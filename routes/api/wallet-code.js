const { isLogin } = require('../../middleware/auth.middleware');
const rateLimit = require('../../middleware/rate-limit');
const { issue } = require('../../helper/wallet-codes');
module.exports={name:'wallet/code',method:'POST',middleware:[isLogin,rateLimit({name:'wallet-code',windowMs:60000,max:20})],run:async({req,res})=>{
 res.set('Cache-Control','no-store');res.json({...issue(req.auth.id,req.auth.username),now:Date.now()});
}};
