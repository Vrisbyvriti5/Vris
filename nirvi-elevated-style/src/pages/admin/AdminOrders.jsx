import React, { useDeferredValue, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminData } from '@/context/AdminDataContext';
import AdminSection from '@/components/admin/AdminSection';
import StatusPill from '@/components/admin/StatusPill';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/admin-formatters';

const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const AdminOrders = () => {
  const { orders, ordersLoading, ordersError, updateOrderStatus } = useAdminData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const deferredSearch = useDeferredValue(searchTerm);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredOrders = [...orders]
    .filter((order) => statusFilter === 'All' || order.status === statusFilter)
    .filter((order) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [order.id, order.userName, ...order.items.map((item) => item.name)]
        .concat(order.gifting?.message ? [order.gifting.message] : [])
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    })
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

  const handleStatusChange = async (order, nextStatus) => {
    if (!nextStatus || nextStatus === order.status) {
      return;
    }

    setUpdatingOrderId(order.id);
    try {
      const result = await updateOrderStatus(order.id, nextStatus);
      toast({
        title: 'Order status updated',
        description: `Order #${order.id} moved to ${result?.status || nextStatus}.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not update order status',
        description: err.data?.message || err.message || 'Please try again.',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <AdminSection title="Orders" description="Monitor fulfillment progress and update order statuses in place.">
      {ordersError ? (
        <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-body">
          {ordersError}
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
          {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {ordersLoading && orders.length === 0 ? (
        <div className="mt-6 space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : null}

      {!ordersLoading && filteredOrders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground font-body">No orders match your current filters.</p>
        </div>
      ) : null}

      {ordersLoading && orders.length > 0 ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          Refreshing orders
        </p>
      ) : null}

      {!ordersLoading && filteredOrders.length > 0 ? (
        <div className="mt-6 hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-border text-left">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
              <th className="pb-3 pr-4">Order</th>
              <th className="pb-3 pr-4">Customer & Delivery</th>
              <th className="pb-3 pr-4">Products</th>
              <th className="pb-3 pr-4">Total</th>
              <th className="pb-3 pr-4">Payment</th>
              <th className="pb-3 pr-4">Extras & Notes</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="align-top">
                <td className="py-4 pr-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{order.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-body">{order.items.length} product(s)</p>
                    <div className="flex flex-col items-start gap-1 mt-2">
                      {order.gifting?.enabled ? (
                        <span className="inline-flex items-center rounded-full border border-[#10b981] bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#047857]">
                          Gift wrap
                        </span>
                      ) : null}
                      {order.donation?.enabled ? (
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">
                          Donation
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-foreground">
                  <p className="font-medium">{order.userName}</p>
                  {order.address?.fullName && (
                    <div className="mt-2 text-xs text-muted-foreground font-body space-y-0.5 max-w-[200px]">
                      <p className="font-semibold text-foreground">Delivery Address:</p>
                      <p>{order.address.fullName} - {order.address.mobile}</p>
                      <p className="truncate whitespace-normal">{order.address.fullAddress}</p>
                      {order.address.landmark ? <p className="truncate whitespace-normal">Landmark: {order.address.landmark}</p> : null}
                      <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                    </div>
                  )}
                </td>
                <td className="py-4 pr-4 text-sm text-muted-foreground font-body">
                  {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                </td>
                <td className="py-4 pr-4 text-sm font-medium text-foreground">{formatCurrency(order.totalPrice)}</td>
                <td className="py-4 pr-4 text-sm text-foreground">{order.paymentStatus || 'Pending'}</td>
                <td className="py-4 pr-4 text-sm text-muted-foreground font-body">
                  <div className="space-y-2">
                    {order.gifting?.enabled ? (
                      <p><span className="font-semibold text-foreground">Gift:</span> {order.gifting.message || 'No message'}</p>
                    ) : null}
                    {order.donation?.enabled ? (
                      <p><span className="font-semibold text-foreground">Donation:</span> {formatCurrency(order.donation.amount)}</p>
                    ) : null}
                    {!order.gifting?.enabled && !order.donation?.enabled ? 'None' : null}
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <StatusPill value={order.status} />
                    <select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) => handleStatusChange(order, event.target.value)}
                      className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-foreground"
                    >
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {updatingOrderId === order.id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body">
                        <Loader2 size={12} className="animate-spin" />
                        Updating
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="py-4 text-sm text-muted-foreground font-body">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      ) : null}

      {!ordersLoading && filteredOrders.length > 0 ? (
        <div className="mt-6 grid gap-4 xl:hidden">
        {filteredOrders.map((order) => (
          <div key={order.id} className="rounded-3xl border border-border bg-muted/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{order.id}</p>
                <p className="mt-1 text-xs text-muted-foreground font-body">{order.userName} • {formatDate(order.createdAt)}</p>
                {order.gifting?.enabled ? (
                  <span className="mt-2 inline-flex items-center rounded-full border border-[#10b981] bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#047857] mr-2">
                    Gift wrap
                  </span>
                ) : null}
                {order.donation?.enabled ? (
                  <span className="mt-2 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">
                    Donation
                  </span>
                ) : null}
              </div>
              <StatusPill value={order.status} />
            </div>
            
            {order.address?.fullName ? (
              <div className="mt-3 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground font-body space-y-0.5">
                <p className="font-semibold text-foreground mb-1">Delivery Address</p>
                <p>{order.address.fullName} - {order.address.mobile}</p>
                <p>{order.address.fullAddress}</p>
                {order.address.landmark ? <p>Landmark: {order.address.landmark}</p> : null}
                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
              </div>
            ) : null}

            <p className="mt-4 text-sm text-muted-foreground font-body">
              {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
            </p>
            {order.gifting?.enabled ? (
              <p className="mt-3 rounded-xl border border-[#ffe3ec] bg-[#fff5f9] px-3 py-2 text-xs text-[#6b7280] font-body">
                <span className="font-semibold text-[#e11d48]">Gift Note:</span>{' '}
                {order.gifting.message || 'No message'}
              </p>
            ) : null}
            {order.donation?.enabled ? (
              <p className="mt-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-700 font-body">
                <span className="font-semibold">Donation:</span> {formatCurrency(order.donation.amount)}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-foreground">{formatCurrency(order.totalPrice)} • {order.paymentStatus || 'Pending'}</p>
              <select
                value={order.status}
                disabled={updatingOrderId === order.id}
                onChange={(event) => handleStatusChange(order, event.target.value)}
                className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              >
                {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            {updatingOrderId === order.id ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                Updating status
              </p>
            ) : null}
          </div>
        ))}
        </div>
      ) : null}
    </AdminSection>
  );
};

export default AdminOrders;
