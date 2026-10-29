const mysql = require('mysql2/promise');
async function main() {
    const db = await mysql.createConnection(require('../config').database);
    try {
        await db.query(`CREATE TABLE IF NOT EXISTS jackpot_pool (
            chest_id TINYINT UNSIGNED NOT NULL,
            amount INT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (chest_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        for (const pool of require('../config').jackpotPools) {
            await db.query('INSERT INTO jackpot_pool (chest_id, amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE chest_id = VALUES(chest_id)', [pool.chestId, pool.base]);
        }
        console.log('Created jackpot_pool and initialized missing pools; existing accumulated amounts unchanged.');
    } finally { await db.end(); }
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
