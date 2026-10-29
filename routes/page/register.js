module.exports = {
  name: "register",
  method: "GET",
  middleware: [],
  run: async ({ req, res, user, options }) => {
    if (!(await user.getInfo())[0]?.username) {
      res.render("auth/register.ejs", {
        options,
        user
      });
    } else {
      res.redirect("/");
    }
  },
};
