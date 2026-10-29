const rateLimit = require('../../middleware/rate-limit');
module.exports = {
  name: "auth/register",
  middleware: [rateLimit({ name: 'register', windowMs: 60 * 60 * 1000, max: 10 })],
  method: "post",
  run: async({ req, res, sql }) => {
    try {
      const { username, password, confirmPassword, captcha } = req.body;

      if (typeof username !== 'string' || typeof password !== 'string' || username.length < 5 || username.length > 12 || password.length < 5 || password.length > 12) {
        return res.json({
          error: true,
          message: "Tài khoản và mật khẩu phải dài từ 5 đến 12 ký tự!",
        });
      }
  
      if (typeof confirmPassword !== 'string' || password !== confirmPassword) {
        return res.json({ error: true, message: 'Mật khẩu nhập lại không khớp!' });
      }

      const usernamePattern = /^[a-zA-Z0-9_]{5,12}$/;
      if (!usernamePattern.test(username.toLowerCase())) {
        return res.json({
          error: true,
          message: "Vui lòng nhập username hợp lệ!",
        });
      }
  
      if (/[\u0000-\u001f\u007f]/.test(password)) return res.status(400).json({ error: true, message: 'Mật khẩu chứa ký tự không hợp lệ.' });
    //  const secret = "6Ld4ANEpAAAAACTKDw6eFX7vslgTShvTEEbftG6A";

    //  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captcha}`);
    //  console.log(response.data);
    //  if (!response.data.success) {
    
    //      return res.json({
       //       status: false,
      //        message: 'Bạn không phải là con người!'
      //    });
   //   }
      sql.query("SELECT id FROM account WHERE username = ? LIMIT 1", [username.toLowerCase()], (err, results) => {
        if (err) {
          console.error("Lỗi khi kiểm tra user:", err);
          return res.json({
            error: true,
            message: "Lỗi khi kiểm tra user",
          });
        }
  
        if (results.length > 0) {
          return res.json({
            error: true,
            message: "User đã tồn tại trong cơ sở dữ liệu",
          });
        }
  
        // const hash = crypto.createHash("md5").update(password).digest("hex");
        const insertUserQuery = `INSERT INTO account (username, password, email, token, xsrf_token, newpass) VALUES (?, ?, ?, ?, ?, ?)`;
        sql.query(insertUserQuery, [username.toLowerCase(), password, '', '', '', ''], (err, insertResult) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: true, message: 'Tên người dùng đã tồn tại.' });
            console.error("Lỗi khi thêm dữ liệu vào bảng user:", err);
            return res.json({
              error: true,
              message: "Lỗi khi thêm dữ liệu vào bảng user",
            });
          }
          console.log("Dữ liệu đã được thêm thành công vào bảng user");
          return res.json({
            error: false,
            message: "Đăng ký thành công",
          });
        });
      });
    } catch(err){
      console.log(err)
      return res.json({
        error: true,
        message: "Đã xảy ra lỗi tại server",
      });
    }
  },
};
