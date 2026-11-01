/**
 * ============================================================================
 * LYRE STUDIO — RETRO PAPERBOY GAZETTE CELEBRATION MODAL (1984 ATARI STYLE)
 * Version 4.0 (Acoustic Forensic Workbench)
 * 
 * Directly modeled after Atari's 1984 Paperboy "The Daily Sun" end-of-round newspaper:
 * - Iconic spinning newspaper zoom animation (scale 0.05 + 720deg rotation to full size).
 * - Multi-column authentic newspaper layout with sensational headlines.
 * - Center pixel artwork of Paperboy / Inspector Byte holding up the morning edition.
 * - Scoreboard recap: Score, Accuracy %, Words Written, Citations Avoided.
 * - Procedural Coin-Op audio chime on reward claim.
 * - Full keyboard & mobile touch support (Esc to close, Space to claim coin).
 * ============================================================================
 */

(function (root) {
    'use strict';

    class PixelGazette {
        /**
         * @param {Object} options
         * @param {HTMLElement|string} options.mountPoint Where the modal is appended (default document.body)
         * @param {Function} options.onClose Callback when closed
         */
        constructor(options = {}) {
            this.mountPoint = typeof options.mountPoint === 'string'
                ? document.querySelector(options.mountPoint)
                : (options.mountPoint || (typeof document !== 'undefined' ? document.body : null));
            this.onClose = options.onClose || null;
            this.modalEl = null;
            this.isOpen = false;
            this._handleKeyDown = this._handleKeyDown.bind(this);
        }

        /**
         * Xuất bản tờ báo với số liệu thống kê tùy biến
         */
        publish(data = {}) {
            const stats = Object.assign({
                headline: 'AMAZING STUDENT DELIVERS 100% CLEARANCE!',
                subhead: 'PERFECT TRANSCRIPTION EARNS HONORS & BIG BUCKS!',
                score: 18450,
                accuracy: 98.4,
                wordsWritten: 240,
                citationsAvoided: 0,
                article1: 'Grestin Ministry reports unprecedented transcription precision. Not a single consonant cluster was misheard during today\'s grueling acoustic examination.',
                article2: 'Mysterious phonetic vandalism baffles local authorities as final -ed endings and third-person -s traps were flawlessly disarmed.'
            }, data);

            this.close(); // Clean up if open
            this._buildDOM(stats);
            this.isOpen = true;

            // Chạy âm thanh vinh danh Coin-Op Chime
            if (window.App && window.App.PixelSFX) {
                window.App.PixelSFX.playCoinOpChime();
            }

            // Lắng nghe phím ESC
            if (typeof window !== 'undefined') {
                window.addEventListener('keydown', this._handleKeyDown);
            }
        }

        _buildDOM(stats) {
            if (!this.mountPoint) return;

            const modal = document.createElement('div');
            modal.id = 'pixelGazetteModal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none overflow-y-auto';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-label', 'The Daily Lyre Extra Newspaper');

            modal.innerHTML = `
                <div class="pixel-newspaper-sheet max-w-2xl w-full bg-[#f4ecd8] text-[#1c1917] border-4 border-[#1c1917] p-4 sm:p-6 shadow-[8px_8px_0px_0px_#000000] animate-newspaper-spin relative space-y-3">
                    
                    <!-- Close button in top right -->
                    <button type="button" id="btnGazetteClose" class="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white font-bold text-xs border-2 border-black flex items-center justify-center hover:bg-red-700 shadow-[2px_2px_0px_0px_#000] z-10" aria-label="Đóng báo">
                        ✕
                    </button>

                    <!-- Top Arcade Header -->
                    <div class="flex items-center justify-between border-b-2 border-black pb-1 text-[9px] px-font-arcade text-[#78350f]">
                        <span>INSERT COINS · 1 COIN PER CREDIT</span>
                        <span>MORNING FINAL · 1984 ATARI VINTAGE</span>
                    </div>

                    <!-- Masthead Title -->
                    <div class="text-center border-b-4 border-double border-black py-2 space-y-0.5">
                        <div class="flex items-center justify-center gap-3">
                            <span class="px-font-arcade text-xs font-bold text-red-700">EXTRA! EXTRA!</span>
                            <h1 class="text-2xl sm:text-3xl font-serif font-black tracking-widest uppercase">The Daily Lyre</h1>
                            <span class="px-font-arcade text-xs font-bold text-red-700">EXTRA! EXTRA!</span>
                        </div>
                        <p class="text-[9px] font-mono tracking-wider text-gray-700">
                            © 1984 ATARI GAMES & LYRE ACOUSTIC LAB · ALL RIGHTS RESERVED
                        </p>
                    </div>

                    <!-- Main Banner Headline -->
                    <div class="text-center border-b-2 border-black pb-2 space-y-1">
                        <h2 class="px-font-arcade text-sm sm:text-base font-bold text-[#0f172a] leading-snug">
                            ${stats.headline}
                        </h2>
                        <div class="text-[10px] font-mono font-bold tracking-wide uppercase text-gray-800">
                            ★ ${stats.subhead} ★
                        </div>
                    </div>

                    <!-- Newspaper 3-Column Story Layout -->
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start border-b-2 border-black pb-3">
                        <!-- Left Column: Story 1 (sm:col-span-4) -->
                        <div class="sm:col-span-4 space-y-1.5 text-[11px] font-mono leading-relaxed border-b sm:border-b-0 sm:border-r border-gray-400 pb-2 sm:pb-0 sm:pr-2">
                            <h3 class="px-font-arcade text-[9px] font-bold uppercase text-red-800">
                                D.A.T. CHOSEN STUDENT OF THE MONTH!
                            </h3>
                            <p class="text-justify text-gray-900">${stats.article1}</p>
                            <p class="text-justify text-gray-700 italic">"It was a rough recording, but pure acoustic determination saved the day!"</p>
                        </div>

                        <!-- Center Column: Vintage Pixel Artwork (sm:col-span-4) -->
                        <div class="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-[#e2d5b5] border-2 border-black text-center space-y-1.5">
                            <div class="w-24 h-24 sm:w-28 sm:h-28 border-2 border-black bg-[#1e293b] flex items-center justify-center relative overflow-hidden shadow-[3px_3px_0px_0px_#000]">
                                <svg class="w-full h-full" viewBox="0 0 32 32" shape-rendering="crispEdges">
                                    <!-- Paperboy cap & face -->
                                    <rect x="8" y="4" width="16" height="5" fill="#eab308" />
                                    <rect x="6" y="7" width="20" height="3" fill="#ca8a04" />
                                    <rect x="8" y="10" width="16" height="10" fill="#fde047" />
                                    <!-- Eyes & Smile -->
                                    <rect x="11" y="13" width="2" height="3" fill="#0f172a" />
                                    <rect x="19" y="13" width="2" height="3" fill="#0f172a" />
                                    <rect x="13" y="17" width="6" height="2" fill="#0f172a" />
                                    <!-- Blue Shirt & Rolled Newspaper -->
                                    <rect x="8" y="20" width="16" height="10" fill="#2563eb" />
                                    <rect x="18" y="16" width="8" height="14" fill="#ffffff" />
                                    <rect x="19" y="17" width="6" height="12" fill="#cbd5e1" />
                                    <rect x="20" y="20" width="4" height="2" fill="#000000" />
                                    <rect x="20" y="24" width="4" height="2" fill="#000000" />
                                </svg>
                            </div>
                            <span class="px-font-arcade text-[8px] font-bold text-gray-800">
                                [AMAZING PAPERBOY DELIVERS]
                            </span>
                        </div>

                        <!-- Right Column: Story 2 & Vandalism (sm:col-span-4) -->
                        <div class="sm:col-span-4 space-y-1.5 text-[11px] font-mono leading-relaxed sm:pl-2">
                            <h3 class="px-font-arcade text-[9px] font-bold uppercase text-red-800">
                                MYSTERIOUS VANDALISM BAFFLES RESIDENTS!
                            </h3>
                            <p class="text-justify text-gray-900">${stats.article2}</p>
                            <p class="text-justify text-gray-700">All windows intact. Daily newspaper safely landed on customer doorsteps.</p>
                        </div>
                    </div>

                    <!-- Bottom Scoreboard Strip (Paperboy High Score Style) -->
                    <div class="bg-black text-amber-300 p-2.5 border-2 border-black flex flex-wrap items-center justify-between gap-2 px-font-arcade text-[10px]">
                        <div>SCORE: <span class="text-white font-bold">${stats.score}</span></div>
                        <div>ACCURACY: <span class="text-emerald-400 font-bold">${stats.accuracy}%</span></div>
                        <div>WORDS: <span class="text-white font-bold">${stats.wordsWritten}</span></div>
                        <div>CITATIONS: <span class="text-green-400 font-bold">${stats.citationsAvoided}</span></div>
                    </div>

                    <!-- Action Controls -->
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button type="button" id="btnGazetteCoin" class="pixel-btn pixel-btn-amber !py-2 !px-4 text-[9px] flex items-center gap-1.5">
                            <span>🪙</span> NHẬN THƯỞNG 1 COIN CREDIT (SPACE)
                        </button>
                        <button type="button" id="btnGazetteDismiss" class="pixel-btn !py-2 !px-4 text-[9px]">
                            ĐÓNG BÁO (ESC)
                        </button>
                    </div>
                </div>
            `;

            this.mountPoint.appendChild(modal);
            this.modalEl = modal;

            // Bind events
            modal.querySelector('#btnGazetteClose').addEventListener('click', () => this.close());
            modal.querySelector('#btnGazetteDismiss').addEventListener('click', () => this.close());

            const coinBtn = modal.querySelector('#btnGazetteCoin');
            coinBtn.addEventListener('click', () => {
                if (window.App && window.App.PixelSFX) {
                    window.App.PixelSFX.playCoinOpChime();
                }
                coinBtn.disabled = true;
                coinBtn.innerHTML = '<span>✅</span> ĐÃ NHẬN 1 CREDIT!';
                coinBtn.classList.add('!bg-green-700');
            });

            // Click outside sheet closes modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }

        _handleKeyDown(e) {
            if (!this.isOpen) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.close();
            } else if (e.key === ' ' || e.key === 'Enter') {
                const coinBtn = this.modalEl ? this.modalEl.querySelector('#btnGazetteCoin') : null;
                if (coinBtn && !coinBtn.disabled) {
                    e.preventDefault();
                    coinBtn.click();
                }
            }
        }

        close() {
            if (this.modalEl && this.modalEl.parentNode) {
                this.modalEl.parentNode.removeChild(this.modalEl);
            }
            this.modalEl = null;
            this.isOpen = false;
            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', this._handleKeyDown);
            }
            if (typeof this.onClose === 'function') {
                this.onClose();
            }
        }
    }

    /**
     * ============================================================================
     * LYRE STUDIO — CLASS 8 APARTMENT DAY SUMMARY SCREEN (STAGE 9)
     * Papers, Please authentic end-of-shift ledger & survival economy:
     * - Shift earnings: $5 per correct entrant
     * - Citations penalty: first 2 are warnings ($0), 3rd onward -$5 each
     * - Fixed Rent: -$20
     * - Checkbox Food: -$10 (unchecked -> Family hungry)
     * - Checkbox Heat: -$10 (unchecked -> Family cold)
     * - Medicine: -$15 (if family sick)
     * - Live savings calculation & Bankruptcy check (< $0)
     * ============================================================================
     */
    class PixelDaySummary {
        constructor(options = {}) {
            this.mountPoint = typeof options.mountPoint === 'string'
                ? document.querySelector(options.mountPoint)
                : (options.mountPoint || (typeof document !== 'undefined' ? document.body : null));
            this.onNextDay = options.onNextDay || null;
            this.modalEl = null;
            this.isOpen = false;
            this._handleKeyDown = this._handleKeyDown.bind(this);
            this.data = null;
        }

        show(shiftData = {}) {
            const defaults = {
                dayNumber: 1,
                date: '82.11.26',
                clearedCount: 8,
                salary: 40,
                bonus: 10,
                citationsCount: 1,
                fine: 0,
                startingSavings: 25,
                rent: 20,
                food: 10,
                heat: 10,
                medicine: 0,
                foodEnabled: true,
                heatEnabled: true,
                medicineEnabled: false,
                family: {
                    wife: 'Khỏe mạnh',
                    son: 'Khỏe mạnh',
                    uncle: 'Khỏe mạnh'
                }
            };
            this.data = Object.assign(defaults, shiftData);
            if (this.data.citationsCount > 2) {
                this.data.fine = (this.data.citationsCount - 2) * 5;
            } else {
                this.data.fine = 0;
            }

            this.close();
            this._buildDOM();
            this.isOpen = true;

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx && typeof sfx.playCoinOpChime === 'function') {
                sfx.playCoinOpChime();
            }

            if (typeof window !== 'undefined') {
                window.addEventListener('keydown', this._handleKeyDown);
            }
        }

        _calculateTotal() {
            const d = this.data;
            const income = d.salary + (d.bonus || 0);
            const foodCost = d.foodEnabled ? d.food : 0;
            const heatCost = d.heatEnabled ? d.heat : 0;
            const medCost = d.medicineEnabled ? d.medicine : 0;
            const expenses = d.rent + foodCost + heatCost + medCost + d.fine;
            return d.startingSavings + income - expenses;
        }

        _buildDOM() {
            if (!this.mountPoint || typeof document === 'undefined') return;

            const d = this.data;
            const modal = document.createElement('div');
            modal.id = 'pixelDaySummaryModal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');

            const total = this._calculateTotal();
            const fineNotice = d.citationsCount <= 2
                ? `<span class="text-emerald-400 font-bold text-[9px]">(${d.citationsCount} cảnh cáo · $0)</span>`
                : `<span class="text-red-400 font-bold text-[9px]">(${d.citationsCount} lỗi · -$${d.fine})</span>`;

            modal.innerHTML = `
                <div class="pixel-apartment-sheet max-w-xl w-full p-4 sm:p-6 text-slate-200 font-mono space-y-4 shadow-2xl relative">
                    <!-- Header -->
                    <div class="border-b-2 border-amber-600/40 pb-2 flex items-center justify-between">
                        <div>
                            <span class="text-amber-400 text-xs font-bold tracking-widest uppercase">CĂN HỘ HẠNG 8 · ĐÔNG GRESTIN</span>
                            <h2 class="text-base sm:text-lg font-bold text-white px-font-arcade mt-0.5">TỔNG KẾT NGÀY #${d.dayNumber} · ${d.date}</h2>
                        </div>
                        <span class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                    </div>

                    <!-- Ledger Table -->
                    <div class="space-y-1.5 text-xs bg-black/40 p-3 border border-gray-800 rounded">
                        <div class="flex justify-between border-b border-gray-700/60 pb-1">
                            <span class="text-gray-400">Số dư đầu ngày:</span>
                            <b class="text-white">$${d.startingSavings}</b>
                        </div>
                        <div class="flex justify-between text-emerald-400">
                            <span>Lương ca trực (${d.clearedCount} người hợp lệ):</span>
                            <b>+$${d.salary}</b>
                        </div>
                        ${d.bonus > 0 ? `
                        <div class="flex justify-between text-cyan-300">
                            <span>Thưởng nghiệp vụ âm học:</span>
                            <b>+$${d.bonus}</b>
                        </div>` : ''}
                        <div class="flex justify-between text-red-400">
                            <span>Tiền phạt M.O.A. ${fineNotice}:</span>
                            <b>-$${d.fine}</b>
                        </div>
                        <div class="flex justify-between text-amber-300">
                            <span>Tiền thuê nhà (Rent - Cố định):</span>
                            <b>-$${d.rent}</b>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                                <input type="checkbox" id="chkDayFood" ${d.foodEnabled ? 'checked' : ''} class="accent-amber-500 w-3.5 h-3.5">
                                <span>Tiền ăn (Food):</span>
                            </label>
                            <b class="${d.foodEnabled ? 'text-amber-400' : 'text-gray-500 line-through'}">-$${d.food}</b>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                                <input type="checkbox" id="chkDayHeat" ${d.heatEnabled ? 'checked' : ''} class="accent-amber-500 w-3.5 h-3.5">
                                <span>Tiền sưởi ấm mùa đông (Heat -15°C):</span>
                            </label>
                            <b class="${d.heatEnabled ? 'text-amber-400' : 'text-gray-500 line-through'}">-$${d.heat}</b>
                        </div>
                        ${d.medicine > 0 ? `
                        <div class="flex items-center justify-between">
                            <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                                <input type="checkbox" id="chkDayMedicine" ${d.medicineEnabled ? 'checked' : ''} class="accent-red-500 w-3.5 h-3.5">
                                <span>Tiền thuốc men (Medicine):</span>
                            </label>
                            <b class="${d.medicineEnabled ? 'text-red-400' : 'text-gray-500 line-through'}">-$${d.medicine}</b>
                        </div>` : ''}
                        <div class="flex justify-between border-t-2 border-gray-600 pt-2 text-sm">
                            <span class="font-bold text-white">SỐ DƯ MANG SANG NGÀY HÔM SAU:</span>
                            <b id="txtDayFinalBalance" class="text-base font-bold ${total >= 0 ? 'text-emerald-400' : 'text-red-500 animate-pulse'}">$${total}</b>
                        </div>
                    </div>

                    <!-- Family Status Section -->
                    <div class="p-2.5 bg-black/30 border border-gray-800 rounded text-[11px] space-y-1">
                        <span class="text-gray-400 uppercase text-[9px] font-bold block mb-1">TÌNH TRẠNG NGƯỜI THÂN:</span>
                        <div class="grid grid-cols-3 gap-2 text-center" id="familyStatusGrid">
                            <div class="p-1.5 bg-gray-900 border border-gray-700 rounded">
                                <span class="text-gray-400 block text-[9px]">Vợ</span>
                                <b id="statusWife" class="${d.foodEnabled && d.heatEnabled ? 'text-emerald-400' : 'text-amber-400'}">${d.foodEnabled && d.heatEnabled ? 'Khỏe mạnh' : (!d.foodEnabled ? 'Đói' : 'Lạnh')}</b>
                            </div>
                            <div class="p-1.5 bg-gray-900 border border-gray-700 rounded">
                                <span class="text-gray-400 block text-[9px]">Con trai</span>
                                <b id="statusSon" class="${d.foodEnabled && d.heatEnabled ? 'text-emerald-400' : 'text-amber-400'}">${d.foodEnabled && d.heatEnabled ? 'Khỏe mạnh' : (!d.foodEnabled ? 'Đói' : 'Lạnh')}</b>
                            </div>
                            <div class="p-1.5 bg-gray-900 border border-gray-700 rounded">
                                <span class="text-gray-400 block text-[9px]">Chú</span>
                                <b id="statusUncle" class="${d.heatEnabled ? 'text-emerald-400' : 'text-red-400'}">${d.heatEnabled ? 'Ấm áp' : 'Bị cảm lạnh'}</b>
                            </div>
                        </div>
                    </div>

                    <!-- Bankruptcy Warning (if balance < 0) -->
                    <div id="boxDayBankruptcy" class="${total < 0 ? '' : 'hidden'} p-2.5 bg-red-950/80 border-2 border-red-600 rounded text-red-300 text-xs font-bold text-center animate-pulse">
                        ⚠️ CẢNH BÁO PHÁ SẢN: Bạn không đủ tiền nộp tiền thuê nhà! Nếu tiếp tục nợ, Bộ Nội Vụ sẽ bắt giữ bạn.
                    </div>

                    <!-- Footer Action -->
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800">
                        <span class="text-[9px] text-gray-400">Bấm Space hoặc Enter để mở nhật báo</span>
                        <button type="button" id="btnDayNextShift" class="pixel-btn pixel-btn-amber !py-2 !px-4 text-xs font-bold cursor-pointer">
                            📰 PHÁT HÀNH NHẬT BÁO SÁNG MAI (ENTER)
                        </button>
                    </div>
                </div>
            `;

            this.mountPoint.appendChild(modal);
            this.modalEl = modal;

            // Wire up interactive toggles
            const chkFood = modal.querySelector('#chkDayFood');
            const chkHeat = modal.querySelector('#chkDayHeat');
            const chkMed = modal.querySelector('#chkDayMedicine');
            const txtBal = modal.querySelector('#txtDayFinalBalance');
            const boxBank = modal.querySelector('#boxDayBankruptcy');
            const statusWife = modal.querySelector('#statusWife');
            const statusSon = modal.querySelector('#statusSon');
            const statusUncle = modal.querySelector('#statusUncle');

            const updateBalance = () => {
                if (chkFood) d.foodEnabled = chkFood.checked;
                if (chkHeat) d.heatEnabled = chkHeat.checked;
                if (chkMed) d.medicineEnabled = chkMed.checked;

                const curTotal = this._calculateTotal();
                if (txtBal) {
                    txtBal.textContent = `$${curTotal}`;
                    txtBal.className = `text-base font-bold ${curTotal >= 0 ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`;
                }
                if (boxBank) {
                    boxBank.classList.toggle('hidden', curTotal >= 0);
                }

                if (statusWife && statusSon && statusUncle) {
                    const healthy = d.foodEnabled && d.heatEnabled;
                    statusWife.textContent = healthy ? 'Khỏe mạnh' : (!d.foodEnabled ? 'Đói' : 'Lạnh');
                    statusWife.className = healthy ? 'text-emerald-400' : 'text-amber-400';
                    statusSon.textContent = healthy ? 'Khỏe mạnh' : (!d.foodEnabled ? 'Đói' : 'Lạnh');
                    statusSon.className = healthy ? 'text-emerald-400' : 'text-amber-400';
                    statusUncle.textContent = d.heatEnabled ? 'Ấm áp' : 'Bị cảm lạnh';
                    statusUncle.className = d.heatEnabled ? 'text-emerald-400' : 'text-red-400';
                }

                const sfx = (root.App && root.App.PixelSFX) || null;
                if (sfx && typeof sfx.playTypewriterBlip === 'function') sfx.playTypewriterBlip();
            };

            if (chkFood) chkFood.addEventListener('change', updateBalance);
            if (chkHeat) chkHeat.addEventListener('change', updateBalance);
            if (chkMed) chkMed.addEventListener('change', updateBalance);

            modal.querySelector('#btnDayNextShift')?.addEventListener('click', () => {
                this.close();
                if (typeof this.onNextDay === 'function') {
                    this.onNextDay(this.data);
                }
            });
        }

        _handleKeyDown(e) {
            if (!this.isOpen) return;
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                const btn = this.modalEl ? this.modalEl.querySelector('#btnDayNextShift') : null;
                if (btn) btn.click();
                else this.close();
            }
        }

        close() {
            if (this.modalEl && this.modalEl.parentNode) {
                this.modalEl.parentNode.removeChild(this.modalEl);
            }
            this.modalEl = null;
            this.isOpen = false;
            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', this._handleKeyDown);
            }
        }
    }

    root.App = root.App || {};
    root.App.PixelGazette = PixelGazette;
    root.App.PixelDaySummary = PixelDaySummary;

})(typeof window !== 'undefined' ? window : global);

