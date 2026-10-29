// Additive migration: preserves existing balances and records schema/balance snapshot first.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
(async () => {
 const c = await mysql.createConnection(require('../config').database);
 try {
  const backup = {createdAt:new Date().toISOString(), schema:(await c.query('SHOW CREATE TABLE account'))[0], balances:(await c.query('SELECT id, vnd, tongnap FROM account'))[0], triggers:(await c.query('SHOW TRIGGERS'))[0]};
  const file = path.join(__dirname,'../logs/transactions-before-' + Date.now() + '.json');
  fs.writeFileSync(file, JSON.stringify(backup,null,2));
  const statements = fs.readFileSync(path.join(__dirname,'../sql/2026-10-23_account_transactions.sql'),'utf8').split('-- statement');
  await c.query(statements[0]);
  const [columns] = await c.query("SHOW COLUMNS FROM account LIKE 'balance_note'");
  if (!columns.length) await c.query(statements[1]);
  const [triggers] = await c.query("SHOW TRIGGERS WHERE `Trigger` = 'account_vnd_history'");
  if (!triggers.length) await c.query(statements[2]);
  console.log('Transaction ledger ready. Backup:',file);
 } finally { await c.end(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
