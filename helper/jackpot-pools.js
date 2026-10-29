const config = require('../config');
const crypto = require('crypto');

async function getPools(db) {
    const [rows] = await db.query('SELECT chest_id, amount FROM jackpot_pool ORDER BY chest_id');
    if (rows.length !== 4) throw new Error('Chưa khởi tạo đủ 4 hũ Jackpot');
    return rows.map(row => ({ ...config.jackpotPools[row.chest_id], amount: Number(row.amount) }));
}

// The caller must hold an active transaction. Lock every pool in stable order so each spin
// contributes to all four tiers without losing concurrent updates.
async function drawPool(db, chestId, randomInt = crypto.randomInt) {
    const settings = config.jackpotPools[chestId];
    const contribution = Math.floor(config.jackpotPrice / 10);
    const [pools] = await db.query('SELECT chest_id, amount FROM jackpot_pool ORDER BY chest_id FOR UPDATE');
    if (pools.length !== 4 || pools.some((pool, index) => Number(pool.chest_id) !== index) || !settings) {
        throw new Error('Chưa khởi tạo đủ 4 hũ Jackpot');
    }
    const won = randomInt(10000) === 0;
    let jackpotAmount = 0;
    let remaining = 0;
    for (const pool of pools) {
        const id = Number(pool.chest_id);
        const amount = Number(pool.amount) + contribution;
        if (!Number.isSafeInteger(amount) || amount > 2147483647) throw new Error('Hũ Jackpot vượt giới hạn số dư VNĐ');
        const isWinningPool = id === chestId;
        if (isWinningPool) jackpotAmount = amount;
        const updatedAmount = isWinningPool && won ? settings.base : amount;
        if (isWinningPool) remaining = updatedAmount;
        await db.query('UPDATE jackpot_pool SET amount = ? WHERE chest_id = ?', [updatedAmount, id]);
    }
    return { won, payout: won ? jackpotAmount : 0, amount: remaining, chestId, contribution };
}

module.exports = { getPools, drawPool };
