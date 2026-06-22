import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Truck } from 'lucide-react';
import { formatPriceINR } from '@/lib/pricing';

const CartItem = ({
  item,
  canEdit,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const deliveryDateLabel = item.deliveryEstimate || 'Delivery in 3-5 days';
  const hasDiscount = item.pricing?.hasDiscount;

  return (
    <article className={`rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md ${item.isUnavailable ? 'opacity-80' : ''}`}>
      <div className="flex gap-4">
        <Link to={`/product/${item.id}`} className="shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className={`h-24 w-20 rounded-lg object-cover sm:h-28 sm:w-24 ${item.isUnavailable ? 'grayscale' : ''}`}
            loading="lazy"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <Link
                to={`/product/${item.id}`}
                className="line-clamp-2 text-sm font-semibold text-[#1f2937] transition-colors hover:text-[#e0b090]"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-xs text-[#9ca3af]">{item.category || 'VRIS Collection'}</p>
            </div>

            <button
              type="button"
              onClick={onRemove}
              disabled={!canEdit}
              className="rounded-md p-1.5 text-[#ef4444] transition-colors hover:bg-[#fbf5f1] hover:text-[#dc2626] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-end gap-2">
            <p className="text-base font-bold text-[#111827]">Rs {formatPriceINR(item.unitPrice)}</p>
            {hasDiscount ? <p className="text-sm text-[#9ca3af] line-through">Rs {formatPriceINR(item.pricing.mrp)}</p> : null}
            {hasDiscount ? (
              <span className="rounded-md bg-[#fbf5f1] px-2 py-0.5 text-xs font-semibold text-[#e0b090]">
                {item.pricing.discountLabel}% OFF
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#e5e7eb]">
              <button
                type="button"
                onClick={onDecrement}
                disabled={!canEdit || item.isUnavailable || item.quantity <= 1}
                className="grid h-9 w-9 place-items-center border-r border-[#e5e7eb] text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="grid h-9 min-w-10 place-items-center px-2 text-sm font-semibold text-[#111827]">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={onIncrement}
                disabled={!canEdit || item.isUnavailable || item.atStockLimit}
                className="grid h-9 w-9 place-items-center border-l border-[#e5e7eb] text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            {item.stock !== null && item.stock > 0 && item.stock <= 5 ? (
              <span className="rounded-md bg-[#fff7ed] px-2.5 py-1 text-xs font-semibold text-[#ea580c]">
                Only {item.stock} left
              </span>
            ) : null}

            {item.isUnavailable ? (
              <span className="rounded-md bg-[#fef2f2] px-2.5 py-1 text-xs font-semibold text-[#dc2626]">
                Currently unavailable
              </span>
            ) : null}
          </div>

          {!item.isUnavailable ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#065f46]">
              <Truck size={13} /> {deliveryDateLabel}
            </p>
          ) : null}
        </div>

        <div className="hidden min-w-[90px] text-right sm:block">
          <p className="text-sm font-semibold text-[#111827]">Rs {formatPriceINR(item.lineTotal)}</p>
          <p className="mt-1 text-xs text-[#9ca3af]">{item.quantity} item(s)</p>
        </div>
      </div>
    </article>
  );
};

export default CartItem;
