const { isLogin } = require('../../middleware/auth.middleware');
const rateLimit = require('../../middleware/rate-limit');
const { redeem, ReferralError } = require('../../helper/referrals');
module.exports = {
  name: 'auth/referral', method: 'POST',
  middleware: [isLogin, rateLimit({ name: 'referral', windowMs: 60000, max: 10 })],
  run: async ({ req, res, sql }) => {
    let db;
    res.set('Cache-Control', 'no-store');
    try {
      db = await sql.promise().getConnection();
      await db.beginTransaction();
      await redeem(db, req.auth.id, req.body?.code);
      await db.commit();
      return res.json({ error: false, message: 'Nhập mã thành công! Cả hai nhận quà tại NPC nhà → Nhận quà Vòng Quay.' });
    } catch (error) {
      if (db) await db.rollback();
      if (!(error instanceof ReferralError)) console.error('Referral failed:', error.code || error.name);
      return res.status(error instanceof ReferralError ? 400 : 503).json({ error: true, message: error instanceof ReferralError ? error.message : 'Chưa thể nhập mã. Vui lòng thử lại.' });
    } finally { if (db) db.release(); }
  }
};
