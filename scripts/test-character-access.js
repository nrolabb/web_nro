const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
process.env.JWT_SECRET = 'character-access-test-secret-for-local-tests-only';
process.env.DB_USER = 'character_test';
process.env.DB_PASSWORD = 'mock-database-no-connection';

async function main() {
  const account = { id: 1, username: 'test', password: 'test-password', ban: 0, vnd: 0 };
  let hasCharacter = false;
  global.sql = {
    query(query, params, callback) {
      if (query.includes('FROM account')) return callback(null, [account]);
      if (query.includes('FROM player')) return callback(null, hasCharacter ? [{ id: 1 }] : []);
      throw new Error('Unexpected database call: ' + query);
    },
  };
  const app = express();
  app.use(express.json(), cookieParser());
  app.set('views', path.resolve('views'));
  app.set('view engine', 'ejs');
  await require('../middleware')({ app, sql: global.sql });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const login = await fetch(base + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account.username, password: account.password }),
    });
    assert.equal((await login.json()).error, false);
    const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    const request = (url, method = 'GET') => fetch(base + url, { method, headers: { cookie }, redirect: 'manual' });
    const home = await request('/');
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.ok(html.includes('Bạn chỉ có thể xem trang chủ'));
    assert.ok(!html.includes('data-wallet-open'));
    for (const url of ['/profile', '/wallet', '/history', '/changepassword', '/naptien', '/bxh', '/jackpot', '/spin', '/boss']) {
      const response = await request(url);
      assert.equal(response.status, 302, url);
      assert.equal(response.headers.get('location'), '/', url);
    }
    for (const [url, method] of [['/wallet/data', 'GET'], ['/wallet/transfer', 'POST'], ['/auth/referral', 'POST'], ['/active', 'POST'], ['/spin', 'POST'], ['/jackpot/open', 'POST'], ['/api/giftcodes', 'GET'], ['/api/boss-live', 'GET'], ['/auth/changepassword', 'POST']]) {
      const response = await request(url, method);
      assert.equal(response.status, 403, url);
      assert.equal((await response.json()).code, 'CHARACTER_REQUIRED', url);
    }
    hasCharacter = true;
    const unlocked = await request('/');
    const unlockedHtml = await unlocked.text();
    assert.equal(unlocked.status, 200);
    assert.ok(!unlockedHtml.includes('Bạn chỉ có thể xem trang chủ'));
    assert.ok(unlockedHtml.includes('data-wallet-open'));
    assert.equal((await request('/wallet')).status, 200);
    assert.equal((await request('/logout', 'POST')).status, 302);
    const badLogin = await fetch(base + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account.username, password: 'wrong' }),
    });
    assert.equal((await badLogin.json()).error, true);
    console.log('PASS: login, homepage rendering, page/API gates, live character creation, logout and invalid password (mock database).');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
