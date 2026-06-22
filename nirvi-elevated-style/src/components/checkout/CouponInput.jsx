import React from 'react';

const CouponInput = ({
  code,
  onCodeChange,
  onApply,
  onRemove,
  isApplying,
  disabled,
  appliedCoupon,
  message,
  error,
}) => {
  return (
    <div className="rounded-xl border border-[#ebedf0] bg-[#fafafa] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">Apply Coupon</p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="h-11 flex-1 rounded-lg border border-[#d1d5db] bg-white px-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#e0b090] focus:ring-2 focus:ring-[#ebd1c1]"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={disabled || isApplying}
          className="h-11 rounded-lg border border-[#e0b090] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#e0b090] transition-colors hover:bg-[#fbf5f1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isApplying ? 'Applying' : 'Apply'}
        </button>
      </div>

      {appliedCoupon ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#047857]">
            Coupon Applied: {appliedCoupon.code}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold uppercase tracking-[0.13em] text-[#6b7280] transition-colors hover:text-[#111827]"
          >
            Remove Coupon
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-2 text-xs font-medium text-[#059669]">{message}</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-[#dc2626]">{error}</p> : null}
    </div>
  );
};

export default CouponInput;
