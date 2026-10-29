const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
async function main() {
    const db = await mysql.createConnection(require('../config').database);
    try {
        const source = fs.readFileSync(path.join(__dirname, '../sql/jackpot.sql'), 'utf8');
        for (const statement of source.split(/;\s*(?:\r?\n|$)/).filter(s => s.trim())) await db.query(statement);
        for (const pool of require('../config').jackpotPools) {
            await db.query('INSERT INTO jackpot_pool (chest_id, amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE chest_id = VALUES(chest_id)', [pool.chestId, pool.base]);
        }
        console.log('Created Jackpot tables and initialized missing pools; existing rewards and accumulated pools unchanged.');
    } finally { await db.end(); }
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
