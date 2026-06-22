import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Minus, Plus, Trash2, Truck } from 'lucide-react';
import { formatPriceINR } from '@/lib/pricing';

const CartItem = ({
  item,
  checked,
  onToggle,
  onIncrement,
  onDecrement,
  onRemove,
  onMoveToWishlist,
  canEdit,
}) => {
  return (
    <article className={`rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm ${item.isUnavailable ? 'opacity-80' : ''}`}>
      <div className="flex gap-3">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-4 w-4 rounded border-[#d1d5db] text-[#e0b090] focus:ring-[#ffc6d6]"
            aria-label={`Select ${item.name}`}
          />
        </div>

        <Link to={`/product/${item.id}`} className="shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className={`h-24 w-20 rounded-lg object-cover sm:h-28 sm:w-24 ${item.isUnavailable ? 'grayscale' : ''}`}
            loading="lazy"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/product/${item.id}`} className="line-clamp-1 text-sm font-semibold text-[#111827] hover:text-[#e0b090]">
                {item.name}
              </Link>
              <p className="mt-1 line-clamp-1 text-sm text-[#6b7280]">{item.shortDescription}</p>
              <p className="mt-1 text-xs text-[#9ca3af]">Sold by: {item.seller}</p>
            </div>

            <button
              type="button"
              onClick={onRemove}
              disabled={!canEdit}
              className="rounded-md p-1.5 text-[#ef4444] transition-colors hover:bg-[#fbf5f1] hover:text-[#dc2626] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#6b7280]">
            <span className="rounded-md bg-[#f4f4f5] px-2 py-1">Size: {item.sizeLabel}</span>

            <div className="inline-flex items-center overflow-hidden rounded-md border border-[#d1d5db] bg-white">
              <button
                type="button"
                onClick={onDecrement}
                disabled={!canEdit || item.quantity <= 1}
                className="grid h-8 w-8 place-items-center border-r border-[#e5e7eb] text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <span className="grid min-w-8 place-items-center px-2 text-sm font-semibold text-[#111827]">{item.quantity}</span>
              <button
                type="button"
                onClick={onIncrement}
                disabled={!canEdit || item.isUnavailable || item.atStockLimit}
                className="grid h-8 w-8 place-items-center border-l border-[#e5e7eb] text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-[#111827]">Rs {formatPriceINR(item.unitPrice)}</p>
            {item.pricing.hasDiscount ? <p className="text-sm text-[#9ca3af] line-through">Rs {formatPriceINR(item.pricing.mrp)}</p> : null}
            {item.pricing.hasDiscount ? (
              <span className="rounded-md bg-[#fbf5f1] px-2 py-0.5 text-xs font-semibold text-[#e0b090]">
                {item.pricing.discountLabel}% OFF
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            {item.stock !== null && item.stock > 0 && item.stock <= 5 ? (
              <span className="rounded-md bg-[#fff7ed] px-2 py-1 font-semibold text-[#ea580c]">Only {item.stock} left</span>
            ) : null}

            {item.isUnavailable ? (
              <span className="rounded-md bg-[#fef2f2] px-2 py-1 font-semibold text-[#dc2626]">Currently unavailable</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#047857]"><Truck size={13} /> {item.deliveryEstimate}</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onMoveToWishlist}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7280] transition-colors hover:text-[#111827]"
            >
              <Heart size={14} /> Move to Wishlist
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CartItem;
