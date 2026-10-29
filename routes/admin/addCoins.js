const { isAdmin } = require("../../middleware/auth.middleware");

module.exports = {
  name: "admin/addCoins",
  middleware: [isAdmin],
  method: "post",
  run: ({ req, res }) => {
    var { username, coins } = req.body;

    const amount = typeof coins === 'number' ? coins : (typeof coins === 'string' && /^-?\d+$/.test(coins) ? Number(coins) : NaN);
    if (typeof username !== 'string' || !/^[a-z0-9_]{3,20}$/i.test(username) || !Number.isSafeInteger(amount) || amount === 0 || Math.abs(amount) > 2147483647) {
      return res.json({
        error: true,
        message: "Tên người dùng và số coins là bắt buộc.",
      });
    }

    // Query the user's current vnd value
    global.sql.query("SELECT * FROM account WHERE username = ?", [username], (err, results) => {
      if (err) {
        console.error("Lỗi khi kiểm tra user:", err);
        return res.json({
          error: true,
          message: "Lỗi khi kiểm tra user",
        });
      }

      if (results.length === 0) {
        return res.json({
          error: true,
          message: "Người dùng không tồn tại.",
        });
      }


      global.sql.query("UPDATE account SET vnd = vnd + ?, balance_note = 'Admin web điều chỉnh số dư' WHERE username = ? AND vnd + ? BETWEEN 0 AND 2147483647", [amount, username.toLowerCase(), amount], (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Lỗi khi cập nhật số coins:", updateErr);
          return res.json({
            error: true,
            message: "Lỗi khi cập nhật số coins",
          });
        }

        if (!updateResult.affectedRows) return res.status(400).json({ error: true, message: 'Số dư sau điều chỉnh không hợp lệ.' });
        res.json({
          error: false,
          message: `Đã điều chỉnh ${amount} vnđ cho tài khoản ${username}.`,
        });
      });
    });
  },
};
