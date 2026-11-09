const { verifySession } = require('./auth.middleware');

// These routes must remain usable before a character exists. The payment
// webhook authenticates the payment provider independently of browser sessions.
const exemptRoutes = new Set([
  'login', 'register', 'auth/login', 'auth/register', 'logout', 'api/sepay/webhook',
]);

module.exports = function characterAccess(route, routeDir, sql) {
  const name = route.name.toLowerCase().replace(/^\/+|\/+$/g, '');
  return (req, res, next) => {
    if (exemptRoutes.has(name)) return next();
    const identity = verifySession(req);
    if (!identity) return next(); // Existing route authentication handles guests.

    res.set('Cache-Control', 'no-store');
    sql.query('SELECT 1 FROM player WHERE account_id = ? LIMIT 1', [identity.sub], (err, rows) => {
      if (err) {
        console.error('Character access lookup failed:', err);
        return res.status(503).json({ error: true, success: false, message: 'Không thể kiểm tra nhân vật, vui lòng thử lại.' });
      }
      res.locals.hasCharacter = rows.length > 0;
      if (res.locals.hasCharacter || (routeDir === 'page' && name === '')) return next();

      if (routeDir === 'page' || (routeDir === 'admin' && route.method.toUpperCase() === 'GET')) {
        return res.redirect('/');
      }
      return res.status(403).json({
        error: true,
        success: false,
        code: 'CHARACTER_REQUIRED',
        message: 'Vui lòng vào game và tạo nhân vật!',
      });
    });
  };
};
