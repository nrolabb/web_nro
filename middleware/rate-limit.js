const buckets = new Map();
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.reset <= now) buckets.delete(key);
}, 60_000);
cleanup.unref();

module.exports = function rateLimit({ windowMs, max, name }) {
  return (req, res, next) => {
    const now = Date.now();
    const clientIp = req.get('cf-connecting-ip') || req.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${name}:${clientIp}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.reset <= now) {
      bucket = { count: 0, reset: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.reset - now) / 1000))));
      return res.status(429).json({ error: true, message: 'Bạn thử quá nhiều lần. Vui lòng chờ rồi thử lại.' });
    }
    next();
  };
};
