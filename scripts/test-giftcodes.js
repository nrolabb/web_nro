const assert=require('node:assert/strict');
const route=require('../routes/api/giftcodes');
const config=require('../config');
const jwt=require('jsonwebtoken');
(async()=>{
 const token=jwt.sign({sub:71,username:'gift_test'},config.jwt_secretkey,{algorithm:'HS256',issuer:'nro-web',audience:'nro-web',expiresIn:'1h'});
 for(const loggedIn of [false,true]){
  let response,playerQueries=0;
  const sql={promise:()=>({query:async(query,args)=>{
   if(query.includes('FROM giftcode'))return [[{id:1,code:'WELCOME',count_left:10,expiresAt:Date.now()+100000}]];
   if(query.includes('FROM account')){assert.deepEqual(args,[71,'gift_test']);return [[{id:71}]];}
   if(query.includes('FROM player')){playerQueries++;assert.deepEqual(args,[71]);return [[{id:1,name:'A',giftcode:'["WELCOME"]'},{id:2,name:'B',giftcode:'[]'},{id:3,name:'C',giftcode:'bad-json'},{id:4,name:'D',giftcode:''}]];}
   throw new Error('Unexpected query');
  }})};
  const res={set(){},status(){return res;},json(value){response=value;}};
  await route.run({req:{cookies:loggedIn?{signature:token,username:'gift_test'}:{}},res,sql});
  assert.equal(response.loggedIn,loggedIn);assert.equal(playerQueries,loggedIn?1:0);
  if(loggedIn){assert.deepEqual(response.characters.map(x=>x.claimed),[['WELCOME'],[],null,[]]);}else assert.equal(response.characters.length,0);
 }
 const html=await require('ejs').renderFile('views/partials/head.ejs',{user:[],options:require('../helper').optionsEJS({originalUrl:'/'},{})});
 assert.ok(html.includes('serverGiftcodeOpen'));assert.ok(html.includes(config.socialLinks.facebook));assert.ok(html.includes(config.socialLinks.zalo));
 console.log('PASS: guest list, account-scoped character claims, empty/corrupt state, sidebar render and configured links.');
})().catch(e=>{console.error(e);process.exitCode=1;});
