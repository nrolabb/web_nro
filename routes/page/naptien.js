const { isLogin } = require("../../middleware/auth.middleware");
const { BanksObject } = require("vietnam-qr-pay");
const config = require("../../helper/config.json");

module.exports = {
  name: "naptien",
  method: "get",
  middleware: [isLogin],
  run: async ({ res, user, options, next, sql }) => {
    try {
      const userInfo = await user.getInfo();
      const donationHistory = await new Promise(resolve => {
        sql.query(
          "SELECT transaction_id, amount, is_credited FROM bank_transfers WHERE username = ? ORDER BY id DESC LIMIT 20",
          [userInfo[0]?.username],
          (err, rows) => {
            if (err) console.error("Không tải được lịch sử Donate:", err.message);
            resolve(err ? null : rows);
          }
        );
      });
      const prefix = process.env.PAYMENT_PREFIX || 'NAP';
      const userId = userInfo[0]?.id;
      // Format ID thành 4 chữ số, VD: 5 -> 0005
      const paddedId = String(userId).padStart(4, '0'); 
      const purpose = `${prefix}TKID${paddedId}`;
      
      const bankBin = process.env.BANK_BIN || BanksObject[config.bankKey]?.bin;
      const accountNumber = process.env.BANK_NUMBER || config.stkCheck;
      const accountName = process.env.BANK_ACCOUNT_NAME || config.accountName;
      const bankName = process.env.BANK_NAME || config.bankName;
      
      res.render("page/naptien.ejs", {
        user: userInfo,
        donationHistory,
        paymentAccount: {
          bankBin,
          bankName,
          accountName,
          accountNumber,
          purpose
        },
        options
      });
    } catch (err) {
      next(err);
    }
  }
};
