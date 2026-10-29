const { randomInt } = require('crypto');
// Single web process: codes are invalid after restart. Keep retired codes for
// 24h so an already-completed transfer can still be retried idempotently.
const codes = new Map();
// Once a sender has verified a still-active code, they get this long to type
// the password, even if the receiver's screen rotates to a new code meanwhile.
const CLAIM_MS = 120000;
const CODE_MS = 60000;
// Incoming transfers per receiver account, so the receiver's open code screen
// can show "points received" notifications (kept 10 minutes).
const receipts = new Map();
function sweep(now) {
 for (const [key,value] of codes) if (value.expiresAt + 86400000 < now) codes.delete(key);
 for (const [id,list] of receipts) { const kept=list.filter(r=>r.at>now-600000); if(kept.length)receipts.set(id,kept); else receipts.delete(id); }
}
function issue(accountId, username, now = Date.now()) {
 sweep(now);
 for (const value of codes.values()) if (value.accountId === accountId) value.expiresAt = Math.min(value.expiresAt, now);
 let code;
 for(let i=0;i<100;i++){const candidate=String(randomInt(100000,1000000));if(!codes.has(candidate)){code=candidate;break;}}
 if(!code)throw new Error('Không thể tạo mã ví. Vui lòng thử lại.');
 codes.set(code,{accountId,username,expiresAt:now+CODE_MS,claims:new Map()});
 return {code,remainingMs:CODE_MS};
}
function lookup(code){
 const c = typeof code === 'number' ? String(code) : typeof code === 'string' ? code.trim() : '';
 return /^\d{6}$/.test(c) ? codes.get(c) : undefined;
}
// Verify a code for a sender before the password step. Returns the receiver
// and how long the sender may take to confirm, or an error message.
function claim(code, senderId, now = Date.now()) {
 const entry = lookup(code);
 if (!entry) return { error: 'Mã ví không tồn tại hoặc đã hết hạn.' };
 if (Number(entry.accountId) === Number(senderId)) return { error: 'Không thể chuyển điểm cho chính mình.' };
 const existing = entry.claims.get(Number(senderId)) || 0;
 if (existing > now) return { username: entry.username, remainingMs: existing - now };
 if (entry.expiresAt <= now) return { error: 'Mã ví đã hết hạn. Hãy lấy mã mới từ người nhận.' };
 entry.claims.set(Number(senderId), now + CLAIM_MS);
 return { username: entry.username, remainingMs: CLAIM_MS };
}
function isUsable(entry, senderId, now = Date.now()) {
 return Boolean(entry) && (entry.expiresAt > now || (entry.claims?.get(Number(senderId)) || 0) > now);
}
function markReceived(accountId, info, now = Date.now()) {
 const list = receipts.get(Number(accountId)) || [];
 list.push({ at: now, from: info.from, amount: info.amount, note: info.note || '' });
 receipts.set(Number(accountId), list.slice(-50));
}
function receivedSince(accountId, since) {
 return (receipts.get(Number(accountId)) || []).filter(r => r.at > since);
}
function consumeClaim(code, senderId) { lookup(code)?.claims?.delete(Number(senderId)); }
module.exports={issue,lookup,claim,isUsable,consumeClaim,markReceived,receivedSince,CLAIM_MS};
