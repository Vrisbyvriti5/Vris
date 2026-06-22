import React, { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, PackageSearch, Plus, Search, Trash2 } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import AdminSection from '@/components/admin/AdminSection';
import ConfirmModal from '@/components/admin/ConfirmModal';
import StatusPill from '@/components/admin/StatusPill';
import { formatCurrency, formatDate } from '@/lib/admin-formatters';
import { PRODUCT_COLLECTIONS } from '@/lib/product-taxonomy';

const AdminProducts = () => {
  const { products, categories, deleteProduct } = useCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [collectionFilter, setCollectionFilter] = useState('All');
  const [productToDelete, setProductToDelete] = useState(null);
  const deferredSearch = useDeferredValue(searchTerm);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredProducts = [...products]
    .filter((product) => categoryFilter === 'All' || product.category === categoryFilter)
    .filter((product) => {
      if (collectionFilter === 'All') return true;
      const tokens = String(product.collection || '').split(',').map((c) => c.trim().toLowerCase());
      return tokens.includes(collectionFilter.toLowerCase());
    })
    .filter((product) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [product.name, product.description, product.category, product.collection, product.sku]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    })
    .sort((first, second) => {
      const secondDate = second.updatedAt || second.createdAt || 0;
      const firstDate = first.updatedAt || first.createdAt || 0;
      return new Date(secondDate) - new Date(firstDate);
    });

  return (
    <>
      <AdminSection
        title="Product Catalog"
        description="Search, filter, edit, or remove products from the live VRIS catalog."
        actions={(
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Plus size={16} />
            Add Product
          </Link>
        )}
      >
        <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
            <Search size={18} className="text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, category, SKU, or description"
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            >
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select
              value={collectionFilter}
              onChange={(event) => setCollectionFilter(event.target.value)}
              className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            >
              <option value="All">All collections</option>
              {PRODUCT_COLLECTIONS.map((collection) => <option key={collection} value={collection}>{collection}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-border text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Collection</th>
                <th className="pb-3 pr-4">Stock</th>
                <th className="pb-3 pr-4">Updated</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-4">
                      <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground font-body">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-sm font-medium text-foreground">{formatCurrency(product.price)}</td>
                  <td className="py-4 pr-4 text-sm text-muted-foreground font-body">{product.category}</td>
                  <td className="py-4 pr-4 text-sm text-muted-foreground font-body">{product.collection}</td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <StatusPill value={product.stock <= 10 ? 'low' : 'healthy'} />
                      <span className="text-sm text-foreground">{product.stock}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-sm text-muted-foreground font-body">{formatDate(product.updatedAt)}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Edit size={14} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setProductToDelete(product)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-4 lg:hidden">
          {filteredProducts.map((product) => (
            <div key={product.id} className="rounded-3xl border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-4">
                <img src={product.image} alt={product.name} className="h-20 w-20 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground font-body">{product.category}</p>
                  <p className="mt-1 text-xs text-muted-foreground font-body">{product.collection}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{formatCurrency(product.price)}</p>
                </div>
                <StatusPill value={product.stock <= 10 ? 'low' : 'healthy'} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground font-body">
                <span>{product.stock} in stock</span>
                <span>{formatDate(product.updatedAt)}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/admin/products/${product.id}/edit`}
                  className="flex-1 rounded-2xl border border-border px-3 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-background"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setProductToDelete(product)}
                  className="flex-1 rounded-2xl border border-border px-3 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-background"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
            <PackageSearch size={34} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold text-foreground">No products matched your filters</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">Try a broader search or add a fresh product to the catalog.</p>
          </div>
        ) : null}
      </AdminSection>

      <ConfirmModal
        open={Boolean(productToDelete)}
        title="Delete product?"
        description={productToDelete ? `This will remove "${productToDelete.name}" from the local catalog immediately.` : ''}
        confirmLabel="Delete Product"
        onCancel={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
          }
          setProductToDelete(null);
        }}
      />
    </>
  );
};

export default AdminProducts;
