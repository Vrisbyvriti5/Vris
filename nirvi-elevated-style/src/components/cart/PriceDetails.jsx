import React from 'react';
import { Gift, HeartHandshake, Percent, ShieldCheck, Ticket } from 'lucide-react';
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

const PriceDetails = ({
  selectedCount,
  totalCount,
  mrpTotal,
  discountOnMrp,
  couponDiscount,
  subtotal,
  shippingFee,
  donationEnabled,
  donationAmount,
  giftingEnabled,
  giftingAmount,
  giftingMessage,
  totalAmount,
  youSaved,
  deliveryInfo,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  appliedCoupon,
  couponMessage,
  couponError,
  onToggleDonate,
  onSelectDonation,
  onToggleGifting,
  onGiftingMessageChange,
  onPlaceOrder,
  placeOrderDisabled,
}) => {
  const normalizedGiftingMessage = String(giftingMessage || '').trim();

  return (
    <aside className="sticky top-20 space-y-4">
      <CouponInput
        code={couponCode}
        onCodeChange={onCouponCodeChange}
        onApply={onApplyCoupon}
        onRemove={onRemoveCoupon}
        isApplying={isApplyingCoupon}
        disabled={selectedCount === 0}
        appliedCoupon={appliedCoupon}
        message={couponMessage}
        error={couponError}
      />

      <section className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">
          <Gift size={14} /> Gifting & Personalisation
        </p>

        <label className="mt-2 flex items-center gap-2 text-sm text-[#374151]">
          <input
            type="checkbox"
            checked={giftingEnabled}
            onChange={(event) => onToggleGifting(event.target.checked)}
            className="h-4 w-4 rounded border-[#d1d5db] text-black focus:ring-gray-300"
          />
          Add gift wrap and personalized message for Rs 35
        </label>

        {giftingEnabled ? (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {GREETING_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => onGiftingMessageChange(template.message)}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                    normalizedGiftingMessage === template.message
                      ? 'border-black bg-gray-50 text-black'
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
              placeholder="Add a personalized message (optional)"
              className="min-h-20 w-full rounded-lg border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-black focus:ring-2 focus:ring-gray-300"
            />
            <p className="text-xs text-[#6b7280]">{giftingMessage.length}/240 characters</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">
          <HeartHandshake size={14} /> Support Transformative Social Work
        </p>

        <label className="mt-2 flex items-center gap-2 text-sm text-[#374151]">
          <input
            type="checkbox"
            checked={donationEnabled}
            onChange={(event) => onToggleDonate(event.target.checked)}
            className="h-4 w-4 rounded border-[#d1d5db] text-black focus:ring-gray-300"
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
                    ? 'border-black bg-gray-50 text-black'
                    : 'border-[#d1d5db] text-[#374151] hover:border-[#ffccd9]',
                ].join(' ')}
              >
                Rs {amount}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Price Details ({selectedCount}/{totalCount} items)</p>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Total MRP</span>
            <span className="font-medium text-[#111827]">Rs {formatPriceINR(mrpTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Discount on MRP</span>
            <span className="font-medium text-[#059669]">{formatSignedPriceINR(discountOnMrp, 'subtract')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[#6b7280]"><Percent size={13} /> Coupon Discount</span>
            <span className={`font-medium ${couponDiscount > 0 ? 'text-[#059669]' : 'text-[#111827]'}`}>
              {couponDiscount > 0 ? formatSignedPriceINR(couponDiscount, 'subtract') : 'Apply Coupon'}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-[#ebedf0] pt-2">
            <span className="font-semibold text-[#374151]">Subtotal</span>
            <span className="font-semibold text-[#111827]">Rs {formatPriceINR(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Shipping</span>
            <span className="font-medium text-[#111827]">{shippingFee === 0 ? 'Free' : formatSignedPriceINR(shippingFee, 'add')}</span>
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

        <div className="mt-4 border-t border-[#ebedf0] pt-3">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-[#111827]">Total Amount</p>
            <p className="text-xl font-bold text-[#111827]">Rs {formatPriceINR(totalAmount)}</p>
          </div>
          <p className="mt-1 text-xs font-semibold text-[#059669]">You saved Rs {formatPriceINR(youSaved)}</p>
        </div>

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={placeOrderDisabled}
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.01] hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-55"
        >
          Place Order
        </button>

        <p className="mt-2 text-xs text-[#6b7280]">By placing the order, you agree to VRIS terms and privacy policy.</p>
      </section>

      <section className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">
          <ShieldCheck size={14} /> Delivery Timeline
        </p>
        <p className="mt-2 text-sm text-[#047857]">{deliveryInfo}</p>
      </section>
    </aside>
  );
};

export default PriceDetails;
