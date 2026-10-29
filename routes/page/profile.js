const { isLogin } = require('../../middleware/auth.middleware');
module.exports = {
  name: 'profile',
  method: 'GET',
  middleware: [isLogin],
  run: async ({ res, user, options }) => {
    const accounts = await user.getInfo();
    if (!accounts[0]?.username) return res.redirect('/');
    const player = await user.getPlayer(accounts[0].id);
    res.render('page/profile.ejs', { user: accounts, player, options });
  }
};
