var { isAdmin } = require("../../middleware/auth.middleware.js");
var config = require("../../config");
var fs = require("fs-extra");
var path = require("path");
var os = require("os");
var spawnableBosses = require("../../data/spawnable-bosses");

const getCpuTimes = () => {
  return os.cpus().reduce(
    function (totals, cpu) {
      Object.keys(cpu.times).forEach(function (type) {
        totals.total += cpu.times[type];
      });
      totals.idle += cpu.times.idle;
      return totals;
    },
    { idle: 0, total: 0 }
  );
};

const getSystemMetrics = () => {
  var start = getCpuTimes();

  return new Promise(function (resolve) {
    setTimeout(function () {
      var end = getCpuTimes();
      var idle = end.idle - start.idle;
      var total = end.total - start.total;
      var totalRam = os.totalmem();
      var usedRam = totalRam - os.freemem();

      resolve({
        cpuUsage: total > 0 ? Math.round((1 - idle / total) * 100) : 0,
        ramUsage: totalRam > 0 ? Math.round((usedRam / totalRam) * 100) : 0,
        ramUsedGb: (usedRam / 1024 / 1024 / 1024).toFixed(1),
        ramTotalGb: (totalRam / 1024 / 1024 / 1024).toFixed(1),
      });
    }, 200);
  });
};

module.exports = {
  name: "panel/admin",
  method: "get",
  middleware: [isAdmin],
  run: async ({ req, res, user, options, sql }) => {
    const queryDatabase = (query, params) => {
      return new Promise((resolve, reject) => {
        sql.query(query, params || [], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    };

    const readLogFile = (filename, maxLines) => {
      try {
        var logPath = path.join(config.logPath, filename);
        if (!fs.existsSync(logPath)) return [];
        var content = fs.readFileSync(logPath, "utf-8");
        var lines = content.split("\n").filter(function (l) {
          return l.trim() !== "";
        });
        return lines.slice(-maxLines);
      } catch (err) {
        console.error("Error reading log file:", err);
        return ["[Error] Cannot read log file: " + err.message];
      }
    };

    // Parse server config from Config.properties
    const parseServerConfig = () => {
      try {
        var configPath = "c:\\NRO_Server\\SERVER_NRO_ARN\\Config.properties";
        if (!fs.existsSync(configPath)) {
          configPath = "c:\\NROServer\\SERVER_NRO_ARN\\Config.properties";
        }
        var content = fs.readFileSync(configPath, "utf-8");
        var cfg = {};
        content.split("\n").forEach(function (line) {
          line = line.trim();
          if (!line || line.startsWith("#")) return;
          var eqIndex = line.indexOf("=");
          if (eqIndex === -1) return;
          var key = line.substring(0, eqIndex).trim();
          var val = line.substring(eqIndex + 1).trim();
          cfg[key] = val;
        });
        return {
          name: cfg["server.name"] || "NRO ARN",
          ip: cfg["server.ip"] || "127.0.0.1",
          port: cfg["server.port"] || "14445",
          maxPlayer: cfg["server.maxplayer"] || "300",
          expRate: cfg["server.expserver"] || "1",
          dbName: cfg["database.name"] || "nro_arn",
        };
      } catch (err) {
        return {
          name: "NRO ARN",
          ip: "127.0.0.1",
          port: "14445",
          maxPlayer: "300",
          expRate: "1",
          dbName: "nro_arn",
        };
      }
    };

    var adminUser = req.cookies?.username || "Admin";
    var { type = "home" } = req.query;

    // Render helper — renders tab content inside the admin-panel layout
    const renderPanel = (tabFile, data) => {
      var ejs = require("ejs");
      var tabPath = path.join(
        __dirname,
        "../../views/admin/tabs",
        tabFile
      );
      ejs.renderFile(tabPath, data, function (err, tabHtml) {
        if (err) {
          console.error("Error rendering tab:", err);
          return res.status(500).send("Error rendering tab: " + err.message);
        }
        res.render("admin/admin-panel.ejs", {
          activeTab: type,
          pageTitle: data.pageTitle || "Dashboard",
          adminUser: adminUser,
          contentPartial: tabHtml,
        });
      });
    };

    switch (type) {
      case "home": {
        try {
          const [totalUsersResult, revenueResult, onlinePlayersResult, systemMetrics] =
            await Promise.all([
              queryDatabase("SELECT COUNT(*) AS totalUsers FROM account"),
              queryDatabase("SELECT COALESCE(SUM(tongnap), 0) AS totalRevenue FROM account"),
              queryDatabase(
                "SELECT COUNT(*) AS onlinePlayers FROM account WHERE last_time_login IS NOT NULL AND (last_time_logout IS NULL OR last_time_login > last_time_logout)"
              ),
              getSystemMetrics(),
            ]);

          var totalRevenue = Number(revenueResult[0].totalRevenue) || 0;

          renderPanel("dashboard.ejs", {
            pageTitle: "Dashboard",
            totalUsers: totalUsersResult[0].totalUsers,
            onlinePlayers: onlinePlayersResult[0].onlinePlayers,
            totalRevenue: totalRevenue,
            serverConfig: parseServerConfig(),
            systemMetrics: systemMetrics,
          });
        } catch (err) {
          console.error("Dashboard error:", err);
          renderPanel("dashboard.ejs", {
            pageTitle: "Dashboard",
            totalUsers: 0,
            onlinePlayers: 0,
            totalRevenue: 0,
            allUser: [],
            serverConfig: parseServerConfig(),
            systemMetrics: {
              cpuUsage: 0,
              ramUsage: 0,
              ramUsedGb: "0.0",
              ramTotalGb: "0.0",
            },
          });
        }
        break;
      }

      case "logs": {
        var logLines = readLogFile("server.log", config.maxLogLines);
        renderPanel("logs.ejs", {
          pageTitle: "Server Log",
          logLines: logLines,
        });
        break;
      }

      case "commands": {
        renderPanel("commands.ejs", {
          pageTitle: "Danh sách lệnh",
          commands: [
            { command: "item", scope: "Admin", description: "Mở biểu mẫu tặng vật phẩm." },
            { command: "c", scope: "Admin", description: "Mở biểu mẫu cộng VND." },
            { command: "brl", scope: "Admin", description: "Hiển thị danh sách boss Broly." },
            { command: "lg", scope: "Admin", description: "Tải lại giftcode từ cơ sở dữ liệu." },
            { command: "ls", scope: "Admin", description: "Tải lại dữ liệu shop từ cơ sở dữ liệu." },
            { command: "getitem", scope: "Admin", description: "Mở biểu mẫu lấy vật phẩm." },
            { command: "hs", scope: "Admin", description: "Xóa thời gian hồi chiêu." },
            { command: "d", scope: "Admin", description: "Dịch chuyển nhân vật xuống 10 tọa độ Y." },
            { command: "a", scope: "Admin", description: "Mở menu admin và xem thông tin máy chủ." },
            { command: "m<mapId>", scope: "Admin", description: "Chuyển đến map theo ID. Ví dụ: m5." },
            { command: "exp<rate>", scope: "Admin", description: "Đổi hệ số EXP toàn máy chủ. Ví dụ: exp2." },
            { command: "toado", scope: "Admin", description: "Xem tọa độ X/Y hiện tại." },
            { command: "1", scope: "Admin", description: "Mở menu quản lý bot." },
            { command: "2", scope: "Admin", description: "Tạo bot tấn công tại vị trí hiện tại." },
            { command: "bots", scope: "Admin", description: "Xem tổng số, thứ tự, loại và vị trí của tối đa 20 bot đang hoạt động." },
            { command: "delbotxxx", scope: "Admin", description: "Xóa bot theo số thứ tự hiển thị bởi lệnh bots." },
            { command: "delbotall", scope: "Admin", description: "Xóa toàn bộ bot khỏi danh sách quản lý và khỏi map." },
            { command: "b", scope: "Admin", description: "Mở biểu mẫu gửi vật phẩm." },
            { command: "n<taskId>", scope: "Admin", description: "Đặt và chuyển tới nhiệm vụ chính theo ID." },
            { command: "dm<value>", scope: "Admin", description: "Đặt chỉ số sát thương." },
            { command: "hp<value>", scope: "Admin", description: "Đặt HP gốc." },
            { command: "ki<value>", scope: "Admin", description: "Đặt KI gốc." },
            { command: "up<amount>", scope: "Admin", description: "Cộng sức mạnh và tiềm năng cho nhân vật." },
            { command: "upp<amount>", scope: "Admin", description: "Cộng sức mạnh và tiềm năng cho đệ tử." },
            { command: "spxxx", scope: "Admin", description: "Buff xxx sức mạnh và tiềm năng cho sư phụ; xxx là số nguyên dương." },
            { command: "dtxxx", scope: "Admin", description: "Buff xxx sức mạnh và tiềm năng cho đệ tử; xxx là số nguyên dương." },
            { command: "i <itemId> <số lượng> [option:value...]", scope: "Admin", description: "Thêm vật phẩm tùy chọn vào hành trang." },
            { command: "ten con la <tên>", scope: "Người chơi", description: "Đổi tên đệ tử." },
            { command: "di theo / follow", scope: "Người chơi", description: "Cho đệ tử đi theo." },
            { command: "bao ve / protect", scope: "Người chơi", description: "Cho đệ tử bảo vệ sư phụ." },
            { command: "tan cong / attack", scope: "Người chơi", description: "Cho đệ tử chủ động tấn công." },
            { command: "ve nha / go home", scope: "Người chơi", description: "Cho đệ tử về nhà." },
            { command: "bien hinh", scope: "Người chơi", description: "Cho đệ tử biến hình." },
            { command: "sach tuyet ky", scope: "Người chơi", description: "Trang bị sách tuyệt kỹ phù hợp cho đệ tử." }
          ]
        });
        break;
      }

      case "accounts": {
        try {
          var page = parseInt(req.query.page) || 1;
          var perPage = 20;
          var offset = (page - 1) * perPage;
          var searchQuery = req.query.search || "";

          var countQuery = "SELECT COUNT(*) AS total FROM account";
          var dataQuery =
            "SELECT * FROM account ORDER BY id DESC LIMIT ? OFFSET ?";
          var countParams = [];
          var dataParams = [perPage, offset];

          if (searchQuery) {
            countQuery =
              "SELECT COUNT(*) AS total FROM account WHERE username LIKE ?";
            dataQuery =
              "SELECT * FROM account WHERE username LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?";
            countParams = ["%" + searchQuery + "%"];
            dataParams = ["%" + searchQuery + "%", perPage, offset];
          }

          const [countResult, accountsResult] = await Promise.all([
            queryDatabase(countQuery, countParams),
            queryDatabase(dataQuery, dataParams),
          ]);

          var totalAccounts = countResult[0].total;
          var totalPages = Math.ceil(totalAccounts / perPage);

          renderPanel("accounts.ejs", {
            pageTitle: "Quản lý Tài khoản",
            accounts: accountsResult,
            totalAccounts: totalAccounts,
            totalPages: totalPages,
            currentPage: page,
            searchQuery: searchQuery,
          });
        } catch (err) {
          console.error("Accounts error:", err);
          renderPanel("accounts.ejs", {
            pageTitle: "Quản lý Tài khoản",
            accounts: [],
            totalAccounts: 0,
            totalPages: 0,
            currentPage: 1,
            searchQuery: "",
          });
        }
        break;
      }

      case "players": {
        try {
          var page = parseInt(req.query.page) || 1;
          var perPage = 20;
          var offset = (page - 1) * perPage;
          var searchQuery = req.query.search || "";

          var countQuery = "SELECT COUNT(*) AS total FROM player";
          var dataQuery =
            "SELECT p.*, a.username AS account_username FROM player p LEFT JOIN account a ON p.account_id = a.id ORDER BY p.id DESC LIMIT ? OFFSET ?";
          var countParams = [];
          var dataParams = [perPage, offset];

          if (searchQuery) {
            countQuery =
              "SELECT COUNT(*) AS total FROM player p LEFT JOIN account a ON p.account_id = a.id WHERE p.name LIKE ? OR a.username LIKE ?";
            dataQuery =
              "SELECT p.*, a.username AS account_username FROM player p LEFT JOIN account a ON p.account_id = a.id WHERE p.name LIKE ? OR a.username LIKE ? ORDER BY p.id DESC LIMIT ? OFFSET ?";
            var searchParam = "%" + searchQuery + "%";
            countParams = [searchParam, searchParam];
            dataParams = [searchParam, searchParam, perPage, offset];
          }

          const [countResult, playersResult] = await Promise.all([
            queryDatabase(countQuery, countParams),
            queryDatabase(dataQuery, dataParams),
          ]);

          var totalPlayers = countResult[0].total;
          var totalPages = Math.ceil(totalPlayers / perPage);

          renderPanel("players.ejs", {
            pageTitle: "Quản lý Player",
            players: playersResult,
            totalPlayers: totalPlayers,
            totalPages: totalPages,
            currentPage: page,
            searchQuery: searchQuery,
          });
        } catch (err) {
          console.error("Players error:", err);
          renderPanel("players.ejs", {
            pageTitle: "Quản lý Player",
            players: [],
            totalPlayers: 0,
            totalPages: 0,
            currentPage: 1,
            searchQuery: "",
          });
        }
        break;
      }

      case "giftcodes": {
        try {
          var page = parseInt(req.query.page) || 1;
          var perPage = 20;
          var offset = (page - 1) * perPage;
          var searchQuery = req.query.search || "";

          var countQuery = "SELECT COUNT(*) AS total FROM giftcode";
          var dataQuery =
            "SELECT * FROM giftcode ORDER BY id DESC LIMIT ? OFFSET ?";
          var countParams = [];
          var dataParams = [perPage, offset];

          if (searchQuery) {
            countQuery =
              "SELECT COUNT(*) AS total FROM giftcode WHERE code LIKE ?";
            dataQuery =
              "SELECT * FROM giftcode WHERE code LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?";
            var searchParam = "%" + searchQuery + "%";
            countParams = [searchParam];
            dataParams = [searchParam, perPage, offset];
          }

          const [countResult, giftcodesResult, giftcodeTemplates, giftcodeOptionTemplates] = await Promise.all([
            queryDatabase(countQuery, countParams),
            queryDatabase(dataQuery, dataParams),
            queryDatabase(
              "SELECT id, NAME AS name, description, icon_id FROM item_template ORDER BY id ASC"
            ),
            queryDatabase(
              "SELECT id, NAME AS name FROM item_option_template ORDER BY id ASC"
            ),
          ]);

          var totalGiftcodes = countResult[0].total;
          var totalPages = Math.ceil(totalGiftcodes / perPage);

          renderPanel("giftcodes.ejs", {
            pageTitle: "Quản lý Giftcode",
            giftcodes: giftcodesResult,
            totalGiftcodes: totalGiftcodes,
            totalPages: totalPages,
            currentPage: page,
            searchQuery: searchQuery,
            giftcodeTemplates: giftcodeTemplates,
            giftcodeOptionTemplates: giftcodeOptionTemplates,
          });
        } catch (err) {
          console.error("Giftcodes error:", err);
          renderPanel("giftcodes.ejs", {
            pageTitle: "Quản lý Giftcode",
            giftcodes: [],
            totalGiftcodes: 0,
            totalPages: 0,
            currentPage: 1,
            searchQuery: "",
            giftcodeTemplates: [],
            giftcodeOptionTemplates: [],
          });
        }
        break;
      }

      case "bosses": {
        var bossesData = [];
        var bossTemplates = [];
        try {
          bossTemplates = await queryDatabase(`
            SELECT 
              bt.*, 
              COUNT(bf.id) AS form_count, 
              MIN(bf.hp_min) AS min_hp, 
              MAX(bf.hp_max) AS max_hp, 
              MIN(bf.dame) AS min_dame, 
              MAX(bf.dame) AS max_dame
            FROM boss_template bt 
            LEFT JOIN boss_form bf ON bt.id = bf.boss_id 
            GROUP BY bt.id 
            ORDER BY bt.id ASC
          `);
        } catch (e) {
          console.error("Error loading boss_template from DB:", e);
        }

        var disguiseItems = [];
        try {
          disguiseItems = await queryDatabase(
            "SELECT id, name, icon_id, head, body, leg FROM item_template WHERE type = 5 ORDER BY id ASC"
          );
        } catch (e) {
          console.error("Error loading disguise items from DB:", e);
        }

        var mapList = [];
        try {
          mapList = await queryDatabase(
            "SELECT id, name FROM map_template ORDER BY id ASC"
          );
        } catch (e) {
          console.error("Error loading mapList from DB:", e);
        }

        var itemTemplates = [];
        try {
          itemTemplates = await queryDatabase(
            "SELECT id, NAME AS name, description, icon_id FROM item_template ORDER BY id ASC"
          );
        } catch (e) {
          console.error("Error loading itemTemplates for bosses:", e);
        }

        var itemOptionTemplates = [];
        try {
          itemOptionTemplates = await queryDatabase(
            "SELECT id, NAME AS name FROM item_option_template ORDER BY id ASC"
          );
        } catch (e) {
          console.error("Error loading itemOptionTemplates for bosses:", e);
        }

        try {
          var bossesJsonPath = path.join(__dirname, "../../bosses.json");
          if (fs.existsSync(bossesJsonPath)) {
            var content = fs.readFileSync(bossesJsonPath, "utf-8");
            bossesData = JSON.parse(content);
          }
        } catch (e) {
          console.error("Error reading bosses.json:", e);
        }

        renderPanel("bosses.ejs", {
          pageTitle: "Quản lý Boss",
          bosses: bossesData,
          bossTemplates: bossTemplates,
          disguiseItems: disguiseItems,
          mapList: mapList,
          itemTemplates: itemTemplates,
          itemOptionTemplates: itemOptionTemplates,
          spawnableBosses: spawnableBosses
        });
        break;
      }

      case "boss_live": {
        var bossesData = [];
        try {
          var bossesJsonPath = path.join(__dirname, "../../bosses.json");
          if (fs.existsSync(bossesJsonPath)) {
            var content = fs.readFileSync(bossesJsonPath, "utf-8");
            bossesData = JSON.parse(content);
          }
        } catch (e) {
          console.error("Error reading bosses.json for admin boss_live:", e);
        }

        renderPanel("boss_live.ejs", {
          pageTitle: "Trạng thái Boss Live (Admin)",
          bosses: bossesData
        });
        break;
      }

      case "spin_items": {
        try {
          var spinData = await Promise.all([
            queryDatabase(
              "SELECT s.*, t.name as template_name, t.icon_id FROM spin_item s LEFT JOIN item_template t ON s.item_id = t.id ORDER BY s.id DESC"
            ),
            queryDatabase(
              "SELECT id, NAME AS name, description, icon_id FROM item_template ORDER BY id ASC"
            ),
            queryDatabase(
              "SELECT id, NAME AS name FROM item_option_template ORDER BY id ASC"
            )
          ]);
          renderPanel("spin.ejs", {
            pageTitle: "Quản lý Vòng Quay",
            spinItems: spinData[0],
            spinTemplates: spinData[1],
            spinOptionTemplates: spinData[2]
          });
        } catch (err) {
          console.error("Spin items error:", err);
          renderPanel("spin.ejs", {
            pageTitle: "Quản lý Vòng Quay",
            spinItems: [],
            spinTemplates: [],
            spinOptionTemplates: []
          });
        }
        break;
      }

      case "deposits": {
        try {
          var page = parseInt(req.query.page) || 1;
          var perPage = 20;
          var offset = (page - 1) * perPage;
          var fromDate = req.query.fromDate || "";
          var toDate = req.query.toDate || "";
          var sortBy = req.query.sortBy || "created_at";
          var sortOrder = req.query.sortOrder === "ASC" ? "ASC" : "DESC";

          var whereClause = "1=1";
          var queryParams = [];

          if (fromDate) {
            whereClause += " AND created_at >= ?";
            queryParams.push(fromDate + " 00:00:00");
          }
          if (toDate) {
            whereClause += " AND created_at <= ?";
            queryParams.push(toDate + " 23:59:59");
          }

          var allowedSorts = ["created_at", "amount"];
          if (!allowedSorts.includes(sortBy)) sortBy = "created_at";

          var countQuery = `SELECT COUNT(*) AS total FROM bank_transfers WHERE ${whereClause}`;
          var dataQuery = `SELECT * FROM bank_transfers WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
          var dataParams = [...queryParams, perPage, offset];

          const [countResult, depositsResult] = await Promise.all([
            queryDatabase(countQuery, queryParams),
            queryDatabase(dataQuery, dataParams),
          ]);

          var totalDeposits = countResult[0].total;
          var totalPages = Math.ceil(totalDeposits / perPage);

          renderPanel("deposits.ejs", {
            pageTitle: "Quản lý Lịch sử Nạp tiền",
            deposits: depositsResult,
            totalDeposits: totalDeposits,
            totalPages: totalPages,
            currentPage: page,
            fromDate: fromDate,
            toDate: toDate,
            sortBy: sortBy,
            sortOrder: sortOrder
          });
        } catch (err) {
          console.error("Deposits error:", err);
          renderPanel("deposits.ejs", {
            pageTitle: "Quản lý Lịch sử Nạp tiền",
            deposits: [],
            totalDeposits: 0,
            totalPages: 0,
            currentPage: 1,
            fromDate: "",
            toDate: "",
            sortBy: "created_at",
            sortOrder: "DESC"
          });
        }
        break;
      }

      default: {
        res.redirect("/panel/admin?type=home");
      }
    }
  },
};
