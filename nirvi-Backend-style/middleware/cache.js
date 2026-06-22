const publicCache = (maxAgeSeconds = 60, staleWhileRevalidateSeconds = maxAgeSeconds * 2) => (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`);
  }
  next();
};

const noStore = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

module.exports = {
  publicCache,
  noStore,
};
