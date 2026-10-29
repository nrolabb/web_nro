const { isLogin } = require("../../middleware/auth.middleware");

module.exports = {
  name: "api/check-balance",
  method: "GET",
  middleware: [isLogin],
  run: async ({ res, user }) => {
    try {
      const userInfo = await user.getInfo();
      if (!userInfo || !userInfo[0]) {
        return res.json({ success: false });
      }
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, vnd: userInfo[0].vnd, tongnap: userInfo[0].tongnap });
    } catch (error) {
      console.error("Check Balance Error:", error);
      return res.status(500).json({ success: false });
    }
  }
};
