const { isLogin } = require('../../middleware/auth.middleware');

module.exports = {
    name: "bxh",
    method: "GET",
    middleware: [isLogin],
    run: async ({ req, res, user, options, next }) => {
        try {
            var { type } = req.query
            var typeFilter = ["0", "1", "2"];
            if (!typeFilter.includes(type)) {
                type = 0;
            }
            var queryDatabase = (query) => {
                return new Promise((resolve, reject) => {
                    sql.query(query, (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results);
                        }
                    });
                });
            };
            var [topUsersResult, topReCharge, topQuest] = await Promise.all([
                queryDatabase("SELECT * FROM player ORDER BY JSON_EXTRACT(data_point, '$[1]') DESC LIMIT 10"),
                queryDatabase(`
                SELECT account.*,
                       (SELECT player.gender FROM player
                        WHERE player.account_id = account.id
                        ORDER BY player.id LIMIT 1) AS gender
                FROM account
                ORDER BY tongnap DESC LIMIT 10
                `),
                queryDatabase(`
                SELECT *
                FROM player
                ORDER BY JSON_EXTRACT(data_task, '$[0]') DESC,
                         CASE WHEN JSON_EXTRACT(data_task, '$[0]') = JSON_EXTRACT(data_task, '$[0]', '$[1]') THEN JSON_EXTRACT(data_task, '$[1]') ELSE NULL END DESC
                LIMIT 10;
                `)
            ]);
            res.render("page/bxh.ejs", {
                user: await user.getInfo(),
                type,
                options,
                allUser: topUsersResult.map(u => {
                    try {
                        const dp = JSON.parse(u.data_point);
                        u.power = dp[1] || 0;
                        u.pet_power = 0;
                        return u;
                    } catch (e) {
                        u.power = 0;
                        u.pet_power = 0;
                        return u;
                    }
                }),
                topReCharge,
                topQuest
            });
        } catch (err) {
            next(err);
        }
    },
};
