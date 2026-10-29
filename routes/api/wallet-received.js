const { isLogin } = require('../../middleware/auth.middleware');
const { receivedSince } = require('../../helper/wallet-codes');
// Polled by the receiver's open "Mã nhận điểm" screen to show incoming points.
module.exports={name:'wallet/received',method:'GET',middleware:[isLogin],run:async({req,res,sql})=>{
 res.set('Cache-Control','no-store');
 const since=Number(req.query.since)||0;
 const items=receivedSince(req.auth.id,since);
 let balance;
 if(items.length){const [[row]]=await sql.promise().query('SELECT vnd FROM account WHERE id=?',[req.auth.id]);balance=Number(row?.vnd);}
 res.json({error:false,now:Date.now(),items,balance});
}};
