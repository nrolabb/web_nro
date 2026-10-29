const { isLogin } = require('../../middleware/auth.middleware');
const config = require('../../config');
const { rankLevel, rewards } = require('../../helper/jackpot');
const { randomInt } = require('crypto');
const jwt = require('jsonwebtoken');
const poolService = require('../../helper/jackpot-pools');
module.exports = {
    name: 'jackpot/open', method: 'POST', middleware: [isLogin],
    run: async ({ req, res, user }) => {
        let db;
        try {
            const account = (await user.getInfo())[0];
            const { chestId, requestId, token } = req.body;
            let proof;
            try { proof = jwt.verify(token, config.jwt_secretkey); } catch (_) { return res.status(403).json({ message: 'Phiên mở rương hết hạn. Hãy tải lại trang.' }); }
            if (!account || proof.purpose !== 'jackpot' || proof.accountId !== account.id) return res.sendStatus(403);
            if (!Number.isInteger(chestId) || chestId < 0 || chestId > 3 || !/^[a-f0-9-]{36}$/.test(requestId || '')) return res.status(400).json({ message: 'Yêu cầu không hợp lệ.' });
            const price = config.jackpotPrices[chestId].price;
            db = await global.sql.promise().getConnection();
            await db.beginTransaction();
            const [[locked]] = await db.query('SELECT vnd, tongnap FROM account WHERE id = ? FOR UPDATE', [account.id]);
            const [[previous]] = await db.query('SELECT reward, chest_id, cost, created_at FROM jackpot_history WHERE account_id = ? AND request_id = ?', [account.id, requestId]);
            if (previous) {
                const pools = await poolService.getPools(db);
                await db.commit();
                return res.json({ reward: typeof previous.reward === 'string' ? JSON.parse(previous.reward) : previous.reward, balance: locked.vnd,
                    receipt: { chestId: previous.chest_id, cost: previous.cost, createdAt: previous.created_at }, pools });
            }
            const fail = async message => { await db.rollback(); return res.status(400).json({ message }); };
            if (rankLevel(locked.tongnap) < chestId) return await fail('Bạn chưa đạt hạng để mở rương này.');
            if (locked.vnd < price) return await fail('Số dư điểm không đủ để mở rương.');
            const [[player]] = await db.query('SELECT id FROM player WHERE account_id = ? LIMIT 1', [account.id]);
            if (!player) return await fail('Hãy tạo nhân vật trong game trước khi mở rương.');
            const pool = await rewards(db, chestId);
            if (!pool.length) return await fail('Rương chưa được cấu hình phần thưởng.');
            const draw = await poolService.drawPool(db, chestId, price);
            const reward = draw.won
                ? { type: 'jackpot', name: 'JACKPOT ' + config.accountRanks[chestId].name, amount: draw.payout, quantity: 1, chest_id: chestId }
                : { ...pool[randomInt(pool.length)], type: 'item' };
            const newBalance = Number(locked.vnd) - price + draw.payout;
            if (!Number.isSafeInteger(newBalance) || newBalance > 2147483647) return await fail('Số dư sau nhận Jackpot vượt giới hạn. Vui lòng liên hệ quản trị viên.');
            await db.query('UPDATE account SET vnd = vnd - ?, balance_note = ? WHERE id = ?', [price, 'Jackpot rương ' + chestId + ': ' + reward.name, account.id]);
            if (draw.won) {
                await db.query('UPDATE account SET vnd = vnd + ?, balance_note = ? WHERE id = ?', [draw.payout, 'Trúng ' + reward.name + ': ' + draw.payout + ' điểm', account.id]);
            } else {
                await db.query('INSERT INTO spin_reward (player_id, reward_id, quantity, item_options) VALUES (?, ?, ?, ?)', [account.id, reward.item_id, reward.quantity, JSON.stringify(reward.options)]);
            }
            await db.query('INSERT INTO jackpot_history (account_id, request_id, chest_id, cost, reward) VALUES (?, ?, ?, ?, ?)', [account.id, requestId, chestId, price, JSON.stringify(reward)]);
            const [[saved]] = await db.query('SELECT chest_id, cost, created_at FROM jackpot_history WHERE account_id = ? AND request_id = ?', [account.id, requestId]);
            const pools = await poolService.getPools(db);
            await db.commit();
            res.json({ reward, balance: newBalance,
                receipt: { chestId: saved.chest_id, cost: saved.cost, createdAt: saved.created_at }, pools });
        } catch (err) {
            if (db) await db.rollback();
            console.error('Jackpot:', err.message);
            res.status(500).json({ message: 'Không thể hoàn tất mở rương. Hãy thử lại cùng lượt mở.' });
        } finally { if (db) db.release(); }
    }
};
