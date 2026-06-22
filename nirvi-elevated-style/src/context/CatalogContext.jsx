import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { productsAPI } from '@/lib/api';
import { getProductPricing } from '@/lib/pricing';
import { getEntityStock } from '@/lib/stock';
import { PRODUCT_CATEGORIES, getCollectionForCategory } from '@/lib/product-taxonomy';

const CatalogContext = createContext(undefined);

const normalizeProductData = (product) => {
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : (product.image ? [product.image] : []);

  const pricing = getProductPricing(product);

  return {
    ...product,
    id: String(product.id),
    price: pricing.finalPrice,
    finalPrice: pricing.finalPrice,
    mrp: pricing.mrp,
    discount_percent: pricing.discountPercent,
    stock: getEntityStock(product, 0),
    featured: Boolean(product.featured),
    images,
    image: images[0] || null,
    category: String(product.category || '').trim().toLowerCase(),
    collection: product.collection || getCollectionForCategory(product.category) || 'Denim',
    averageRating: Number(product.average_rating ?? product.averageRating ?? 0),
    reviewCount: Number(product.review_count ?? product.reviewCount ?? 0),
    createdAt: product.createdAt || product.created_at || new Date().toISOString(),
    updatedAt: product.updatedAt || product.updated_at || product.created_at || new Date().toISOString(),
  };
};

const buildProductFormData = (input) => {
  const formData = new FormData();

  Object.entries(input || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (key === 'imagesFiles' && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) {
          formData.append('images', file);
        }
      });
      return;
    }

    if ((key === 'imageUrls' || key === 'images') && Array.isArray(value)) {
      const urls = value
        .map((entry) => String(entry || '').trim())
        .filter(Boolean);

      if (urls.length > 0) {
        formData.append('imageUrls', JSON.stringify(urls));
      }
      return;
    }

    if (value instanceof File) {
      formData.append('images', value);
      return;
    }

    formData.append(key, value);
  });

  return formData;
};

const buildCategoryOptions = (products) => {
  const available = [...new Set(products.map((product) => product.category?.trim().toLowerCase()).filter(Boolean))];

  return [
    'All',
    ...PRODUCT_CATEGORIES,
    ...available.filter((category) => !PRODUCT_CATEGORIES.includes(category)).sort(),
  ];
};

export const CatalogProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all products from backend on mount
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productsAPI.getAll({
        sort: 'diverse-random',
        _ts: Date.now(),
      });
      const normalized = (res.data || []).map(normalizeProductData);
      setProducts(normalized);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (input) => {
    try {
      const formData = buildProductFormData(input);
      console.log('[CatalogContext] Creating product with payload keys:', Object.keys(input || {}));
      const res = await productsAPI.create(formData);
      const newProduct = normalizeProductData(res.data);
      setProducts((prev) => [newProduct, ...prev]);
      fetchProducts().catch((err) => console.error('Failed to refresh products after create:', err));
      console.log('[CatalogContext] Created product response:', {
        id: newProduct.id,
        name: newProduct.name,
        mrp: newProduct.mrp,
        discount_percent: newProduct.discount_percent,
      });
      return newProduct;
    } catch (err) {
      console.error('Add product error:', err);
      throw err;
    }
  };

  const updateProduct = async (productId, input) => {
    try {
      const formData = buildProductFormData(input);
      console.log('[CatalogContext] Updating product', {
        productId,
        payloadKeys: Object.keys(input || {}),
        mrp: input?.mrp,
        discount_percent: input?.discount_percent,
      });
      const res = await productsAPI.update(productId, formData);
      const updated = normalizeProductData(res.data);
      setProducts((prev) =>
        prev.map((p) => (p.id === String(productId) ? updated : p))
      );
      fetchProducts().catch((err) => console.error('Failed to refresh products after update:', err));
      console.log('[CatalogContext] Updated product response:', {
        id: updated.id,
        name: updated.name,
        mrp: updated.mrp,
        discount_percent: updated.discount_percent,
      });
      return updated;
    } catch (err) {
      console.error('Update product error:', err);
      throw err;
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await productsAPI.delete(productId);
      setProducts((prev) => prev.filter((p) => p.id !== String(productId)));
      fetchProducts().catch((err) => console.error('Failed to refresh products after delete:', err));
    } catch (err) {
      console.error('Delete product error:', err);
      throw err;
    }
  };

  const value = {
    products,
    categories: buildCategoryOptions(products),
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: fetchProducts,
    // Keep customizationOptions as empty stubs for backward compat
    customizationOptions: { colors: [], styles: [], addOns: [] },
    addCustomizationOption: () => {},
    removeCustomizationOption: () => {},
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }

  return context;
};
