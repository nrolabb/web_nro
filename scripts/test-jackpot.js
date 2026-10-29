const assert = require('node:assert/strict');
const config = require('../config');
const { rankLevel, normalizeOptions, rewards } = require('../helper/jackpot');
const route = require('../routes/game/jackpot-open');
const jwt = require('jsonwebtoken');
async function run() {
    assert.equal(rankLevel(0), -1);
    config.accountRanks.forEach((rank, i) => { assert.equal(rankLevel(rank.amount), i); assert.equal(rankLevel(rank.amount - 1), i - 1); });
    assert.deepEqual(normalizeOptions('[[50,10]]'), [{ id: 50, param: 10 }]);
    for (const invalid of ['{}', '[[50]]', '[[-1,2]]', '[[50,"10"]]']) assert.throws(() => normalizeOptions(invalid));
    const item = { id: 1, item_id: 1, quantity: 2, name: 'Test reward', icon_id: 1, item_options: '[[50,10]]', chest_id: 0 };
    for (let chest = 0; chest < 4; chest++) {
        const db = { query: async (sql, args) => sql.includes('jackpot_item') ? [[0,1,2,3].filter(i => i <= args[0]).map(i => ({ ...item, chest_id: i }))] : [[{ id: 50 }]] };
        assert.equal((await rewards(db, chest)).length, chest + 1);
    }
    for (const scenario of ['success', 'rank', 'balance', 'empty', 'invalid', 'queue-error', 'retry']) {
        let committed = false, rolledBack = false, debit = 0, queued = 0, released = false;
        const db = {
            beginTransaction: async () => {}, commit: async () => { committed = true; }, rollback: async () => { rolledBack = true; }, release: () => { released = true; },
            query: async (sql, args) => {
                if (sql.startsWith('SELECT vnd')) return [[{ vnd: scenario === 'balance' ? 0 : 100000, tongnap: scenario === 'rank' ? 0 : 999999999 }]];
                if (sql.startsWith('SELECT reward')) return [scenario === 'retry' ? [{ reward: JSON.stringify(item) }] : []];
                if (sql.startsWith('SELECT chest_id')) return [[{ chest_id: 3, cost: config.jackpotPrice, created_at: new Date() }]];
                if (sql.startsWith('SELECT id FROM player')) return [[{ id: 1 }]];
                if (sql.includes('FROM jackpot_item')) return [scenario === 'empty' ? [] : [{ ...item, item_options: scenario === 'invalid' ? '{}' : item.item_options }]];
                if (sql.includes('FROM item_option_template')) return [[{ id: 50 }]];
                if (sql.startsWith('UPDATE account')) debit++;
                if (sql.startsWith('INSERT INTO spin_reward')) { if (scenario === 'queue-error') throw new Error('injected queue failure'); queued++; assert.equal(args[0], 123); assert.equal(args[3], '[{"id":50,"param":10}]'); }
                return [{}];
            }
        };
        global.sql = { promise: () => ({ getConnection: async () => db }) };
        const res = { code: 200, status(n) { this.code = n; return this; }, json(data) { this.data = data; }, sendStatus(n) { this.code = n; } };
        await route.run({ req: { body: { chestId: 3, requestId: '12345678-1234-1234-1234-123456789012', token: jwt.sign({ purpose: 'jackpot', accountId: 123 }, config.jwt_secretkey) } }, user: { getInfo: async () => [{ id: 123 }] }, res });
        assert.ok(released);
        if (scenario === 'success') { assert.ok(committed); assert.equal(debit, 1); assert.equal(queued, 1); assert.equal(res.data.balance, 100000 - config.jackpotPrice); }
        else if (scenario === 'retry') { assert.ok(committed); assert.equal(debit, 0); assert.equal(queued, 0); }
        else { assert.ok(rolledBack); assert.equal(committed, false); assert.ok(res.code >= 400); }
    }
    console.log('PASS: rank boundaries, inherited pools, options, debit/queue, insufficient balance, empty pool, rollback and duplicate retry.');
}
run().catch(err => { console.error(err); process.exitCode = 1; });
