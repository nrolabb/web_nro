const jwt = require('jsonwebtoken');
const config = require('../config');

function clearSession(res, req) {
  const options = { httpOnly: true, sameSite: 'lax', secure: Boolean(req?.secure) || config.publicOrigin.startsWith('https://'), path: '/' };
  res.clearCookie('signature', options);
  res.clearCookie('username', options);
}

function verifySession(req) {
  const token = req.cookies?.signature;
  if (!token || !req.cookies?.username) return null;
  try {
    const decoded = jwt.verify(token, config.jwt_secretkey, {
      algorithms: ['HS256'], issuer: 'nro-web', audience: 'nro-web',
      maxAge: '7d',
    });
    if (!Number.isSafeInteger(decoded.sub) || decoded.username !== req.cookies.username) return null;
    return decoded;
  } catch (_) { return null; }
}

module.exports = {
  verifySession,
  clearSession,
  isLogin: (req, res, next) => {
    const identity = verifySession(req);
    if (!identity) {
      clearSession(res, req);
      return res.redirect('/login');
    }
    global.sql.query('SELECT id, username, ban FROM account WHERE id = ? LIMIT 1', [identity.sub], (err, rows) => {
      if (err) return res.status(503).send('Không thể xác thực tài khoản.');
      const account = rows[0];
      if (!account || account.username !== identity.username || Number(account.ban) !== 0) {
        clearSession(res, req);
        return res.redirect('/login');
      }
      req.auth = { id: account.id, username: account.username };
      next();
    });
  },
  isFix: (_req, res) => res.status(404).send('Không tìm thấy.'),
  isAdmin: (req, res, next) => {
    module.exports.isLogin(req, res, () => {
      global.sql.query('SELECT is_admin FROM account WHERE id = ? LIMIT 1', [req.auth.id], (err, rows) => {
        if (err) return res.status(503).send('Không thể kiểm tra quyền tài khoản.');
        if (Number(rows[0]?.is_admin) !== 1) return res.status(403).send('Bạn không có quyền truy cập.');
        next();
      });
    });
  },
};
