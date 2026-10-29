const { isLogin } = require('../../middleware/auth.middleware');
module.exports = {
  name: 'changepassword',
  method: 'GET',
  middleware: [isLogin],
  run: async ({ res }) => res.redirect('/profile#change-password')
};
