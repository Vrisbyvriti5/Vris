import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPriceINR } from '@/lib/pricing';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

const CartDrawer = ({ onClose }) => {
  const { items, totalItems, totalPrice, increment, decrement, removeItem } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <SheetHeader className="px-6 py-4 border-b border-gray-100 space-y-0">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#e0b090]" />
            Your Bag <span className="text-gray-400 font-medium">({totalItems})</span>
          </SheetTitle>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your bag is empty</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-[240px]">
              Looks like you haven't added anything to your bag yet.
            </p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-full px-8 py-2 border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-50"
              onClick={onClose}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-6">
              {items.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-4 group"
                >
                  <div className="relative aspect-[3/4] w-20 overflow-hidden rounded-xl bg-gray-100 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <h4 className="text-sm font-bold text-gray-900 truncate pr-4">{item.name}</h4>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">{item.category}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center border border-gray-100 rounded-lg bg-gray-50/50">
                        <button 
                          onClick={() => decrement(item.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => increment(item.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-gray-900">₹{formatPriceINR(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {items.length > 0 && (
        <div className="p-6 border-t border-gray-100 bg-gray-50/30">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">₹{formatPriceINR(totalPrice)}</span>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider text-center">
              Shipping & taxes calculated at checkout
            </p>
            <div className="grid gap-3 pt-2">
              <Button 
                onClick={handleCheckout}
                className="w-full bg-[#e0b090] hover:bg-[#d6a382] text-white rounded-xl py-6 text-sm font-bold uppercase tracking-[0.15em] shadow-[0_4px_12px_rgba(224,176,144,0.3)] transition-all active:scale-[0.98]"
              >
                Proceed to Checkout
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDrawer;
