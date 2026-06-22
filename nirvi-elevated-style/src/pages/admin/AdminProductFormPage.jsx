import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useCatalog } from '@/context/CatalogContext';
import AdminSection from '@/components/admin/AdminSection';
import ProductForm from '@/components/admin/ProductForm';

const AdminProductFormPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, customizationOptions, addProduct, updateProduct, refreshProducts } = useCatalog();
  const editingProduct = products.find((product) => product.id === productId);
  const isEditMode = Boolean(productId);

  if (isEditMode && !editingProduct) {
    return <Navigate to="/admin/products" replace />;
  }

  const handleSubmit = async (values) => {
    try {
      console.log('[AdminProductFormPage] Submitting product form', {
        mode: isEditMode ? 'edit' : 'create',
        productId,
        name: values?.name,
        mrp: values?.mrp,
        discount_percent: values?.discount_percent,
        imageUrlsCount: values?.imageUrls?.length || 0,
        imageFilesCount: values?.imagesFiles?.length || 0,
      });

      if (isEditMode) {
        await updateProduct(productId, values);
      } else {
        await addProduct(values);
      }

      await refreshProducts();
      navigate('/admin/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      // In a real app, you would show a toast here
    }
  };

  return (
    <AdminSection
      title={isEditMode ? 'Edit Product' : 'Add Product'}
      description={isEditMode ? 'Update product details and keep the storefront in sync instantly.' : 'Create a new product and publish it to the local catalog.'}
    >
      <ProductForm
        mode={isEditMode ? 'edit' : 'create'}
        initialValues={editingProduct}
        customizationOptions={customizationOptions}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/products')}
      />
    </AdminSection>
  );
};

export default AdminProductFormPage;
