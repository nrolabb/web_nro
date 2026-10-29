const { isLogin } = require('../../middleware/auth.middleware');
const rateLimit = require('../../middleware/rate-limit');
const { transfer, WalletError } = require('../../helper/wallet');
const codes = require('../../helper/wallet-codes');
module.exports = {
  name: 'wallet/transfer', method: 'POST',
  middleware: [isLogin, rateLimit({name:'wallet-transfer',windowMs:60000,max:10})],
  run: async ({req,res,sql}) => {
    let db;
    try {
      db = await sql.promise().getConnection();
      await db.beginTransaction();
      const result = await transfer(db, req.auth.id, req.body || {});
      await db.commit();
      // Notify the receiver's open "Mã nhận điểm" screen only after commit.
      if (!result.duplicate) {
        codes.markReceived(result.receiverId, { from: result.sender, amount: result.amount, note: result.note });
        if (req.body?.recipientCode !== undefined) codes.consumeClaim(req.body.recipientCode, req.auth.id);
      }
      res.json({error:false, balance:result.balance, duplicate:result.duplicate, receiver:result.receiver, message:result.duplicate?'Giao dịch này đã hoàn tất trước đó.':`Chuyển ${Number(result.amount).toLocaleString('vi-VN')} điểm đến ${result.receiver} thành công.`});
    } catch(error) {
      if(db) await db.rollback();
      if (!(error instanceof WalletError)) console.error('Wallet transfer failed:', error.code || 'database error');
      res.status(error instanceof WalletError ? 400 : 500).json({error:true,message:error instanceof WalletError?error.message:'Chưa xác nhận được giao dịch. Bấm thử lại để kiểm tra cùng giao dịch.'});
    } finally { if(db) db.release(); }
  }
};
