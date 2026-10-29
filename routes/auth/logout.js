module.exports = {
  name: "logout",
  middleware: [],
  method: "post",
  run: ({ req, res }) => {
    const { clearSession } = require('../../middleware/auth.middleware');
    clearSession(res, req);
    res.redirect("/");
  },
};
