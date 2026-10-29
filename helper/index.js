var crypto = require("crypto");
var config = require("../config");
var fs = require("fs-extra")
module.exports = {
  encryptPassword: (password) => {
    try {
      const hash = crypto.createHash("md5").update(password).digest("hex");
      return hash;
    } catch (err) {
      return {
        error: true,
        message: "Không thế mã hoá mật khẩu!",
      };
    }
  },
  optionsEJS: (req, res) => {
    var getAvatar = {
      0: "../assets/images/avatars/td.png",
      2: "../assets/images/avatars/xd.png",
      1: "../assets/images/avatars/nm.png"
    }
    return {
      config,
      res,
      req,
      getAvatar,
      pointDescription: value => String(value || "").replace(/VNĐ|VND|vnđ/g, "điểm").replace(/nạp tiền/gi, "Donate").replace(/tiền/g, "điểm")
    }
  },
};
