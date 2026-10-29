const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: "spin-combo",
  method: "GET",
  run: async ({ req, res }) => {
    const code = req.query.code;
    if (typeof code !== 'string' || !/^[a-z0-9_-]{1,64}$/i.test(code)) return res.status(400).json({ error: true, message: 'Mã combo không hợp lệ.' });
    const root = path.resolve(__dirname, 'combo_data');
    const filePath = path.resolve(root, code + '.json');
    if (!filePath.startsWith(root + path.sep)) return res.status(400).json({ error: true });
    try {
      const data = await fs.readJson(filePath);
      res.set('Cache-Control', 'public, max-age=60');
      return res.json({ error: false, data });
    } catch (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: true, message: 'Không tìm thấy dữ liệu combo.' });
      return res.status(500).json({ error: true, message: 'Không thể tải dữ liệu combo.' });
    }
  }
};
