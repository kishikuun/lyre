/**
 * ============================================================================
 * LYRE STUDIO — RETRO PIXEL RPG CHARACTER STATS SHEET (DELTARUNE STYLE)
 * Version 4.0 (Acoustic Forensic Workbench)
 * 
 * Directly modeled after Toby Fox's Deltarune Character Stats Sheet:
 * - Pure 8-bit black & white crisp border aesthetic with retro icons.
 * - Dynamic RPG Stats: ATK (Transcription), DEF (Error Resistance), MAGIC (Prosody), GUTS (Streak).
 * - Visual pixel hearts (❤️❤️❤️❤️❤️) / skulls for GUTS meter.
 * - Equipment & Badge slots (Audio Stylus, Studio Cans, Gold Inspector Pin).
 * - Party member switcher: Inspector Byte, Forensic Kris, Susie Stenographer.
 * - 100% responsive for Mobile & Desktop (Flexbox/Grid, touch targets >= 48px).
 * ============================================================================
 */

(function (root) {
    'use strict';

    const DEFAULT_CHARACTERS = [
        {
            id: 'byte',
            name: 'Inspector Byte',
            title: 'Chief Acoustic Inspector',
            level: 5,
            hp: 95,
            maxHp: 100,
            atk: 88,
            def: 92,
            magic: 85,
            guts: 5,
            accuracy: 96,
            avatarBg: '#fde047',
            items: [
                { slot: 'WEAPON', name: 'Nagra Diamond Stylus +4', desc: 'Tăng 15% độ chính xác chép từ đuôi -ed' },
                { slot: 'ARMOR', name: 'Sennheiser Studio Cans', desc: 'Giảm 40% tạp âm môi trường và tiếng vang' },
                { slot: 'BADGE', name: 'Arstotzka Gold Seal', desc: 'Miễn trừ 1 lần phạt Citation Slip mỗi buổi' }
            ]
        },
        {
            id: 'susie',
            name: 'Susie Steno',
            title: 'Heavy Acoustic Enforcer',
            level: 6,
            hp: 110,
            maxHp: 110,
            atk: 99,
            def: 80,
            magic: 70,
            guts: 5,
            accuracy: 91,
            avatarBg: '#f43f5e',
            items: [
                { slot: 'WEAPON', name: 'Heavy Mechanical Key +6', desc: 'Tốc độ gõ 160 WPM bùng nổ' },
                { slot: 'ARMOR', name: 'Spiked Leather Jacket', desc: 'Kháng hoàn toàn bẫy âm nối âm (linking)' },
                { slot: 'BADGE', name: 'Rude Buster Emblem', desc: 'Tự động sửa lỗi chính tả viết hoa' }
            ]
        },
        {
            id: 'ralsei',
            name: 'Ralsei Scholar',
            title: 'Phonetic Harmony Priest',
            level: 5,
            hp: 85,
            maxHp: 85,
            atk: 75,
            def: 86,
            magic: 99,
            guts: 4,
            accuracy: 98,
            avatarBg: '#22c55e',
            items: [
                { slot: 'WEAPON', name: 'Silver Tuning Fork', desc: 'Hiển thị chính xác cao độ 220Hz đường ngữ điệu' },
                { slot: 'ARMOR', name: 'Green Duster Cloak', desc: 'Tăng gấp đôi điểm ghi nhớ Spaced Repetition SRS' },
                { slot: 'BADGE', name: 'Heal Prayer Ribbon', desc: 'Hồi phục 1 tim máu khi hoàn thành bài tập' }
            ]
        }
    ];

    class PixelStats {
        /**
         * @param {Object} options 
         * @param {HTMLElement|string} options.container Container element or selector
         * @param {Array} options.characters Optional character roster
         * @param {Function} options.onCharacterChange Callback when active character changes
         */
        constructor(options = {}) {
            this.container = typeof options.container === 'string'
                ? document.querySelector(options.container)
                : (options.container || null);
            this.characters = options.characters || DEFAULT_CHARACTERS;
            this.activeCharIndex = 0;
            this.onCharacterChange = options.onCharacterChange || null;

            if (this.container) {
                this.render();
            }
        }

        /**
         * Gán container và render bảng chỉ số
         */
        mount(container) {
            this.container = typeof container === 'string'
                ? document.querySelector(container)
                : container;
            this.render();
        }

        /**
         * Lấy nhân vật hiện tại
         */
        getActiveCharacter() {
            return this.characters[this.activeCharIndex] || this.characters[0];
        }

        /**
         * Đổi nhân vật theo ID
         */
        selectCharacter(id) {
            const idx = this.characters.findIndex(c => c.id === id);
            if (idx !== -1) {
                this.activeCharIndex = idx;
                this.render();
                if (typeof this.onCharacterChange === 'function') {
                    this.onCharacterChange(this.getActiveCharacter());
                }
                if (window.App && window.App.PixelSFX) {
                    window.App.PixelSFX.playTypewriterBlip();
                }
            }
        }

        /**
         * Cập nhật điểm chỉ số thời gian thực
         */
        updateStats(partialStats = {}) {
            const char = this.getActiveCharacter();
            Object.assign(char, partialStats);
            this.render();
        }

        /**
         * Render chuỗi icon tim hoặc đầu lâu cho GUTS
         */
        renderGutsIcons(count) {
            let html = '';
            for (let i = 0; i < 5; i++) {
                if (i < count) {
                    html += `<span class="inline-block text-red-500 transform hover:scale-125 transition-transform" title="1 Guts Point">❤️</span> `;
                } else {
                    html += `<span class="inline-block text-gray-700 opacity-40">🖤</span> `;
                }
            }
            return html;
        }

        /**
         * Render DOM bảng chỉ số RPG Deltarune
         */
        render() {
            if (!this.container) return;
            const char = this.getActiveCharacter();

            this.container.innerHTML = `
                <div class="pixel-stats-sheet bg-black text-white p-4 sm:p-5 border-4 border-white select-none space-y-4" role="region" aria-label="Bảng Chỉ Số Nhân Vật RPG">
                    <!-- Top Bar: Header & Character Selector -->
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-white pb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-red-500 animate-pulse text-sm">❤️</span>
                            <span class="px-font-arcade text-xs tracking-wider text-white">CHAR · STATS</span>
                            <span class="text-xs font-mono text-gray-400">LV ${char.level}</span>
                        </div>

                        <!-- Party Switcher (Kris / Susie / Byte) -->
                        <div class="flex items-center gap-1 sm:gap-2">
                            ${this.characters.map((c, i) => `
                                <button type="button"
                                    class="party-select-btn px-2 py-1 text-[9px] px-font-arcade border ${i === this.activeCharIndex ? 'border-amber-400 bg-amber-950/60 text-amber-300' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'} rounded transition-colors"
                                    data-char-id="${c.id}">
                                    ${i === this.activeCharIndex ? '❤️ ' : ''}${c.name.split(' ')[0]}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Main Character Profile & Stats Layout -->
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <!-- Left Column: Portrait & Title (md:col-span-4) -->
                        <div class="md:col-span-4 flex flex-col items-center p-3 border-2 border-gray-800 bg-[#0a0a0f] space-y-2 text-center">
                            <!-- Avatar 64x64 -->
                            <div class="w-16 h-16 border-2 border-white bg-black flex items-center justify-center relative">
                                <svg class="w-12 h-12" viewBox="0 0 32 32" shape-rendering="crispEdges">
                                    <rect x="6" y="6" width="20" height="20" fill="${char.avatarBg}" />
                                    <rect x="8" y="4" width="16" height="2" fill="${char.avatarBg}" />
                                    <rect x="8" y="26" width="16" height="2" fill="${char.avatarBg}" />
                                    <rect x="4" y="4" width="24" height="4" fill="#1e3a8a" />
                                    <rect x="6" y="2" width="20" height="2" fill="#1e40af" />
                                    <rect x="2" y="8" width="28" height="2" fill="#0f172a" />
                                    <rect x="14" y="3" width="4" height="3" fill="#fbbf24" />
                                    <rect x="10" y="14" width="3" height="4" fill="#0f172a" />
                                    <rect x="19" y="14" width="3" height="4" fill="#0f172a" />
                                    <rect x="13" y="22" width="6" height="2" fill="#0f172a" />
                                </svg>
                                <span class="absolute -top-2 -right-2 text-xs">❤️</span>
                            </div>

                            <div class="space-y-0.5">
                                <div class="px-font-arcade text-xs text-amber-300">${char.name}</div>
                                <div class="text-[10px] font-mono text-gray-400">${char.title}</div>
                            </div>

                            <!-- HP Bar -->
                            <div class="w-full space-y-1 pt-1">
                                <div class="flex justify-between text-[10px] font-mono text-gray-300">
                                    <span>HP:</span>
                                    <span class="text-emerald-400 font-bold">${char.hp} / ${char.maxHp}</span>
                                </div>
                                <div class="w-full h-2.5 bg-gray-900 border border-gray-700 rounded-none overflow-hidden">
                                    <div class="h-full bg-emerald-500 transition-all duration-300" style="width: ${(char.hp / char.maxHp) * 100}%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Middle Column: Primary Acoustic RPG Stats (md:col-span-4) -->
                        <div class="md:col-span-4 space-y-2.5 border-2 border-gray-800 bg-[#0a0a0f] p-3">
                            <div class="px-font-arcade text-[10px] text-gray-400 border-b border-gray-800 pb-1 flex items-center justify-between">
                                <span>--- STATS ---</span>
                                <span class="text-amber-400">ACCURACY: ${char.accuracy}%</span>
                            </div>

                            <div class="space-y-2 text-xs font-mono">
                                <!-- ATK -->
                                <div class="flex items-center justify-between">
                                    <span class="flex items-center gap-1.5 text-gray-300">
                                        <span class="text-sm">🗡️</span> Attack (Tốc độ gõ):
                                    </span>
                                    <span class="px-font-arcade text-[11px] text-white font-bold">${char.atk}</span>
                                </div>
                                <!-- DEF -->
                                <div class="flex items-center justify-between">
                                    <span class="flex items-center gap-1.5 text-gray-300">
                                        <span class="text-sm">🛡️</span> Defense (Kháng bẫy):
                                    </span>
                                    <span class="px-font-arcade text-[11px] text-white font-bold">${char.def}</span>
                                </div>
                                <!-- MAGIC -->
                                <div class="flex items-center justify-between">
                                    <span class="flex items-center gap-1.5 text-gray-300">
                                        <span class="text-sm">✨</span> Magic (Ngữ điệu):
                                    </span>
                                    <span class="px-font-arcade text-[11px] text-white font-bold">${char.magic}</span>
                                </div>
                                <!-- GUTS -->
                                <div class="flex items-center justify-between pt-1 border-t border-gray-900">
                                    <span class="flex items-center gap-1.5 text-gray-300">
                                        <span class="text-sm">🔥</span> Guts (Chuỗi Streak):
                                    </span>
                                    <span class="text-xs">${this.renderGutsIcons(char.guts)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column: Equipped Items & Badges (md:col-span-4) -->
                        <div class="md:col-span-4 space-y-2 border-2 border-gray-800 bg-[#0a0a0f] p-3">
                            <div class="px-font-arcade text-[10px] text-gray-400 border-b border-gray-800 pb-1">
                                --- EQUIP & BADGES ---
                            </div>

                            <div class="space-y-2">
                                ${char.items.map(item => `
                                    <div class="border border-gray-800 p-1.5 bg-black/60 space-y-0.5">
                                        <div class="flex items-center justify-between text-[10px] px-font-arcade">
                                            <span class="text-amber-400 font-bold">[${item.slot}]</span>
                                            <span class="text-gray-300 truncate max-w-[150px]">${item.name}</span>
                                        </div>
                                        <p class="text-[9px] font-mono text-gray-500 leading-tight">${item.desc}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Bind party switcher clicks
            const buttons = this.container.querySelectorAll('.party-select-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const charId = btn.getAttribute('data-char-id');
                    this.selectCharacter(charId);
                });
            });
        }
    }

    root.App = root.App || {};
    root.App.PixelStats = PixelStats;

})(typeof window !== 'undefined' ? window : global);

