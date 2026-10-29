const { isLogin } = require('../../middleware/auth.middleware');
const { randomUUID } = require('crypto');
module.exports={name:'wallet/data',method:'GET',middleware:[isLogin],run:async({req,res,sql})=>{
 const db=sql.promise();
 const [[account]]=await db.query('SELECT vnd FROM account WHERE id=?',[req.auth.id]);
 const [rows]=await db.query("SELECT id,amount,description,UNIX_TIMESTAMP(created_at)*1000 time_ms FROM account_transactions WHERE account_id=? AND (description LIKE 'Chuyển %' OR description LIKE 'Nhận %') ORDER BY id DESC LIMIT 100",[req.auth.id]);
 res.set('Cache-Control','no-store');
 res.json({accountId:req.auth.id,balance:account.vnd,requestId:randomUUID(),transactions:rows.map(row=>{
  const match=/^(?:Chuyển|Nhận) \d+ điểm (?:đến|từ) (\S+)(?: - ([\s\S]*))? \[Ví:[^\]]+\]$/.exec(row.description);
  return {id:row.id,type:Number(row.amount)>0?'receive':'transfer',amount:Math.abs(Number(row.amount)),targetCode:match?.[1]||'',note:match?.[2]||'',time:new Date(Number(row.time_ms)).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'}),status:'Thành Công'};
 })});
}};
