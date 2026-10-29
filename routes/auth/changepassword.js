const { isLogin } = require('../../middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = {
  name: 'auth/changepassword',
  middleware: [isLogin],
  method: 'post',
  run: async ({ req, res, next, user }) => {
    try {
      const identity = jwt.verify(req.cookies?.signature, config.jwt_secretkey);
      if (!identity.username || identity.username !== req.cookies?.username) {
        return res.json({ error: true, message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
      }
      const account = (await user.getInfo())[0];
      if (!account || account.username !== identity.username) {
        return res.json({ error: true, message: 'Không tìm thấy tài khoản đăng nhập.' });
      }
      const { oldPassword, newPassword } = req.body || {};
      if (typeof oldPassword !== 'string' || typeof newPassword !== 'string' || !oldPassword || !newPassword) {
        return res.json({ error: true, message: 'Vui lòng nhập đầy đủ thông tin!' });
      }
      if (!/^[a-z0-9]+$/i.test(newPassword)) {
        return res.json({ error: true, message: 'Mật khẩu chỉ được chứa chữ cái và chữ số, không có khoảng trắng hoặc ký tự đặc biệt.' });
      }
      if (oldPassword !== account.password) {
        return res.json({ error: true, message: 'Mật khẩu hiện tại không đúng!' });
      }
      if (oldPassword === newPassword) {
        return res.json({ error: true, message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
      }
      global.sql.query('UPDATE account SET password = ? WHERE id = ? AND BINARY password = ?',
        [newPassword, account.id, oldPassword], (err, result) => {
          if (err) return res.json({ error: true, message: 'Đã xảy ra lỗi tại hệ thống!' });
          if (!result.affectedRows) return res.json({ error: true, message: 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.' });
          res.clearCookie('signature');
          res.clearCookie('username');
          return res.json({ error: false, message: 'Đổi mật khẩu thành công!' });
        });
    } catch (err) { next(err); }
  }
};
