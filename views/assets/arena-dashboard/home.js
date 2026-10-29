        let currentClassHeroIndex = 0;

        const classHeroDataList = [
            {
                id: 'goku',
                classKey: 'traidat',
                heroName: 'SON GOKU',
                raceName: 'HỆ TRÁI ĐẤT',
                roleName: 'CÂN BẰNG & BIẾN HÓA',
                titleTag: '★ SIÊU CHIẾN BINH HUYỀN THOẠI ★',
                quote: 'Dù đối thủ có mạnh đến đâu, ta cũng sẽ vượt qua mọi giới hạn để bảo vệ hành tinh này!',
                color: '#00e5ff',
                themeId: 'goku',
                auraClass: 'aura-goku',
                pillClass: 'pill-traidat',
                roleClass: 'role-blue',
                frameClass: 'frame-goku',
                ringClass: 'ring-blue',
                fillClass: 'fill-blue',
                icon: 'fa-earth-asia',
                charIcon: 'fa-bolt-lightning',
                image: '/assets/images/avatars/td.png',
                stats: {
                    damage: 85,
                    ki: 100,
                    hp: 80,
                    extraName: 'Tốc Độ Né',
                    extraVal: 95
                },
                skills: [
                    {
                        name: 'SuperKamehameha',
                        type: '',
                        icon: 'fa-sun',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Quả Cầu Năng Lượng',
                        type: '',
                        icon: 'fa-globe',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Dịch Chuyển Tức Thời',
                        type: '',
                        icon: 'fa-person-running',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Kaioken',
                        type: '',
                        icon: 'fa-fire-flame-curved',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Thôi Miên',
                        type: '',
                        icon: 'fa-dharmachakra',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Thái Dương Hạ San',
                        type: '',
                        icon: 'fa-sun',
                        image: '',
                        desc: ''
                    }
                ]
            },
            {
                id: 'piccolo',
                classKey: 'namec',
                heroName: 'PICCOLO',
                raceName: 'HỆ NAMEC',
                roleName: 'HỒI PHỤC & HỖ TRỢ',
                titleTag: '★ BẬC THẦY MA THUẬT BẤT TỬ ★',
                quote: 'Ma thuật Namek cổ xưa và ý chí chiến binh bất diệt sẽ đảo ngược mọi thế trận!',
                color: '#2ecc71',
                themeId: 'piccolo',
                auraClass: 'aura-piccolo',
                pillClass: 'pill-namec',
                roleClass: 'role-green',
                frameClass: 'frame-piccolo',
                ringClass: 'ring-green',
                fillClass: 'fill-green',
                icon: 'fa-dna',
                charIcon: 'fa-hand-sparkles',
                image: '/assets/images/avatars/nm.png',
                stats: {
                    damage: 70,
                    ki: 85,
                    hp: 100,
                    extraName: 'Hồi Phục Sinh Lực',
                    extraVal: 95
                },
                skills: [
                    {
                        name: 'Makankosappo',
                        type: '',
                        icon: 'fa-wand-magic-sparkles',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Trị Thương Thần Tốc',
                        type: '',
                        icon: 'fa-heart-pulse',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Triệu Hồi Trợ Thủ',
                        type: '',
                        icon: 'fa-egg',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Ma Pong Ba',
                        type: '',
                        icon: 'fa-shield-halved',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Liên Hoàn',
                        type: '',
                        icon: 'fa-hand-fist',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Biến Socola',
                        type: '',
                        icon: 'fa-cookie-bite',
                        image: '',
                        desc: ''
                    }
                ]
            },
            {
                id: 'vegeta',
                classKey: 'xayda',
                heroName: 'VEGETA',
                raceName: 'HỆ XAYDA',
                roleName: 'BẠO KÍCH & SÁT THƯƠNG',
                titleTag: '★ HOÀNG TỬ SAIYAN KIÊU HÃNH ★',
                quote: 'Kính cẩn trước sức mạnh tuyệt đối của Hoàng Tử Saiyan - kẻ thống trị võ đài!',
                color: '#ff5722',
                themeId: 'vegeta',
                auraClass: 'aura-vegeta',
                pillClass: 'pill-xayda',
                roleClass: 'role-orange',
                frameClass: 'frame-vegeta',
                ringClass: 'ring-orange',
                fillClass: 'fill-orange',
                icon: 'fa-fire',
                charIcon: 'fa-meteor',
                image: '/assets/images/avatars/xd.png',
                stats: {
                    damage: 100,
                    ki: 65,
                    hp: 85,
                    extraName: 'Tỉ Lệ Bạo Kích',
                    extraVal: 98
                },
                skills: [
                    {
                        name: 'Liên Hoàn Chưởng',
                        type: '',
                        icon: 'fa-meteor',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Tái Tạo Năng Lượng',
                        type: '',
                        icon: 'fa-bolt',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Hóa Khỉ Đột',
                        type: '',
                        icon: 'fa-dragon',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Giải Phóng Năng Lượng',
                        type: '',
                        icon: 'fa-bomb',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Huýt Sáo',
                        type: '',
                        icon: 'fa-music',
                        image: '',
                        desc: ''
                    },
                    {
                        name: 'Trói',
                        type: '',
                        icon: 'fa-cubes-stacked',
                        image: '',
                        desc: ''
                    }
                ]
            }
        ];

        function renderHomeClassHero(index = 0) {
            currentClassHeroIndex = (index + classHeroDataList.length) % classHeroDataList.length;
            const hero = classHeroDataList[currentClassHeroIndex];
            const container = document.getElementById('classSingleHeroCard');

            if (!container) return;

            container.innerHTML = `
                <div class="hero-card-inner hero-theme-${hero.themeId}">
                    <div class="hero-card-ambient-aura ${hero.auraClass}"></div>
                    <!-- LEFT COLUMN: Character Identity, Dynamic Avatar & Lore Quote -->
                    <div class="hero-col-left">
                        <!-- TOP: Character Name -->
                        <div class="hero-header-top">
                            <h2 class="hero-char-name">${hero.heroName}</h2>
                            <div class="hero-name-divider" style="background: linear-gradient(90deg, transparent, ${hero.color}, #ffd700, ${hero.color}, transparent); color: ${hero.color};"></div>
                        </div>

                        <!-- CHARACTER VISUAL / AVATAR WITH ENERGY PEDESTAL -->
                        <div class="hero-visual-box">
                            <div class="hero-portrait-frame ${hero.frameClass}">
                                <div class="hero-energy-beam"></div>
                                <div class="hero-stage-pedestal" style="background: radial-gradient(ellipse at 50% 85%, ${hero.color}66 0%, ${hero.color}15 50%, transparent 75%);"></div>

                                ${hero.image ? `
                                    <div class="hero-character-img-wrap">
                                        <img src="${hero.image}" alt="${hero.heroName}" class="hero-character-img" />
                                    </div>
                                ` : `
                                    <div class="hero-character-icon-art">
                                        <i class="fa-solid ${hero.charIcon}"></i>
                                    </div>
                                `}
                            </div>

                            <!-- LORE QUOTE BUBBLE -->
                            <div class="hero-quote-bubble" style="border-left-color: ${hero.color};">
                                <div class="quote-icon-badge" style="background: ${hero.color}22; color: ${hero.color}; border-color: ${hero.color}55;">
                                    <i class="fa-solid fa-quote-left"></i>
                                </div>
                                <p>"${hero.quote}"</p>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: Modern 6-Skill Matrix -->
                    <div class="hero-col-right">
                        <!-- SKILLS SECTION -->
                        <div class="hero-section-box hero-skills-main-box">
                            <div class="hero-box-header">
                                <div class="hero-box-header-title">
                                    <div class="hero-header-icon-glow" style="background: ${hero.color}25; color: ${hero.color}; border-color: ${hero.color}66;">
                                        <i class="fa-solid fa-burst"></i>
                                    </div>
                                    <div>
                                        <span class="hero-header-main-text">BỘ KỸ NĂNG ĐẶC TRƯNG</span>
                                        <span class="hero-header-sub-text">Hệ thống 6 tuyệt kỹ thức tỉnh sức mạnh</span>
                                    </div>
                                </div>
                                <div class="hero-class-pagination-dots">
                                    ${classHeroDataList.map((h, i) => `
                                        <button class="hero-dot-btn ${i === currentClassHeroIndex ? 'active' : ''}" 
                                                onclick="selectClassHero(${i})" 
                                                style="${i === currentClassHeroIndex ? `background: ${hero.color}; box-shadow: 0 0 10px ${hero.color};` : ''}"
                                                title="${h.heroName}"></button>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="hero-skills-grid">
                                ${hero.skills.map((skill, sIdx) => `
                                    <div class="hero-skill-card ${skill.isPlaceholder ? 'hero-skill-card-placeholder' : ''}" 
                                         style="--skill-color: ${hero.color};"
                                         data-skill-index="${sIdx + 1}">
                                        <div class="hero-skill-slot-num">0${sIdx + 1}</div>
                                        <div class="hero-skill-icon-wrap" style="color: ${skill.isPlaceholder ? '#64748b' : hero.color};">
                                            ${skill.image ? `
                                                <div class="hero-skill-icon-frame">
                                                    <img src="${skill.image}" alt="${skill.name}" class="hero-skill-img-icon" />
                                                    <div class="skill-icon-shine"></div>
                                                </div>
                                            ` : `
                                                <div class="hero-skill-slot-empty">
                                                    <i class="fa-solid ${skill.icon || 'fa-plus'}"></i>
                                                </div>
                                            `}
                                        </div>
                                        <div class="hero-skill-info">
                                            <div class="hero-skill-name-row">
                                                <h4 style="${skill.isPlaceholder ? 'color: #94a3b8; font-style: italic; font-weight: 600;' : ''}">${skill.name}</h4>
                                                ${skill.type ? `<span class="skill-mini-type" style="color: ${hero.color}; border-color: ${hero.color};">${skill.type}</span>` : ''}
                                            </div>
                                            ${skill.desc ? `<p>${skill.desc}</p>` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function selectClassHero(index) {
            renderHomeClassHero(index);
        }

        function nextClassHero() {
            renderHomeClassHero(currentClassHeroIndex + 1);
        }

        function prevClassHero() {
            renderHomeClassHero(currentClassHeroIndex - 1);
        }


renderHomeClassHero(0);
