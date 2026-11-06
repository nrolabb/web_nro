const assert = require('node:assert/strict');
const fs = require('node:fs');
const { redeem, getCode, ReferralError } = require('../helper/referrals');
// No real accounts are modified. Model SQL effects and transaction rollback.
class Database {
  constructor(active = 0) {
    this.rows = [1, 2].map(id => ({ id, username: 'test' + id, gioithieu: 'code' + id,
      active: id === 1 ? active : 0, vnd: 100000, xacnhan_gioithieu: 0,
      last_time_login: '2026-01-01', last_time_logout: '2026-01-02' }));
    this.gifts = [];
  }
  async beginTransaction() { this.snapshot = structuredClone({ rows: this.rows, gifts: this.gifts }); }
  async commit() { this.snapshot = null; }
  async rollback() { if (this.snapshot) Object.assign(this, this.snapshot); this.snapshot = null; }
  release() {}
  async query(sql, args) {
    if (sql.startsWith('SELECT id FROM account WHERE gioithieu')) return [this.rows.filter(x => x.gioithieu === args[0])];
    if (sql.includes('WHERE id IN')) return [this.rows.filter(x => args.includes(x.id)).map(x => ({ ...x }))];
    if (sql.startsWith('SELECT')) return [this.rows.filter(x => x.id === args[0]).map(x => ({ ...x }))];
    if (sql.startsWith('INSERT INTO spin_reward')) {
      if (this.failGift) throw new Error('simulated queue failure');
      this.gifts.push(args); return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('UPDATE account SET xacnhan')) {
      const row = this.rows.find(x => x.id === args[1]);
      if (row.xacnhan_gioithieu) return [{ affectedRows: 0 }];
      row.xacnhan_gioithieu = args[0];
    } else if (sql.startsWith('UPDATE account SET gioithieu')) {
      this.rows.find(x => x.id === args[1]).gioithieu = args[0];
    } else if (sql.startsWith('UPDATE account SET vnd')) {
      this.rows.find(x => x.id === args[0]).vnd += 10000;
    } else if (sql.startsWith('UPDATE account SET active')) {
      const row = this.rows.find(x => x.id === args[1]);
      if (row.active || row.vnd < args[0]) return [{ affectedRows: 0 }];
      row.active = 1; row.vnd -= args[0];
    } else throw new Error('Unhandled SQL: ' + sql);
    return [{ affectedRows: 1 }];
  }
}
// Stub only deployment config; exercise real route handlers and helpers.
require.cache[require.resolve('../config')] = { exports: { active_coins: 10000, jwt_secretkey: 'test', publicOrigin: '' } };
const referral = require('../routes/auth/referral');
const activate = require('../routes/auth/active');
async function run(route, db, code) {
  const res = { set() { return this; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  await route.run({ req: { auth: { id: 1 }, body: { code } }, res, sql: { promise: () => ({ getConnection: async () => db }) } });
  return res;
}
(async () => {
  for (const active of [0, 1]) {
    const db = new Database(active);
    assert.equal((await run(referral, db, ' code2 ')).body.error, false);
    assert.equal(db.rows[0].xacnhan_gioithieu, 2);
    assert.deepEqual(db.gifts, [[1,573,5,'[]'],[1,574,5,'[]'],[2,573,5,'[]'],[2,574,5,'[]']]);
    assert.equal(db.rows[1].vnd, active ? 110000 : 100000);
    assert.equal((await run(referral, db, 'code2')).body.error, true);
    assert.equal(db.gifts.length, 4);
    assert.equal((await run(activate, db)).body.error, false);
    assert.equal(db.rows[1].vnd, 110000);
    await run(activate, db);
    assert.equal(db.rows[1].vnd, 110000, 'activation must not pay twice');
  }
  for (const code of ['code1', 'missing', '', null, {}, 'a'.repeat(256)]) {
    const db = new Database();
    await assert.rejects(() => redeem(db, 1, code), ReferralError);
    assert.equal(db.gifts.length, 0);
  }
  const online = new Database();
  online.rows[0].last_time_login = '2026-01-03';
  assert.equal((await run(referral, online, 'code2')).body.error, true);
  assert.equal((await run(activate, online)).body.error, true);
  const broken = new Database(1); broken.failGift = true;
  assert.equal((await run(referral, broken, 'code2')).statusCode, 503);
  assert.equal(broken.rows[0].xacnhan_gioithieu, 0);
  assert.equal(broken.rows[1].vnd, 100000);
  const codes = new Database(); codes.rows[0].gioithieu = null;
  const generated = await getCode(codes, 1);
  assert.ok(generated.startsWith('test1_'));
  assert.equal(await getCode(codes, 1), generated);
  const template = fs.readFileSync(require.resolve('../views/page/profile.ejs'), 'utf8').replace(/<%- include\([^\n]+\) %>/g, '');
  for (const confirmed of [0, 2]) {
    const html = require('ejs').render(template, { user: [{ username: 'test', gioithieu: '<script>', xacnhan_gioithieu: confirmed }], player: [], options: { config: { accountRanks: [] } } });
    assert.ok(html.includes('Xem mã giới thiệu'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.equal(html.includes('id="referral-form"'), !confirmed);
  }
  console.log('Referral tests passed: rewards, activation, duplicate, validation, offline, rollback, stable code, EJS states.');
})().catch(error => { console.error(error); process.exitCode = 1; });
