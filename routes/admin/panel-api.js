var { isAdmin } = require("../../middleware/auth.middleware.js");
var config = require("../../config");
var fs = require("fs-extra");
var path = require("path");
var spawnableBosses = require("../../data/spawnable-bosses");
var spawnableBossIds = new Set(spawnableBosses.map(function(boss) { return boss.id; }));

module.exports = {
  name: "panel/admin-api",
  method: "post",
  middleware: [isAdmin],
  run: async ({ req, res, sql }) => {
    const queryDatabase = (query, params) => {
      return new Promise((resolve, reject) => {
        sql.query(query, params || [], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    };

    const queueGiftcodeReload = async () => {
      try {
        var commandResult = await queryDatabase(
          "INSERT INTO admin_command (command_name, command_value) VALUES (?, ?)",
          ["RELOAD_GIFTCODE", ""]
        );
        if (!commandResult.insertId) return false;

        // Chỉ báo thành công sau khi tiến trình game xác nhận đã reload cache.
        for (var attempt = 0; attempt < 40; attempt++) {
          await new Promise(function(resolve) { setTimeout(resolve, 100); });
          var commandRows = await queryDatabase(
            "SELECT status FROM admin_command WHERE id = ? LIMIT 1",
            [commandResult.insertId]
          );
          if (commandRows.length && Number(commandRows[0].status) === 1) return true;
          if (commandRows.length && Number(commandRows[0].status) === 2) return false;
        }
        return false;
      } catch (reloadError) {
        console.error("Cannot queue giftcode reload:", reloadError);
        return false;
      }
    };

    const giftcodeSuccessMessage = (message, reloaded) => {
      return reloaded
        ? message + " và server đã cập nhật ngay"
        : message + ", nhưng server chưa xác nhận reload cache";
    };

    var { action } = req.body;

    try {
      switch (action) {
        case "ban-account": {
          var { accountId, ban } = req.body;
          if (!Number.isSafeInteger(Number(accountId)) || Number(accountId) <= 0 || ![0, 1, true, false, '0', '1'].includes(ban)) return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
          await queryDatabase("UPDATE account SET ban = ? WHERE id = ?", [
            Number(ban) === 1 ? 1 : 0,
            Number(accountId),
          ]);
          return res.json({ success: true, message: Number(ban) === 1 ? "Đã ban tài khoản" : "Đã unban tài khoản" });
        }

        case "toggle-admin": {
          var { accountId, isAdmin: adminVal } = req.body;
          if (!Number.isSafeInteger(Number(accountId)) || Number(accountId) <= 0 || ![0, 1, true, false, '0', '1'].includes(adminVal)) return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
          await queryDatabase("UPDATE account SET is_admin = ? WHERE id = ?", [
            Number(adminVal) === 1 ? 1 : 0,
            Number(accountId),
          ]);
          return res.json({ success: true, message: Number(adminVal) === 1 ? "Đã set admin" : "Đã gỡ admin" });
        }

        case "update-vnd": {
          var { accountId, amount } = req.body;
          var parsedAmount = typeof amount === 'number' ? amount : (typeof amount === 'string' && /^\d+$/.test(amount) ? Number(amount) : NaN);
          if (!Number.isSafeInteger(Number(accountId)) || Number(accountId) <= 0 || !Number.isSafeInteger(parsedAmount) || parsedAmount <= 0 || parsedAmount > 2147483647) return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
          const updateResult = await queryDatabase("UPDATE account SET vnd = vnd + ?, tongnap = tongnap + ?, balance_note = 'Admin web cộng tiền' WHERE id = ? AND vnd + ? <= 2147483647 AND tongnap + ? <= 2147483647", [parsedAmount, parsedAmount, Number(accountId), parsedAmount, parsedAmount]);
          if (!updateResult.affectedRows) return res.status(400).json({ success: false, message: "Không tìm thấy tài khoản hoặc số dư vượt giới hạn" });
          return res.json({ success: true, message: "Đã thêm " + parsedAmount + " VND" });
        }

        case "delete-account": {
          var { accountId } = req.body;
          var parsedAccountId = Number(accountId);
          if (!Number.isSafeInteger(parsedAccountId) || parsedAccountId <= 0) return res.status(400).json({ success: false, message: "accountId không hợp lệ" });
          const db = await sql.promise().getConnection();
          try {
            await db.beginTransaction();
            await db.query("DELETE FROM player WHERE account_id = ?", [parsedAccountId]);
            const [deleted] = await db.query("DELETE FROM account WHERE id = ?", [parsedAccountId]);
            if (!deleted.affectedRows) { await db.rollback(); return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" }); }
            await db.commit();
          } catch (deleteError) { await db.rollback(); throw deleteError; }
          finally { db.release(); }
          return res.json({ success: true, message: "Đã xóa tài khoản" });
        }

        case "refresh-logs": {
          var { logType } = req.body;
          var filename = logType === "error" ? "server-error.log" : "server.log";
          try {
            var logPath = path.join(config.logPath, filename);
            if (!fs.existsSync(logPath)) {
              return res.json({ success: true, lines: ["[Info] Log file not found: " + filename] });
            }
            var content = fs.readFileSync(logPath, "utf-8");
            var lines = content
              .split("\n")
              .filter(function (l) {
                return l.trim() !== "";
              })
              .slice(-config.maxLogLines);
            return res.json({ success: true, lines: lines });
          } catch (err) {
            return res.json({ success: false, message: "Lỗi đọc file log: " + err.message });
          }
        }

        case "player-detail": {
          var { playerId } = req.body;
          if (!playerId) return res.json({ success: false, message: "Thiếu playerId" });
          var results = await queryDatabase(
            "SELECT p.*, a.username AS account_username FROM player p LEFT JOIN account a ON p.account_id = a.id WHERE p.id = ?",
            [playerId]
          );
          if (results.length === 0) {
            return res.json({ success: false, message: "Không tìm thấy player" });
          }
          return res.json({ success: true, player: results[0] });
        }

        case "spawn-boss": {
          var { bossId } = req.body;
          if (bossId === undefined || bossId === null || bossId === "") return res.json({ success: false, message: "Thiếu bossId" });
          var parsedBossId = Number(bossId);
          if (!Number.isInteger(parsedBossId)) {
            return res.json({ success: false, message: "Boss ID phải là một số nguyên hợp lệ!" });
          }
          
          var spawnCommand = await queryDatabase(
            "INSERT INTO admin_command (command_name, command_value) VALUES (?, ?)",
            ["SPAWN_BOSS", parsedBossId.toString()]
          );
          for (var spawnAttempt = 0; spawnAttempt < 40; spawnAttempt++) {
            await new Promise(function(resolve) { setTimeout(resolve, 100); });
            var spawnRows = await queryDatabase(
              "SELECT status FROM admin_command WHERE id = ? LIMIT 1",
              [spawnCommand.insertId]
            );
            if (spawnRows.length && Number(spawnRows[0].status) === 1) {
              return res.json({ success: true, message: "Server đã gọi Boss (ID " + parsedBossId + ") thành công!" });
            }
            if (spawnRows.length && Number(spawnRows[0].status) === 2) {
              return res.json({ success: false, message: "Server không thể tạo Boss này; hãy kiểm tra log game" });
            }
          }
          return res.json({ success: false, message: "Đã gửi lệnh nhưng server chưa xác nhận gọi Boss" });
        }

        case "toggle-boss-enabled": {
          var { bossId, enabled } = req.body;
          var parsedId = Number(bossId);
          if (!Number.isInteger(parsedId)) return res.json({ success: false, message: "ID Boss không hợp lệ!" });
          var newStatus = enabled ? 1 : 0;
          await queryDatabase("UPDATE boss_template SET enabled = ? WHERE id = ?", [newStatus, parsedId]);
          return res.json({ success: true, message: "Đã cập nhật trạng thái Boss ID " + parsedId + " thành " + (newStatus ? "BẬT" : "TẮT") + "!" });
        }

        case "update-boss-template": {
          var {
            id, name, type, sub_type, gender, enabled, spawn_count, respawn_delay, despawn_timeout, is_notify, is_zone_0_1_disabled, require_task_id,
            form_id, form_name, hp_min, hp_max, dame, outfit_head, outfit_body, outfit_leg, outfit_bag, outfit_aura, outfit_eff, text_start, text_mid, text_end, maps, rewards
          } = req.body;
          
          var parsedId = Number(id);
          if (!Number.isInteger(parsedId)) return res.json({ success: false, message: "ID Boss không hợp lệ!" });

          await queryDatabase(
            "UPDATE boss_template SET name = ?, type = ?, sub_type = ?, gender = ?, enabled = ?, spawn_count = ?, respawn_delay = ?, despawn_timeout = ?, is_notify = ?, is_zone_0_1_disabled = ?, require_task_id = ? WHERE id = ?",
            [
              name || '',
              type || 'NORMAL',
              sub_type && sub_type.trim() ? sub_type.trim() : null,
              Number(gender) || 0,
              enabled ? 1 : 0,
              Number(spawn_count) || 1,
              Number(respawn_delay) || 300,
              Number(despawn_timeout) || 900,
              is_notify ? 1 : 0,
              is_zone_0_1_disabled ? 1 : 0,
              require_task_id ? Number(require_task_id) : null,
              parsedId
            ]
          );

          if (form_id || hp_min !== undefined || outfit_head !== undefined) {
            var targetFormId = Number(form_id);
            if (Number.isInteger(targetFormId) && targetFormId > 0) {
              await queryDatabase(
                "UPDATE boss_form SET name = ?, hp_min = ?, hp_max = ?, dame = ?, outfit_head = ?, outfit_body = ?, outfit_leg = ?, outfit_bag = ?, outfit_aura = ?, outfit_eff = ?, text_start = ?, text_mid = ?, text_end = ? WHERE id = ?",
                [
                  form_name || name,
                  Number(hp_min) || 1000000,
                  Number(hp_max) || Number(hp_min) || 1000000,
                  Number(dame) || 10000,
                  outfit_head !== undefined && outfit_head !== null && outfit_head !== '' ? Number(outfit_head) : -1,
                  outfit_body !== undefined && outfit_body !== null && outfit_body !== '' ? Number(outfit_body) : -1,
                  outfit_leg !== undefined && outfit_leg !== null && outfit_leg !== '' ? Number(outfit_leg) : -1,
                  outfit_bag !== undefined && outfit_bag !== null && outfit_bag !== '' ? Number(outfit_bag) : -1,
                  outfit_aura !== undefined && outfit_aura !== null && outfit_aura !== '' ? Number(outfit_aura) : -1,
                  outfit_eff !== undefined && outfit_eff !== null && outfit_eff !== '' ? Number(outfit_eff) : -1,
                  text_start || null,
                  text_mid || null,
                  text_end || null,
                  targetFormId
                ]
              );
            } else {
              await queryDatabase(
                "UPDATE boss_form SET name = ?, hp_min = ?, hp_max = ?, dame = ?, outfit_head = ?, outfit_body = ?, outfit_leg = ?, outfit_bag = ?, outfit_aura = ?, outfit_eff = ?, text_start = ?, text_mid = ?, text_end = ? WHERE boss_id = ? AND form_order = 0",
                [
                  form_name || name,
                  Number(hp_min) || 1000000,
                  Number(hp_max) || Number(hp_min) || 1000000,
                  Number(dame) || 10000,
                  outfit_head !== undefined && outfit_head !== null && outfit_head !== '' ? Number(outfit_head) : -1,
                  outfit_body !== undefined && outfit_body !== null && outfit_body !== '' ? Number(outfit_body) : -1,
                  outfit_leg !== undefined && outfit_leg !== null && outfit_leg !== '' ? Number(outfit_leg) : -1,
                  outfit_bag !== undefined && outfit_bag !== null && outfit_bag !== '' ? Number(outfit_bag) : -1,
                  outfit_aura !== undefined && outfit_aura !== null && outfit_aura !== '' ? Number(outfit_aura) : -1,
                  outfit_eff !== undefined && outfit_eff !== null && outfit_eff !== '' ? Number(outfit_eff) : -1,
                  text_start || null,
                  text_mid || null,
                  text_end || null,
                  parsedId
                ]
              );
            }
          }

          if (maps !== undefined) {
            var mapArray = [];
            if (typeof maps === 'string') {
              try { mapArray = JSON.parse(maps); } catch (e) {}
            } else if (Array.isArray(maps)) {
              mapArray = maps;
            }

            if (Array.isArray(mapArray)) {
              await queryDatabase("DELETE FROM boss_map WHERE boss_id = ?", [parsedId]);
              for (var m of mapArray) {
                var mId = Number(m.map_id);
                var zId = m.zone_id !== undefined ? Number(m.zone_id) : -1;
                if (Number.isInteger(mId) && mId >= 0) {
                  await queryDatabase(
                    "INSERT INTO boss_map (boss_id, map_id, zone_id) VALUES (?, ?, ?)",
                    [parsedId, mId, zId]
                  );
                }
              }
            }
          }

          if (rewards !== undefined) {
            var rewardArray = [];
            if (typeof rewards === 'string') {
              try { rewardArray = JSON.parse(rewards); } catch (e) {}
            } else if (Array.isArray(rewards)) {
              rewardArray = rewards;
            }

            if (Array.isArray(rewardArray)) {
              await queryDatabase("DELETE FROM boss_reward WHERE boss_id = ?", [parsedId]);
              for (var r of rewardArray) {
                var itemId = Number(r.item_id);
                if (Number.isInteger(itemId) && itemId > 0) {
                  var qMin = Number(r.quantity_min) || 1;
                  var qMax = Number(r.quantity_max) || qMin;
                  var rate = (r.rate !== undefined && r.rate !== null && r.rate !== '') ? Number(r.rate) : 100;
                  var opts = typeof r.item_options === 'string' ? r.item_options : JSON.stringify(r.item_options || []);
                  var evPt = Number(r.event_point) || 0;
                  var actPt = Number(r.active_point) || 0;
                  await queryDatabase(
                    "INSERT INTO boss_reward (boss_id, item_id, quantity_min, quantity_max, rate, item_options, event_point, active_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [parsedId, itemId, qMin, qMax, rate, opts, evPt, actPt]
                  );
                }
              }
            }
          }

          return res.json({ success: true, message: "Đã cập nhật cấu hình Boss (ID " + parsedId + ") thành công!" });
        }

        case "delete-boss-template": {
          var { bossId } = req.body;
          var parsedId = Number(bossId);
          if (!Number.isInteger(parsedId)) return res.json({ success: false, message: "ID Boss không hợp lệ!" });

          await queryDatabase("DELETE FROM boss_template WHERE id = ?", [parsedId]);
          return res.json({ success: true, message: "Đã xóa Boss (ID: " + parsedId + ") khỏi CSDL!" });
        }

        case "get-boss-details": {
          var { bossId } = req.body;
          var parsedId = Number(bossId);
          if (!Number.isInteger(parsedId)) return res.json({ success: false, message: "ID Boss không hợp lệ!" });

          var templateRows = await queryDatabase("SELECT * FROM boss_template WHERE id = ? LIMIT 1", [parsedId]);
          if (templateRows.length === 0) return res.json({ success: false, message: "Không tìm thấy Boss trong CSDL" });
          var template = templateRows[0];

          var forms = await queryDatabase("SELECT * FROM boss_form WHERE boss_id = ? ORDER BY form_order ASC", [parsedId]);
          
          var skills = [];
          if (forms.length > 0) {
            var formIds = forms.map(function(f) { return f.id; });
            skills = await queryDatabase(
              "SELECT bs.*, st.name as skill_name FROM boss_skill bs LEFT JOIN skill_template st ON bs.skill_id = st.id WHERE bs.form_id IN (" + formIds.join(",") + ") ORDER BY bs.form_id ASC, bs.id ASC"
            );
          }

          var maps = await queryDatabase(
            "SELECT bm.*, m.name as map_name FROM boss_map bm LEFT JOIN map_template m ON bm.map_id = m.id WHERE bm.boss_id = ? ORDER BY bm.id ASC",
            [parsedId]
          );

          var rewards = await queryDatabase(
            "SELECT br.*, it.name as item_name, it.icon_id FROM boss_reward br LEFT JOIN item_template it ON br.item_id = it.id WHERE br.boss_id = ? ORDER BY br.id ASC",
            [parsedId]
          );

          var together = await queryDatabase(
            "SELECT bt.*, t.name as sub_boss_name FROM boss_appear_together bt LEFT JOIN boss_template t ON bt.sub_boss_id = t.id WHERE bt.boss_id = ?",
            [parsedId]
          );

          return res.json({
            success: true,
            boss: {
              template: template,
              forms: forms,
              skills: skills,
              maps: maps,
              rewards: rewards,
              together: together
            }
          });
        }

        case "add-boss-template": {
          var {
            id, name, type, sub_type, gender, enabled, spawn_count, respawn_delay, despawn_timeout, is_notify, is_zone_0_1_disabled, require_task_id,
            form_name, hp_min, hp_max, dame, outfit_head, outfit_body, outfit_leg, outfit_bag, outfit_aura, outfit_eff, text_start, text_mid, text_end, maps, rewards
          } = req.body;

          if (!name || !name.trim()) return res.json({ success: false, message: "Tên Boss không được để trống!" });

          var bossId = Number(id);
          if (!Number.isInteger(bossId)) {
            var minIdRow = await queryDatabase("SELECT MIN(id) as min_id FROM boss_template");
            var currentMin = (minIdRow.length && minIdRow[0].min_id < 0) ? minIdRow[0].min_id : -2000;
            bossId = currentMin - 1;
          } else {
            var dup = await queryDatabase("SELECT id FROM boss_template WHERE id = ? LIMIT 1", [bossId]);
            if (dup.length > 0) {
              return res.json({ success: false, message: "Boss ID " + bossId + " đã tồn tại trong CSDL!" });
            }
          }

          await queryDatabase(
            "INSERT INTO boss_template (id, name, type, sub_type, gender, enabled, spawn_count, respawn_delay, despawn_timeout, is_notify, is_zone_0_1_disabled, require_task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              bossId,
              name.trim(),
              type || 'NORMAL',
              sub_type && sub_type.trim() ? sub_type.trim() : null,
              Number(gender) || 0,
              enabled ? 1 : 0,
              Number(spawn_count) || 1,
              Number(respawn_delay) || 300,
              Number(despawn_timeout) || 900,
              is_notify ? 1 : 0,
              is_zone_0_1_disabled ? 1 : 0,
              require_task_id ? Number(require_task_id) : null
            ]
          );

          await queryDatabase(
            "INSERT INTO boss_form (boss_id, form_order, name, hp_min, hp_max, dame, outfit_head, outfit_body, outfit_leg, outfit_bag, outfit_aura, outfit_eff, text_start, text_mid, text_end) VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              bossId,
              form_name && form_name.trim() ? form_name.trim() : (name.trim() + " Gốc"),
              Number(hp_min) || 1000000,
              Number(hp_max) || 1000000,
              Number(dame) || 10000,
              outfit_head !== undefined && outfit_head !== null && outfit_head !== '' ? Number(outfit_head) : -1,
              outfit_body !== undefined && outfit_body !== null && outfit_body !== '' ? Number(outfit_body) : -1,
              outfit_leg !== undefined && outfit_leg !== null && outfit_leg !== '' ? Number(outfit_leg) : -1,
              outfit_bag !== undefined && outfit_bag !== null && outfit_bag !== '' ? Number(outfit_bag) : -1,
              outfit_aura !== undefined && outfit_aura !== null && outfit_aura !== '' ? Number(outfit_aura) : -1,
              outfit_eff !== undefined && outfit_eff !== null && outfit_eff !== '' ? Number(outfit_eff) : -1,
              text_start && text_start.trim() ? text_start.trim() : null,
              text_mid && text_mid.trim() ? text_mid.trim() : null,
              text_end && text_end.trim() ? text_end.trim() : null
            ]
          );

          if (maps !== undefined) {
            var mapArray = [];
            if (typeof maps === 'string') {
              try { mapArray = JSON.parse(maps); } catch (e) {}
            } else if (Array.isArray(maps)) {
              mapArray = maps;
            }

            if (Array.isArray(mapArray)) {
              for (var m of mapArray) {
                var mId = Number(m.map_id);
                var zId = m.zone_id !== undefined ? Number(m.zone_id) : -1;
                if (Number.isInteger(mId) && mId >= 0) {
                  await queryDatabase(
                    "INSERT INTO boss_map (boss_id, map_id, zone_id) VALUES (?, ?, ?)",
                    [bossId, mId, zId]
                  );
                }
              }
            }
          }

          if (rewards !== undefined) {
            var rewardArray = [];
            if (typeof rewards === 'string') {
              try { rewardArray = JSON.parse(rewards); } catch (e) {}
            } else if (Array.isArray(rewards)) {
              rewardArray = rewards;
            }

            if (Array.isArray(rewardArray)) {
              for (var r of rewardArray) {
                var itemId = Number(r.item_id);
                if (Number.isInteger(itemId) && itemId > 0) {
                  var qMin = Number(r.quantity_min) || 1;
                  var qMax = Number(r.quantity_max) || qMin;
                  var rate = (r.rate !== undefined && r.rate !== null && r.rate !== '') ? Number(r.rate) : 100;
                  var opts = typeof r.item_options === 'string' ? r.item_options : JSON.stringify(r.item_options || []);
                  var evPt = Number(r.event_point) || 0;
                  var actPt = Number(r.active_point) || 0;
                  await queryDatabase(
                    "INSERT INTO boss_reward (boss_id, item_id, quantity_min, quantity_max, rate, item_options, event_point, active_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [bossId, itemId, qMin, qMax, rate, opts, evPt, actPt]
                  );
                }
              }
            }
          }

          return res.json({ success: true, message: "Đã thêm Boss mới (ID: " + bossId + ") thành công!" });
        }

        case "get-part-icons": {
          var { head, body, leg } = req.body;
          var headId = Number(head);
          var bodyId = Number(body);
          var legId = Number(leg);

          var validIds = [];
          if (Number.isInteger(headId) && headId >= 0) validIds.push(headId);
          if (Number.isInteger(bodyId) && bodyId >= 0) validIds.push(bodyId);
          if (Number.isInteger(legId) && legId >= 0) validIds.push(legId);

          var partsResult = { head: null, body: null, leg: null };

          if (validIds.length > 0) {
            var rows = await queryDatabase(
              "SELECT id, type, DATA FROM part WHERE id IN (" + validIds.join(",") + ")"
            );

            var rowMap = {};
            rows.forEach(function(row) { rowMap[row.id] = row; });

            var getPartInfo = function(partId, slotType) {
              if (!Number.isInteger(partId) || partId < 0) return null;
              var row = rowMap[partId];
              if (!row) return null;
              try {
                var parsedData = JSON.parse(row.DATA);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                  var pType = Number(row.type);
                  // Index ảnh: Head (0) -> index 0; Body (1) & Leg (2) -> index 1
                  var targetIdx = (slotType === 'head' || pType === 0) ? 0 : 1;
                  var frame = (parsedData.length > targetIdx ? parsedData[targetIdx] : parsedData[0]);

                  return {
                    iconId: frame[0],
                    dx: Number(frame[1]) || 0,
                    dy: Number(frame[2]) || 0,
                    type: pType
                  };
                }
              } catch (ex) {
                console.error("Error parsing part data:", ex);
              }
              return null;
            };

            partsResult.head = getPartInfo(headId, 'head');
            partsResult.body = getPartInfo(bodyId, 'body');
            partsResult.leg = getPartInfo(legId, 'leg');
          }

          return res.json({ success: true, parts: partsResult });
        }

        case "add_spin_item": {
          console.log("add_spin_item hit:", req.body);
          var { name, item_id, quantity, ratio, item_options, image } = req.body;
          if (item_id === undefined || item_id === null || item_id === "") {
            return res.json({ success: false, message: "ID không được để trống" });
          }

          await queryDatabase(
            "INSERT INTO spin_item (name, item_id, quantity, item_options, ratio, image) VALUES (?, ?, ?, ?, ?, ?)",
            [name || '', item_id, quantity, item_options || '[]', ratio || 0, image || '']
          );
          return res.json({ success: true, message: "Đã thêm vật phẩm vòng quay thành công!" });
        }

        case "edit_spin_item": {
          console.log("edit_spin_item hit:", req.body);
          var { id, name, item_id, quantity, ratio, item_options, image } = req.body;
          if (!id || item_id === undefined || item_id === null || item_id === "") {
            return res.json({ success: false, message: "ID và ID Template không được để trống" });
          }

          await queryDatabase(
            "UPDATE spin_item SET name = ?, item_id = ?, quantity = ?, item_options = ?, ratio = ?, image = ? WHERE id = ?",
            [name || '', item_id, quantity, item_options || '[]', ratio || 0, image || '', id]
          );
          return res.json({ success: true, message: "Đã cập nhật vật phẩm vòng quay thành công!" });
        }

        case "delete_spin_item": {
          console.log("delete_spin_item hit:", req.body);
          var { id } = req.body;
          if (!id) return res.json({ success: false, message: "Thiếu ID vật phẩm" });

          await queryDatabase("DELETE FROM spin_item WHERE id = ?", [id]);
          return res.json({ success: true, message: "Đã xóa vật phẩm khỏi vòng quay!" });
        }

        case "add_giftcode":
        case "edit_giftcode": {
          var isEditingGiftcode = action === "edit_giftcode";
          var giftcodeId = Number(req.body.id);
          var giftcodeValue = String(req.body.code || "").trim();
          var giftcodeCount = Number(req.body.count_left);
          var giftcodeExpired = String(req.body.expired || "").trim();
          var giftcodeDetail;

          if (isEditingGiftcode && (!Number.isInteger(giftcodeId) || giftcodeId <= 0)) {
            return res.json({ success: false, message: "ID giftcode không hợp lệ" });
          }
          if (!giftcodeValue) {
            return res.json({ success: false, message: "Mã giftcode không được để trống" });
          }
          if (!Number.isInteger(giftcodeCount) || giftcodeCount < 1) {
            return res.json({ success: false, message: "Số lượt phải là số nguyên lớn hơn 0" });
          }
          if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(giftcodeExpired)) {
            return res.json({ success: false, message: "Thời gian hết hạn không hợp lệ" });
          }
          giftcodeExpired = giftcodeExpired.replace("T", " ");
          if (giftcodeExpired.length === 16) giftcodeExpired += ":00";

          try {
            giftcodeDetail = typeof req.body.detail === "string"
              ? JSON.parse(req.body.detail)
              : req.body.detail;
          } catch (parseError) {
            return res.json({ success: false, message: "Danh sách phần thưởng không phải JSON hợp lệ" });
          }
          if (!Array.isArray(giftcodeDetail) || giftcodeDetail.length === 0) {
            return res.json({ success: false, message: "Giftcode phải có ít nhất một phần thưởng" });
          }

          var itemIds = [];
          var optionIds = [];
          var seenItemIds = {};
          for (var detailIndex = 0; detailIndex < giftcodeDetail.length; detailIndex++) {
            var reward = giftcodeDetail[detailIndex] || {};
            reward.id = Number(reward.id);
            reward.quantity = Number(reward.quantity);
            reward.options = Array.isArray(reward.options) ? reward.options : [];
            if (!Number.isInteger(reward.id) || reward.id < 0 ||
                !Number.isInteger(reward.quantity) || reward.quantity < 1) {
              return res.json({ success: false, message: "Vật phẩm hoặc số lượng phần thưởng không hợp lệ" });
            }
            if (seenItemIds[reward.id]) {
              return res.json({ success: false, message: "Mỗi vật phẩm chỉ nên xuất hiện một lần trong giftcode" });
            }
            seenItemIds[reward.id] = true;
            itemIds.push(reward.id);

            for (var optionIndex = 0; optionIndex < reward.options.length; optionIndex++) {
              var giftOption = reward.options[optionIndex] || {};
              giftOption.id = Number(giftOption.id);
              giftOption.param = Number(giftOption.param);
              if (!Number.isInteger(giftOption.id) || giftOption.id < 0 ||
                  !Number.isInteger(giftOption.param)) {
                return res.json({ success: false, message: "Option vật phẩm không hợp lệ" });
              }
              optionIds.push(giftOption.id);
            }
          }

          var validItems = await queryDatabase(
            "SELECT id FROM item_template WHERE id IN (?)",
            [itemIds]
          );
          if (validItems.length !== itemIds.length) {
            return res.json({ success: false, message: "Có vật phẩm không tồn tại trong item_template" });
          }
          var uniqueOptionIds = optionIds.filter(function (id, index, list) {
            return list.indexOf(id) === index;
          });
          if (uniqueOptionIds.length > 0) {
            var validOptions = await queryDatabase(
              "SELECT id FROM item_option_template WHERE id IN (?)",
              [uniqueOptionIds]
            );
            if (validOptions.length !== uniqueOptionIds.length) {
              return res.json({ success: false, message: "Có option không tồn tại trong item_option_template" });
            }
          }

          var duplicateCodeQuery = isEditingGiftcode
            ? "SELECT id FROM giftcode WHERE code = ? AND id <> ? LIMIT 1"
            : "SELECT id FROM giftcode WHERE code = ? LIMIT 1";
          var duplicateCodeParams = isEditingGiftcode
            ? [giftcodeValue, giftcodeId]
            : [giftcodeValue];
          var duplicateGiftcodes = await queryDatabase(duplicateCodeQuery, duplicateCodeParams);
          if (duplicateGiftcodes.length > 0) {
            return res.json({ success: false, message: "Mã giftcode đã tồn tại" });
          }

          var normalizedGiftcodeDetail = JSON.stringify(giftcodeDetail.map(function (reward) {
            return {
              id: reward.id,
              quantity: reward.quantity,
              options: reward.options.map(function (option) {
                return { id: option.id, param: option.param };
              }),
            };
          }));

          if (isEditingGiftcode) {
            var editResult = await queryDatabase(
              "UPDATE giftcode SET code = ?, count_left = ?, detail = ?, expired = ? WHERE id = ?",
              [giftcodeValue, giftcodeCount, normalizedGiftcodeDetail, giftcodeExpired, giftcodeId]
            );
            if (!editResult.affectedRows) {
              return res.json({ success: false, message: "Không tìm thấy giftcode cần sửa" });
            }
            var editReloaded = await queueGiftcodeReload();
            return res.json({
              success: true,
              reloaded: editReloaded,
              message: giftcodeSuccessMessage("Đã cập nhật giftcode thành công", editReloaded)
            });
          }

          await queryDatabase(
            "INSERT INTO giftcode (code, count_left, detail, expired) VALUES (?, ?, ?, ?)",
            [giftcodeValue, giftcodeCount, normalizedGiftcodeDetail, giftcodeExpired]
          );
          var addReloaded = await queueGiftcodeReload();
          return res.json({
            success: true,
            reloaded: addReloaded,
            message: giftcodeSuccessMessage("Đã thêm giftcode thành công", addReloaded)
          });
        }

        case "delete_giftcode": {
          var deleteGiftcodeId = Number(req.body.id);
          if (!Number.isInteger(deleteGiftcodeId) || deleteGiftcodeId <= 0) {
            return res.json({ success: false, message: "ID giftcode không hợp lệ" });
          }
          var deleteGiftcodeResult = await queryDatabase(
            "DELETE FROM giftcode WHERE id = ?",
            [deleteGiftcodeId]
          );
          if (!deleteGiftcodeResult.affectedRows) {
            return res.json({ success: false, message: "Không tìm thấy giftcode cần xóa" });
          }
          var deleteReloaded = await queueGiftcodeReload();
          return res.json({
            success: true,
            reloaded: deleteReloaded,
            message: giftcodeSuccessMessage("Đã xóa giftcode thành công", deleteReloaded)
          });
        }

        default:
          console.log("Unknown action:", action);
          return res.json({ success: false, message: "Action không hợp lệ" });
      }
    } catch (err) {
      console.error("Admin API error:", err);
      return res.json({ success: false, message: "Lỗi server: " + err.message });
    }
  },
};
