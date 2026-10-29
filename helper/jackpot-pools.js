const config = require('../config');
const crypto = require('crypto');

async function getPools(db) {
    const [rows] = await db.query('SELECT chest_id, amount FROM jackpot_pool ORDER BY chest_id');
    if (rows.length !== 4) throw new Error('Chưa khởi tạo đủ 4 hũ Jackpot');
    return rows.map(row => ({ ...config.jackpotPools[row.chest_id], amount: Number(row.amount) }));
}

function getContributions(price) {
    const total = Math.floor(price / 10);
    const weights = [1, 2, 3, 4];
    const shares = weights.map(weight => Math.floor(total * weight / 10));
    let remainder = total - shares.reduce((sum, share) => sum + share, 0);
    const remainderOrder = weights.map((weight, index) => ({ index, remainder: total * weight % 10 }))
        .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    for (let i = 0; i < remainder; i++) shares[remainderOrder[i].index]++;
    return shares;
}

// The caller must hold an active transaction. Lock every pool in stable order so each spin
// contributes to all four tiers without losing concurrent updates.
async function drawPool(db, chestId, spinPrice, randomInt = crypto.randomInt) {
    const settings = config.jackpotPools[chestId];
    const contributions = getContributions(spinPrice);
    const [pools] = await db.query('SELECT chest_id, amount FROM jackpot_pool ORDER BY chest_id FOR UPDATE');
    if (pools.length !== 4 || pools.some((pool, index) => Number(pool.chest_id) !== index) || !settings) {
        throw new Error('Chưa khởi tạo đủ 4 hũ Jackpot');
    }
    const won = randomInt(10000) === 0;
    let jackpotAmount = 0;
    let remaining = 0;
    for (const pool of pools) {
        const id = Number(pool.chest_id);
        // Pool order: Mini 1 share, Minor 2, Major 3, Grand 4 of the 10% total.
        const contribution = contributions[id];
        const amount = Number(pool.amount) + contribution;
        if (!Number.isSafeInteger(amount) || amount > 2147483647) throw new Error('Hũ Jackpot vượt giới hạn số dư VNĐ');
        const isWinningPool = id === chestId;
        if (isWinningPool) jackpotAmount = amount;
        const updatedAmount = isWinningPool && won ? settings.base : amount;
        if (isWinningPool) remaining = updatedAmount;
        await db.query('UPDATE jackpot_pool SET amount = ? WHERE chest_id = ?', [updatedAmount, id]);
    }
    return { won, payout: won ? jackpotAmount : 0, amount: remaining, chestId };
}

module.exports = { getPools, drawPool };
