const { verifySession } = require('../middleware/auth.middleware');
module.exports = async (req, res, next) => {
  var getInfo = () => {
    try {
      return new Promise((resolve, _) => {
        var identity = verifySession(req);
        if (!identity) return resolve([]);
        var username = identity.username;
        global.sql.query("SELECT * FROM account WHERE username = ?", [username], (err, results) => {
          if (err) {
            console.error("Lỗi khi kiểm tra user:", err);
            resolve({
              error: true,
              message: "Lỗi khi kiểm tra user",
            });
          }
          resolve(results);
        });
      });
    } catch (err) {
      console.log(err);
      resolve({
        error: true,
        message: "Lỗi khi kiểm tra user",
      });
    }
  };
  var getPlayer = (account_id) => {
    try {
      return new Promise((resolve, _) => {
        global.sql.query("SELECT * FROM player WHERE account_id = ?", [account_id], (err, results) => {
          if (err) {
            console.error("Lỗi khi kiểm tra player:", err);
            resolve({
              error: true,
              message: "Lỗi khi kiểm tra player",
            });
          }
          resolve(results);
        });
      });
    } catch (err) {
      console.log(err);
      resolve({
        error: true,
        message: "Lỗi khi kiểm tra player",
      });
    }
  }
  var getHistory = (account_id) => {
    try {
      return new Promise((resolve, _) => {
        global.sql.query(
          "SELECT * FROM spin WHERE account_id = ? ORDER BY time_stamps DESC LIMIT 200",
          [account_id],
          (err, results) => {
          if (err) {
            console.error("Lỗi khi kiểm tra player:", err);
            resolve({
              error: true,
              message: "Lỗi khi kiểm tra player",
            });
          }
            resolve(results);
          }
        );
      });
    } catch (err) {
      console.log(err);
      resolve({
        error: true,
        message: "Lỗi khi kiểm tra player",
      });
    }
  }
  return {
    getInfo,
    getPlayer,
    getHistory
  };
};
