export const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getEntityStock = (entity, fallback = 0) => {
  const rawStock = entity?.stock ?? entity?.quantity ?? entity?.qty ?? entity?.availableQuantity;
  const parsed = toFiniteNumber(rawStock);
  if (parsed === null) {
    return fallback;
  }
  return parsed;
};

export const isOutOfStock = (entity) => getEntityStock(entity, 0) <= 0;
