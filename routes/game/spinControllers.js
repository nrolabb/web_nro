const { isLogin } = require("../../middleware/auth.middleware");
const { randomInt } = require('crypto');
const rateLimit = require('../../middleware/rate-limit');

module.exports = {
  name: "spin",
  method: "POST",
  middleware: [isLogin, rateLimit({ name: 'spin', windowMs: 60 * 1000, max: 20 })],
  run: async ({ res, user, req }) => {
    let connection;
    try {
    const { type } = req.body;
    const spinType = type === "x10" ? "x10" : "x1";
    const spins = spinType === "x10" ? 10 : 1;
    // Chi phí: 1 lần quay = 1000, 10 lần quay = 9000
    const cost = spinType === "x10" ? 9000 : 1000;

    const info = await user.getInfo();
    if (info[0]?.username) {
      const getUser = info[0];
      if (getUser.vnd < cost) {
        return res.json({
          error: true,
          message: `Bạn không đủ số dư! Cần ${cost.toLocaleString()} điểm để quay ${spins} lần.`
        });
      }

      const rawItems = await new Promise((resolve, reject) => {
        sql.query('SELECT s.*, t.name as template_name, t.icon_id FROM spin_item s LEFT JOIN item_template t ON s.item_id = t.id', (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (rawItems.length > 1000) return res.status(503).json({ error: true, message: 'Danh sách phần thưởng vượt giới hạn cấu hình.' });
      const items = rawItems.map(item => {
        const ratio = Number(item.ratio);
        const quantity = Number(item.quantity);
        const itemId = Number(item.item_id);
        const options = JSON.parse(item.item_options || '[]');
        if (!Number.isSafeInteger(ratio) || ratio < 0 || ratio > 1000000 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647 || !Number.isSafeInteger(itemId) || itemId < 0 || itemId > 32767 || !Array.isArray(options) || options.some(pair => !Array.isArray(pair) || pair.length !== 2 || !Number.isSafeInteger(Number(pair[0])) || !Number.isSafeInteger(Number(pair[1]))) || JSON.stringify(options).length > 255) {
          throw new Error('Invalid spin reward configuration');
        }
        return {
          id: item.id,
          name: item.name || item.template_name || ('Vật phẩm ' + itemId),
          img: item.icon_id != null
            ? `/api/icon/${item.icon_id}.png`
            : (item.image || ''),
          ratio,
          params: [{ quantity, options, id: itemId }]
        };
      });

      const totalRatio = items.reduce((acc, item) => acc + item.ratio, 0);
      if (!items.length || totalRatio <= 0 || !Number.isSafeInteger(totalRatio)) return res.json({error:true,message:"Vòng quay chưa có phần thưởng hợp lệ."});

      const selectedItems = [];
      for (let i = 0; i < spins; i++) {
        let draw = randomInt(totalRatio);
        let selectedItem = items.find(item => {
          draw -= item.ratio;
          return draw < 0;
        });
        if (!selectedItem) throw new Error('Spin weighted selection failed');
        selectedItems.push({
          ...selectedItem,
          img: selectedItem.img || '/assets/images/spin/default.png'
        });
      }

      connection = await global.sql.promise().getConnection();
      await connection.beginTransaction();
      const [accounts] = await connection.query('SELECT vnd FROM account WHERE id = ? FOR UPDATE', [getUser.id]);
      if (!accounts.length || accounts[0].vnd < cost) {
        await connection.rollback();
        return res.json({error:true,message:'Số dư không đủ để quay.'});
      }
      const newBalance = accounts[0].vnd - cost;
      await connection.query('UPDATE account SET vnd = vnd - ?, balance_note = ? WHERE id = ?',
        [cost, 'Vòng quay ' + spinType + ' (' + spins + ' lượt): ' + selectedItems.map(item => item.name).join(', ').slice(0,800), getUser.id]);
      const giftCodes = [];
      for (const item of selectedItems) {
        giftCodes.push('Vào game nhận');
        for (const p of item.params) {
          await connection.query('INSERT INTO spin_reward (player_id, reward_id, quantity, item_options) VALUES (?, ?, ?, ?)',
            [getUser.id, p.id, p.quantity, JSON.stringify(p.options)]);
        }
      }
      await connection.commit();


      return res.json({error:false, data:selectedItems, giftCodes, newBalance});
    } else {
      return res.json({error:true,message:'Bạn chưa đăng nhập!'});
    }
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Spin transaction failed:', error.message);
      return res.status(500).json({error:true,message:'Không thể hoàn tất vòng quay. Vui lòng thử lại.'});
    } finally { if (connection) connection.release(); }
  }
};
