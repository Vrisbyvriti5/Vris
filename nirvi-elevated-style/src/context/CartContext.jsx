import React, { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import { cartAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => String(i.id) === String(action.payload.id));
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            String(i.id) === String(action.payload.id)
              ? {
                ...i,
                quantity: i.quantity + (action.payload.quantity || 1),
                stock: action.payload.stock ?? i.stock,
              }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => String(i.id) !== String(action.payload)) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items
          .map((i) =>
            String(i.id) === String(action.payload.id)
              ? { ...i, quantity: action.payload.quantity }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
};

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [], loading: false });

  // Fetch cart from backend when user is authenticated
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ITEMS', payload: [] });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await cartAPI.get();
      const items = (res.data?.items || []).map((item) => ({
        id: String(item.product_id),
        product_id: item.product_id,
        name: item.name,
        price: Number(item.price),
        image: item.image,
        category: item.category,
        quantity: item.quantity,
        stock: Number.isFinite(Number(item.stock)) ? Number(item.stock) : null,
      }));
      dispatch({ type: 'SET_ITEMS', payload: items });
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      dispatch({ type: 'SET_ITEMS', payload: [] });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (item) => {
    const normalizedId = String(item.id);
    const parsedStock = Number(item.stock);
    const safeStock = Number.isFinite(parsedStock) ? parsedStock : null;
    const existing = state.items.find((entry) => String(entry.id) === normalizedId);

    if (safeStock !== null && safeStock <= 0) {
      return false;
    }

    if (existing) {
      const existingStock = Number(existing.stock);
      const knownStock = Number.isFinite(existingStock) ? existingStock : safeStock;
      if (knownStock !== null && existing.quantity >= knownStock) {
        return false;
      }
    }

    const quantityToAdd = item.quantity || 1;

    // Optimistic update
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...item,
        id: normalizedId,
        quantity: quantityToAdd,
        ...(safeStock !== null ? { stock: safeStock } : {}),
      },
    });
    if (isAuthenticated) {
      try {
        await cartAPI.addItem(parseInt(item.id, 10), quantityToAdd);
      } catch (err) {
        console.error('Failed to add to cart:', err);
        fetchCart(); // re-sync on failure
        return false;
      }
    }

    return true;
  };

  const removeItem = async (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: String(id) });
    if (isAuthenticated) {
      try {
        await cartAPI.removeItem(parseInt(id, 10));
      } catch (err) {
        console.error('Failed to remove from cart:', err);
        fetchCart();
      }
    }
  };

  const increment = async (id) => {
    const item = state.items.find((i) => String(i.id) === String(id));
    if (!item) return;

    const knownStock = Number(item.stock);
    if (Number.isFinite(knownStock) && item.quantity >= knownStock) {
      return;
    }

    const newQty = item.quantity + 1;
    dispatch({ type: 'UPDATE_QTY', payload: { id: String(id), quantity: newQty } });
    if (isAuthenticated) {
      try {
        await cartAPI.updateQuantity(parseInt(id, 10), newQty);
      } catch (err) {
        console.error('Failed to increment:', err);
        fetchCart();
      }
    }
  };

  const decrement = async (id) => {
    const item = state.items.find((i) => String(i.id) === String(id));
    if (!item) return;
    const newQty = Math.max(0, item.quantity - 1);
    if (newQty === 0) {
      return removeItem(id);
    }
    dispatch({ type: 'UPDATE_QTY', payload: { id: String(id), quantity: newQty } });
    if (isAuthenticated) {
      try {
        await cartAPI.updateQuantity(parseInt(id, 10), newQty);
      } catch (err) {
        console.error('Failed to decrement:', err);
        fetchCart();
      }
    }
  };

  const clear = async () => {
    dispatch({ type: 'CLEAR' });
    if (isAuthenticated) {
      try {
        await cartAPI.clear();
      } catch (err) {
        console.error('Failed to clear cart:', err);
        fetchCart();
      }
    }
  };

  const value = {
    items: state.items,
    loading: state.loading,
    addItem,
    removeItem,
    increment,
    decrement,
    clear,
    totalItems: state.items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
