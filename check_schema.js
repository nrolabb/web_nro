const mysql = require('mysql2/promise');
const config = require('./config');

async function run() {
  try {
    const conn = await mysql.createConnection(config.database);
    const [result] = await conn.query(
      "INSERT INTO spin_item (name, item_id, quantity, item_options, ratio, image) VALUES (?, ?, ?, ?, ?, ?)",
      ['', 1287, 1, '[]', 10, '']
    );
    console.log("Insert success:", result);
    const [rows] = await conn.query('SELECT * FROM spin_item WHERE id = ?', [result.insertId]);
    console.log("Row:", rows);
    await conn.query('DELETE FROM spin_item WHERE id = ?', [result.insertId]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
