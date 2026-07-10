import React, { useDeferredValue, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminData } from '@/context/AdminDataContext';
import AdminSection from '@/components/admin/AdminSection';
import StatusPill from '@/components/admin/StatusPill';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/admin-formatters';

const customizationStatuses = ['Pending', 'Processing', 'Preprocessing', 'Ready', 'Shipped', 'Delivered', 'Cancelled'];

const AdminCustomizations = () => {
  const { customizations, customizationsLoading, customizationsError, updateCustomizationStatus } = useAdminData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const deferredSearch = useDeferredValue(searchTerm);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredItems = [...(customizations || [])]
    .filter((item) => statusFilter === 'All' || item.status === statusFilter)
    .filter((item) => {
      if (!normalizedSearch) return true;
      const searchable = [
        item.order_id,
        item.user_name,
        item.user_email,
        item.product_name,
        item.custom_color,
      ].join(' ').toLowerCase();
      return searchable.includes(normalizedSearch);
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleStatusChange = async (item, nextStatus) => {
    if (!nextStatus || nextStatus === item.status) return;

    setUpdatingItemId(item.item_id);
    try {
      const result = await updateCustomizationStatus(item.order_id, nextStatus);
      toast({
        title: 'Status updated',
        description: `Customization #${item.item_id} moved to ${result?.status || nextStatus}.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not update status',
        description: err.data?.message || err.message || 'Please try again.',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <AdminSection title="Customizations" description="Manage and track custom measurement orders from customers.">
      {customizationsError ? (
        <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-body">
          {customizationsError}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by order ID, customer, or product"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground lg:max-w-xl"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
        >
          <option value="All">All Statuses</option>
          {customizationStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {customizationsLoading && (customizations || []).length === 0 ? (
        <div className="mt-6 space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : null}

      {!customizationsLoading && filteredItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground font-body">No customizations match your filters.</p>
        </div>
      ) : null}

      {customizationsLoading && (customizations || []).length > 0 ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          Refreshing
        </p>
      ) : null}

      {!customizationsLoading && filteredItems.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                <th className="pb-3 pr-4">Order & Item</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">Measurements & Color</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.item_id} className="align-top">
                  <td className="py-4 pr-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Ord: {item.order_id}</p>
                      <p className="mt-1 text-xs text-muted-foreground font-body">Item: {item.item_id}</p>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-sm text-foreground">
                    <p className="font-medium">{item.user_name}</p>
                    <p className="text-xs text-muted-foreground font-body">{item.user_email}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-10 w-10 rounded-lg border border-border object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-2">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="space-y-1 text-xs font-medium text-foreground">
                      {item.custom_bust != null && <p>Bust: {item.custom_bust}"</p>}
                      {item.custom_waist != null && <p>Waist: {item.custom_waist}"</p>}
                      {item.custom_hips != null && <p>Hips: {item.custom_hips}"</p>}
                      {item.custom_length != null && <p>Length: {item.custom_length}"</p>}
                      {item.custom_color && (
                        <p className="inline-flex items-center gap-1.5 mt-1 pt-1 border-t border-border">
                          Color: {item.custom_color}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-sm">
                    <p className="font-medium text-foreground">{formatCurrency(Number(item.price))}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-body">
                      {item.payment_status} ({item.payment_method})
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={item.status || 'Pending'}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        disabled={updatingItemId === item.item_id}
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-foreground/50 focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50"
                      >
                        {customizationStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      {updatingItemId === item.item_id ? (
                        <Loader2 size={14} className="animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-4 text-xs text-muted-foreground font-body">
                    {formatDate(item.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminSection>
  );
};

export default AdminCustomizations;
