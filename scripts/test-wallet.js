const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { transfer, WalletError } = require('../helper/wallet');
(async () => {
 const db = await require('mysql2/promise').createConnection(require('../config').database);
 const ids=[];
 try {
  await db.beginTransaction();
  const tag=Date.now().toString(36);
  for (let i=0;i<2;i++) {
   const [r]=await db.query("INSERT INTO account (username,password,email,token,xsrf_token,newpass,vnd,tongnap,ban) VALUES (?,?,'','','','',10000,0,0)",['wtest'+tag+i,'test-only']);ids.push(r.insertId);
  }
  const payload={recipient:'wtest'+tag+'1',password:'test-only',amount:'1000',requestId:randomUUID(),note:'Kiểm tra <script>'};
  assert.equal((await transfer(db,ids[0],payload)).balance,9000);
  assert.equal((await transfer(db,ids[0],payload)).duplicate,true);
  for(const change of [{amount:'-1'},{amount:'0'},{amount:'1.5'},{amount:'100000'},{password:'wrong'},{recipient:'wtest'+tag+'0'}]) {
   await assert.rejects(()=>transfer(db,ids[0],{...payload,requestId:randomUUID(),...change}),WalletError);
  }
  await assert.rejects(()=>transfer(db,ids[0],{...payload,amount:'2'}),WalletError);
  await transfer(db,ids[1],{recipient:'wtest'+tag+'0',password:'test-only',amount:500,requestId:randomUUID()});
  const [balances]=await db.query('SELECT vnd,tongnap FROM account WHERE id IN (?,?) ORDER BY id',ids);
  assert.deepEqual(balances.map(x=>[x.vnd,x.tongnap]),[[9500,0],[10500,0]]);
  const [rows]=await db.query('SELECT *, UNIX_TIMESTAMP(created_at)*1000 time_ms FROM account_transactions WHERE account_id IN (?,?)',ids);
  assert.equal(rows.length,4); assert.equal(rows.reduce((s,r)=>s+Number(r.amount),0),0);
  const options=require('../helper').optionsEJS({originalUrl:'/wallet'},{});
  const html=await require('ejs').renderFile('views/page/wallet.ejs',{user:[{id:ids[0],username:'test',vnd:9500}],options,transactions:rows,requestId:randomUUID()});
  assert.ok(html.includes('Ví cá nhân'));assert.ok(html.includes('userFeaturesModal'));assert.ok(html.includes('wallet-popup.js'));
  const codes=require('../helper/wallet-codes');
  const issued=codes.issue(ids[1],payload.recipient);
  const codePayload={...payload,recipient:undefined,recipientCode:issued.code,requestId:randomUUID(),amount:1};
  await transfer(db,ids[0],codePayload);
  codes.issue(ids[1],payload.recipient);
  assert.equal((await transfer(db,ids[0],codePayload)).duplicate,true);
  await assert.rejects(()=>transfer(db,ids[0],{...codePayload,requestId:randomUUID()}),WalletError);
  const expired=codes.issue(ids[1],payload.recipient,Date.now()-61000);
  await assert.rejects(()=>transfer(db,ids[0],{...codePayload,recipientCode:expired.code,requestId:randomUUID()}),WalletError);
  await transfer(db,ids[1],{recipient:'wtest'+tag+'0',password:'test-only',amount:1,requestId:randomUUID()});
  const oldToken=process.env.SEPAY_WEBHOOK_TOKEN;
  process.env.SEPAY_WEBHOOK_TOKEN='wallet-test-token';
  try {
   let response;
   const res={json:value=>{response=value;return res;},status:()=>res};
   const request={get:()=> 'Apikey wallet-test-token',body:{id:'wallet-test-'+tag,transferType:'in',transferAmount:20000,content:(process.env.PAYMENT_PREFIX || 'NAP')+'TKID'+String(ids[0]).padStart(4,'0'),gateway:'test'}};
   // Keep the webhook's writes inside the outer rollback-only test transaction.
   const wrapped={query:db.query.bind(db),beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{}};
   const sql={promise:()=>({getConnection:async()=>wrapped})};
   await require('../routes/api/sepay').run({req:request,res,sql});
   assert.equal(response.success,true);
   const expected=Math.floor(20000*Number(process.env.FIRST_TOPUP_BONUS || 200)/100);
   const [[after]]=await db.query('SELECT vnd,tongnap FROM account WHERE id=?',[ids[0]]);
   assert.equal(after.vnd,9500+expected);assert.equal(after.tongnap,20000);
   await require('../routes/api/sepay').run({req:request,res,sql});
   assert.equal(response.message,'Transaction already processed');
   const [donations]=await db.query('SELECT amount FROM account_transactions WHERE account_id=? AND description LIKE ?',[ids[0],'Donate SePay #wallet-test-'+tag+'%']);
   assert.equal(donations.length,1);assert.equal(Number(donations[0].amount),expected);
  }finally{if(oldToken===undefined)delete process.env.SEPAY_WEBHOOK_TOKEN;else process.env.SEPAY_WEBHOOK_TOKEN=oldToken;}
  await db.rollback();
  assert.equal((await db.query('SELECT id FROM account WHERE id IN (?,?)',ids))[0].length,0);
  console.log('PASS: transfer both directions, duplicate, insufficient balance, password, self-transfer, invalid amount, ledger, Donate rank unchanged, escaped EJS. Donate webhook credit, duplicate and ledger verified. All test data rolled back.');
 } finally {await db.rollback();await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
