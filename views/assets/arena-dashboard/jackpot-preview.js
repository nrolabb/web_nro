// Visual preview: effects and simulated rewards from Web Arena Than Rong/main.html.
// No requests to the live spin or payment API.
let userGems = 2000000;

let chestIndex = 0;

const chests = [
            { 
                name: 'RƯƠNG ĐỒNG', 
                price1: 50, 
                reqTier: 'bronze', 
                reqTierLevel: 0, 
                reqTierName: 'BRONZE (Đồng)', 
                color: '#cd7f32',
                keyClass: 'golden-key-icon key-bronze'
            },
            { 
                name: 'RƯƠNG BẠC', 
                price1: 100, 
                reqTier: 'silver', 
                reqTierLevel: 1, 
                reqTierName: 'SILVER (Bạc)', 
                color: '#f1f2f6',
                keyClass: 'golden-key-icon key-silver'
            },
            { 
                name: 'RƯƠNG VÀNG', 
                price1: 300, 
                reqTier: 'gold', 
                reqTierLevel: 2, 
                reqTierName: 'GOLD (Vàng)', 
                color: '#ffd700',
                keyClass: 'golden-key-icon key-gold'
            },
            { 
                name: 'RƯƠNG KIM CƯƠNG', 
                price1: 500, 
                reqTier: 'diamond', 
                reqTierLevel: 3, 
                reqTierName: 'DIAMOND (Kim Cương)', 
                color: '#00f2fe',
                keyClass: 'golden-key-icon key-diamond'
            }
        ];

function getUserAchievementInfo() {
            const vip = getVipTier(userTotalAccumulatedPoints);
            const tierMap = { 'bronze': 0, 'silver': 1, 'gold': 2, 'diamond': 3 };
            return {
                tier: vip.tier,
                level: tierMap[vip.tier] !== undefined ? tierMap[vip.tier] : 0,
                name: vip.name,
                color: vip.color
            };
        }

function isChestUnlocked(chest) {
            const user = getUserAchievementInfo();
            return user.level >= chest.reqTierLevel;
        }

function changeChest(direction = 0) {
            chestIndex += direction;
            if (chestIndex < 0) chestIndex = chests.length - 1;
            if (chestIndex >= chests.length) chestIndex = 0;

            const chest = chests[chestIndex];
            const userTier = getUserAchievementInfo();
            const unlocked = isChestUnlocked(chest);
            
            // Update Text content & colors
            const nameEl = document.getElementById('chestName');
            if (nameEl) {
                nameEl.innerText = chest.name;
                nameEl.style.color = chest.color;
                nameEl.style.textShadow = `0 0 15px ${chest.color}`;
            }

            const priceEl = document.getElementById('price1');
            if (priceEl) priceEl.innerText = chest.price1.toLocaleString('vi-VN');

            // Update Requirement Tag
            const reqTag = document.getElementById('chestReqTierTag');
            const reqName = document.getElementById('chestReqTierName');
            if (reqTag) {
                if (unlocked) {
                    reqTag.className = 'chest-req-tier-tag req-unlocked';
                    reqTag.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Mở khóa với Thành Tựu ${chest.reqTierName}</span>`;
                } else {
                    reqTag.className = 'chest-req-tier-tag req-locked';
                    reqTag.innerHTML = `<i class="fa-solid fa-lock"></i> <span>Yêu cầu: ${chest.reqTierName} (Hiện có: ${userTier.name})</span>`;
                }
            }

            // Update Tip & Button
            const tipEl = document.getElementById('openChestTip');
            const spinBtn = document.getElementById('singleSpinBtn');
            const lockOverlay = document.getElementById('chestLockOverlay');
            const lockText = document.getElementById('chestLockText');
            const diamondGems = document.getElementById('diamondChestGems');

            if (unlocked) {
                if (tipEl) {
                    tipEl.className = 'open-chest-tip animate-pulse';
                    tipEl.innerHTML = '✨ NHẤP ĐỂ MỞ RƯƠNG ✨';
                }
                if (spinBtn) {
                    spinBtn.className = 'spin-action-btn single-spin-btn';
                    spinBtn.innerHTML = `💎 MỞ RƯƠNG: <span id="price1">${chest.price1.toLocaleString('vi-VN')}</span> Ngọc`;
                }
                if (lockOverlay) lockOverlay.classList.add('hidden');
            } else {
                if (tipEl) {
                    tipEl.className = 'open-chest-tip chest-locked-tip animate-pulse';
                    tipEl.innerHTML = `🔒 CẦN ĐẠT THÀNH TỰU ${chest.reqTierName.toUpperCase()} 🔒`;
                }
                if (spinBtn) {
                    spinBtn.className = 'spin-action-btn single-spin-btn btn-locked';
                    spinBtn.innerHTML = `<i class="fa-solid fa-lock"></i> KHÓA (Cần Thành Tựu ${chest.reqTierName})`;
                }
                if (lockOverlay) {
                    lockOverlay.classList.remove('hidden');
                    if (lockText) lockText.innerText = `CẦN THÀNH TỰU ${chest.reqTierName.toUpperCase()}`;
                }
            }

            // Toggle Diamond embedded gems overlay
            if (diamondGems) {
                if (chest.name === 'RƯƠNG KIM CƯƠNG') {
                    diamondGems.classList.remove('hidden');
                } else {
                    diamondGems.classList.add('hidden');
                }
            }

            // Update Key icon class
            const keyIcon = document.getElementById('chestKeyIcon');
            if (keyIcon) {
                keyIcon.className = 'fa-solid fa-key ' + chest.keyClass;
            }
            
            // Apply CSS color filters to dynamically recolor all chest image layers (Base & Lid)
            const chestImgs = document.querySelectorAll('.gold-chest-image');
            chestImgs.forEach(img => {
                if (chest.name === 'RƯƠNG ĐỒNG') {
                    img.style.filter = 'url(#removeBlackBg) sepia(0.85) hue-rotate(-26deg) saturate(1.8) brightness(0.78)';
                } else if (chest.name === 'RƯƠNG BẠC') {
                    img.style.filter = 'url(#removeBlackBg) grayscale(1) brightness(1.22) contrast(1.15)';
                } else if (chest.name === 'RƯƠNG VÀNG') {
                    img.style.filter = 'url(#removeBlackBg) saturate(1.15) brightness(1.05)';
                } else if (chest.name === 'RƯƠNG KIM CƯƠNG') {
                    img.style.filter = 'url(#removeBlackBg) hue-rotate(155deg) saturate(1.4) brightness(1.12) contrast(1.05)';
                }
            });
        }

const CSGO_ITEMS = [
            // 🟡 SPECIAL RARE / GOLD (★)
            { id: 'gold_diamond_shenron', name: '★ Thần Thú Vô Cực Shenron (Diamond Edition)', tier: 'gold', label: 'SIÊU PHẨM ★★★', icon: 'fa-gem', color: '#00f2fe' },
            { id: 'gold_diamond_blade', name: '★ Kiếm Thần Sáng Thế Zeno Kim Cương (Doppler)', tier: 'gold', label: 'SIÊU PHẨM ★★★', icon: 'fa-khanda', color: '#00f2fe' },
            { id: 'gold_shenron', name: '★ Thần Thú Vô Cực Shenron (Gold Gem)', tier: 'gold', label: 'CỰC PHẨM ★', icon: 'fa-dragon', color: '#ffd700' },
            { id: 'gold_gloves', name: '★ Găng Tay Hủy Diệt Beerus (StatTrak™)', tier: 'gold', label: 'CỰC PHẨM ★', icon: 'fa-hand-fist', color: '#ffd700' },
            { id: 'gold_dagger', name: '★ Dao Găm Siêu Saiyan Rose (Doppler P2)', tier: 'gold', label: 'CỰC PHẨM ★', icon: 'fa-burst', color: '#ffd700' },

            // 🔴 COVERT (Red)
            { id: 'red_diamond_armor', name: 'Giáp Hủy Diệt Beerus Kim Cương Tối Thượng', tier: 'red', label: 'TỐI THƯỢNG', icon: 'fa-shield-halved', color: '#00f2fe' },
            { id: 'red_goku', name: 'Cải Trang Goku Bản Năng Vô Cực', tier: 'red', label: 'TỐI THƯỢNG', icon: 'fa-bolt', color: '#eb4b4b' },
            { id: 'red_armor', name: 'Giáp Ngọc Rồng Siêu Cấp X-10', tier: 'red', label: 'TỐI THƯỢNG', icon: 'fa-shield-halved', color: '#eb4b4b' },
            { id: 'red_staff', name: 'Trượng Thiên Sứ Whis Tối Thượng', tier: 'red', label: 'TỐI THƯỢNG', icon: 'fa-wand-magic-sparkles', color: '#eb4b4b' },

            // 💖 CLASSIFIED (Pink)
            { id: 'pink_sword', name: 'Kiếm Z-Sword Cổ Đại Thần Vũ', tier: 'pink', label: 'TUYỆT PHẨM', icon: 'fa-khanda', color: '#d32ce6' },
            { id: 'pink_gloves', name: 'Găng Tay Ma Thuật Bulma V2', tier: 'pink', label: 'TUYỆT PHẨM', icon: 'fa-mitten', color: '#d32ce6' },
            { id: 'pink_radar', name: 'Rada Dò Ngọc Cấp 7 Tinh Anh', tier: 'pink', label: 'TUYỆT PHẨM', icon: 'fa-satellite-dish', color: '#d32ce6' },

            // 🟣 RESTRICTED (Purple)
            { id: 'purple_stone', name: 'Đá Nâng Cấp Tinh Tú (x5)', tier: 'purple', label: 'QUÝ HIẾM', icon: 'fa-gem', color: '#8847ff' },
            { id: 'purple_bean', name: 'Đậu Thần Thượng Đế (x50)', tier: 'purple', label: 'QUÝ HIẾM', icon: 'fa-seedling', color: '#8847ff' },
            { id: 'purple_card', name: 'Thẻ Nhân Đôi EXP (7 Ngày)', tier: 'purple', label: 'QUÝ HIẾM', icon: 'fa-id-card', color: '#8847ff' },

            // 🔵 MIL-SPEC (Blue)
            { id: 'blue_talisman', name: 'Bùa Da Trâu Siêu Bền (x10)', tier: 'blue', label: 'PHỔ THÔNG', icon: 'fa-scroll', color: '#4b69ff' },
            { id: 'blue_potion', name: 'Thuốc Tăng Lực Siêu Cấp (x5)', tier: 'blue', label: 'PHỔ THÔNG', icon: 'fa-flask-vial', color: '#4b69ff' },
            { id: 'blue_gold', name: '500.000 Vàng Võ Đài', tier: 'blue', label: 'PHỔ THÔNG', icon: 'fa-coins', color: '#4b69ff' },
            { id: 'blue_water', name: 'Nước Thánh Korin Thần Kỳ', tier: 'blue', label: 'PHỔ THÔNG', icon: 'fa-bottle-droplet', color: '#4b69ff' }
        ];

const FLOAT_CONDITIONS = [
            { name: 'Factory New', min: 0.001, max: 0.07 },
            { name: 'Minimal Wear', min: 0.07, max: 0.15 },
            { name: 'Field-Tested', min: 0.15, max: 0.38 },
            { name: 'Well-Worn', min: 0.38, max: 0.45 },
            { name: 'Battle-Scarred', min: 0.45, max: 0.99 }
        ];

const SoundFX = {
            ctx: null,
            init() {
                if (!this.ctx) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (AudioCtx) this.ctx = new AudioCtx();
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            },
            // Key insert
            playKeyInsert() {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1400, now);
                osc.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            },
            // Mechanical lock snap "CẠCH!"
            playUnlock() {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                
                const osc1 = this.ctx.createOscillator();
                const gain1 = this.ctx.createGain();
                osc1.type = 'triangle';
                osc1.frequency.setValueAtTime(900, now);
                osc1.frequency.exponentialRampToValueAtTime(220, now + 0.08);
                gain1.gain.setValueAtTime(0.5, now);
                gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc1.connect(gain1);
                gain1.connect(this.ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.1);

                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'sawtooth';
                osc2.frequency.setValueAtTime(1500, now + 0.05);
                osc2.frequency.exponentialRampToValueAtTime(320, now + 0.25);
                gain2.gain.setValueAtTime(0.5, now + 0.05);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                osc2.connect(gain2);
                gain2.connect(this.ctx.destination);
                osc2.start(now + 0.05);
                osc2.stop(now + 0.28);
            },
            // Chest lid popping open
            playChestOpen() {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(180, now + 0.4);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
            },
            // Iconic CS:GO Roulette Case Tick "Tạch Tạch Tạch"
            playCaseTick(rate = 1.0) {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'triangle';
                const baseFreq = 850 + (rate * 300);
                osc.frequency.setValueAtTime(baseFreq, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.035);
                
                gain.gain.setValueAtTime(0.38, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.04);
            },
            // Stop sound for Common items (Blue / Purple)
            playItemStopCommon() {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            },
            // Resounding CS:GO GOLD DROP "KENGGG!" & Divine Fanfare
            playGoldDropSound() {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;

                // 1. Massive Resonant Golden Bell Impact ("KENGGGG!")
                [1046.50, 1318.51, 1567.98, 2093.00, 3135.96].forEach((f, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, now);
                    gain.gain.setValueAtTime(0.35 / (i + 1), now);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 2.8);
                });

                // 2. Sub-bass earthquake impact
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(130, now);
                subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.8);
                subGain.gain.setValueAtTime(0.7, now);
                subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                subOsc.start(now);
                subOsc.stop(now + 0.9);

                // 3. Triumphant Brass Symphony Chord
                const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
                chords.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + 0.1 + idx * 0.06);
                    gain.gain.setValueAtTime(0.25, now + 0.1 + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + 0.1 + idx * 0.06);
                    osc.stop(now + 2.6);
                });
            },
            // Dramatic Red drop sound
            playRedDropSound() {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                
                // Dramatic Horns
                [440.00, 554.37, 659.25, 880.00].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                    gain.gain.setValueAtTime(0.3, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.6);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + 1.7);
                });
            },
            // Magical Crystal Bells Fanfare for Pink / Purple items
            playEpicDropSound() {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                
                [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                    gain.gain.setValueAtTime(0.3, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 1.2);
                });
            }
        };

let isOpeningChest = false;

function rollSingleItem() {
            const currentChest = chests[chestIndex] ? chests[chestIndex].name : 'RƯƠNG ĐỒNG';
            const roll = Math.random() * 100;
            let targetTier = 'blue';

            if (currentChest === 'RƯƠNG ĐỒNG') {
                // Rương Đồng (10.000 Ngọc): Cơ bản
                if (roll < 0.8) {
                    targetTier = 'gold';    // 0.8% Gold ★
                } else if (roll < 5.0) {
                    targetTier = 'red';     // 4.2% Red
                } else if (roll < 20.0) {
                    targetTier = 'pink';    // 15% Pink
                } else if (roll < 55.0) {
                    targetTier = 'purple';  // 35% Purple
                } else {
                    targetTier = 'blue';    // 45% Blue
                }
            } else if (currentChest === 'RƯƠNG BẠC') {
                // Rương Bạc (20.000 Ngọc): Cân bằng & Tăng phẩm cấp
                if (roll < 2.5) {
                    targetTier = 'gold';    // 2.5% Gold ★
                } else if (roll < 12.0) {
                    targetTier = 'red';     // 9.5% Red
                } else if (roll < 35.0) {
                    targetTier = 'pink';    // 23% Pink
                } else if (roll < 70.0) {
                    targetTier = 'purple';  // 35% Purple
                } else {
                    targetTier = 'blue';    // 30% Blue
                }
            } else if (currentChest === 'RƯƠNG VÀNG') {
                // RƯƠNG VÀNG (50.000 Ngọc): Tỉ lệ nổ Tối Thượng & Cực Phẩm (Gold ★) cao!
                if (roll < 6.0) {
                    targetTier = 'gold';    // 6% Gold ★
                } else if (roll < 24.0) {
                    targetTier = 'red';     // 18% Red
                } else if (roll < 56.0) {
                    targetTier = 'pink';    // 32% Pink
                } else if (roll < 84.0) {
                    targetTier = 'purple';  // 28% Purple
                } else {
                    targetTier = 'blue';    // 16% Blue
                }
            } else {
                // RƯƠNG KIM CƯƠNG (100.000 Ngọc): Tỉ lệ nổ Siêu Phẩm Kim Cương ★★★ Đỉnh Cao!
                if (roll < 12.0) {
                    targetTier = 'gold';    // 12% Siêu Phẩm Kim Cương ★★★
                } else if (roll < 35.0) {
                    targetTier = 'red';     // 23% Tối Thượng Red
                } else if (roll < 70.0) {
                    targetTier = 'pink';    // 35% Tuyệt Phẩm Pink
                } else if (roll < 92.0) {
                    targetTier = 'purple';  // 22% Quý Hiếm Purple
                } else {
                    targetTier = 'blue';    // 8% Blue
                }
            }

            const pool = CSGO_ITEMS.filter(item => item.tier === targetTier);
            const chosen = pool[Math.floor(Math.random() * pool.length)];

            // Generate CS:GO Float Value & Wear
            const floatCondition = FLOAT_CONDITIONS[Math.floor(Math.random() * FLOAT_CONDITIONS.length)];
            const rawFloat = (floatCondition.min + Math.random() * (floatCondition.max - floatCondition.min)).toFixed(8);
            const patternSeed = Math.floor(1 + Math.random() * 999);

            return {
                ...chosen,
                floatVal: rawFloat,
                wear: floatCondition.name,
                pattern: `#${patternSeed}`
            };
        }

function openChestLockAlertModal(chest, userTier) {
            const nameEl = document.getElementById('lockAlertChestName');
            const reqTierEl = document.getElementById('lockAlertReqTier');
            const userTierEl = document.getElementById('lockAlertUserTier');

            if (nameEl) {
                nameEl.innerText = chest.name;
                nameEl.style.color = chest.color;
                nameEl.style.textShadow = `0 0 15px ${chest.color}`;
            }
            if (reqTierEl) {
                reqTierEl.innerText = chest.reqTierName;
                reqTierEl.style.color = chest.color;
            }
            if (userTierEl) {
                userTierEl.innerText = userTier.name;
                userTierEl.style.color = userTier.color;
            }

            const modal = document.getElementById('chestLockAlertModal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.classList.add('modal-open');
            }
        }

function closeChestLockAlertModal() {
            const modal = document.getElementById('chestLockAlertModal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
        }

function spinChest(count) {
            if (isOpeningChest) return;

            const chest = chests[chestIndex];
            const price = chest.price1;

            // Check Achievement Unlock Requirement
            if (!isChestUnlocked(chest)) {
                const userTier = getUserAchievementInfo();
                openChestLockAlertModal(chest, userTier);
                return;
            }

            if (userGems < price) {
                alert('Bạn không đủ Ngọc để mở rương này! Vui lòng Donet nạp thẻ để mở thêm.');
                return;
            }

            // Deduct Gems
            userGems -= price;
            document.getElementById('userGemsText').innerText = userGems.toLocaleString('vi-VN');
            isOpeningChest = true;

            // ==========================================================================
            // JACKPOT ACCUMULATION ENGINE:
            // Mỗi 100 Ngọc mở rương phân bổ:
            // MINI: +100 Điểm | MINOR: +200 Điểm | MAJOR: +300 Điểm | GRAND: +400 Điểm
            // ==========================================================================
            const addMini = Math.round(price * 1.0);   // +100 Điểm / 100 Ngọc
            const addMinor = Math.round(price * 2.0);  // +200 Điểm / 100 Ngọc
            const addMajor = Math.round(price * 3.0);  // +300 Điểm / 100 Ngọc
            const addGrand = Math.round(price * 4.0);  // +400 Điểm / 100 Ngọc

            jackpotPools.mini += addMini;
            jackpotPools.minor += addMinor;
            jackpotPools.major += addMajor;
            jackpotPools.grand += addGrand;

            // Hiển thị tăng dần từng điểm một và hiệu ứng floating points
            updateJackpotUI(true, {
                mini: addMini,
                minor: addMinor,
                major: addMajor,
                grand: addGrand
            });

            // Check Jackpot roll chance (Áp dụng cho TẤT CẢ các loại rương trên toàn server)
            triggeredJackpotOnSpin = rollJackpotForChest(chest);

            const container = document.getElementById('chestContainer');
            const keyEl = document.getElementById('chestKey');
            const flashEl = document.getElementById('unlockFlash');
            const glowEl = document.getElementById('chestGlow');
            const lidEl = document.getElementById('chestLidLayer');
            const cavityEl = document.getElementById('chestCavity');
            const insideGlowEl = document.getElementById('chestInsideGlow');
            const particlesEl = document.getElementById('chestParticles');

            // Reset classes
            keyEl.className = 'chest-key-anim';
            container.className = 'chest-container';
            glowEl.className = 'chest-glow-burst';
            if (lidEl) lidEl.classList.remove('open-lid-anim');
            if (cavityEl) cavityEl.classList.remove('active-cavity');
            if (insideGlowEl) insideGlowEl.classList.remove('active-glow');

            // STEP 1 (0ms): Golden Key flies into lock
            SoundFX.playKeyInsert();
            keyEl.classList.add('key-flying');
            createParticles(particlesEl, 6);

            // STEP 2 (450ms): Key inserts & turns 90deg with "CẠCH!"
            setTimeout(() => {
                keyEl.classList.remove('key-flying');
                keyEl.classList.add('key-inserted');
                
                setTimeout(() => {
                    keyEl.classList.add('key-turning');
                    SoundFX.playUnlock();

                    flashEl.classList.add('flash-active');
                    setTimeout(() => flashEl.classList.remove('flash-active'), 300);
                }, 200);
            }, 450);

            // STEP 3 (950ms): Chest Lid seamlessly hinges open backward, revealing glowing interior!
            setTimeout(() => {
                keyEl.classList.add('key-fadeout');
                container.classList.add('chest-opening');
                if (lidEl) lidEl.classList.add('open-lid-anim');
                if (cavityEl) cavityEl.classList.add('active-cavity');
                if (insideGlowEl) insideGlowEl.classList.add('active-glow');
                glowEl.classList.add('active');
                SoundFX.playChestOpen();
                createParticles(particlesEl, 20);

                // STEP 4 (2000ms): Transition to CS:GO Horizontal Roulette Conveyor Belt!
                setTimeout(() => {
                    launchCSGORoulette();
                }, 1050);
            }, 950);
        }

function launchCSGORoulette() {
            const modal = document.getElementById('caseOpeningModal');
            const rail = document.getElementById('rouletteRail');
            const chest = chests[chestIndex];

            document.getElementById('rouletteChestTitle').innerText = chest.name;

            // Generate 65 items for the roulette strip
            const TOTAL_ITEMS = 65;
            const WIN_INDEX = 50; // The winning item lands at index 50
            const winningItem = rollSingleItem();

            rail.innerHTML = '';
            rail.style.transition = 'none';
            rail.style.transform = 'translateX(0px)';

            const cardWidth = 135; // Widescreen card width
            const cardGap = 14;    // Gap between cards
            const itemStep = cardWidth + cardGap; // 149px per step

            const generatedItems = [];

            for (let i = 0; i < TOTAL_ITEMS; i++) {
                let item;
                if (i === WIN_INDEX) {
                    item = winningItem;
                } else if (i === WIN_INDEX - 1 || i === WIN_INDEX + 1) {
                    // Suspense teaser: 40% chance of baiting a Gold/Red right next to target!
                    if (Math.random() < 0.4) {
                        const baitPool = CSGO_ITEMS.filter(it => it.tier === 'gold' || it.tier === 'red');
                        item = baitPool[Math.floor(Math.random() * baitPool.length)];
                    } else {
                        item = CSGO_ITEMS[Math.floor(Math.random() * CSGO_ITEMS.length)];
                    }
                } else {
                    item = CSGO_ITEMS[Math.floor(Math.random() * CSGO_ITEMS.length)];
                }
                generatedItems.push(item);

                const card = document.createElement('div');
                card.className = `roulette-card tier-${item.tier}`;
                card.innerHTML = `
                    <div class="card-tier-bar"></div>
                    <div class="card-icon"><i class="fa-solid ${item.icon}"></i></div>
                    <div class="card-info">
                        <div class="card-name">${item.name}</div>
                        <div class="card-tier-label">${item.label}</div>
                    </div>
                `;
                rail.appendChild(card);
            }

            // Open roulette modal
            modal.classList.remove('hidden');

            // Force reflow
            void rail.offsetWidth;

            // Calculate exact landing position
            const viewportWidth = rail.parentElement.clientWidth || 650;
            const centerTarget = viewportWidth / 2;
            
            // Random offset within the winning card (-25px to +25px around card center)
            const randomOffsetInsideCard = (Math.random() - 0.5) * 50;
            const targetX = (WIN_INDEX * itemStep) + (cardWidth / 2) + randomOffsetInsideCard - centerTarget;

            // Spin animation duration: 5.5 seconds
            const duration = 5500;
            const startTime = performance.now();
            let lastCardIndex = 0;

            // Custom CS:GO cubic-bezier deceleration curve simulation
            function easeOutCubicBezier(t) {
                // Approximate CS:GO spin deceleration curve (starts blazing fast, smoothly glides to halt)
                return 1 - Math.pow(1 - t, 4.2);
            }

            function animateRoulette(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);
                const eased = easeOutCubicBezier(progress);

                const currentX = targetX * eased;
                rail.style.transform = `translateX(-${currentX}px)`;

                // Track card index passing under the center line to trigger ticks
                const currentPassingIndex = Math.floor((currentX + centerTarget) / itemStep);
                if (currentPassingIndex !== lastCardIndex) {
                    lastCardIndex = currentPassingIndex;
                    const speedRatio = 1.0 - (progress * 0.85); // Pitch lowers as it slows
                    SoundFX.playCaseTick(speedRatio);
                }

                if (progress < 1.0) {
                    requestAnimationFrame(animateRoulette);
                } else {
                    // STOPPED ON WINNING ITEM!
                    onRouletteFinished(winningItem);
                }
            }

            // Start animation frame loop
            setTimeout(() => {
                requestAnimationFrame(animateRoulette);
            }, 100);
        }

function onRouletteFinished(item) {
            const modal = document.getElementById('caseOpeningModal');
            
            // Dramatic pause of 600ms to let player look at the stopped card
            setTimeout(() => {
                // Hide roulette modal
                modal.classList.add('hidden');

                // Launch CS:GO 3D Inspect Screen Reveal!
                openInspectModal(item);

                // Reset chest state in background
                const container = document.getElementById('chestContainer');
                const glowEl = document.getElementById('chestGlow');
                const keyEl = document.getElementById('chestKey');
                const lidEl = document.getElementById('chestLidLayer');
                const cavityEl = document.getElementById('chestCavity');
                const insideGlowEl = document.getElementById('chestInsideGlow');
                const particlesEl = document.getElementById('chestParticles');

                container.classList.remove('chest-opening');
                if (lidEl) lidEl.classList.remove('open-lid-anim');
                if (cavityEl) cavityEl.classList.remove('active-cavity');
                if (insideGlowEl) insideGlowEl.classList.remove('active-glow');
                glowEl.classList.remove('active');
                keyEl.className = 'chest-key-anim';
                particlesEl.innerHTML = '';
                isOpeningChest = false;
            }, 750);
        }

let confettiAnimationId = null;

function launchRareConfetti(tier) {
            const canvas = document.getElementById('rareConfettiCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const particles = [];
            const particleCount = tier === 'gold' ? 120 : (tier === 'red' ? 90 : 60);

            let palette = ['#ffd700', '#ffa500', '#ffffff', '#ffeb3b'];
            if (tier === 'red') palette = ['#ff3838', '#ff6b81', '#ffffff', '#ff4757', '#ffd700'];
            if (tier === 'pink') palette = ['#d32ce6', '#ff70a6', '#ffffff', '#e056fd'];
            if (tier === 'purple') palette = ['#8847ff', '#b388ff', '#ffffff', '#c56cf0'];

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                    y: canvas.height / 2 + (Math.random() - 0.5) * 100,
                    vx: (Math.random() - 0.5) * 18,
                    vy: (Math.random() - 1.2) * 16 - 2,
                    size: Math.random() * 8 + 4,
                    color: palette[Math.floor(Math.random() * palette.length)],
                    rotation: Math.random() * 360,
                    rotationSpeed: (Math.random() - 0.5) * 12,
                    opacity: 1,
                    decay: Math.random() * 0.008 + 0.005,
                    shape: Math.random() > 0.4 ? 'rect' : 'circle'
                });
            }

            if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);

            function render() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let alive = 0;

                particles.forEach(p => {
                    if (p.opacity > 0) {
                        alive++;
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.35; // Gravity
                        p.vx *= 0.98;
                        p.rotation += p.rotationSpeed;
                        p.opacity -= p.decay;

                        ctx.save();
                        ctx.globalAlpha = Math.max(0, p.opacity);
                        ctx.translate(p.x, p.y);
                        ctx.rotate((p.rotation * Math.PI) / 180);
                        ctx.fillStyle = p.color;

                        if (p.shape === 'rect') {
                            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                        } else {
                            ctx.beginPath();
                            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.restore();
                    }
                });

                if (alive > 0) {
                    confettiAnimationId = requestAnimationFrame(render);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }

            render();
        }

function createInspectEmbers(tier) {
            const container = document.getElementById('inspectEmberParticles');
            if (!container) return;
            container.innerHTML = '';
            const count = 18;
            for (let i = 0; i < count; i++) {
                const ember = document.createElement('div');
                ember.className = `inspect-ember ember-${tier}`;
                const leftPos = Math.random() * 100;
                const delay = Math.random() * 2.2;
                const size = 3 + Math.random() * 6;
                ember.style.left = `${leftPos}%`;
                ember.style.bottom = `${Math.random() * 25}%`;
                ember.style.width = `${size}px`;
                ember.style.height = `${size}px`;
                ember.style.animationDelay = `${delay}s`;
                container.appendChild(ember);
            }
        }

function createInspectSparkles(tier) {
            const container = document.getElementById('inspectSparkleStars');
            if (!container) return;
            container.innerHTML = '';
            
            // Only add sparkling star glints for Purple, Pink, Red, Gold
            if (tier === 'blue') return;

            const count = tier === 'gold' ? 14 : (tier === 'red' ? 12 : 9);
            for (let i = 0; i < count; i++) {
                const star = document.createElement('div');
                star.className = `sparkle-star star-tier-${tier}`;
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 80;
                const delay = Math.random() * 2.5;
                const duration = 1.2 + Math.random() * 1.5;
                const scale = 0.6 + Math.random() * 0.9;
                
                star.style.left = `${x}%`;
                star.style.top = `${y}%`;
                star.style.animationDelay = `${delay}s`;
                star.style.animationDuration = `${duration}s`;
                star.style.transform = `scale(${scale})`;
                container.appendChild(star);
            }
        }

function openInspectModal(item) {
            const inspectModal = document.getElementById('inspectItemModal');
            const flashBg = document.getElementById('inspectFlashBg');
            const shockwave = document.getElementById('inspectShockwave');
            const inspectCard = document.getElementById('inspectCard');

            // Populate Item Details
            document.getElementById('inspectItemName').innerText = item.name;
            document.getElementById('inspectTierBadge').innerText = `ĐỘ HIẾM: ${item.label}`;
            document.getElementById('inspectWear').innerText = item.wear;
            document.getElementById('inspectFloat').innerText = item.floatVal;
            document.getElementById('inspectPattern').innerText = item.pattern;

            const iconEl = document.getElementById('inspectItemIcon');
            iconEl.className = `fa-solid ${item.icon}`;

            // Reset classes
            inspectCard.className = `inspect-card inspect-tier-${item.tier}`;
            flashBg.className = 'inspect-flash-bg';
            if (shockwave) {
                shockwave.className = 'inspect-shockwave';
                void shockwave.offsetWidth;
                shockwave.classList.add('shockwave-active');
            }

            // Spawn floating ember particles & twinkling star glints around weapon
            createInspectEmbers(item.tier);
            createInspectSparkles(item.tier);

            // Trigger Tier Specific Sound & Visual Effects
            if (item.tier === 'gold') {
                document.getElementById('inspectRarityHeader').innerText = '★ VẬT PHẨM CỰC PHẨM SIÊU HIẾM (GOLD GEM) ★';
                flashBg.classList.add('gold-flash');
                SoundFX.playGoldDropSound();
                launchRareConfetti('gold');
            } else if (item.tier === 'red') {
                document.getElementById('inspectRarityHeader').innerText = '🔥 VẬT PHẨM TỐI THƯỢNG (COVERT) 🔥';
                flashBg.classList.add('red-flash');
                SoundFX.playRedDropSound();
                launchRareConfetti('red');
            } else if (item.tier === 'pink') {
                document.getElementById('inspectRarityHeader').innerText = '💖 VẬT PHẨM TUYỆT PHẨM (CLASSIFIED) 💖';
                flashBg.classList.add('pink-flash');
                SoundFX.playEpicDropSound();
                launchRareConfetti('pink');
            } else if (item.tier === 'purple') {
                document.getElementById('inspectRarityHeader').innerText = '🟣 VẬT PHẨM QUÝ HIẾM (RESTRICTED) 🟣';
                flashBg.classList.add('purple-flash');
                SoundFX.playEpicDropSound();
                launchRareConfetti('purple');
            } else {
                document.getElementById('inspectRarityHeader').innerText = `PHẦN THƯỞNG: ${item.label}`;
                SoundFX.playItemStopCommon();
            }

            inspectModal.classList.remove('hidden');
        }

let triggeredJackpotOnSpin = null;

function closeInspectModal() {
            document.getElementById('inspectItemModal').classList.add('hidden');
            if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);

            if (triggeredJackpotOnSpin) {
                const hit = triggeredJackpotOnSpin;
                triggeredJackpotOnSpin = null;
                setTimeout(() => {
                    triggerJackpotWin(hit);
                }, 400);
            }
        }

function reopenChest() {
            closeInspectModal();
            setTimeout(() => {
                spinChest(1);
            }, 300);
        }

function createParticles(parent, num) {
            parent.innerHTML = '';
            for (let i = 0; i < num; i++) {
                const p = document.createElement('div');
                p.className = 'sparkle-particle';
                const angle = (Math.PI * 2 * i) / num;
                const dist = 30 + Math.random() * 40;
                const tx = Math.cos(angle) * dist;
                const ty = Math.sin(angle) * dist;
                p.style.setProperty('--tx', `${tx}px`);
                p.style.setProperty('--ty', `${ty}px`);
                p.style.animationDelay = `${Math.random() * 0.15}s`;
                parent.appendChild(p);
            }
        }

let userTotalAccumulatedPoints = 1000000;

let userDonnetPoints = 1000000;

function getVipTier(points) {
            const pts = typeof points === 'number' ? points : (userTotalAccumulatedPoints || 0);
            if (pts >= 10000000) {
                return {
                    tier: 'diamond',
                    name: 'DIAMOND',
                    shortName: 'DIAMOND',
                    badgeClass: 'badge-vip-diamond',
                    borderClass: 'vip-border-diamond',
                    avatarCrownClass: 'crown-diamond',
                    bannerClass: 'vip-banner-diamond',
                    color: '#00f2fe',
                    icon: 'fa-gem',
                    desc: 'Cấp bậc DIAMOND Tối Thượng - Vinh danh Chiến Binh Huyền Thoại',
                    threshold: 'Từ 10.000.000 Điểm',
                    min: 10000000,
                    nextMin: null
                };
            } else if (pts >= 3000000) {
                return {
                    tier: 'gold',
                    name: 'GOLD',
                    shortName: 'GOLD',
                    badgeClass: 'badge-vip-gold',
                    borderClass: 'vip-border-gold',
                    avatarCrownClass: 'crown-gold',
                    bannerClass: 'vip-banner-gold',
                    color: '#ffd700',
                    icon: 'fa-crown',
                    desc: 'Cấp bậc GOLD Hoàng Kim cao cấp',
                    threshold: 'Từ 3.000.000 đến 10.000.000 Điểm',
                    min: 3000000,
                    nextMin: 10000000
                };
            } else if (pts >= 1000000) {
                return {
                    tier: 'silver',
                    name: 'SILVER',
                    shortName: 'SILVER',
                    badgeClass: 'badge-vip-silver',
                    borderClass: 'vip-border-silver',
                    avatarCrownClass: 'crown-silver',
                    bannerClass: 'vip-banner-silver',
                    color: '#e2e8f0',
                    icon: 'fa-shield-halved',
                    desc: 'Cấp bậc SILVER ưu tú',
                    threshold: 'Từ 1.000.000 đến 3.000.000 Điểm',
                    min: 1000000,
                    nextMin: 3000000
                };
            } else {
                return {
                    tier: 'bronze',
                    name: 'BRONZE',
                    shortName: 'BRONZE',
                    badgeClass: 'badge-vip-bronze',
                    borderClass: 'vip-border-bronze',
                    avatarCrownClass: 'crown-bronze',
                    bannerClass: 'vip-banner-bronze',
                    color: '#e67e22',
                    icon: 'fa-medal',
                    desc: 'Cấp bậc BRONZE khởi đầu',
                    threshold: 'Dưới 1.000.000 Điểm',
                    min: 0,
                    nextMin: 1000000
                };
            }
        }

function updateUserVipUI() {
            const vip = getVipTier(userTotalAccumulatedPoints);
            userProfile.status = vip.name;

            // Update Standalone VIP Outer Badge (Bronze / Silver / Gold / Diamond)
            const badgeEl = document.getElementById('headerVipBadge');
            if (badgeEl) {
                badgeEl.className = `vip-outer-badge ${vip.badgeClass}`;
            }

            const badgeIconEl = document.getElementById('headerVipBadgeIcon');
            if (badgeIconEl) {
                badgeIconEl.className = `fa-solid ${vip.icon}`;
            }

            const badgeTextEl = document.getElementById('headerVipBadgeText');
            if (badgeTextEl) {
                badgeTextEl.innerText = vip.shortName;
            }

            const crownEl = document.getElementById('headerCrownIcon');
            if (crownEl) {
                crownEl.className = `fa-solid fa-crown crown-icon ${vip.avatarCrownClass}`;
            }

            const wrapperEl = document.getElementById('headerAvatarWrapper');
            if (wrapperEl) {
                wrapperEl.className = `user-avatar-wrapper ${vip.borderClass}`;
            }

            const balanceEl = document.getElementById('headerUserBalance');
            if (balanceEl) {
                balanceEl.innerText = `${userDonnetPoints.toLocaleString('vi-VN')}đ`;
            }

            if (typeof changeChest === 'function') {
                changeChest(0);
            }
        }

let userProfile = {
            fullname: '', // Chưa cập nhật
            email: '',    // Chưa cập nhật
            phone: '',    // Chưa cập nhật
            joinedDate: '15/08/2026',
            status: 'VIP BẠC'
        };

let userNotifications = [
            {
                id: 1,
                type: 'like',
                postId: 1,
                icon: 'fa-heart',
                iconClass: 'msg-icon-event',
                sender: 'LƯỢT THÍCH BÀI VIẾT',
                senderColor: '#ff4757',
                title: 'Dragon_God đã thích bài viết của bạn',
                content: 'Dragon_God đã thả tim yêu thích bài viết "🔥 [CHÍNH THỨC] KHAI MỞ MÁY CHỦ S1 - NGỌC RỒNG ARENA".',
                time: '5 phút trước',
                unread: true
            },
            {
                id: 2,
                type: 'comment',
                postId: 1,
                commentId: 11,
                openComments: true,
                icon: 'fa-comment',
                iconClass: 'msg-icon-forum',
                sender: 'BÌNH LUẬN BÀI VIẾT',
                senderColor: '#00e5ff',
                title: 'Vegeta_VIP đã bình luận vào bài viết của bạn',
                content: 'Vegeta_VIP: "Server mượt cực kì admin ơi! Đang gom ngọc mở rương vàng đây 🔥"',
                time: '25 phút trước',
                unread: true
            },
            {
                id: 3,
                type: 'donnet',
                icon: 'fa-hand-holding-dollar',
                iconClass: 'msg-icon-donnet',
                sender: 'DONNET THÀNH CÔNG',
                senderColor: '#ffd700',
                title: '+1.000.000đ Donnet Thành Công',
                content: 'Cảm ơn bạn đã donnet ủng hộ chúng tôi ! Bạn nhận được 1.000.000 Điểm vào Ví Cá Nhân',
                time: '1 giờ trước',
                unread: true
            },
            {
                id: 4,
                type: 'wallet',
                icon: 'fa-wallet',
                iconClass: 'msg-icon-wallet',
                sender: 'BIẾN ĐỘNG VÍ CÁ NHÂN',
                senderColor: '#00e5ff',
                title: '+500.000 Điểm Nhận Vào Ví',
                content: 'Bạn vừa nhận được số điểm 500.000 số điểm hiện có là 1.000.000 Điểm',
                time: '2 giờ trước',
                unread: true
            },
            {
                id: 5,
                type: 'comment',
                postId: 1,
                commentId: 12,
                openComments: true,
                icon: 'fa-reply',
                iconClass: 'msg-icon-forum',
                sender: 'PHẢN HỒI BÌNH LUẬN',
                senderColor: '#2ecc71',
                title: 'GokuSSJ đã trả lời bình luận của bạn',
                content: 'GokuSSJ: "Bài viết hay và rất hữu ích, cảm ơn bạn đã chia sẻ! 🔥"',
                time: '3 giờ trước',
                unread: true
            },
            {
                id: 6,
                type: 'profile',
                targetUser: 'SonGoku_99',
                icon: 'fa-user-check',
                iconClass: 'msg-icon-admin',
                sender: 'KẾT BẠN THÀNH CÔNG',
                senderColor: '#ffd700',
                title: 'SonGoku_99 đã trở thành bạn bè',
                content: 'SonGoku_99 đã chấp nhận lời mời kết bạn của bạn. Nhấp để xem hồ sơ chiến binh.',
                time: 'Hôm qua',
                unread: false
            }
        ];

function addUserNotification(notif) {
            userNotifications.unshift(notif);
            updateNotificationBadge();
        }

function updateNotificationBadge() {
            const unreadCount = userNotifications.filter(n => n.unread).length;
            const badge = document.getElementById('headerNotificationBadge');
            if (badge) {
                badge.innerText = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }
        }

let nextHistoryId = 10;

let exchangeHistory = [
            { id: 1, type: 'receive', amount: 50000, targetCode: '#839215', note: 'Tặng bạn ít điểm mua đồ nhé!', time: '10:45 - 21/08/2026', status: 'Thành Công' },
            { id: 2, type: 'transfer', amount: 100000, targetCode: '#294819', note: 'Chuyển điểm đấu giá bang hội', time: '09:15 - 21/08/2026', status: 'Thành Công' },
            { id: 3, type: 'receive', amount: 200000, targetCode: '#558291', note: 'Thưởng Top 1 Võ Đài Vũ Trụ', time: '16:30 - 20/08/2026', status: 'Thành Công' },
            { id: 4, type: 'transfer', amount: 50000, targetCode: '#194820', note: '', time: '14:10 - 20/08/2026', status: 'Thành Công' }
        ];

function openRewardModal() {
            document.getElementById('rewardModal').classList.remove('hidden');
            document.body.classList.add('modal-open');
        }

function closeRewardModal() {
            document.getElementById('rewardModal').classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

let jackpotPools = {
            mini: 10000,
            minor: 50000,
            major: 200000,
            grand: 1000000
        };

let pendingJackpotReward = null;

const jackpotMilestoneData = {
            mini: {
                name: 'MINI JACKPOT',
                pillClass: 'pill-mini',
                badgeBg: 'linear-gradient(135deg, #00e5ff 0%, #00b4db 100%)',
                color: '#00e5ff',
                minGems: 50000,
                maxGems: 150000,
                extraItem: '📜 x10 Bùa May Mắn Cấp 5',
                rateText: '5.0% / lượt mở rương'
            },
            minor: {
                name: 'MINOR JACKPOT',
                pillClass: 'pill-minor',
                badgeBg: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                color: '#a855f7',
                minGems: 200000,
                maxGems: 600000,
                extraItem: '👑 x1 Thẻ Đổi Tên VIP Rực Lửa',
                rateText: '2.5% / lượt mở rương'
            },
            major: {
                name: 'MAJOR JACKPOT',
                pillClass: 'pill-major',
                badgeBg: 'linear-gradient(135deg, #ff5722 0%, #f43f5e 100%)',
                color: '#ff5722',
                minGems: 1000000,
                maxGems: 3000000,
                extraItem: '🔥 Cải Trang Siêu Saiyan Rose / Blue (Vĩnh Viễn)',
                rateText: '0.8% / lượt mở rương'
            },
            grand: {
                name: 'GRAND JACKPOT',
                pillClass: 'pill-grand',
                badgeBg: 'linear-gradient(135deg, #ffd700 0%, #ff8800 100%)',
                color: '#ffd700',
                minGems: 5000000,
                maxGems: 15000000,
                extraItem: '🐉 ★ Thần Thú Vô Cực Shenron (Diamond Edition) + Danh Hiệu [THẦN LONG ĐỆ NHẤT HŨ]',
                rateText: '0.1% Siêu Hũ Toàn Server'
            }
        };

let displayedJackpotPools = {
            mini: 10000,
            minor: 50000,
            major: 200000,
            grand: 1000000
        };

let jackpotAnimFrameId = null;

function showFloatingJackpotAdd(addedPoints) {
            if (!addedPoints) return;
            const tierMap = {
                mini: { selector: '.jackpot-mini', colorClass: 'floating-add-mini' },
                minor: { selector: '.jackpot-minor', colorClass: 'floating-add-minor' },
                major: { selector: '.jackpot-major', colorClass: 'floating-add-major' },
                grand: { selector: '.jackpot-grand', colorClass: 'floating-add-grand' }
            };

            Object.keys(addedPoints).forEach(tier => {
                const addVal = addedPoints[tier];
                if (!addVal || addVal <= 0) return;
                const info = tierMap[tier];
                if (!info) return;
                const cardEl = document.querySelector(info.selector);
                if (!cardEl) return;

                const floatEl = document.createElement('div');
                floatEl.className = `jackpot-floating-add ${info.colorClass}`;
                floatEl.innerText = `+${addVal.toLocaleString('vi-VN')}`;
                cardEl.appendChild(floatEl);

                setTimeout(() => {
                    if (floatEl && floatEl.parentNode) {
                        floatEl.parentNode.removeChild(floatEl);
                    }
                }, 8800);
            });
        }

function renderJackpotDigits() {
            const elMini = document.getElementById('jackpotAmountMini');
            const elMinor = document.getElementById('jackpotAmountMinor');
            const elMajor = document.getElementById('jackpotAmountMajor');
            const elGrand = document.getElementById('jackpotAmountGrand');

            if (elMini) elMini.innerText = Math.round(displayedJackpotPools.mini).toLocaleString('vi-VN');
            if (elMinor) elMinor.innerText = Math.round(displayedJackpotPools.minor).toLocaleString('vi-VN');
            if (elMajor) elMajor.innerText = Math.round(displayedJackpotPools.major).toLocaleString('vi-VN');
            if (elGrand) elGrand.innerText = Math.round(displayedJackpotPools.grand).toLocaleString('vi-VN');

            // Update modal values if modal is open
            const mMini = document.getElementById('modalPoolMini');
            const mMinor = document.getElementById('modalPoolMinor');
            const mMajor = document.getElementById('modalPoolMajor');
            const mGrand = document.getElementById('modalPoolGrand');

            if (mMini) mMini.innerText = `${Math.round(displayedJackpotPools.mini).toLocaleString('vi-VN')} Điểm`;
            if (mMinor) mMinor.innerText = `${Math.round(displayedJackpotPools.minor).toLocaleString('vi-VN')} Điểm`;
            if (mMajor) mMajor.innerText = `${Math.round(displayedJackpotPools.major).toLocaleString('vi-VN')} Điểm`;
            if (mGrand) mGrand.innerText = `${Math.round(displayedJackpotPools.grand).toLocaleString('vi-VN')} Điểm`;
        }

function updateJackpotUI(animate = false, addedPoints = null) {
            const tiers = ['mini', 'minor', 'major', 'grand'];

            if (!animate) {
                if (jackpotAnimFrameId) {
                    cancelAnimationFrame(jackpotAnimFrameId);
                    jackpotAnimFrameId = null;
                }
                tiers.forEach(tier => {
                    displayedJackpotPools[tier] = jackpotPools[tier];
                });
                renderJackpotDigits();
                return;
            }

            // Animate points increasing gradually point by point (Tốc độ nhảy điểm chậm rãi, quan sát cực kỳ rõ ~9.0s)
            const startValues = { ...displayedJackpotPools };
            const targetValues = { ...jackpotPools };
            const duration = 9000; // 9.0s smooth roll-up
            const startTime = performance.now();

            if (addedPoints) {
                showFloatingJackpotAdd(addedPoints);
            }

            const cardDigitEls = [
                document.getElementById('jackpotAmountMini'),
                document.getElementById('jackpotAmountMinor'),
                document.getElementById('jackpotAmountMajor'),
                document.getElementById('jackpotAmountGrand')
            ];
            cardDigitEls.forEach(el => el && el.classList.add('jackpot-digits-counting'));

            if (jackpotAnimFrameId) {
                cancelAnimationFrame(jackpotAnimFrameId);
            }

            function stepAnimation(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1.0);
                // Linear steady tick-up
                const easeProgress = progress;

                tiers.forEach(tier => {
                    const start = startValues[tier];
                    const target = targetValues[tier];
                    if (start !== target) {
                        displayedJackpotPools[tier] = Math.round(start + (target - start) * easeProgress);
                    } else {
                        displayedJackpotPools[tier] = target;
                    }
                });

                renderJackpotDigits();

                if (progress < 1.0) {
                    jackpotAnimFrameId = requestAnimationFrame(stepAnimation);
                } else {
                    jackpotAnimFrameId = null;
                    tiers.forEach(tier => {
                        displayedJackpotPools[tier] = targetValues[tier];
                    });
                    renderJackpotDigits();
                    cardDigitEls.forEach(el => el && el.classList.remove('jackpot-digits-counting'));
                }
            }

            jackpotAnimFrameId = requestAnimationFrame(stepAnimation);
        }

function startJackpotLiveEngine() {
            updateJackpotUI();

            // Rotating live ticker announcements
            const tickerMessages = [
                '🎉 Chúc mừng <strong>[Dragon_God]</strong> vừa trúng JACKPOT <strong>MAJOR</strong> nhận <strong>2.450.000 Điểm</strong>!',
                '⚡ Chiến binh <strong>[Vegeta_VIP]</strong> vừa trúng JACKPOT <strong>MINI</strong> nhận <strong>128.500 Điểm</strong>!',
                '🌟 <strong>[GokuSSJ]</strong> vừa trúng JACKPOT <strong>MINOR</strong> nhận <strong>586.200 Điểm</strong>!',
                '👑 <strong>GRAND JACKPOT</strong> đã vượt mốc <strong>12.888.888 Điểm</strong> - Hãy mở Rương ngay!',
                '⭐ Chiến binh <strong>[admin]</strong> vừa tích lũy thêm điểm cống hiến vào tổng điểm server!'
            ];
            let tickerIdx = 0;
            const tickerEl = document.getElementById('jackpotTickerText');
            if (tickerEl) {
                setInterval(() => {
                    tickerIdx = (tickerIdx + 1) % tickerMessages.length;
                    tickerEl.style.opacity = '0';
                    setTimeout(() => {
                        tickerEl.innerHTML = tickerMessages[tickerIdx];
                        tickerEl.style.opacity = '1';
                    }, 300);
                }, 5000);
            }
        }

function rollJackpotForChest(chest) {
            if (!chest) return null;
            const roll = Math.random() * 100;

            if (chest.name === 'RƯƠNG KIM CƯƠNG') {
                if (roll < 0.20) return 'grand';        // 0.20%
                else if (roll < 1.40) return 'major';   // 1.20%
                else if (roll < 4.90) return 'minor';   // 3.50%
                else if (roll < 11.90) return 'mini';   // 7.00%
            } else if (chest.name === 'RƯƠNG VÀNG') {
                if (roll < 0.15) return 'grand';        // 0.15%
                else if (roll < 1.15) return 'major';   // 1.00%
                else if (roll < 4.15) return 'minor';   // 3.00%
                else if (roll < 10.15) return 'mini';   // 6.00%
            } else if (chest.name === 'RƯƠNG BẠC') {
                if (roll < 0.10) return 'grand';        // 0.10%
                else if (roll < 0.90) return 'major';   // 0.80%
                else if (roll < 3.40) return 'minor';   // 2.50%
                else if (roll < 8.40) return 'mini';    // 5.00%
            } else { // RƯƠNG ĐỒNG & Các rương cơ bản khác
                if (roll < 0.10) return 'grand';        // 0.10%
                else if (roll < 0.90) return 'major';   // 0.80%
                else if (roll < 3.40) return 'minor';   // 2.50%
                else if (roll < 8.40) return 'mini';    // 5.00%
            }
            return null;
        }

let currentSelectedTestTier = 'grand';

function selectJackpotTestTier(tier = 'grand') {
            currentSelectedTestTier = tier;

            const tiers = ['mini', 'minor', 'major', 'grand'];
            tiers.forEach(t => {
                const card = document.getElementById(`tierDetail_${t}`);
                if (card) {
                    if (t === tier) {
                        card.classList.add('active-selected-tier');
                    } else {
                        card.classList.remove('active-selected-tier');
                    }
                }
            });

            const btn = document.getElementById('btnTestJackpotTrigger');
            if (!btn) return;

            btn.className = 'btn-feature-action';

            const tierConfigs = {
                mini: { text: 'THỬ NGHIỆM TRÚNG THƯỞNG MINI', btnClass: 'btn-cyan-action' },
                minor: { text: 'THỬ NGHIỆM TRÚNG THƯỞNG MINOR', btnClass: 'btn-purple-action' },
                major: { text: 'THỬ NGHIỆM TRÚNG THƯỞNG MAJOR', btnClass: 'btn-major-action' },
                grand: { text: 'THỬ NGHIỆM TRÚNG THƯỞNG GRAND', btnClass: 'btn-gold-action' }
            };

            const cfg = tierConfigs[tier] || tierConfigs.grand;
            btn.classList.add(cfg.btnClass);
            btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${cfg.text}`;
        }

function testTriggerCurrentSelectedTier() {
            testTriggerJackpot(currentSelectedTestTier);
        }

function openJackpotDetailsModal(focusTier = null) {
            updateJackpotUI();
            document.getElementById('jackpotDetailsModal').classList.remove('hidden');
            document.body.classList.add('modal-open');

            const tierToSelect = focusTier || 'grand';
            selectJackpotTestTier(tierToSelect);

            if (focusTier) {
                setTimeout(() => {
                    const card = document.getElementById(`tierDetail_${focusTier}`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.classList.add('highlight-tier-pulse');
                        setTimeout(() => card.classList.remove('highlight-tier-pulse'), 2500);
                    }
                }, 150);
            }
        }

function closeJackpotDetailsModal() {
            document.getElementById('jackpotDetailsModal').classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

function testTriggerJackpot(tier = 'grand') {
            closeJackpotDetailsModal();
            triggerJackpotWin(tier);
        }

let jackpotConfettiAnimationId = null;

function launchJackpotSuperConfetti(tier = 'grand') {
            const canvas = document.getElementById('jackpotConfettiCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const particles = [];
            const count = tier === 'grand' ? 180 : 120;
            const palettes = {
                grand: ['#ffd700', '#ffea00', '#ff9100', '#00e5ff', '#ffffff', '#ff3d00'],
                major: ['#ff5722', '#ff1744', '#ffd700', '#ff9100', '#ffffff'],
                minor: ['#a855f7', '#d946ef', '#6366f1', '#38bdf8', '#ffffff'],
                mini: ['#00e5ff', '#00b4db', '#38ef7d', '#ffffff', '#ffd700']
            };
            const currentPalette = palettes[tier] || palettes.grand;

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: canvas.width / 2 + (Math.random() - 0.5) * 300,
                    y: canvas.height / 2 + (Math.random() - 0.5) * 150,
                    vx: (Math.random() - 0.5) * 26,
                    vy: (Math.random() - 1.2) * 22 - 4,
                    size: Math.random() * 9 + 4,
                    color: currentPalette[Math.floor(Math.random() * currentPalette.length)],
                    rotation: Math.random() * 360,
                    rotationSpeed: (Math.random() - 0.5) * 14,
                    opacity: 1,
                    decay: Math.random() * 0.005 + 0.003,
                    type: Math.random() > 0.6 ? 'coin' : (Math.random() > 0.3 ? 'star' : 'gem')
                });
            }

            if (jackpotConfettiAnimationId) cancelAnimationFrame(jackpotConfettiAnimationId);

            function renderJackpotParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let alive = 0;

                particles.forEach(p => {
                    if (p.opacity > 0) {
                        alive++;
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.38; // Gravity
                        p.vx *= 0.985;
                        p.rotation += p.rotationSpeed;
                        p.opacity -= p.decay;

                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate((p.rotation * Math.PI) / 180);
                        ctx.globalAlpha = Math.max(0, p.opacity);

                        if (p.type === 'coin') {
                            ctx.fillStyle = p.color;
                            ctx.beginPath();
                            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1.2;
                            ctx.stroke();
                        } else if (p.type === 'star') {
                            ctx.fillStyle = p.color;
                            ctx.shadowColor = p.color;
                            ctx.shadowBlur = 10;
                            ctx.beginPath();
                            ctx.moveTo(0, -p.size);
                            ctx.lineTo(p.size * 0.3, -p.size * 0.3);
                            ctx.lineTo(p.size, 0);
                            ctx.lineTo(p.size * 0.3, p.size * 0.3);
                            ctx.lineTo(0, p.size);
                            ctx.lineTo(-p.size * 0.3, p.size * 0.3);
                            ctx.lineTo(-p.size, 0);
                            ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
                            ctx.closePath();
                            ctx.fill();
                        } else {
                            ctx.fillStyle = p.color;
                            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                        }

                        ctx.restore();
                    }
                });

                if (alive > 0) {
                    jackpotConfettiAnimationId = requestAnimationFrame(renderJackpotParticles);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }

            renderJackpotParticles();
        }

function animateJackpotCountUp(targetAmount, duration = 1400) {
            const amountEl = document.getElementById('jackpotWinAmount');
            if (!amountEl) return;

            const startTime = performance.now();
            const startVal = 0;

            function updateCount(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);
                // Ease out expo curve for thrilling slowdown near target
                const easeVal = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const currentNum = Math.floor(startVal + (targetAmount - startVal) * easeVal);

                amountEl.innerText = `+${currentNum.toLocaleString('vi-VN')}`;

                if (progress < 1.0) {
                    requestAnimationFrame(updateCount);
                } else {
                    amountEl.innerText = `+${targetAmount.toLocaleString('vi-VN')}`;
                }
            }

            requestAnimationFrame(updateCount);
        }

function triggerJackpotWin(tier = 'grand', customAmount = null) {
            const data = jackpotMilestoneData[tier] || jackpotMilestoneData.grand;
            const winAmount = customAmount || jackpotPools[tier] || 5000000;

            pendingJackpotReward = {
                tier: tier,
                amount: winAmount,
                extraItem: data.extraItem
            };

            // Play Divine Gold Fanfare Sound
            SoundFX.playGoldDropSound();

            // Populate Modal UI
            const badgeEl = document.getElementById('jackpotWinBadge');
            const rarityTagEl = document.getElementById('jackpotWinRarityTag');
            const titleEl = document.getElementById('jackpotWinTitle');
            const extraNameEl = document.getElementById('jackpotWinExtraName');

            const rarityLabels = {
                grand: 'Tỉ Lệ 0.1% Toàn Sever',
                major: 'Tỉ Lệ 0.8% Toàn Sever',
                minor: 'Tỉ Lệ 2.5% Toàn Sever',
                mini: 'Tỉ Lệ 5.0% Toàn Sever'
            };

            if (badgeEl) {
                badgeEl.innerText = data.name;
                badgeEl.style.background = data.badgeBg;
                badgeEl.style.boxShadow = `0 0 25px ${data.color}`;
            }

            if (rarityTagEl) {
                rarityTagEl.innerText = rarityLabels[tier] || rarityLabels.grand;
            }

            if (titleEl) {
                titleEl.innerText = data.name;
                if (tier === 'grand') {
                    titleEl.className = 'jackpot-win-main-tier text-shimmer-grand';
                } else if (tier === 'major') {
                    titleEl.className = 'jackpot-win-main-tier text-orange';
                } else if (tier === 'minor') {
                    titleEl.className = 'jackpot-win-main-tier text-purple';
                } else {
                    titleEl.className = 'jackpot-win-main-tier text-cyan';
                }
            }

            if (extraNameEl) {
                extraNameEl.innerText = data.extraItem;
            }

            // Animate number countup
            animateJackpotCountUp(winAmount);

            // Launch Super Confetti Particle Engine
            launchJackpotSuperConfetti(tier);

            // Prepend new record into jackpotHistoryList
            jackpotHistoryList.unshift({
                time: getFormattedCurrentDateTime(),
                user: 'admin',
                avatar: 'vip-border-gold',
                vip: 'VIP 5',
                tier: tier,
                tierName: data.name,
                tierColor: data.color,
                tierBadge: `pill-${tier}`,
                icon: tier === 'grand' ? 'fa-crown' : (tier === 'major' ? 'fa-fire' : (tier === 'minor' ? 'fa-bolt-lightning' : 'fa-star')),
                points: winAmount,
                status: 'Đã nhận thưởng'
            });

            // Reset pool back to base seed
            const seedBases = { mini: 10000, minor: 50000, major: 200000, grand: 1000000 };
            jackpotPools[tier] = seedBases[tier] || 10000;
            updateJackpotUI();

            // Show Celebration Modal
            document.getElementById('jackpotWinModal').classList.remove('hidden');
            document.body.classList.add('modal-open');

            // Add server notification
            addUserNotification({
                id: Date.now(),
                type: 'jackpot',
                icon: 'fa-crown',
                iconClass: 'msg-icon-jackpot',
                sender: 'SỰ KIỆN NỔ HŨ JACKPOT',
                senderColor: '#ffd700',
                title: `💥 QUAY THƯỞNG TRÚNG ${data.name}: +${winAmount.toLocaleString('vi-VN')} ĐIỂM!`,
                content: `Chiến binh đã xuất sắc quay thưởng trúng ${data.name}, nhận ngay +${winAmount.toLocaleString('vi-VN')} Điểm!`,
                time: 'Vừa xong',
                unread: true
            });
        }

function claimJackpotWinReward() {
            let rewardedAmount = 0;
            if (pendingJackpotReward) {
                rewardedAmount = pendingJackpotReward.amount;
                const tierName = pendingJackpotReward.tier ? pendingJackpotReward.tier.toUpperCase() : 'JACKPOT';
                
                // 1. Cộng thẳng toàn bộ số điểm trúng Jackpot vào ví người dùng
                userDonnetPoints += rewardedAmount;
                userTotalAccumulatedPoints += rewardedAmount;
                
                // 2. Cập nhật hiển thị số dư ví ở Header Capsule
                updateUserVipUI();
                
                // 3. Cập nhật số dư ở các giao diện khác (Tab Donnet, Modal Điểm, Modal Ví)
                const donnetBalEl = document.getElementById('donnetBalanceText');
                if (donnetBalEl) donnetBalEl.innerText = `${userDonnetPoints.toLocaleString('vi-VN')} Điểm`;
                
                const donnetModalBalEl = document.getElementById('donnetModalCurrentPoints');
                if (donnetModalBalEl) donnetModalBalEl.innerText = userDonnetPoints.toLocaleString('vi-VN');

                // 4. Thêm bản ghi vào Lịch Sử Biến Động Ví Cá Nhân (Exchange History)
                const now = new Date();
                const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                if (typeof nextHistoryId !== 'undefined' && Array.isArray(exchangeHistory)) {
                    exchangeHistory.unshift({
                        id: ++nextHistoryId,
                        type: 'receive',
                        amount: rewardedAmount,
                        targetCode: 'HỆ THỐNG JACKPOT',
                        note: `Trúng thưởng ${tierName} JACKPOT toàn Server`,
                        time: timeString,
                        status: 'Thành Công'
                    });
                }

                // This preview has no Donate history to update.

                // 5. Phát âm thanh chiến thắng
                if (SoundFX && typeof SoundFX.playFanfare === 'function') {
                    SoundFX.playFanfare();
                }

                // 6. Thông báo nhận thưởng thành công
                alert(`🎉 NHẬN THƯỞNG JACKPOT MÔ PHỎNG!\n\n+${rewardedAmount.toLocaleString('vi-VN')} Điểm đã được cộng vào ví mô phỏng của bản xem thử.\nSố dư ví hiện tại: ${userDonnetPoints.toLocaleString('vi-VN')} Điểm.`);

                pendingJackpotReward = null;
            }

            if (jackpotConfettiAnimationId) cancelAnimationFrame(jackpotConfettiAnimationId);
            const canvas = document.getElementById('jackpotConfettiCanvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            document.getElementById('jackpotWinModal').classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

let jackpotHistoryFilter = 'all';

const jackpotHistoryList = [
            {
                time: '19:02',
                user: 'Dragon_God',
                avatar: 'vip-border-gold',
                vip: 'VIP 6',
                tier: 'major',
                tierName: 'MAJOR',
                tierColor: '#ff5722',
                tierBadge: 'pill-major',
                icon: 'fa-fire',
                points: 2450000,
                status: 'Đã nhận thưởng'
            },
            {
                time: '18:48',
                user: 'Vegeta_VIP',
                avatar: 'vip-border-silver',
                vip: 'VIP 3',
                tier: 'mini',
                tierName: 'MINI',
                tierColor: '#00e5ff',
                tierBadge: 'pill-mini',
                icon: 'fa-star',
                points: 128500,
                status: 'Đã nhận thưởng'
            },
            {
                time: '18:31',
                user: 'GokuSSJ',
                avatar: 'vip-border-gold',
                vip: 'VIP 5',
                tier: 'minor',
                tierName: 'MINOR',
                tierColor: '#a855f7',
                tierBadge: 'pill-minor',
                icon: 'fa-bolt-lightning',
                points: 586200,
                status: 'Đã nhận thưởng'
            },
            {
                time: '17:15',
                user: 'Shenron_Master',
                avatar: 'vip-border-gold',
                vip: 'VIP 7',
                tier: 'grand',
                tierName: 'GRAND',
                tierColor: '#ffd700',
                tierBadge: 'pill-grand',
                icon: 'fa-crown',
                points: 12888888,
                status: 'Đã nhận thưởng'
            },
            {
                time: '16:50',
                user: 'Broly_Legend',
                avatar: 'vip-border-bronze',
                vip: 'VIP 2',
                tier: 'minor',
                tierName: 'MINOR',
                tierColor: '#a855f7',
                tierBadge: 'pill-minor',
                icon: 'fa-bolt-lightning',
                points: 495000,
                status: 'Đã nhận thưởng'
            },
            {
                time: '15:20',
                user: 'Beerus_Hakai',
                avatar: 'vip-border-gold',
                vip: 'VIP 6',
                tier: 'major',
                tierName: 'MAJOR',
                tierColor: '#ff5722',
                tierBadge: 'pill-major',
                icon: 'fa-fire',
                points: 2180000,
                status: 'Đã nhận thưởng'
            },
            {
                time: '14:05',
                user: 'Trunks_Future',
                avatar: 'vip-border-silver',
                vip: 'VIP 4',
                tier: 'mini',
                tierName: 'MINI',
                tierColor: '#00e5ff',
                tierBadge: 'pill-mini',
                icon: 'fa-star',
                points: 142000,
                status: 'Đã nhận thưởng'
            },
            {
                time: '12:40',
                user: 'Whis_Angel',
                avatar: 'vip-border-gold',
                vip: 'VIP 8',
                tier: 'grand',
                tierName: 'GRAND',
                tierColor: '#ffd700',
                tierBadge: 'pill-grand',
                icon: 'fa-crown',
                points: 15400000,
                status: 'Đã nhận thưởng'
            }
        ];

function getFormattedCurrentDateTime() {
            const d = new Date();
            const pad = n => String(n).padStart(2, '0');
            return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }

function openJackpotHistoryModal(filter = 'all') {
            jackpotHistoryFilter = filter;
            renderJackpotHistoryTable(filter);
            document.getElementById('jackpotHistoryModal').classList.remove('hidden');
            document.body.classList.add('modal-open');
        }

function closeJackpotHistoryModal() {
            document.getElementById('jackpotHistoryModal').classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

function filterJackpotHistory(filter, btn) {
            jackpotHistoryFilter = filter;
            const tabBtns = document.querySelectorAll('.history-tab-btn');
            tabBtns.forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');
            renderJackpotHistoryTable(filter);
        }

function renderJackpotHistoryTable(filter = null) {
            const curFilter = filter || jackpotHistoryFilter || 'all';
            const tbody = document.getElementById('jackpotHistoryTableBody');
            const countAllEl = document.getElementById('historyCountAll');
            if (countAllEl) countAllEl.innerText = jackpotHistoryList.length;

            if (!tbody) return;

            const filtered = curFilter === 'all' 
                ? jackpotHistoryList 
                : jackpotHistoryList.filter(item => item.tier === curFilter);

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="history-empty-cell">
                            <i class="fa-solid fa-inbox icon-empty"></i>
                            <p>Chưa có dữ liệu nổ hũ cho mốc này trong phiên hôm nay!</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filtered.slice(0, 7).map(item => `
                <tr class="history-row-item ${item.tier === 'grand' ? 'row-grand-highlight' : ''}">
                    <td class="history-col-user">
                        <div class="history-user-info">
                            <div class="history-user-avatar ${item.avatar || 'vip-border-gold'}">
                                <i class="fa-solid fa-user-astronaut"></i>
                            </div>
                            <div class="history-user-meta">
                                <span class="history-user-name">${item.user}</span>
                                <span class="history-user-vip">${item.vip}</span>
                            </div>
                        </div>
                    </td>
                    <td class="history-col-tier">
                        <span class="jackpot-badge-pill ${item.tierBadge}">
                            ${item.tierName}
                        </span>
                    </td>
                    <td class="history-col-points">
                        <span class="history-points-val ${item.tier === 'grand' ? 'text-shimmer-grand' : ''}" style="color: ${item.tierColor}">
                            +${item.points.toLocaleString('vi-VN')} <i class="fa-solid fa-star"></i>
                        </span>
                    </td>
                    <td class="history-col-time">
                        <span class="history-time-badge"><i class="fa-regular fa-clock"></i> ${item.time}</span>
                    </td>
                </tr>
            `).join('');
        }

changeChest(0); updateJackpotUI(); startJackpotLiveEngine(); renderJackpotHistoryTable();
