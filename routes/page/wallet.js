const { isLogin } = require('../../middleware/auth.middleware');
module.exports={name:'wallet',method:'GET',middleware:[isLogin],run:async({res,user,options})=>{res.set('Cache-Control','no-store');res.render('page/wallet.ejs',{user:await user.getInfo(),options});}};
