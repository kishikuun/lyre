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

    root.App = root.App || {};
    root.App.PixelGazette = PixelGazette;

})(typeof window !== 'undefined' ? window : global);
