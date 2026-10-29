const assert=require('node:assert/strict');
const mysql=require('mysql2/promise');
(async()=>{
 const c=await mysql.createConnection(require('../config').database);
 let id;
 try {
  await c.beginTransaction();
  const [insert]=await c.query("INSERT INTO account (username,password,email,token,xsrf_token,newpass,vnd) VALUES (?,?,'','','','',10000)",['ledger'+Date.now().toString().slice(-10),'test-only']);
  id=insert.insertId;
  await c.query("UPDATE account SET vnd=vnd+2000,balance_note='Test credit' WHERE id=?",[id]);
  await c.query("UPDATE account SET vnd=vnd-1000,balance_note='Vòng quay x1' WHERE id=? AND vnd>=1000",[id]);
  await c.query("UPDATE account SET vnd=vnd-500,balance_note='Đổi 500 VNĐ lấy 50 ngọc xanh' WHERE id=? AND vnd>=500",[id]);
  const [failed]=await c.query('UPDATE account SET vnd=vnd-999999 WHERE id=? AND vnd>=999999',[id]);
  assert.equal(failed.affectedRows,0);
  await c.query('UPDATE account SET vnd=vnd WHERE id=?',[id]);
  const [rows]=await c.query('SELECT * FROM account_transactions WHERE account_id=? ORDER BY id',[id]);
  assert.equal(rows.length,3);
  assert.deepEqual(rows.map(r=>[Number(r.amount),Number(r.balance_before),Number(r.balance_after)]),[[2000,10000,12000],[-1000,12000,11000],[-500,11000,10500]]);
  assert.ok(rows[2].description.includes('50 ngọc'));
  assert.equal((await c.query('SELECT balance_note FROM account WHERE id=?',[id]))[0][0].balance_note,null);
  const options=require('../helper').optionsEJS({path:'/history'},{});
  const html=await require('ejs').renderFile(require('path').join(__dirname,'../views/page/history.ejs'),{
   user:[{id,username:'test',vnd:10500}],player:[],options,transactions:rows.map(r=>({...r,time_ms:Date.now()})),summary:{credits:2000,debits:1500},filter:'all',currentPage:1,pages:1,bankHistory:[],rewards:[]
  });
  assert.ok(html.includes('history-credit'));assert.ok(html.includes('history-debit'));assert.ok(html.includes('50 ngọc'));
  await c.rollback();
  assert.equal((await c.query('SELECT id FROM account_transactions WHERE account_id=?',[id]))[0].length,0);
  assert.equal((await c.query('SELECT id FROM account WHERE id=?',[id]))[0].length,0);
  console.log('PASS: ledger amounts, before/after, debit guard, no-op, description, reset, rollback and EJS rendering. No test balance or account committed.');
 }finally{await c.rollback();await c.end();}
})().catch(e=>{console.error(e);process.exitCode=1});
