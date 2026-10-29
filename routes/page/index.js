const { isLogin } = require('../../middleware/auth.middleware');

module.exports = {
  name: "/",
  method: "GET",
  middleware: [isLogin],
  run: async({ req, res, user, options }) => {
    res.render("index.ejs", {
      user: await user.getInfo(),
      options,
    });
  },
};
