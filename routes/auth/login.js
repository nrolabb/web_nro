const jwt = require("jsonwebtoken");
const config = require("../../config.js");
const rateLimit = require('../../middleware/rate-limit');

module.exports = {
  name: "auth/login",
  method: "POST",
  middleware: [rateLimit({ name: 'login', windowMs: 15 * 60 * 1000, max: 10 })],
  run: ({ req, res, sql }) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string' || username.length === 0 || password.length === 0) {
      return res.json({
        error: true,
        message: "Vui lòng nhập đầy đủ thông tin!",
      });
    }
    if (username.length > 20 || password.length > 100) {
      return res.status(400).json({ error: true, message: 'Thông tin tài khoản không hợp lệ.' });
    }

    const normalizedUsername = username.toLowerCase();
    sql.query("SELECT id, username, password, ban FROM account WHERE username = ? LIMIT 1", [normalizedUsername], (err, results) => {
      if (err) {
        console.error("Account lookup failed during login:", err);
        return res.status(503).json({
          error: true,
          message: "Không thể kết nối cơ sở dữ liệu, vui lòng thử lại.",
        });
      }

      if (results.length === 0) {
        return res.json({
          error: true,
          message: "Tên đăng nhập hoặc mật khẩu không chính xác.",
        });
      }

      const account = results[0];
      if (account.password !== password || Number(account.ban) !== 0) {
        return res.json({
          error: true,
          message: "Tên đăng nhập hoặc mật khẩu không chính xác.",
        });
      }

      sql.query("SELECT 1 FROM player WHERE account_id = ? LIMIT 1", [account.id], (playerErr, players) => {
        if (playerErr) {
          console.error("Player lookup failed during login:", playerErr);
          return res.status(503).json({
            error: true,
            message: "Không thể kết nối cơ sở dữ liệu, vui lòng thử lại.",
          });
        }

        if (players.length === 0) {
          return res.json({
            error: true,
            message: "Vui lòng vào game và tạo nhân vật!",
          });
        }

        const signature = jwt.sign({ sub: account.id, username: account.username }, config.jwt_secretkey, {
          algorithm: 'HS256', expiresIn: '7d', issuer: 'nro-web', audience: 'nro-web'
        });
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const cookieOptions = { expires, httpOnly: true, sameSite: 'lax', secure: Boolean(req.secure) || config.publicOrigin.startsWith('https://'), path: '/' };

        res.cookie("signature", signature, cookieOptions);
        res.cookie("username", account.username, cookieOptions);
        return res.json({
          error: false,
          message: "Đăng nhập thành công",
        });
      });
    });
  },
};
