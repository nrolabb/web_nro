const MAX_POINTS = 2147483647;
class WalletError extends Error {}
// Also works on installations with the balance-history trigger enabled.
async function recordBalance(db, account, before, after, description) {
  const [existing] = await db.query('SELECT id FROM account_transactions WHERE account_id = ? AND description = ? AND balance_before = ? AND balance_after = ? FOR UPDATE', [account.id, description, before, after]);
  if (!existing.length) await db.query(`INSERT INTO account_transactions (account_id, username, character_name, amount, balance_before, balance_after, description)
    VALUES (?, ?, (SELECT name FROM player WHERE account_id = ? ORDER BY id LIMIT 1), ?, ?, ?, ?)`, [account.id, account.username, account.id, after-before, before, after, description]);
}
async function transfer(db, senderId, input) {
  const { password, requestId } = input;
  const receiveCode = input.recipientCode === undefined ? null : require('./wallet-codes').lookup(input.recipientCode);
  if (input.recipientCode !== undefined && !receiveCode) throw new WalletError('Mã ví không tồn tại hoặc đã hết hạn.');
  const recipient = receiveCode ? receiveCode.username : input.recipient;
  const note = input.note === undefined ? '' : input.note;
  if (typeof note !== 'string' || note.length > 150 || /[\r\n\x00-\x1f]/.test(note)) throw new WalletError('Lời nhắn không hợp lệ (tối đa 150 ký tự).');
  const message = note.trim() ? ` - ${note.trim()}` : '';
  const amount = typeof input.amount === 'number' ? input.amount : typeof input.amount === 'string' && /^\d+$/.test(input.amount) ? Number(input.amount) : NaN;
  const reqId = typeof requestId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId) ? requestId : require('crypto').randomUUID();
  if (typeof recipient !== 'string' || !/^[a-zA-Z0-9_]{1,30}$/.test(recipient) || typeof password !== 'string' || !password || password.length > 100 || !Number.isSafeInteger(amount) || amount < 1 || amount > MAX_POINTS) throw new WalletError('Thông tin chuyển điểm không hợp lệ.');
  let receiverId;
  if (receiveCode) {
    receiverId = receiveCode.accountId;
  } else {
    const [targets] = await db.query('SELECT id FROM account WHERE username = ?', [recipient.toLowerCase()]);
    if (!targets.length) throw new WalletError('Tài khoản nhận không tồn tại.');
    receiverId = targets[0].id;
  }
  if (Number(receiverId) === Number(senderId)) throw new WalletError('Không thể chuyển điểm cho chính mình.');
  // Lock in a fixed order to serialize duplicate requests and opposite transfers.
  const accounts = [];
  for (const id of [senderId, receiverId].sort((a,b)=>a-b)) {
    const [rows] = await db.query('SELECT id, username, password, ban, vnd FROM account WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw new WalletError('Tài khoản không tồn tại.');
    accounts.push(rows[0]);
  }
  const sender = accounts.find(a=>Number(a.id)===Number(senderId));
  const receiver = accounts.find(a=>Number(a.id)===Number(receiverId));
  if (Number(sender.ban) || Number(receiver.ban)) throw new WalletError('Tài khoản đang bị khóa.');
  if (sender.password !== password) throw new WalletError('Mật khẩu xác nhận không đúng.');
  const marker = `[Ví:${reqId.toLowerCase()}]`;
  const outgoing = `Chuyển ${amount} điểm đến ${receiver.username}${message} ${marker}`;
  const [previous] = await db.query('SELECT id, description, amount FROM account_transactions WHERE account_id = ? AND description LIKE ? FOR UPDATE', [sender.id, `%${marker}`]);
  if (previous.length) {
    if (previous.length !== 1 || previous[0].description !== outgoing || Number(previous[0].amount) !== -amount) throw new WalletError('Mã giao dịch đã được sử dụng cho nội dung khác.');
    return { balance: Number(sender.vnd), duplicate: true };
  }
  if (receiveCode && !require('./wallet-codes').isUsable(receiveCode, sender.id)) throw new WalletError('Mã ví đã hết hạn. Hãy lấy mã mới từ người nhận.');
  const before = Number(sender.vnd), receiverBefore = Number(receiver.vnd);
  if (!Number.isSafeInteger(before) || before < amount) throw new WalletError('Số điểm không đủ.');
  if (!Number.isSafeInteger(receiverBefore) || receiverBefore < 0 || receiverBefore + amount > MAX_POINTS) throw new WalletError('Ví nhận đã đạt giới hạn điểm.');
  const incoming = `Nhận ${amount} điểm từ ${sender.username}${message} ${marker}`;
  await db.query('UPDATE account SET vnd = vnd - ?, balance_note = ? WHERE id = ?', [amount, outgoing, sender.id]);
  await db.query('UPDATE account SET vnd = vnd + ?, balance_note = ? WHERE id = ?', [amount, incoming, receiver.id]);
  await recordBalance(db, sender, before, before-amount, outgoing);
  await recordBalance(db, receiver, receiverBefore, receiverBefore+amount, incoming);
  await db.query('UPDATE account SET balance_note = NULL WHERE id IN (?, ?)', [sender.id, receiver.id]);
  return { balance: before-amount, duplicate: false, receiverId: receiver.id, receiver: receiver.username, sender: sender.username, amount, note: note.trim() };
}
module.exports = { transfer, recordBalance, WalletError };
