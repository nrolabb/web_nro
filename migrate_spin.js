const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'nro_app',
        password: 'Quang@9355',
        database: 'nro_arn',
        port: 3306
    });

    const query = (sql, args) => connection.query(sql, args).then(([rows]) => rows);

    console.log("Connected to DB.");

    try {
        // Create table spin_item
        await query(`
            CREATE TABLE IF NOT EXISTS spin_item (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                item_id INT NOT NULL,
                quantity INT NOT NULL,
                item_options TEXT,
                ratio FLOAT NOT NULL DEFAULT 1,
                image VARCHAR(255) DEFAULT ''
            )
        `);
        console.log("Created table spin_item");

        // Clear existing data (if any, so we don't duplicate on re-run)
        await query('DELETE FROM spin_item');

        // Add item_options to spin_reward
        try {
            await query("ALTER TABLE spin_reward ADD COLUMN item_options VARCHAR(255) DEFAULT '[]'");
            console.log("Added column item_options to spin_reward");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column item_options already exists in spin_reward");
            } else {
                throw e;
            }
        }

        // Migrate data
        const listItemsPath = path.join('C:', 'NROServer', 'lighthakai', 'website', 'nroforum', 'routes', 'game', 'listItem.json');
        const items = JSON.parse(fs.readFileSync(listItemsPath, 'utf8'));

        for (const item of items) {
            const name = item.name;
            const img = item.img || '';
            const ratio = item.ratio || 1;
            const param = item.params[0];
            const item_id = param.id;
            const quantity = param.quantity || 1;
            const options = JSON.stringify(param.options || []);

            await query(
                'INSERT INTO spin_item (name, item_id, quantity, item_options, ratio, image) VALUES (?, ?, ?, ?, ?, ?)',
                [name, item_id, quantity, options, ratio, img]
            );
        }
        
        console.log("Migrated " + items.length + " items to spin_item table.");

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        connection.end();
    }
}

run();
