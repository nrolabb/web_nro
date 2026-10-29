const jackpot = JSON.parse(document.getElementById('jackpotData').textContent);
let chestIndex = 0, busy = false, pending = null, revealing = false;
const money = n => Number(n).toLocaleString('vi-VN');
const chestPrice = index => Number(jackpot.prices?.[index] ?? jackpot.price);
const jackpotChanceText = Number(jackpot.chancePercent ?? 0.01).toLocaleString('vi-VN', { maximumFractionDigits: 6 });
const SoundFX = {
 ctx: null,
 init() {
  try {
   const AudioCtx = window.AudioContext || window.webkitAudioContext;
   if (!this.ctx && AudioCtx) this.ctx = new AudioCtx();
   if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
  } catch (_) {}
 },
 tone(type, from, to, duration, volume, offset = 0) {
  if (!this.ctx) return;
  try {
   const now = this.ctx.currentTime + offset, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
   osc.type = type; osc.frequency.setValueAtTime(from, now);
   (type === 'sine' && to > from ? osc.frequency.exponentialRampToValueAtTime(to, now + duration) : osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration));
   gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
   osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now + duration);
  } catch (_) {}
 },
 playKeyInsert() { this.tone('sine', 1400, 2600, .18, .3); },
 playUnlock() { this.tone('triangle', 900, 220, .1, .5); this.tone('sawtooth', 1500, 320, .23, .5, .05); },
 playChestOpen() { this.tone('sawtooth', 100, 180, .6, .3); },
 playCaseTick(rate = 1) { this.tone('triangle', 850 + rate * 300, 200, .04, .38); },
 playItemStop() { this.tone('triangle', 280, 80, .3, .4); },
 playGoldDropSound() {
  if (!this.ctx) return;
  [1046.5, 1318.51, 1567.98, 2093, 3135.96].forEach((frequency, index) => this.tone('sine', frequency, frequency, 2.8, .35 / (index + 1)));
  this.tone('sine', 130, 35, .9, .7);
  [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((frequency, index) => this.tone('sawtooth', frequency, frequency, 2.5, .25, .1 + index * .06));
 }
};
function syncAccountBalance(balance) {
 const formatted = money(balance);
 const pageBalance = document.getElementById('balance');
 const headerBalance = document.getElementById('header-user-vnd');
 if (pageBalance) pageBalance.textContent = formatted;
 if (headerBalance) headerBalance.textContent = formatted;
}
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
 syncAccountBalance(jackpot.balance);
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
 SoundFX.init();
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
  syncAccountBalance(jackpot.balance);
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
 SoundFX.playKeyInsert();
 key.classList.add('key-flying'); chestParticles(6);
 await delay(450);
 key.classList.remove('key-flying'); key.classList.add('key-inserted');
 await delay(200);
 key.classList.add('key-turning'); SoundFX.playUnlock(); document.getElementById('unlockFlash').classList.add('flash-active');
 await delay(300);
 document.getElementById('unlockFlash').classList.remove('flash-active'); key.classList.add('key-fadeout');
 document.getElementById('chestContainer').classList.add('chest-opening');
 document.getElementById('chestLidLayer').classList.add('open-lid-anim');
 document.getElementById('chestCavity').classList.add('active-cavity');
 document.getElementById('chestInsideGlow').classList.add('active-glow');
 document.getElementById('chestGlow').classList.add('active'); SoundFX.playChestOpen(); chestParticles(24);
 await delay(1050);
}
async function animateReward(winner) {
 const modal = document.getElementById('caseOpeningModal'), rail = document.getElementById('rouletteRail');
 const status = document.getElementById('rouletteStatus');
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
 status.textContent = 'Đang mở phần thưởng…';
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
  const qty = document.createElement('div'); qty.className = 'card-tier-label'; qty.textContent = item.type === 'jackpot' ? (i === 35 && item !== winner ? 'CƠ HỘI ' + jackpotChanceText + '% · ' : '') + money(item.amount) + ' điểm' : '× ' + item.quantity;
  const bar = document.createElement('div'); bar.className = 'card-tier-bar'; card.append(icon, name, qty, bar); rail.append(card);
 }
 revealing = true; modal.classList.remove('hidden');
 const winningCard = rail.children[50];
 const itemStep = rail.children[1].offsetLeft - rail.children[0].offsetLeft;
 const centerMarker = modal.querySelector('.roulette-center-line');
 const markerRect = centerMarker.getBoundingClientRect();
 const markerCenterX = markerRect.left + markerRect.width / 2;
 const winningCardRect = winningCard.getBoundingClientRect();
 const targetX = winningCardRect.left + winningCardRect.width / 2 - markerCenterX;
 const viewportWidth = rail.parentElement.clientWidth;
 await new Promise(resolve => {
  let start, lastCardIndex = -1;
  function frame(now) {
   if (start === undefined) start = now;
   const progress = Math.min((now - start) / 5500, 1);
   const eased = 1 - Math.pow(1 - progress, 4.2), currentX = targetX * eased;
   rail.style.transform = 'translateX(' + -currentX + 'px)';
   const passingIndex = Math.floor((currentX + viewportWidth / 2) / itemStep);
   if (passingIndex !== lastCardIndex) { lastCardIndex = passingIndex; SoundFX.playCaseTick(1 - progress * .85); }
   if (progress < 1) requestAnimationFrame(frame); else resolve();
  }
  requestAnimationFrame(frame);
 });
 winningCard.classList.add('jackpot-winner');
 if (winner.type !== 'jackpot') SoundFX.playItemStop();
 status.textContent = winner.type === 'jackpot'
  ? 'JACKPOT! ' + winner.name + ' — +' + money(winner.amount) + ' điểm đã cộng vào tài khoản.'
  : 'Bạn nhận được ' + winner.name + ' × ' + winner.quantity + '. Vào game nhận thưởng vòng quay.';
 await delay(650);
 modal.classList.add('hidden');
 showRewardReveal(winner);
}
function showRewardReveal(winner) {
 const modal = document.getElementById('rewardRevealModal');
 const card = document.getElementById('rewardRevealCard');
 const icon = document.getElementById('rewardRevealIcon');
 const jackpotWin = winner.type === 'jackpot';
 const tier = jackpotWin ? 'diamond' : ['blue', 'purple', 'pink', 'gold'][winner.chest_id] || 'blue';
 const jackpotTier = ['mini', 'minor', 'major', 'grand'][winner.chest_id] || 'mini';
 card.className = 'reward-reveal-card reward-tier-' + tier + (jackpotWin ? ' jackpot-celebration-card jackpot-reveal-' + jackpotTier : '');
 modal.setAttribute('aria-labelledby', jackpotWin ? 'jackpotWinTitle' : 'rewardRevealName');
 document.querySelectorAll('.jackpot-only').forEach(element => element.classList.toggle('hidden', !jackpotWin));
 document.getElementById('rewardRevealHeading').classList.toggle('hidden', jackpotWin);
 document.getElementById('rewardRevealIcon').classList.toggle('hidden', jackpotWin);
 document.getElementById('rewardRevealName').classList.toggle('hidden', jackpotWin);
 document.getElementById('rewardRevealDescription').classList.toggle('hidden', jackpotWin);
 document.getElementById('rewardRevealOptions').classList.toggle('hidden', jackpotWin);
 const close = document.getElementById('closeReward');
 close.className = jackpotWin ? 'jackpot-claim-btn' : 'spin-action-btn';
 close.innerHTML = jackpotWin ? '<span class="btn-claim-shine" aria-hidden="true"></span><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ĐÃ CỘNG ĐIỂM · ĐÓNG' : 'ĐÃ NHẬN';
 document.getElementById('rewardRevealHeading').textContent = jackpotWin ? 'JACKPOT! CHÚC MỪNG BẠN' : 'MỞ RƯƠNG THÀNH CÔNG';
 document.getElementById('rewardRevealName').textContent = winner.name;
 document.getElementById('rewardRevealDescription').textContent = jackpotWin
  ? '+' + money(winner.amount) + ' điểm đã được cộng vào tài khoản.'
  : 'Số lượng: × ' + winner.quantity + ' · Quà đã gửi vào mục nhận thưởng vòng quay trong game.';
 icon.replaceChildren();
 if (jackpotWin) {
  const gem = document.createElement('i'); gem.className = 'fa-solid fa-gem'; gem.setAttribute('aria-hidden', 'true'); icon.append(gem);
 } else {
  const img = document.createElement('img'); img.src = '/api/icon/' + winner.icon_id + '.png'; img.alt = winner.name; icon.append(img);
 }
 const options = document.getElementById('rewardRevealOptions'); options.replaceChildren();
 if (!jackpotWin && Array.isArray(winner.options) && winner.options.length) {
  const label = document.createElement('span'); label.textContent = winner.options.map(option => 'Option ' + option.id + ': ' + option.param).join(' · '); options.append(label);
 }
 if (jackpotWin) {
  const badge = document.getElementById('jackpotWinBadge');
  const badgeStyle = {
   mini: ['MINI JACKPOT', 'linear-gradient(135deg,#00e5ff,#00b4db)', '#00e5ff'],
   minor: ['MINOR JACKPOT', 'linear-gradient(135deg,#a855f7,#6366f1)', '#a855f7'],
   major: ['MAJOR JACKPOT', 'linear-gradient(135deg,#ff5722,#f43f5e)', '#ff5722'],
   grand: ['GRAND JACKPOT', 'linear-gradient(135deg,#ffd700,#ff8800)', '#ffd700']
  }[jackpotTier];
  badge.textContent = badgeStyle[0]; badge.style.background = badgeStyle[1]; badge.style.boxShadow = '0 0 25px ' + badgeStyle[2];
  const title = document.getElementById('jackpotWinTitle');
  title.textContent = badgeStyle[0];
  title.className = 'jackpot-win-main-tier jackpot-title-' + jackpotTier;
  document.getElementById('jackpotWinRarityTag').textContent = 'TỈ LỆ ' + jackpotChanceText + '% / LƯỢT MỞ';
  document.getElementById('jackpotWinSubtitle').textContent = 'Bạn đã kích hoạt hũ Jackpot của rương ' + jackpot.ranks[winner.chest_id].name + '!';
  document.getElementById('jackpotRevealShockwave').classList.remove('active');
  void document.getElementById('jackpotRevealShockwave').offsetWidth;
  document.getElementById('jackpotRevealShockwave').classList.add('active');
  SoundFX.playGoldDropSound();
 }
 modal.classList.remove('hidden');
 launchRewardConfetti(jackpotWin ? 'jackpot' : tier);
 if (jackpotWin) animateJackpotAmount(winner.amount);
 close.focus();
}
let jackpotAmountFrame = null;
function animateJackpotAmount(targetAmount) {
 if (jackpotAmountFrame) cancelAnimationFrame(jackpotAmountFrame);
 const amount = document.getElementById('jackpotWinAmount'), start = performance.now(), duration = 1700;
 const step = now => {
  const progress = Math.min((now - start) / duration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  amount.textContent = '+' + money(Math.round(Number(targetAmount) * eased));
  if (progress < 1) jackpotAmountFrame = requestAnimationFrame(step);
  else { amount.textContent = '+' + money(targetAmount); jackpotAmountFrame = null; }
 };
 amount.textContent = '+0'; jackpotAmountFrame = requestAnimationFrame(step);
}
let rewardConfettiFrame = null;
function launchRewardConfetti(tier) {
 const canvas = document.getElementById('rewardConfetti'), ctx = canvas.getContext('2d');
 canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
 canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
 ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
 const width = window.innerWidth, height = window.innerHeight;
 const colors = tier === 'jackpot' ? ['#ffd700', '#ff9d00', '#fff6bd', '#ff5722', '#00e5ff'] : tier === 'diamond' ? ['#baf7ff', '#3ddcff', '#fff', '#8a75ff'] :
  tier === 'gold' ? ['#ffe36e', '#ffad32', '#fff', '#ffef9c'] :
  tier === 'pink' ? ['#ff75e1', '#d32ce6', '#fff', '#ff9fcf'] :
  tier === 'purple' ? ['#c39cff', '#8847ff', '#fff', '#ef9cff'] : ['#73d9ff', '#4b69ff', '#fff', '#b4ecff'];
 const particles = Array.from({ length: tier === 'jackpot' ? 190 : tier === 'diamond' || tier === 'gold' ? 110 : 70 }, () => ({
  x: width / 2 + (Math.random() - .5) * 240, y: height * .46 + (Math.random() - .5) * 100,
  vx: (Math.random() - .5) * 9, vy: -Math.random() * 10 - 2,
  size: Math.random() * 7 + 3, rotation: Math.random() * 6.28,
  spin: (Math.random() - .5) * .22, color: colors[Math.floor(Math.random() * colors.length)], life: 1
 }));
 if (rewardConfettiFrame) cancelAnimationFrame(rewardConfettiFrame);
 const started = performance.now();
 function frame(now) {
  ctx.clearRect(0, 0, width, height);
  const elapsed = now - started;
  for (const p of particles) {
   p.x += p.vx; p.y += p.vy; p.vy += .16; p.rotation += p.spin; p.life -= .006;
   ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
   ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .7); ctx.restore();
  }
  if (elapsed < 5200 && particles.some(p => p.life > 0)) rewardConfettiFrame = requestAnimationFrame(frame);
  else { ctx.clearRect(0, 0, width, height); rewardConfettiFrame = null; }
 }
 rewardConfettiFrame = requestAnimationFrame(frame);
}
function closeRewardReveal() {
 if (busy) return;
 document.getElementById('caseOpeningModal').classList.add('hidden');
 document.getElementById('rewardRevealModal').classList.add('hidden');
 if (rewardConfettiFrame) cancelAnimationFrame(rewardConfettiFrame);
 if (jackpotAmountFrame) cancelAnimationFrame(jackpotAmountFrame);
 const ctx = document.getElementById('rewardConfetti').getContext('2d'); ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
 revealing = false; renderChest(); document.getElementById('openChest').focus();
}
document.addEventListener('keydown', event => {
 if (event.key === 'Escape') closeRewardReveal();
 if (event.key === 'Tab' && !document.getElementById('rewardRevealModal').classList.contains('hidden')) {
  event.preventDefault(); document.getElementById('closeReward').focus();
 }
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
