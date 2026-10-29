var { isLogin } = require("../../middleware/auth.middleware")
var { active_coins } = require("../../config")
module.exports = {
    name: "active",
    middleware: [isLogin],
    method: "post",
    run: async ({ req, res, sql }) => {
        const accountId = req.auth?.id;
        if (!accountId) return res.status(401).json({ error: true, message: 'Vui lòng đăng nhập lại.' });
        sql.query("SELECT id, active, vnd FROM account WHERE id = ?", [accountId], (err, result) => {
            if (err) return res.status(500).json({ error: true, message: 'Không thể kiểm tra tài khoản.' });
            if (!result.length) {
                return res.redirect("/login")
            }
            let currentCoins = result[0].vnd;
            currentCoins = parseInt(currentCoins)
            if (result[0].active == 1) {
                return res.json({
                    error: false,
                    message: `Bạn đã kích hoạt rồi`
                })
            }
            if (currentCoins < active_coins) {
                return res.json({
                    error: true,
                    message: `Bạn còn thiếu ${active_coins - currentCoins} coins để kích hoạt!`
                })
            }
            sql.query("UPDATE account SET active = ?, vnd = vnd - ?, balance_note = 'Mở thành viên trên web' WHERE id = ? AND active = 0 AND vnd >= ?", [1, active_coins, accountId, active_coins], (err, resp) => {
                if (err || !resp.affectedRows) {
                    console.log(err)
                    return res.json({
                        error: true,
                        message: `Không thể kích hoạt tài khoản này!`
                    })
                }
                return res.json({
                    error: false,
                    message: `Kích hoạt thành công !`
                })
            })
        })
    },
};
