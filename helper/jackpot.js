const config = require('../config');
function rankLevel(total) {
    return config.accountRanks.reduce((level, rank, i) => Number(total) >= rank.amount ? i : level, -1);
}
function normalizeOptions(raw) {
    const pairs = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(pairs) || pairs.some(p => !Array.isArray(p) || p.length !== 2 ||
        !Number.isInteger(p[0]) || p[0] < 0 || !Number.isInteger(p[1]) || p[1] < 0 || p[1] > 2147483647)) {
        throw new Error('Option phải có dạng [[id,value],[id,value]]');
    }
    const options = pairs.map(([id, param]) => ({ id, param }));
    if (JSON.stringify(options).length > 255) throw new Error('Option vượt giới hạn nhận thưởng 255 ký tự');
    return options;
}
async function rewards(db, chestId) {
    const [rows] = await db.query('SELECT j.*, t.name, t.icon_id FROM jackpot_item j LEFT JOIN item_template t ON t.id = j.item_id WHERE j.chest_id <= ? ORDER BY j.id', [chestId]);
    const [templates] = await db.query('SELECT id FROM item_option_template');
    const ids = new Set(templates.map(t => t.id));
    return rows.map(row => {
        const options = normalizeOptions(row.item_options);
        if (!row.name || !Number.isInteger(row.quantity) || row.quantity <= 0 || row.item_id < 0 || row.item_id > 32767 || options.some(o => !ids.has(o.id))) throw new Error('Cấu hình phần thưởng không hợp lệ');
        return { ...row, options, item_options: undefined };
    });
}
module.exports = { rankLevel, normalizeOptions, rewards };
