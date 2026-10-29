module.exports = {
  name: "login",
  method: "GET",
  middleware: [],
  run: async ({ req, res, user, options }) => {
    if (!(await user.getInfo())[0]?.username) {
      res.render("auth/login.ejs", {
        user,
        options,
      });
    } else {
      res.redirect("/");
    }
  },
};
