const { isLogin } = require('../../middleware/auth.middleware');
module.exports = {
 name:'history',method:'get',middleware:[isLogin],
 run:async ({req,res,user,options,sql}) => {
  try {
   const accounts=await user.getInfo();
   const account=accounts[0];
   if (!account) return res.redirect('/login');
   const player=await user.getPlayer(account.id);
   const filter=['credit','debit'].includes(req.query.type) ? req.query.type : 'all';
   const page=Math.min(1000000,Math.max(1,parseInt(req.query.page,10)||1));
   const condition=filter==='credit'?' AND amount > 0':filter==='debit'?' AND amount < 0':'';
   const db=sql.promise();
   const [[summary]]=await db.query(`SELECT COUNT(*) total, COALESCE(SUM(IF(amount > 0,amount,0)),0) credits, COALESCE(SUM(IF(amount < 0,-amount,0)),0) debits FROM account_transactions WHERE account_id = ?`,[account.id]);
   const [[count]]=await db.query('SELECT COUNT(*) total FROM account_transactions WHERE account_id = ?'+condition,[account.id]);
   const pages=Math.max(1,Math.ceil(count.total/30));
   const currentPage=Math.min(page,pages);
   const [transactions]=await db.query('SELECT *, UNIX_TIMESTAMP(created_at)*1000 AS time_ms FROM account_transactions WHERE account_id = ?'+condition+' ORDER BY id DESC LIMIT 30 OFFSET ?',[account.id,(currentPage-1)*30]);
   const [bankHistory]=await db.query('SELECT transaction_id,amount,status,is_credited,UNIX_TIMESTAMP(created_at)*1000 AS time_ms FROM bank_transfers WHERE username = ? ORDER BY id DESC LIMIT 100',[account.username]);
   const rewards=await user.getHistory(account.id);
   res.render('page/history.ejs',{user:accounts,options,player,transactions,summary,filter,currentPage,pages,bankHistory,rewards:Array.isArray(rewards)?rewards:[]});
  } catch(error) {
   console.error('Cannot load transaction history:',error.message);
   res.status(500).send('Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.');
  }
 }
};
