const { recordBalance } = require('../../helper/wallet');
const MAX_INT = 2147483647;
const escapeRegex = value => value;

module.exports = {
  name: 'api/sepay/webhook',
  method: 'POST',
  middleware: [],
  run: async ({ req, res, sql }) => {
    const configuredToken = process.env.SEPAY_WEBHOOK_TOKEN;
    const auth = req.get('authorization') || '';
    const tokenMatch = /^Apikey\s+([^\s]+)$/i.exec(auth);
    if (!configuredToken || configuredToken === 'MatKhauBaoMatWebhookCuaBan' || !tokenMatch || tokenMatch[1] !== configuredToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return res.status(400).json({ success: false });
    if (payload.transferType !== 'in') return res.json({ success: true, message: 'Ignored' });
    const transactionId = String(payload.id ?? payload.referenceCode ?? '');
    const rawAmount = payload.transferAmount;
    const amount = typeof rawAmount === 'number' ? rawAmount : (typeof rawAmount === 'string' && /^\d+$/.test(rawAmount) ? Number(rawAmount) : NaN);
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';
    const gateway = typeof payload.gateway === 'string' ? payload.gateway.slice(0, 255) : '';
    if (!transactionId || transactionId.length > 255 || !Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_INT || content.length > 1000) {
      return res.status(400).json({ success: false, message: 'Invalid payment payload' });
    }

    const configuredPrefix = (process.env.PAYMENT_PREFIX || 'nap').trim();
    if (!/^[a-z0-9_-]{1,32}$/i.test(configuredPrefix)) return res.status(503).json({ success: false });
    const match = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(configuredPrefix)}tkid(\\d{4,10})(?!\\d)`, 'i').exec(content);
    if (!match) return res.json({ success: true, message: 'No payment code found' });
    const userId = Number(match[1]);
    if (!Number.isSafeInteger(userId) || userId <= 0) return res.status(400).json({ success: false });

    let db;
    try {
      db = await sql.promise().getConnection();
      await db.beginTransaction();
      const [accounts] = await db.query('SELECT id, username, vnd, tongnap FROM account WHERE id = ? FOR UPDATE', [userId]);
      if (!accounts.length) {
        await db.rollback();
        return res.status(404).json({ success: false, message: 'Payment account not found' });
      }
      const account = accounts[0];
      const credited = amount;
      if (!Number.isSafeInteger(credited) || credited <= 0 || credited > MAX_INT || Number(account.vnd) + credited > MAX_INT || Number(account.tongnap) + amount > MAX_INT) {
        await db.rollback();
        return res.status(400).json({ success: false, message: 'Payment amount exceeds account limits' });
      }
      try {
        await db.query('INSERT INTO bank_transfers (transaction_id, username, amount, description, status, sender_bank_name, is_credited) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [transactionId, account.username, amount, content, 'success', gateway, 1]);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          await db.rollback();
          return res.json({ success: true, message: 'Transaction already processed' });
        }
        throw err;
      }
      const description = `Donate SePay #${transactionId}: mức Donate ${amount}, cộng ${credited} điểm`;
      await db.query('UPDATE account SET vnd = vnd + ?, tongnap = tongnap + ?, balance_note = ? WHERE id = ?',
        [credited, amount, description, userId]);
      await recordBalance(db, account, Number(account.vnd), Number(account.vnd) + credited, description);
      await db.query('UPDATE account SET balance_note = NULL WHERE id = ?', [userId]);
      await db.commit();
      return res.json({ success: true, message: 'Payment processed successfully' });
    } catch (error) {
      if (db) await db.rollback();
      console.error('SePay webhook processing failed:', error.code || 'database error');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
      if (db) db.release();
    }
  }
};
