const { isLogin } = require("../../middleware/auth.middleware");

module.exports = {
    name: "jackpot",
    method: "GET",
    middleware: [isLogin],
    run: async ({ res, user, options, next }) => {
        try {
            const info = await user.getInfo();
            const { rankLevel, rewards } = require('../../helper/jackpot');
            const config = require('../../config');
            const pool = await rewards(global.sql.promise(), 3);
            const pools = await require('../../helper/jackpot-pools').getPools(global.sql.promise());
            const [history] = await global.sql.promise().query('SELECT chest_id, cost, reward, created_at FROM jackpot_history WHERE account_id = ? ORDER BY id DESC LIMIT 30', [info[0].id]);
            res.render('page/jackpot.ejs', {
                user: info, options, history,
                jackpot: { level: rankLevel(info[0].tongnap), balance: info[0].vnd, price: config.jackpotPrice,
                    ranks: config.accountRanks, rewards: pool, pools,
                    token: require('jsonwebtoken').sign({ purpose: 'jackpot', accountId: info[0].id }, config.jwt_secretkey, { expiresIn: '2h' }) }
            });
        } catch (err) {
            next(err);
        }
    }
};
