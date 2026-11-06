const { isLogin } = require('../../middleware/auth.middleware');
const { getCode } = require('../../helper/referrals');
module.exports = {
  name: 'profile',
  method: 'GET',
  middleware: [isLogin],
  run: async ({ res, user, options, sql }) => {
    const accounts = await user.getInfo();
    if (!accounts[0]?.username) return res.redirect('/');
    res.set('Cache-Control', 'no-store');
    accounts[0].gioithieu = await getCode(sql.promise(), accounts[0].id);
    const player = await user.getPlayer(accounts[0].id);
    res.render('page/profile.ejs', { user: accounts, player, options });
  }
};
