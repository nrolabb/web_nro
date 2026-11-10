const { randomBytes } = require('node:crypto');

class ReferralError extends Error {}
async function getCode(db, accountId) {
  const [rows] = await db.query('SELECT username, gioithieu FROM account WHERE id = ?', [accountId]);
  if (!rows.length) throw new ReferralError('Không tìm thấy tài khoản.');
  const code = rows[0].gioithieu;
  if (code && code.trim() && code !== 'null') return code;
  const generated = rows[0].username + '_' + randomBytes(8).toString('hex');
  await db.query("UPDATE account SET gioithieu = ? WHERE id = ? AND (gioithieu IS NULL OR TRIM(gioithieu) = '' OR gioithieu = 'null')", [generated, accountId]);
  const [updated] = await db.query('SELECT gioithieu FROM account WHERE id = ?', [accountId]);
  return updated[0].gioithieu;
}
async function creditReferrer(db, referrerId) {
  await db.query("UPDATE account SET vnd = vnd + 10000, balance_note = 'Thưởng giới thiệu thành viên' WHERE id = ?", [referrerId]);
}
// Caller owns the transaction: registration, both gifts and money commit together.
async function redeem(db, accountId, rawCode) {
  if (typeof rawCode !== 'string' || !rawCode.trim() || rawCode.trim().length > 255) {
    throw new ReferralError('Vui lòng nhập mã giới thiệu hợp lệ.');
  }
  const [refs] = await db.query('SELECT id FROM account WHERE gioithieu = ? LIMIT 2', [rawCode.trim()]);
  if (refs.length !== 1) throw new ReferralError('Mã giới thiệu không hợp lệ.');
  const refId = refs[0].id;
  if (Number(refId) === Number(accountId)) throw new ReferralError('Không thể nhập mã của chính mình!');
  const [rows] = await db.query('SELECT id, active, xacnhan_gioithieu, last_time_login, last_time_logout FROM account WHERE id IN (?, ?) ORDER BY id FOR UPDATE', [accountId, refId]);
  const account = rows.find(row => Number(row.id) === Number(accountId));
  if (!account || rows.length !== 2) throw new ReferralError('Không tìm thấy tài khoản.');
  if (Number(account.xacnhan_gioithieu)) throw new ReferralError('Bạn đã nhập mã giới thiệu rồi!');
  const [result] = await db.query('UPDATE account SET xacnhan_gioithieu = ? WHERE id = ? AND COALESCE(xacnhan_gioithieu, 0) = 0', [refId, accountId]);
  if (result.affectedRows !== 1) throw new ReferralError('Bạn đã nhập mã giới thiệu rồi!');
  for (const id of [accountId, refId]) {
    for (const itemId of [573, 574]) {
      await db.query('INSERT INTO spin_reward (player_id, reward_id, quantity, item_options) VALUES (?, ?, ?, ?)', [id, itemId, 5, '[]']);
    }
  }
  if (Number(account.active) === 1) await creditReferrer(db, refId);
}
module.exports = { ReferralError, getCode, creditReferrer, redeem };
