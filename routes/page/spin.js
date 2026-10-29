const { isLogin, isAdmin } = require("../../middleware/auth.middleware")


module.exports = {
    name: "spin",
    method: "GET",
    middleware: [isLogin],
    run: async ({ req, res, user, options }) => {
        const userInfo = await user.getInfo();
        
        const getUser = userInfo[0];
        
        const itemsList = await new Promise((resolve, reject) => {
            sql.query('SELECT s.*, t.name as template_name, t.icon_id FROM spin_item s LEFT JOIN item_template t ON s.item_id = t.id', (err, results) => {
                if (err) resolve([]);
                else resolve(results);
            });
        });

        // Lấy tối đa 200 lượt quay mới nhất của user hiện tại từ spin_reward
        const spinHistoryRaw = await new Promise((resolve, reject) => {
            sql.query(
                `SELECT s.*, a.username FROM spin_reward s 
                 LEFT JOIN account a ON s.player_id = a.id 
                 WHERE s.player_id = ?
                 ORDER BY s.created_at DESC 
                 LIMIT 200`,
                [getUser.id],
                (err, results) => {
                    if (err) {
                        console.error("Lỗi khi lấy lịch sử quay:", err);
                        resolve([]);
                    }
                    resolve(results || []);
                }
            );
        });

        const spinHistory = spinHistoryRaw.map(record => {
            let itemName = "Vật phẩm";
            for (let item of itemsList) {
               if (item.item_id === record.reward_id) {
                   itemName = item.name || item.template_name || ('Vật phẩm ' + item.item_id);
                   break;
               }
            }
            return {
                ...record,
                name: itemName
            };
        });

        res.render("page/spin.ejs", {
            user: userInfo,
            options,
            spinHistory: spinHistory,
            itemsList: itemsList
        })
    },
}
