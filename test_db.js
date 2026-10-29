const mysql = require("mysql2");
require("dotenv").config();
const config = require("./config");
console.log("Config DB:", config.database);
const connection = mysql.createPool(config.database);
connection.query("SELECT * FROM account LIMIT 1", (err, results) => {
    if (err) {
        console.error("Query Error:", err);
    } else {
        console.log("Results:", results);
    }
    process.exit(0);
});
