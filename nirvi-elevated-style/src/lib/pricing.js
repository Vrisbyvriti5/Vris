const toNonNegativeNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return numeric;
};

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

export const clampDiscountPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  if (numeric > 95) return 95;
  return Number(numeric.toFixed(2));
};

export const calculateFinalPrice = (mrp, discountPercent) => {
  const safeMrp = toNonNegativeNumber(mrp);
  const safeDiscount = clampDiscountPercent(discountPercent);

  if (safeMrp <= 0) {
    return 0;
  }

  const finalPrice = safeMrp - ((safeMrp * safeDiscount) / 100);
  return Number(Math.max(finalPrice, 0).toFixed(2));
};

export const getProductPricing = (product = {}) => {
  const fallbackFinalPrice = toNonNegativeNumber(product.final_price ?? product.finalPrice ?? product.price ?? 0);
  const mrpCandidate = toNonNegativeNumber(product.mrp ?? fallbackFinalPrice);
  const rawDiscount = product.discount_percent ?? product.discountPercent;

  let discountPercent;
  let finalPrice;

  if (hasValue(rawDiscount)) {
    discountPercent = clampDiscountPercent(rawDiscount);
    finalPrice = calculateFinalPrice(mrpCandidate || fallbackFinalPrice, discountPercent);
  } else {
    finalPrice = fallbackFinalPrice;
    if (mrpCandidate > 0 && finalPrice < mrpCandidate) {
      discountPercent = clampDiscountPercent(((mrpCandidate - finalPrice) / mrpCandidate) * 100);
    } else {
      discountPercent = 0;
    }
  }

  const mrp = Number((mrpCandidate > 0 ? mrpCandidate : finalPrice).toFixed(2));
  const hasDiscount = discountPercent > 0 && mrp > finalPrice;

  return {
    mrp,
    discountPercent,
    finalPrice,
    hasDiscount,
    discountLabel: Math.max(0, Math.round(discountPercent)),
  };
};

export const formatPriceINR = (value) => {
  const safeValue = toNonNegativeNumber(value);
  const hasFraction = Math.abs(safeValue - Math.trunc(safeValue)) > 0.001;

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(safeValue);
};

export const formatSignedPriceINR = (value, type = 'base') => {
  const formatted = `Rs ${formatPriceINR(value)}`;

  if (type === 'add') {
    return `+ ${formatted}`;
  }

  if (type === 'subtract') {
    return `- ${formatted}`;
  }

  return formatted;
};
