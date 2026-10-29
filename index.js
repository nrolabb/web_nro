const express = require("express");
const mysql = require("mysql2");
const config = require("./config");
const bodyParser = require("body-parser");
const middleware = require("./middleware/index");
const app = express();
const port = config.port;
const path = require("path");
const cookieParser = require('cookie-parser');
require('dotenv').config()

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection; restarting process:', err);
  process.exit(1);
});
process.on('uncaughtException', err => {
  console.error('Uncaught exception; restarting process:', err);
  process.exit(1);
});

app.set('trust proxy', process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(bodyParser.urlencoded({ extended: false, limit: '32kb', parameterLimit: 200 }));
app.use(bodyParser.json({ limit: '32kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || req.path === '/api/sepay/webhook') return next();
  const source = req.get('origin') || (req.get('referer') ? (() => { try { return new URL(req.get('referer')).origin; } catch (_) { return ''; } })() : '');
  const reqHost = (req.get('host') || '').toLowerCase();
  const sourceHost = (() => { try { return new URL(source).host.toLowerCase(); } catch (_) { return ''; } })();
  const isMatch = (config.publicOrigin && source.toLowerCase() === config.publicOrigin.toLowerCase()) || (reqHost && sourceHost === reqHost) || source.toLowerCase() === `${req.protocol}://${reqHost}`.toLowerCase();
  if (!source || !isMatch) return res.status(403).json({ error: true, message: 'Nguồn yêu cầu không hợp lệ.' });
  next();
});

// app.use(async function (req, res, next) {
//   if(!checkFunction(req.url)) {
//       next();
//   } else {
//       res.status(404).send(`<script>alert('Học ăn học nói, học đâu cái thói trộm cắp ?');window.location.href = '${Buffer.from("aHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL1RoaWV1VHJ1bmdLaTNuLw==", 'base64').toString('utf-8')}'</script>`)
//   }
// })

// var checkFunction = (url) => {
//  var blockedUrl = ['/assets/css/style.css', '/assets/css/main.css', '/assets/js/detect.js', '/assets/js/main.js'];

//  return blockedUrl.find(function(urlCheck){
//       return urlCheck === url;
//  })
// }

// Cho phép truy cập vào tài nguyên tĩnh trong thư mục /views/assets
app.use("/assets", express.static(path.join(__dirname, "/views/assets")));
// Serve only the vendor files used by pages, not the entire installed dependency tree.
const gameDataDir = process.env.NRO_GAME_DATA_DIR
  ? path.resolve(process.env.NRO_GAME_DATA_DIR)
  : path.resolve(__dirname, "../SERVER_NRO_ARN/data");
app.use("/api/icon-x2", express.static(path.join(gameDataDir, "icon/x2")));
app.use("/api/icon", express.static(path.join(gameDataDir, "icon/x4")));

// Use a pool so a MySQL restart or idle timeout cannot permanently leave the
// running website with a closed connection.
const connection = mysql.createPool({
  ...config.database,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 200,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});
connection.getConnection((err, pooledConnection) => {
  if (!err) {
    pooledConnection.release();
  }
  if (err) {
    console.error("Lỗi kết nối đến cơ sở dữ liệu:", err);
    return;
  }
  console.log("Kết nối thành công đến cơ sở dữ liệu MySQL");
});

global.sql = connection;

// The watchdog uses this endpoint to distinguish a listening web process from
// a web process that can actually reach its database.
app.get("/health", (req, res) => {
  connection.query("SELECT 1", (err) => {
    if (err) {
      return res.status(503).json({ status: "unhealthy", database: "down" });
    }
    return res.status(200).json({ status: "ok", database: "up" });
  });
});

app.listen(port, config.host, async () => {
  console.log(`Website đang chạy tại http://${config.host}:${port}`);
  middleware({ app, sql: connection });
});
