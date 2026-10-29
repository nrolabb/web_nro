const config = require('../config');
const crypto = require('crypto');

async function getPools(db) {
    const [rows] = await db.query('SELECT chest_id, amount FROM jackpot_pool ORDER BY chest_id');
    if (rows.length !== 4) throw new Error('Chưa khởi tạo đủ 4 hũ Jackpot');
    return rows.map(row => ({ ...config.jackpotPools[row.chest_id], amount: Number(row.amount) }));
}

// The caller must hold an active transaction. Lock serializes all players of this chest.
async function drawPool(db, chestId, randomInt = crypto.randomInt) {
    const settings = config.jackpotPools[chestId];
    const [[pool]] = await db.query('SELECT amount FROM jackpot_pool WHERE chest_id = ? FOR UPDATE', [chestId]);
    if (!pool) throw new Error('Hũ Jackpot chưa được khởi tạo');
    const amount = Number(pool.amount) + settings.increment;
    if (!Number.isSafeInteger(amount) || amount > 2147483647) throw new Error('Hũ Jackpot vượt giới hạn số dư VNĐ');
    const won = randomInt(100) === 0;
    const remaining = won ? settings.base : amount;
    await db.query('UPDATE jackpot_pool SET amount = ? WHERE chest_id = ?', [remaining, chestId]);
    return { won, payout: won ? amount : 0, amount: remaining, chestId };
}

module.exports = { getPools, drawPool };
