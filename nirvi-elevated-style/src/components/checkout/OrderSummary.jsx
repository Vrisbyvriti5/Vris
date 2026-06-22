import React from 'react';
import { Gift, HeartHandshake, RotateCcw, ShieldCheck, Tag, Truck } from 'lucide-react';
import { formatPriceINR, formatSignedPriceINR } from '@/lib/pricing';
import CouponInput from '@/components/checkout/CouponInput';

const DONATION_OPTIONS = [10, 20, 50, 100];
const GREETING_TEMPLATES = [
  {
    label: 'Birthday',
    message: 'Happy Birthday! Wishing you joy and beautiful moments.',
  },
  {
    label: 'Anniversary',
    message: 'Happy Anniversary! Celebrating your beautiful journey together.',
  },
  {
    label: 'Thank You',
    message: 'Thank you so much! Your support means a lot to us.',
  },
];

const OrderSummary = ({
  items,
  mrpTotal,
  subtotal,
  productDiscount,
  couponDiscount,
  donationEnabled,
  donationAmount,
  giftingEnabled,
  giftingAmount,
  giftingMessage,
  deliveryCharge,
  finalTotal,
  selectedAddress,
  onToggleDonation,
  onSelectDonation,
  onToggleGifting,
  onGiftingMessageChange,
  couponProps,
  ctaLabel,
  ctaDisabled,
  onCta,
  note,
}) => {
  const normalizedGiftingMessage = String(giftingMessage || '').trim();
  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);
  
  const dayName = estimatedDeliveryDate.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = estimatedDeliveryDate.toLocaleDateString('en-US', { month: 'short' });
  const dayOfMonth = String(estimatedDeliveryDate.getDate()).padStart(2, '0');
  const estimatedDeliveryLabel = `Get it by ${dayName}, ${monthName} ${dayOfMonth}`;

  return (
    <aside className="sticky top-20 rounded-2xl border border-[#ebedf0] bg-white p-6 shadow-md">
      <h2 className="text-xl font-bold text-[#111827]">Order Summary</h2>

      <div className="mt-4 space-y-3 rounded-xl border border-[#ebedf0] bg-[#fafafa] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Items ({items.length})</p>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <p className="line-clamp-1 text-[#4b5563]">
                {item.name} x {item.quantity}
              </p>
              <p className="shrink-0 font-semibold text-[#111827]">Rs {formatPriceINR(item.lineTotal)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3 border-y border-[#ebedf0] py-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#6b7280]">Product Total</span>
          <span className="font-medium text-[#111827]">Rs {formatPriceINR(mrpTotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#6b7280]">Discount on Products</span>
          <span className="font-medium text-[#059669]">{formatSignedPriceINR(productDiscount, 'subtract')}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#6b7280]">Coupon Discount</span>
          <span className={`font-medium ${couponDiscount > 0 ? 'text-[#059669]' : 'text-[#111827]'}`}>
            {couponDiscount > 0 ? formatSignedPriceINR(couponDiscount, 'subtract') : 'Rs 0'}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-[#ebedf0] pt-2">
          <span className="font-semibold text-[#374151]">Subtotal</span>
          <span className="font-semibold text-[#111827]">Rs {formatPriceINR(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#6b7280]">Shipping</span>
          <span className="font-medium text-[#111827]">
            {deliveryCharge === 0 ? 'Free' : formatSignedPriceINR(deliveryCharge, 'add')}
          </span>
        </div>

        {giftingEnabled ? (
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Gift Wrap</span>
            <span className="font-medium text-[#111827]">{formatSignedPriceINR(giftingAmount, 'add')}</span>
          </div>
        ) : null}

        {donationEnabled ? (
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Donation</span>
            <span className="font-medium text-[#111827]">{formatSignedPriceINR(donationAmount, 'add')}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-[#ffe3ec] bg-[#fff5f9] p-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#e11d48]">
          <Gift size={14} /> Gifting & Personalisation
        </p>

        <label className="mt-2 flex items-center gap-2 text-sm text-[#374151]">
          <input
            type="checkbox"
            checked={giftingEnabled}
            onChange={(event) => onToggleGifting(event.target.checked)}
            className="h-4 w-4 rounded border-[#d1d5db] text-[#e0b090] focus:ring-[#ffc6d6]"
          />
          Add gift wrap and personalized message for Rs 35
        </label>

        {giftingEnabled ? (
          <div className="mt-2 space-y-1.5">
            <div className="flex flex-wrap gap-2">
              {GREETING_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => onGiftingMessageChange(template.message)}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                    normalizedGiftingMessage === template.message
                      ? 'border-[#e0b090] bg-[#fbf5f1] text-[#e0b090]'
                      : 'border-[#d1d5db] text-[#374151] hover:border-[#ffccd9]',
                  ].join(' ')}
                >
                  {template.label}
                </button>
              ))}
            </div>
            <textarea
              value={giftingMessage}
              onChange={(event) => onGiftingMessageChange(event.target.value.slice(0, 240))}
              placeholder="Enter your gift message (optional)"
              className="min-h-20 w-full rounded-lg border border-[#fbcfe8] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
            />
            <p className="text-xs text-[#6b7280]">{giftingMessage.length}/240 characters</p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-[#fef3c7] bg-[#fffbeb] p-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#a16207]">
          <HeartHandshake size={14} /> Support Transformative Social Work
        </p>

        <label className="mt-2 flex items-center gap-2 text-sm text-[#374151]">
          <input
            type="checkbox"
            checked={donationEnabled}
            onChange={(event) => onToggleDonation(event.target.checked)}
            className="h-4 w-4 rounded border-[#d1d5db] text-[#e0b090] focus:ring-[#ffc6d6]"
          />
          Donate and make a difference
        </label>

        {donationEnabled ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {DONATION_OPTIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onSelectDonation(amount)}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                  donationAmount === amount
                    ? 'border-[#e0b090] bg-[#fbf5f1] text-[#e0b090]'
                    : 'border-[#d1d5db] text-[#374151] hover:border-[#ffccd9]',
                ].join(' ')}
              >
                Rs {amount}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <CouponInput {...couponProps} />

      <div className="mt-4 rounded-xl border border-[#ebedf0] bg-[#fff6f9] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6b7280]">Total</span>
          <span className="text-2xl font-bold text-[#111827]">Rs {formatPriceINR(finalTotal)}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={ctaDisabled}
        onClick={onCta}
        className="mt-4 w-full rounded-xl bg-[#e0b090] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.01] hover:bg-[#d6a382] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {ctaLabel}
      </button>

      {note ? <p className="mt-2 text-xs text-[#dc2626]">{note}</p> : null}

      <div className="mt-5 grid gap-3 border-t border-[#ebedf0] pt-4">
        <div className="rounded-xl border border-[#e7f8ef] bg-[#f3fcf7] p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#047857]">
            <ShieldCheck size={14} /> Secure Payment
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">Encrypted checkout with trusted UPI, cards, and wallets.</p>
        </div>
        <div className="rounded-xl border border-[#e5f2ff] bg-[#f4f9ff] p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#2563eb]">
            <Truck size={14} /> Free Delivery
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">Free delivery on orders above Rs 999.</p>
        </div>
        <div className="rounded-xl border border-[#fff1d8] bg-[#fffaf0] p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#b45309]">
            <Tag size={14} /> Estimated Delivery
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">{estimatedDeliveryLabel}</p>
        </div>
        <div className="rounded-xl border border-[#fce7f3] bg-[#fdf2f8] p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#be185d]">
            <RotateCcw size={14} /> Return Policy
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">Easy 7-day return window after delivery.</p>
        </div>
      </div>

      {selectedAddress ? (
        <div className="mt-5 rounded-xl border border-[#ebedf0] bg-[#fafafa] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Deliver To</p>
          <p className="mt-1 text-sm font-semibold text-[#111827]">{selectedAddress.fullName}</p>
          <p className="mt-1 text-sm text-[#6b7280]">
            {selectedAddress.fullAddress}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
          </p>
        </div>
      ) : null}
    </aside>
  );
};

export default OrderSummary;
