const { isLogin } = require('../../middleware/auth.middleware');
const { active_coins } = require('../../config');
const { creditReferrer, ReferralError } = require('../../helper/referrals');
module.exports = {
  name: 'active', middleware: [isLogin], method: 'POST',
  run: async ({ req, res, sql }) => {
    let db;
    try {
      db = await sql.promise().getConnection();
      await db.beginTransaction();
      const [rows] = await db.query('SELECT id, active, vnd, xacnhan_gioithieu, last_time_login, last_time_logout FROM account WHERE id = ? FOR UPDATE', [req.auth.id]);
      const account = rows[0];
      if (!account) throw new ReferralError('Không tìm thấy tài khoản.');
      if (Number(account.active) === 1) {
        await db.rollback();
        return res.json({ error: false, message: 'Bạn đã kích hoạt rồi' });
      }
      if (Number(account.vnd) < active_coins) throw new ReferralError(`Bạn còn thiếu ${active_coins - Number(account.vnd)} coins để kích hoạt!`);
      const [result] = await db.query("UPDATE account SET active = 1, vnd = vnd - ?, balance_note = 'Mở thành viên trên web' WHERE id = ? AND active = 0 AND vnd >= ?", [active_coins, account.id, active_coins]);
      if (result.affectedRows !== 1) throw new ReferralError('Không thể kích hoạt tài khoản này!');
      if (Number(account.xacnhan_gioithieu)) await creditReferrer(db, account.xacnhan_gioithieu);
      await db.commit();
      return res.json({ error: false, message: 'Kích hoạt thành công!' });
    } catch (error) {
      if (db) await db.rollback();
      if (!(error instanceof ReferralError)) console.error('Activation failed:', error.code || error.name);
      return res.json({ error: true, message: error instanceof ReferralError ? error.message : 'Không thể kích hoạt tài khoản. Vui lòng thử lại.' });
    } finally { if (db) db.release(); }
  }
};
