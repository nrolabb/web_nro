const { isLogin } = require('../../middleware/auth.middleware');
const rateLimit = require('../../middleware/rate-limit');
const { claim } = require('../../helper/wallet-codes');
// Step 1 of a code transfer: confirm the code is still valid and show the
// sender who will receive the points before asking for the password.
module.exports={name:'wallet/code/check',method:'POST',middleware:[isLogin,rateLimit({name:'wallet-code-check',windowMs:60000,max:20})],run:async({req,res})=>{
 res.set('Cache-Control','no-store');
 const result=claim(req.body?.code,req.auth.id);
 if(result.error)return res.status(400).json({error:true,message:result.error});
 res.json({error:false,recipient:result.username,remainingMs:result.remainingMs});
}};
