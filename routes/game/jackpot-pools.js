const { isLogin } = require('../../middleware/auth.middleware');
const { getPools } = require('../../helper/jackpot-pools');
module.exports = {
    name: 'jackpot/pools', method: 'GET', middleware: [isLogin],
    run: async ({ res }) => {
        res.set('Cache-Control', 'no-store');
        try { res.json({ pools: await getPools(global.sql.promise()) }); }
        catch (err) { console.error('Jackpot pools:', err.message); res.status(503).json({ message: 'Chưa thể tải hũ Jackpot.' }); }
    }
};
