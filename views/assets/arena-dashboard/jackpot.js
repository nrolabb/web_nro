const jackpot = JSON.parse(document.getElementById('jackpotData').textContent);
let chestIndex = 0, busy = false, pending = null, revealing = false;
const money = n => Number(n).toLocaleString('vi-VN');
const chestPrice = index => Number(jackpot.prices?.[index] ?? jackpot.price);
const poolTiers = [
 { id: 'jackpotAmountMini', selector: '.jackpot-mini', color: 'floating-add-mini' },
 { id: 'jackpotAmountMinor', selector: '.jackpot-minor', color: 'floating-add-minor' },
 { id: 'jackpotAmountMajor', selector: '.jackpot-major', color: 'floating-add-major' },
 { id: 'jackpotAmountGrand', selector: '.jackpot-grand', color: 'floating-add-grand' }
];
const poolAnimationFrames = [null, null, null, null];
function animatePoolAmount(index, start, target, amountAdded) {
 const tier = poolTiers[index], amount = document.getElementById(tier.id);
 if (!amount) return;
 if (poolAnimationFrames[index] !== null) cancelAnimationFrame(poolAnimationFrames[index]);
 const visualStart = Number(amount.textContent.replace(/\D/g, '')) || start;
 if (amountAdded > 0) {
  const card = document.querySelector(tier.selector);
  if (card) {
   const floating = document.createElement('div');
   floating.className = 'jackpot-floating-add ' + tier.color;
   floating.textContent = '+' + money(amountAdded);
   card.append(floating);
   setTimeout(() => floating.remove(), 8800);
  }
 }
 amount.classList.add('jackpot-digits-counting');
 const startedAt = performance.now(), duration = 9000;
 const step = now => {
  const progress = Math.min((now - startedAt) / duration, 1);
  amount.textContent = money(Math.round(visualStart + (target - visualStart) * progress));
  if (progress < 1) poolAnimationFrames[index] = requestAnimationFrame(step);
  else {
   poolAnimationFrames[index] = null;
   amount.textContent = money(target);
   amount.classList.remove('jackpot-digits-counting');
  }
 };
 poolAnimationFrames[index] = requestAnimationFrame(step);
}
function renderJackpotPools(pools, animateIncrease = false) {
 pools.forEach((pool, index) => {
  const tier = poolTiers[index], amount = document.getElementById(tier.id);
  if (!amount) return;
  const previous = Number(jackpot.pools[index]?.amount ?? pool.amount);
  const target = Number(pool.amount);
  if (animateIncrease && target > previous) animatePoolAmount(index, previous, target, target - previous);
  else {
   if (poolAnimationFrames[index] !== null) cancelAnimationFrame(poolAnimationFrames[index]);
   poolAnimationFrames[index] = null;
   amount.classList.remove('jackpot-digits-counting');
   amount.textContent = money(target);
  }
 });
 jackpot.pools = pools;
}
renderJackpotPools(jackpot.pools);
setInterval(async () => {
 try {
  const response = await fetch('/jackpot/pools', { cache: 'no-store' });
  if (!response.ok) return;
  const data = await response.json();
  if (Array.isArray(data.pools) && data.pools.length === 4) renderJackpotPools(data.pools, true);
 } catch (_) {}
}, 30000);
function changeChest(direction = 0) {
 if (busy || pending || revealing) return;
 chestIndex = (chestIndex + direction + 4) % 4; renderChest();
}
function renderChest() {
 const rank = jackpot.ranks[chestIndex];
 document.getElementById('chestName').textContent = 'RƯƠNG ' + rank.name.toUpperCase();
 document.getElementById('requirement').textContent = 'Yêu cầu hạng ' + rank.name + ' · Tổng Donate từ ' + money(rank.amount) + ' điểm';
 document.getElementById('chestPrice').textContent = 'Giá mở rương: ' + money(chestPrice(chestIndex)) + ' điểm/lượt';
 const button = document.getElementById('openChest');
 button.disabled = busy || revealing || jackpot.level < chestIndex || (!pending && jackpot.balance < chestPrice(chestIndex));
 button.textContent = busy ? 'ĐANG MỞ RƯƠNG…' : pending ? 'THỬ LẠI LƯỢT MỞ' : jackpot.level < chestIndex ? 'CHƯA ĐỦ HẠNG' : 'MỞ RƯƠNG · ' + money(chestPrice(chestIndex)) + ' điểm';
 document.getElementById('diamondChestGems').classList.toggle('hidden', chestIndex !== 3);
 document.getElementById('chestContainer').style.filter = ['sepia(.7)', 'grayscale(1)', 'none', 'hue-rotate(130deg)'][chestIndex];
 document.getElementById('balance').textContent = money(jackpot.balance);
 const pool = jackpot.rewards.filter(item => item.chest_id <= chestIndex);
 const list = document.getElementById('rewards'); list.replaceChildren();
 if (!pool.length) {
  const row = document.createElement('tr'), cell = document.createElement('td');
  cell.colSpan = 4; cell.textContent = 'Rương chưa có phần thưởng.'; row.append(cell); list.append(row);
 }
 for (const item of pool) {
  const row = document.createElement('tr');
  const name = document.createElement('td'), quantity = document.createElement('td'), options = document.createElement('td'), rate = document.createElement('td');
  const identity = document.createElement('div'); identity.className = 'jackpot-reward-name';
  const img = document.createElement('img'); img.src = '/api/icon/' + item.icon_id + '.png'; img.alt = ''; img.width = 48;
  const label = document.createElement('span'); label.textContent = item.name;
  identity.append(img, label); name.append(identity);
  quantity.textContent = item.quantity;
  options.textContent = item.options.map(o => 'Option ' + o.id + ': ' + o.param).join(' · ') || '—';
  rate.textContent = (100 / pool.length).toFixed(2) + '%';
  row.append(name, quantity, options, rate); list.append(row);
 }
}
function newRequestId() {
 const bytes = crypto.getRandomValues(new Uint8Array(16));
 return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}
async function spinChest() {
 if (busy || revealing || jackpot.level < chestIndex || (!pending && jackpot.balance < chestPrice(chestIndex))) return;
 busy = true;
 pending = pending || { chestId: chestIndex, requestId: newRequestId(), token: jackpot.token }; renderChest();
 const result = document.getElementById('result'); result.textContent = 'Đang mở rương…';
 resetChestAnimation();
 try {
  const response = await fetch('/jackpot/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) });
  const data = await response.json();
  if (!response.ok) { if (response.status < 500) pending = null; throw new Error(data.message || 'Không thể mở rương. Hãy tải lại trang.'); }
  jackpot.balance = data.balance; pending = null;
  if (Array.isArray(data.pools) && data.pools.length === 4) renderJackpotPools(data.pools, true);
  const receipt = data.receipt || { chestId: chestIndex, cost: chestPrice(chestIndex), createdAt: new Date().toISOString() };
  appendHistory(data.reward, receipt);
  document.getElementById('balance').textContent = money(jackpot.balance);
  await animateChestOpen();
  await animateReward(data.reward);
  result.textContent = data.reward.type === 'jackpot'
   ? 'Chúc mừng! Bạn trúng ' + data.reward.name + ' và được cộng ' + money(data.reward.amount) + ' điểm vào tài khoản.'
   : 'Nhận được ' + data.reward.name + ' × ' + data.reward.quantity + '. Vào game nhận thưởng vòng quay.';
 } catch (err) {
  result.textContent = pending ? 'Chưa xác nhận kết quả. Bấm thử lại để kiểm tra cùng lượt, không trừ điểm lần hai.' : err.message;
 } finally { busy = false; resetChestAnimation(); renderChest(); }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function resetChestAnimation() {
 const classes = { chestContainer: 'chest-opening', chestLidLayer: 'open-lid-anim', chestCavity: 'active-cavity', chestInsideGlow: 'active-glow', chestGlow: 'active', unlockFlash: 'flash-active' };
 for (const [id, name] of Object.entries(classes)) document.getElementById(id).classList.remove(name);
 document.getElementById('chestKey').className = 'chest-key-anim';
 document.getElementById('chestParticles').replaceChildren();
}
function chestParticles(count) {
 const parent = document.getElementById('chestParticles'); parent.replaceChildren();
 for (let i = 0; i < count; i++) {
  const p = document.createElement('div'); p.className = 'sparkle-particle';
  const angle = Math.PI * 2 * i / count, distance = 40 + Math.random() * 50;
  p.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
  p.style.setProperty('--ty', Math.sin(angle) * distance + 'px'); parent.append(p);
 }
}
async function animateChestOpen() {
 const key = document.getElementById('chestKey');
 key.classList.add('key-flying'); chestParticles(6);
 await delay(450);
 key.classList.remove('key-flying'); key.classList.add('key-inserted');
 await delay(200);
 key.classList.add('key-turning'); document.getElementById('unlockFlash').classList.add('flash-active');
 await delay(300);
 document.getElementById('unlockFlash').classList.remove('flash-active'); key.classList.add('key-fadeout');
 document.getElementById('chestContainer').classList.add('chest-opening');
 document.getElementById('chestLidLayer').classList.add('open-lid-anim');
 document.getElementById('chestCavity').classList.add('active-cavity');
 document.getElementById('chestInsideGlow').classList.add('active-glow');
 document.getElementById('chestGlow').classList.add('active'); chestParticles(24);
 await delay(1050);
}
async function animateReward(winner) {
 const modal = document.getElementById('caseOpeningModal'), rail = document.getElementById('rouletteRail');
 const close = document.getElementById('closeReward'), status = document.getElementById('rouletteStatus');
 const pool = jackpot.rewards.filter(item => item.chest_id <= chestIndex);
 if (!pool.length) pool.push(winner);
 const jackpotPreview = {
  type: 'jackpot',
  name: 'JACKPOT ' + jackpot.ranks[chestIndex].name,
  amount: Number(jackpot.pools[chestIndex]?.amount ?? 0),
  quantity: 1,
  chest_id: chestIndex
 };
 rail.replaceChildren(); rail.style.transform = 'translateX(0px)';
 close.classList.add('hidden'); status.textContent = 'Đang mở phần thưởng…';
 document.getElementById('rouletteChestTitle').textContent = 'RƯƠNG ' + jackpot.ranks[chestIndex].name.toUpperCase();
 // Only the API award can occupy the winning position. Other cards are visual decoration.
 for (let i = 0; i < 65; i++) {
  // Always show the eligible Jackpot among the roulette cards; only the API result at slot 50 wins.
  const item = i === 50 ? winner : i === 35 ? jackpotPreview : pool[Math.floor(Math.random() * pool.length)];
  const card = document.createElement('div');
  card.className = 'roulette-card tier-' + ['blue', 'purple', 'pink', 'gold'][item.chest_id] + (item.type === 'jackpot' ? ' jackpot-prize-card' : '');
  const icon = document.createElement('div'); icon.className = 'card-icon';
  if (item.type === 'jackpot') {
   const gem = document.createElement('i'); gem.className = 'fa-solid fa-gem'; gem.setAttribute('aria-hidden', 'true'); icon.append(gem);
  } else {
   const img = document.createElement('img'); img.src = '/api/icon/' + item.icon_id + '.png'; img.alt = ''; icon.append(img);
  }
  const name = document.createElement('div'); name.className = 'card-name'; name.textContent = item.name;
  const qty = document.createElement('div'); qty.className = 'card-tier-label'; qty.textContent = item.type === 'jackpot' ? (i === 35 && item !== winner ? 'CƠ HỘI 0,01% · ' : '') + money(item.amount) + ' điểm' : '× ' + item.quantity;
  const bar = document.createElement('div'); bar.className = 'card-tier-bar'; card.append(icon, name, qty, bar); rail.append(card);
 }
 revealing = true; modal.classList.remove('hidden');
 const winningCard = rail.children[50];
 await new Promise(resolve => {
  let start;
  function frame(now) {
   if (start === undefined) start = now;
   const progress = Math.min((now - start) / 5500, 1);
   const target = winningCard.offsetLeft + winningCard.offsetWidth / 2 - rail.parentElement.clientWidth / 2;
   rail.style.transform = 'translateX(' + (-target * (1 - Math.pow(1 - progress, 4.2))) + 'px)';
   if (progress < 1) requestAnimationFrame(frame); else resolve();
  }
  requestAnimationFrame(frame);
 });
 winningCard.classList.add('jackpot-winner');
 status.textContent = winner.type === 'jackpot'
  ? 'JACKPOT! ' + winner.name + ' — +' + money(winner.amount) + ' điểm đã cộng vào tài khoản.'
  : 'Bạn nhận được ' + winner.name + ' × ' + winner.quantity + '. Vào game nhận thưởng vòng quay.';
 close.classList.remove('hidden'); close.focus();
}
function closeRewardReveal() {
 if (busy) return;
 document.getElementById('caseOpeningModal').classList.add('hidden'); revealing = false; renderChest(); document.getElementById('openChest').focus();
}
document.getElementById('caseOpeningModal').addEventListener('keydown', event => {
 if (event.key === 'Escape') closeRewardReveal();
 if (event.key === 'Tab') { event.preventDefault(); document.getElementById('closeReward').focus(); }
});
function appendHistory(reward, receipt) {
 document.getElementById('historyEmpty')?.remove();
 const row = document.createElement('tr');
 const values = [new Date(receipt.createdAt).toLocaleString('vi-VN', {timeZone:'Asia/Bangkok'}), jackpot.ranks[receipt.chestId].name, reward.name, reward.quantity, money(receipt.cost) + ' điểm'];
 for (const value of values) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
 const body = document.getElementById('history'); body.prepend(row);
 while (body.children.length > 30) body.lastElementChild.remove();
}
renderChest();
