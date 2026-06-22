import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCheckout } from '@/context/CheckoutContext';

const ORDER_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const STATUS_BADGE_STYLES = {
  Pending: 'border-[#e5e7eb] bg-[#f9fafb] text-[#4b5563]',
  Processing: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  Shipped: 'border-[#fef08a] bg-[#fefce8] text-[#a16207]',
  Delivered: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  Cancelled: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

const normalizeOrderStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  const map = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    confirmed: 'Processing',
  };
  return map[normalized] || 'Pending';
};

const formatOrderDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const OrderTimeline = ({ status }) => {
  const normalizedStatus = normalizeOrderStatus(status);
  const currentStepIndex = ORDER_FLOW.indexOf(normalizedStatus);
  const isCancelled = normalizedStatus === 'Cancelled';

  return (
    <div className="mt-5 rounded-2xl border border-[#ebedf0] bg-[#fafafa] p-5 sm:p-6 shadow-sm">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[560px]">
          <div className="flex items-center">
            {ORDER_FLOW.map((step, index) => {
              const isCompleted = !isCancelled && index <= currentStepIndex;
              const isCurrent = !isCancelled && index === currentStepIndex;
              const connectorActive = !isCancelled && index < currentStepIndex;

              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold transition-colors ${
                        isCompleted
                          ? 'border-[#e0b090] bg-[#e0b090] text-white'
                          : 'border-[#d1d5db] bg-white text-[#9ca3af]'
                      } ${isCurrent ? 'ring-4 ring-[#ebd1c1]' : ''}`}
                    >
                      {index + 1}
                    </span>
                    <span className={`mt-2 text-[11px] font-bold uppercase tracking-[0.18em] ${isCompleted ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                      {step}
                    </span>
                  </div>

                  {index !== ORDER_FLOW.length - 1 ? (
                    <span className={`mx-2 h-[2px] flex-1 rounded-full transition-colors ${connectorActive ? 'bg-[#e0b090]' : 'bg-[#e5e7eb]'}`} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isCancelled ? (
        <p className="mt-4 text-xs font-medium text-[#ef4444] font-body bg-[#fef2f2] p-3 rounded-xl border border-[#fecaca]">
          This order was cancelled and will not proceed further in the delivery timeline.
        </p>
      ) : null}
    </div>
  );
};

const Orders = () => {
  const location = useLocation();
  const { orders, ordersLoading, ordersError } = useCheckout();
  const successOrderId = String(location.state?.orderId || '').trim();
  const successGiftWrapAdded = Boolean(location.state?.giftWrapAdded);

  const successfulOrder = React.useMemo(
    () => orders.find((order) => String(order.id) === successOrderId) || null,
    [orders, successOrderId],
  );
  const showSuccessBanner = Boolean(successOrderId);
  const showGiftWrapSuccessBadge = successGiftWrapAdded || Boolean(successfulOrder?.gifting?.enabled);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-[96px] md:pt-[104px] pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 max-w-6xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827] mb-2">My Orders</h1>
        <p className="text-sm text-[#6b7280] font-body mb-6 md:mb-8">Track your order journey from placement to delivery.</p>

        {showSuccessBanner ? (
          <div className="mb-6 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-[#065f46]">Order #{successOrderId} placed successfully.</p>
            {showGiftWrapSuccessBadge ? (
              <span className="mt-3 inline-flex items-center rounded-full border border-[#10b981] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#047857] shadow-sm">
                Gift wrap added
              </span>
            ) : null}
          </div>
        ) : null}

        {ordersError ? (
          <div className="mb-6 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4 text-sm text-[#b91c1c] font-body shadow-sm">
            {ordersError}
          </div>
        ) : null}

        {ordersLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-2xl border border-[#ebedf0] bg-white shadow-sm" />
            ))}
          </div>
        ) : null}

        {!ordersLoading && orders.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-[#d1d5db] bg-white shadow-sm">
            <Package size={48} className="mx-auto text-[#9ca3af] mb-4" />
            <p className="text-[#6b7280] mb-5 font-body">No orders yet</p>
            <Link to="/shop" className="inline-block px-8 py-3.5 bg-[#111827] rounded-xl text-white text-xs font-bold tracking-widest uppercase hover:bg-[#1f2937] transition-colors shadow-sm">
              Start Shopping
            </Link>
          </div>
        ) : null}

        {!ordersLoading && orders.length > 0 ? (
          <div className="space-y-6 lg:space-y-8">
            {orders.map((order) => {
              const itemSubtotal = order.items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
              const giftWrapCharge = order.gifting?.enabled ? Number(order.gifting.amount || 0) : 0;
              const donationAmount = order.donation?.enabled ? Number(order.donation.amount || 0) : 0;
              const deliveryCharge = Number(order.totals.deliveryCharge || 0);
              const finalTotal = Number(order.totals.total || 0);
              const expectedTotal = itemSubtotal + giftWrapCharge + donationAmount + deliveryCharge;
              const impliedDiscount = expectedTotal > finalTotal ? expectedTotal - finalTotal : 0;

              return (
                <article key={order.id} className="rounded-2xl border border-[#ebedf0] bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ebedf0] pb-5">
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">Order ID</p>
                      <p className="mt-1 text-sm sm:text-base font-bold text-[#111827]">#{order.id}</p>
                      <p className="mt-1 text-xs text-[#9ca3af] font-body">Placed on {formatOrderDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">Status</p>
                      <span className={`mt-1.5 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] ${STATUS_BADGE_STYLES[normalizeOrderStatus(order.status)] || STATUS_BADGE_STYLES.Pending}`}>
                        {normalizeOrderStatus(order.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">Payment</p>
                      <p className="mt-1.5 text-sm sm:text-base font-bold text-[#111827]">{order.paymentStatus || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">Total</p>
                      <p className="mt-1.5 text-sm sm:text-base font-extrabold text-[#e0b090]">₹{finalTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <OrderTimeline status={order.status} />

                  <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12 border-t border-[#ebedf0] pt-8">
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280] mb-4">Items Summary</h4>
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.id}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-[#111827] font-medium">{item.name} <span className="text-[#6b7280]">x {item.quantity}</span></span>
                          <span className="font-bold text-[#111827]">₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
                        </div>
                      ))}

                      {order.address && (
                        <div className="mt-6 pt-6 border-t border-[#ebedf0]">
                          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280] mb-3">Delivery Address</h4>
                          <div className="text-sm text-[#4b5563] font-body">
                            <p className="font-bold text-[#111827]">{order.address.fullName}</p>
                            <p>{order.address.fullAddress}</p>
                            {order.address.landmark && <p>{order.address.landmark}</p>}
                            <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                            <p className="mt-1 text-[#6b7280]">Phone: {order.address.mobile}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-5 rounded-xl border border-[#f3f4f6] bg-[#f9fafb] p-5">
                      <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280] mb-4">Payment Summary</h4>
                      <div className="space-y-3 text-sm text-[#4b5563] font-body">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-medium text-[#111827]">₹{itemSubtotal.toFixed(2)}</span>
                        </div>
                        {deliveryCharge > 0 ? (
                          <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="font-medium text-[#111827]">+₹{deliveryCharge.toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-[#059669]">
                            <span>Shipping</span>
                            <span className="font-medium uppercase tracking-wider text-[11px]">Free</span>
                          </div>
                        )}
                        {order.gifting?.enabled && (
                          <div className="flex justify-between">
                            <span>Gift Wrap</span>
                            <span className="font-medium text-[#111827]">+₹{giftWrapCharge.toFixed(2)}</span>
                          </div>
                        )}
                        {order.donation?.enabled && (
                          <div className="flex justify-between text-sky-700">
                            <span>Donation</span>
                            <span className="font-medium">+₹{donationAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {impliedDiscount > 0.01 && (
                          <div className="flex justify-between text-[#059669]">
                            <span>Discount Applied</span>
                            <span className="font-medium">-₹{impliedDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="my-2 border-t border-[#d1d5db]"></div>
                        <div className="flex justify-between font-bold text-[#111827] text-base">
                          <span>Total Paid</span>
                          <span className="text-[#e0b090]">₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {order.gifting?.enabled && order.gifting?.message ? (
                        <div className="mt-5 rounded-xl border border-[#ffe3ec] bg-[#fff5f9] px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#e11d48]">Gift Note attached</p>
                          <p className="mt-1.5 text-xs text-[#4b5563] font-body italic">"{order.gifting.message}"</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
};

export default Orders;
