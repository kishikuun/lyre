/**
 * ============================================================================
 * LYRE STUDIO — RETRO PIXEL GAME LOOP ORCHESTRATION ENGINE
 * Version 4.0 (Acoustic Forensic Workbench)
 * 
 * Bridges core application logic with the Retro Pixel Game visual suite:
 * - Manages skin mode transitions: Swiss Editorial (Classic) <-> Retro Pixel (Dark/Paper).
 * - Mounts and coordinates:
 *   1. Deltarune Dialogue Box (Typewriter, Emotion Sprites, Action Choices).
 *   2. Papers, Please Inspection Desk (Entry Permit, Spring-Loaded Stamps, Citation Printer).
 *   3. Ace Attorney Starburst Badges ([HOLD IT!] and [OBJECTION!]).
 *   4. Return of the Obra Dinn Indelible Ink Lock-in.
 *   5. Deltarune RPG Character Stats Sheet (ATK, DEF, MAGIC, GUTS, Level-up).
 *   6. 1984 Atari Paperboy Gazette Round-End Celebration Modal.
 * - 100% offline, zero external runtime dependency, mobile-touch WCAG compliant.
 * ============================================================================
 */

(function (root) {
    'use strict';

    class PixelGameLoop {
        constructor() {
            this.isInitialized = false;
            this.isEnabled = false;
            this.currentSkin = 'pixel-dark'; // 'pixel-dark' | 'pixel-paper'

            this.sfx = null;
            this.dialogue = null;
            this.desk = null;
            this.stats = null;
            this.gazette = null;

            this.dom = {
                toggleBtn: null,
                toggleBtnText: null,
                workbench: null,
                dialogueSlot: null,
                deskContainer: null,
                permitCard: null,
                permitInput: null,
                stampSlot: null,
                citationMount: null,
                rulebookContainer: null,
                statsDrawerModal: null,
                statsMount: null,
                btnOpenStats: null,
                btnHoldIt: null,
                btnObjection: null,
                btnGavel: null,
                starburstSlot: null,
                charCountBadge: null,
                wordCountBadge: null
            };
        }

        /**
         * Khởi động Game Loop Engine và gắn kết vào DOM
         */
        init() {
            if (this.isInitialized) return;

            // 1. Khởi tạo Web Audio SFX
            if (root.App && root.App.PixelSFX) {
                this.sfx = root.App.PixelSFX;
                this.sfx.init();
            }

            // 2. Khôi phục tùy chọn skin đã lưu
            try {
                const savedEnabled = localStorage.getItem('lyre_pixel_mode_enabled');
                const savedSkin = localStorage.getItem('lyre_pixel_skin');
                if (savedSkin === 'pixel-paper' || savedSkin === 'pixel-dark') {
                    this.currentSkin = savedSkin;
                }
                this.isEnabled = savedEnabled === 'true';
            } catch (e) {
                this.isEnabled = false;
            }

            // 3. Gắn nút chuyển chế độ vào Header nếu chưa có
            this._setupHeaderToggleButton();

            // 4. Xây dựng cấu trúc DOM Game Workbench
            this._injectGameWorkbench();

            // 5. Khởi tạo các sub-controller
            this._initSubControllers();

            // 6. Kích hoạt skin nếu đang bật
            if (this.isEnabled) {
                this.activatePixelMode();
            }

            this.isInitialized = true;
        }

        /**
         * Tạo nút bật/tắt chế độ Game Retro Pixel trên thanh công cụ
         */
        _setupHeaderToggleButton() {
            let btn = document.getElementById('btnTogglePixelMode');
            if (!btn) {
                const headerRight = document.querySelector('header .tactile-rocker') || document.querySelector('header > div:last-child');
                if (headerRight) {
                    btn = document.createElement('button');
                    btn.id = 'btnTogglePixelMode';
                    btn.className = 'tactile-btn flex items-center gap-1.5 text-amber-300 border-amber-500/40 bg-amber-950/20 hover:bg-amber-900/40 transition select-none';
                    btn.title = 'Bật/Tắt chế độ Game Retro Pixel (Deltarune / Papers, Please / Paperboy)';
                    btn.innerHTML = `
                        <span class="text-xs">🕹️</span>
                        <span class="hidden sm:inline font-bold" id="btnTogglePixelModeText">GAME PIXEL</span>
                    `;
                    headerRight.parentNode.insertBefore(btn, headerRight.nextSibling);
                }
            }

            if (btn) {
                this.dom.toggleBtn = btn;
                this.dom.toggleBtnText = btn.querySelector('#btnTogglePixelModeText') || btn;
                btn.addEventListener('click', () => {
                    this.togglePixelMode();
                });
            }
        }

        /**
         * Xây dựng vùng bàn làm việc Pixel Game Workbench trong #workspaceArea
         */
        _injectGameWorkbench() {
            const workspaceArea = document.getElementById('workspaceArea');
            if (!workspaceArea) return;

            let workbench = document.getElementById('pixelGameWorkbench');
            if (!workbench) {
                workbench = document.createElement('div');
                workbench.id = 'pixelGameWorkbench';
                workbench.className = 'hidden flex-col gap-5 select-none animate-fade-in';

                workbench.innerHTML = `
                    <!-- 1. Top Ribbon: Deltarune Dialogue Guidance Bar -->
                    <div id="gameDialogueSlot" class="w-full">
                        <!-- PixelDialogue mounts here -->
                    </div>

                    <!-- 2. Papers, Please Inspection Desk & Rulebook Rig -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" id="gameDeskContainer">
                        
                        <!-- Left Column: Entry Permit Visa & Mechanical Stamps (8 cols) -->
                        <div class="lg:col-span-8 pixel-permit-card space-y-4 relative" id="gamePermitCard">
                            <div class="pixel-paperclip" title="Kẹp kim loại giữ tờ khai nhập cảnh"></div>

                            <!-- Header Strip -->
                            <div class="flex items-center justify-between border-b border-gray-600/40 pb-2 pl-6">
                                <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span class="px-font-arcade text-[10px] tracking-wider text-amber-300" id="gamePassportHeader">ENTRY PERMIT · AR-8304</span>
                                </div>
                                <div class="flex items-center gap-3 text-xs font-mono text-gray-400">
                                    <span id="gamePermitDuration">THỜI LƯỢNG: 0.0s</span>
                                    <span id="gameCharCountBadge" class="text-amber-400 font-bold">0 KÝ TỰ</span>
                                </div>
                            </div>

                            <!-- Provenance Info Strip -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono bg-black/10 p-2 border border-gray-600/30 rounded">
                                <div><span class="text-gray-500">QUỐC TỊCH:</span> <b class="text-gray-200">ARSTOTZKA</b></div>
                                <div><span class="text-gray-500">GIỌNG NÓI:</span> <b class="text-gray-200" id="gameSpeakerBadge">NATIVE US</b></div>
                                <div><span class="text-gray-500">TỐC ĐỘ:</span> <b class="text-gray-200" id="gameSpeedBadge">1.0x NORMAL</b></div>
                                <div><span class="text-gray-500">NHIỆM VỤ:</span> <b class="text-emerald-400">CHÍNH TẢ</b></div>
                            </div>

                            <!-- Transcription Input -->
                            <div class="space-y-1.5">
                                <label class="text-xs font-mono text-gray-400 flex items-center justify-between">
                                    <span>Lời khai âm thanh (Chép chính tả):</span>
                                    <span id="gameWordCountBadge" class="text-gray-400">0 từ</span>
                                </label>
                                <textarea id="gamePermitInput" rows="3"
                                    class="w-full bg-[var(--px-bg-deep)] border-2 border-[var(--px-border-shadow)] p-3 px-font-study text-[var(--px-paper-text)] outline-none focus:border-amber-500 transition-colors shadow-inner text-base"
                                    placeholder="Lắng nghe và chép lại lời khai của người xuất nhập cảnh..."></textarea>
                            </div>

                            <!-- Stamp Target Area & Spring Controls -->
                            <div class="min-h-[76px] flex flex-wrap items-center justify-between gap-3 p-3 bg-black/20 border border-dashed border-gray-600/50 rounded">
                                <div class="text-xs font-mono text-gray-400">
                                    <span>CON DẤU PHÊ DUYỆT:</span>
                                    <div id="gameStampSlot" class="mt-1">
                                        <span class="text-xs italic text-gray-500">Chưa đóng dấu phê duyệt.</span>
                                    </div>
                                </div>

                                <div class="flex flex-wrap items-center gap-2">
                                    <button id="btnGameStampApproved" class="pixel-btn pixel-btn-green flex items-center gap-1.5 cursor-pointer select-none" title="Bấm giữ để nén lò xo, thả tay để dập lún mặt bàn">
                                        <span class="w-3 h-3 rounded-full stamp-handle-wood inline-block"></span>
                                        <span>[✓] APPROVED (LÒ XO)</span>
                                    </button>
                                    <button id="btnGameStampDenied" class="pixel-btn pixel-btn-red flex items-center gap-1.5 cursor-pointer select-none" title="Bấm giữ để nén lò xo, thả tay để dập phạt">
                                        <span class="w-3 h-3 rounded-full stamp-handle-wood inline-block"></span>
                                        <span>[✕] DENIED (LÒ XO)</span>
                                    </button>
                                    <button id="btnGameClearStamps" class="pixel-btn !py-1.5 !px-2 text-[8px] bg-gray-700" title="Gỡ dấu">
                                        GỠ DẤU
                                    </button>
                                </div>
                            </div>

                            <!-- Ace Attorney Reaction Bar -->
                            <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-600/30">
                                <div class="flex items-center gap-2">
                                    <button id="btnGameHoldIt" class="pixel-btn pixel-btn-amber !py-1 !px-2.5 text-[9px] flex items-center gap-1" title="Lùi lại 2 giây để đối chiếu âm thanh">
                                        <span>✋</span> [HOLD IT!] (-2s)
                                    </button>
                                    <button id="btnGameObjection" class="pixel-btn pixel-btn-red !py-1 !px-2.5 text-[9px] flex items-center gap-1" title="Chỉ ra bẫy âm vị nuốt âm">
                                        <span>⚡</span> [OBJECTION!]
                                    </button>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button id="btnOpenStatsModal" class="pixel-btn !py-1 !px-2.5 text-[9px] flex items-center gap-1 text-amber-300">
                                        <span>❤️</span> HỒ SƠ RPG
                                    </button>
                                    <button id="btnTriggerGazetteManual" class="pixel-btn !py-1 !px-2.5 text-[9px] flex items-center gap-1 text-cyan-300">
                                        <span>📰</span> XUẤT BẢN BÁO
                                    </button>
                                </div>
                            </div>

                            <div id="gameStarburstSlot" class="h-10 flex items-center justify-center"></div>
                        </div>

                        <!-- Right Column: Citation Printer Slot & Rulebook Ledger (4 cols) -->
                        <div class="lg:col-span-4 space-y-4">
                            <!-- Citation Printer Slot -->
                            <div class="bg-black/40 border-2 border-gray-800 p-2.5 rounded space-y-1">
                                <div class="flex items-center justify-between text-[9px] px-font-arcade text-red-400">
                                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> MÁY IN PHIẾU PHẠT</span>
                                    <span class="text-gray-500">KHE TRẦN</span>
                                </div>
                                <div id="gameCitationMount" class="max-h-36 overflow-y-auto space-y-2 pt-1">
                                    <span class="text-[10px] font-mono text-gray-500 italic block">Chưa có vi phạm nào.</span>
                                </div>
                            </div>

                            <!-- 4-Tab Rulebook -->
                            <div class="pixel-spiral-notebook p-3 space-y-2.5" id="gameRulebookSlot">
                                <div class="pixel-spiral-coil"></div>
                                <div class="flex items-center justify-between border-b border-gray-600/30 pb-1.5 pl-3">
                                    <span class="px-font-arcade text-[9px] text-amber-400">SỔ TAY THANH TRA</span>
                                    <span class="text-[9px] font-mono text-gray-400">OBRA DINN V.4</span>
                                </div>

                                <div class="pixel-notebook-tabs pl-3">
                                    <button class="pixel-tab-btn is-active" data-tab="rules">QUY TẮC</button>
                                    <button class="pixel-tab-btn" data-tab="phonetics">BẪY ÂM</button>
                                    <button class="pixel-tab-btn" data-tab="vocab">TỪ VỰNG</button>
                                    <button class="pixel-tab-btn" data-tab="config">CẤU HÌNH</button>
                                </div>

                                <div class="rulebook-pane space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="rules">
                                    <ul class="list-disc pl-3 space-y-1 text-gray-300 text-[11px]">
                                        <li>Nghe kỹ từng cụm phụ âm đuôi.</li>
                                        <li>Bấm <b>Space</b> để phát/dừng lời khai.</li>
                                        <li>Đạt <b>&gt;= 80%</b> để được dập APPROVED.</li>
                                    </ul>
                                </div>

                                <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="phonetics">
                                    <div class="p-1.5 bg-black/10 border border-gray-700/50 space-y-1 text-[11px]">
                                        <b class="text-amber-400">Bẫy đuôi -ed:</b>
                                        <p class="text-gray-300">Âm vô thanh (p, k, f, s, sh, ch) + -ed = /t/.</p>
                                    </div>
                                </div>

                                <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="vocab">
                                    <p class="text-[11px] text-gray-400 italic">Từ vựng đã xác nhận sẽ được khóa mực vĩnh viễn.</p>
                                </div>

                                <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="config">
                                    <div class="p-1.5 bg-black/10 border border-gray-700/50 space-y-1 text-[10px]">
                                        <label class="flex items-center gap-1.5 cursor-pointer text-gray-300">
                                            <input type="checkbox" id="chkGameShake" checked class="accent-amber-500">
                                            <span>Rung bàn khi đập dấu</span>
                                        </label>
                                        <label class="flex items-center gap-1.5 cursor-pointer text-gray-300">
                                            <input type="checkbox" id="chkGameBlips" checked class="accent-amber-500">
                                            <span>Âm bíp gõ thoại</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RPG Stats Sheet Modal (Hidden until triggered) -->
                    <div id="gameStatsModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
                        <div class="max-w-3xl w-full relative">
                            <button id="btnCloseStatsModal" class="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white font-bold text-xs border-2 border-black flex items-center justify-center hover:bg-red-700 z-10 shadow-[2px_2px_0px_#000]">
                                ✕
                            </button>
                            <div id="gameStatsSheetMount"></div>
                        </div>
                    </div>
                `;

                // Chèn lên trước #dictationSection
                const dictSection = document.getElementById('dictationSection');
                if (dictSection) {
                    workspaceArea.insertBefore(workbench, dictSection);
                } else {
                    workspaceArea.appendChild(workbench);
                }
            }

            this.dom.workbench = workbench;
            this.dom.dialogueSlot = workbench.querySelector('#gameDialogueSlot');
            this.dom.deskContainer = workbench.querySelector('#gameDeskContainer');
            this.dom.permitCard = workbench.querySelector('#gamePermitCard');
            this.dom.permitInput = workbench.querySelector('#gamePermitInput');
            this.dom.stampSlot = workbench.querySelector('#gameStampSlot');
            this.dom.citationMount = workbench.querySelector('#gameCitationMount');
            this.dom.rulebookContainer = workbench.querySelector('#gameRulebookSlot');
            this.dom.statsDrawerModal = workbench.querySelector('#gameStatsModal');
            this.dom.statsMount = workbench.querySelector('#gameStatsSheetMount');
            this.dom.btnOpenStats = workbench.querySelector('#btnOpenStatsModal');
            this.dom.starburstSlot = workbench.querySelector('#gameStarburstSlot');
            this.dom.charCountBadge = workbench.querySelector('#gameCharCountBadge');
            this.dom.wordCountBadge = workbench.querySelector('#gameWordCountBadge');
        }

        /**
         * Khởi tạo các controller thành phần và gắn các listener
         */
        _initSubControllers() {
            // 1. PixelDesk
            if (root.App && root.App.PixelDesk) {
                this.desk = new root.App.PixelDesk({
                    deskContainer: this.dom.deskContainer,
                    permitCard: this.dom.permitCard,
                    stampTarget: this.dom.stampSlot,
                    rulebookContainer: this.dom.rulebookContainer,
                    citationContainer: this.dom.citationMount
                });

                // Gắn cơ chế lò xo dập lún
                const btnApp = document.getElementById('btnGameStampApproved');
                const btnDen = document.getElementById('btnGameStampDenied');
                if (btnApp) this.desk.bindSpringStamp(btnApp, 'approved');
                if (btnDen) this.desk.bindSpringStamp(btnDen, 'denied', 'BẪY ÂM ĐUÔI -ED');

                const btnClear = document.getElementById('btnGameClearStamps');
                if (btnClear) btnClear.addEventListener('click', () => this.desk.clearStamps());
            }

            // 2. PixelDialogue
            if (root.App && root.App.PixelDialogue) {
                this.dialogue = new root.App.PixelDialogue({
                    container: this.dom.dialogueSlot,
                    speed: 32
                });
            }

            // 3. PixelStats
            if (root.App && root.App.PixelStats && this.dom.statsMount) {
                this.stats = new root.App.PixelStats({
                    container: this.dom.statsMount,
                    onCharacterChange: (char) => {
                        if (this.dialogue) {
                            this.dialogue.say(char.name, `Đã chọn nhân vật \\cY${char.name}\\cW! Sẵn sàng thẩm định âm thanh.`, 'cool');
                        }
                    }
                });
            }

            // 4. PixelGazette
            if (root.App && root.App.PixelGazette) {
                this.gazette = new root.App.PixelGazette({
                    onClose: () => {
                        if (this.dialogue) {
                            this.dialogue.say('Inspector Byte', 'Chào mừng bạn trở lại bàn làm việc. Arstotzka ghi nhận thành tích của bạn!', 'proud');
                        }
                    }
                });
            }

            // 5. Đồng bộ 2 chiều giữa permitInput trong Game Desk và dictationTextarea
            if (this.dom.permitInput) {
                this.dom.permitInput.addEventListener('input', () => {
                    const val = this.dom.permitInput.value;
                    const standardArea = document.getElementById('dictationTextarea');
                    if (standardArea) standardArea.value = val;
                    if (root.App && root.App.state) {
                        root.App.state.standardInputText = val;
                    }
                    this._updateInputCounts();
                });
            }

            // 6. Ace Attorney Quick Triggers
            const btnHoldIt = document.getElementById('btnGameHoldIt');
            if (btnHoldIt) {
                btnHoldIt.addEventListener('click', () => {
                    if (this.sfx) this.sfx.playHoldItSound();
                    if (this.desk) this.desk.triggerScreenShake(this.dom.deskContainer);
                    if (root.App && root.App.AudioEngine) root.App.AudioEngine.rewind(2.0);
                    this._renderStarburst('HOLD IT!', '#ea580c', '#ffffff');
                });
            }

            const btnObj = document.getElementById('btnGameObjection');
            if (btnObj) {
                btnObj.addEventListener('click', () => {
                    if (this.sfx) this.sfx.playGavelKnock();
                    if (this.desk) this.desk.triggerScreenShake(this.dom.deskContainer);
                    this._renderStarburst('OBJECTION!', '#dc2626', '#fde047');
                });
            }

            // 7. Stats Modal Open/Close
            if (this.dom.btnOpenStats && this.dom.statsDrawerModal) {
                this.dom.btnOpenStats.addEventListener('click', () => {
                    this.dom.statsDrawerModal.classList.remove('hidden');
                    if (this.sfx) this.sfx.playTypewriterBlip();
                });
                const btnClose = document.getElementById('btnCloseStatsModal');
                if (btnClose) {
                    btnClose.addEventListener('click', () => {
                        this.dom.statsDrawerModal.classList.add('hidden');
                    });
                }
            }

            // 8. Gazette Manual Trigger
            const btnGaz = document.getElementById('btnTriggerGazetteManual');
            if (btnGaz) {
                btnGaz.addEventListener('click', () => {
                    this.triggerGazetteCelebration();
                });
            }

            // 9. Rulebook Tabs Switcher
            if (this.dom.rulebookContainer && this.desk) {
                const tabs = this.dom.rulebookContainer.querySelectorAll('.pixel-tab-btn');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const tabName = tab.getAttribute('data-tab');
                        this.desk.switchRulebookTab(tabName);
                    });
                });
            }

            // 10. Config Toggles
            const chkShake = document.getElementById('chkGameShake');
            const chkBlips = document.getElementById('chkGameBlips');
            if (chkBlips && this.sfx) {
                chkBlips.addEventListener('change', () => {
                    this.sfx.setTypewriterBlipsEnabled(chkBlips.checked);
                });
            }
        }

        _renderStarburst(text, fillColor, strokeColor) {
            if (!this.dom.starburstSlot) return;
            this.dom.starburstSlot.innerHTML = `
                <div class="starburst-badge">
                    <svg viewBox="0 0 160 48" width="160" height="48">
                        <polygon points="5,24 15,8 35,10 55,4 80,9 105,4 125,10 145,8 155,24 145,40 125,38 105,44 80,39 55,44 35,38 15,40"
                            fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" />
                        <text x="80" y="30" font-family="'Press Start 2P', monospace" font-size="12" fill="${strokeColor}" font-weight="bold" text-anchor="middle">${text}</text>
                    </svg>
                </div>
            `;
            setTimeout(() => {
                if (this.dom.starburstSlot) this.dom.starburstSlot.innerHTML = '';
            }, 1200);
        }

        _updateInputCounts() {
            if (!this.dom.permitInput) return;
            const text = this.dom.permitInput.value;
            if (this.dom.charCountBadge) {
                this.dom.charCountBadge.textContent = `${text.length} KÝ TỰ`;
            }
            if (this.dom.wordCountBadge) {
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                this.dom.wordCountBadge.textContent = `${words} từ`;
            }
        }

        /**
         * Chuyển đổi trạng thái bật/tắt chế độ Game Retro Pixel
         */
        togglePixelMode() {
            this.isEnabled = !this.isEnabled;
            try {
                localStorage.setItem('lyre_pixel_mode_enabled', this.isEnabled ? 'true' : 'false');
            } catch (e) {}

            if (this.isEnabled) {
                this.activatePixelMode();
            } else {
                this.deactivatePixelMode();
            }
        }

        /**
         * Bật chế độ Game Retro Pixel
         */
        activatePixelMode() {
            this.isEnabled = true;
            document.documentElement.setAttribute('data-skin', this.currentSkin);

            if (this.dom.toggleBtnText) {
                this.dom.toggleBtnText.textContent = 'GAME: BẬT';
            }
            if (this.dom.toggleBtn) {
                this.dom.toggleBtn.classList.add('border-green-500/60', 'text-green-300', 'bg-green-950/30');
            }

            if (this.dom.workbench) {
                this.dom.workbench.classList.remove('hidden');
            }

            const dictSection = document.getElementById('dictationSection');
            if (dictSection) {
                dictSection.classList.add('hidden');
            }

            if (this.sfx) {
                this.sfx.playCoinOpChime();
            }

            // Cập nhật câu hiện tại vào Game Desk
            this.syncCurrentSentence();

            // Kích hoạt MGS Codec Oscilloscope trong Shadowing Lab
            const codecSlot = document.getElementById('gameCodecSlot');
            if (codecSlot) {
                codecSlot.classList.remove('hidden');
                this.initCodecOscilloscope(codecSlot);
            }

            if (this.dialogue) {
                this.dialogue.say('Inspector Byte', 'Chào mừng Thanh Tra đến với trạm kiểm soát Grestin! Hãy chuẩn bị tai nghe và con dấu.', 'neutral');
            }
        }

        /**
         * Tắt chế độ Game Retro Pixel (Trở về Swiss Editorial Classic)
         */
        deactivatePixelMode() {
            this.isEnabled = false;
            document.documentElement.removeAttribute('data-skin');

            if (this.dom.toggleBtnText) {
                this.dom.toggleBtnText.textContent = 'GAME PIXEL';
            }
            if (this.dom.toggleBtn) {
                this.dom.toggleBtn.classList.remove('border-green-500/60', 'text-green-300', 'bg-green-950/30');
            }

            if (this.dom.workbench) {
                this.dom.workbench.classList.add('hidden');
            }

            const dictSection = document.getElementById('dictationSection');
            if (dictSection) {
                dictSection.classList.remove('hidden');
            }

            const codecSlot = document.getElementById('gameCodecSlot');
            if (codecSlot) {
                codecSlot.classList.add('hidden');
            }

            if (this.sfx) {
                this.sfx.stopLofiChiptuneBGM();
            }
        }

        /**
         * Đồng bộ câu hiện tại từ App.state vào Game Desk
         */
        syncCurrentSentence() {
            if (!root.App || !root.App.state) return;
            const state = root.App.state;
            const currentSub = state.subs && state.subs[state.currentIdx];

            if (this.dom.permitInput) {
                this.dom.permitInput.value = state.standardInputText || '';
                this._updateInputCounts();
            }

            const passportHeader = document.getElementById('gamePassportHeader');
            if (passportHeader && currentSub) {
                passportHeader.textContent = `ENTRY PERMIT · CÂU #${(state.currentIdx + 1).toString().padStart(2, '0')}`;
            }

            const durationSpan = document.getElementById('gamePermitDuration');
            if (durationSpan && currentSub) {
                const dur = (currentSub.end - currentSub.start).toFixed(1);
                durationSpan.textContent = `THỜI LƯỢNG: ${dur}s`;
            }

            if (this.desk) {
                this.desk.clearStamps();
            }
        }

        /**
         * Hook sự kiện khi người dùng chuyển sang câu mới
         */
        onSentenceChanged(idx) {
            this.syncCurrentSentence();
            if (!this.isEnabled) return;

            if (this.dialogue && root.App && root.App.state) {
                const state = root.App.state;
                const total = state.subs ? state.subs.length : 0;
                this.dialogue.say(
                    'Inspector Byte',
                    `Đang thẩm định hồ sơ \\cY#${idx + 1}/${total}\\cW. Hãy lắng nghe kỹ và chép lời khai vào tờ khai nhập cảnh!`,
                    'neutral'
                );
            }
        }

        /**
         * Hook sự kiện khi chấm điểm câu chép chính tả (Dictation Graded)
         */
        onDictationGraded(diffResult, sentenceText) {
            if (!this.isEnabled) return;

            const accuracy = diffResult.accuracy || 0;

            if (accuracy >= 80) {
                // Đóng dấu APPROVED
                if (this.desk) {
                    this.desk.stampApproved(`ACOUSTIC CLEARANCE ★ ${accuracy}%`);
                }

                // Avatar chúc mừng
                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cGXUẤT SẮC!\\cW Đạt độ chuẩn xác \\cY${accuracy}%\\cW! Con dấu \\cGAPPROVED\\cW đã được cấp phép hợp lệ.`,
                        accuracy >= 95 ? 'cool' : 'proud'
                    );
                }

                // Cập nhật RPG Stats
                if (this.stats) {
                    const char = this.stats.getActiveCharacter();
                    this.stats.updateStats({
                        atk: Math.min(99, char.atk + 1),
                        hp: Math.min(char.maxHp, char.hp + 5)
                    });
                }

                // Kiểm tra hoàn thành toàn bộ bài nghe
                if (root.App && root.App.state) {
                    const state = root.App.state;
                    if (state.subs && state.subs.length > 0 && state.completedSentences && state.completedSentences.size === state.subs.length) {
                        setTimeout(() => {
                            this.triggerGazetteCelebration();
                        }, 1200);
                    }
                }

            } else {
                // Đóng dấu DENIED và in giấy phạt Citation Slip
                const misheardReason = this._diagnosePhoneticDiscrepancy(diffResult, sentenceText);
                if (this.desk) {
                    this.desk.stampDenied(misheardReason);
                }

                // Avatar toát mồ hôi
                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cRCẢNH BÁO VI PHẠM!\\cW Phát hiện sai lệch âm vị: \\cR${misheardReason}\\cW. Phiếu phạt đã được chuyển vào hồ sơ!`,
                        'sweating'
                    );
                }

                // Trừ 1 điểm HP
                if (this.stats) {
                    const char = this.stats.getActiveCharacter();
                    this.stats.updateStats({
                        hp: Math.max(10, char.hp - 10)
                    });
                }
            }
        }

        /**
         * Phân tích lý do vi phạm âm vị để in lên Citation Slip
         */
        _diagnosePhoneticDiscrepancy(diffResult, sentenceText) {
            const text = (sentenceText || '').toLowerCase();
            if (text.includes('ed ') || text.endsWith('ed')) {
                return 'BẪY ÂM ĐUÔI -ED: Bỏ sót âm bật /t/ hoặc /d/';
            }
            if (text.includes("'s") || text.includes("n't")) {
                return 'BẪY DẠNG RÚT GỌN (CONTRACTION): Bỏ sót phụ âm nối';
            }
            if (text.includes('the ') || text.includes('a ') || text.includes('an ')) {
                return 'BẪY MẠO TỪ YẾU: Không nhận diện được âm lướt Schwa /ə/';
            }
            return `LỖI CHÍNH TẢ: Sai lệch ${(100 - (diffResult.accuracy || 0)).toFixed(0)}% so với lời khai gốc`;
        }

        /**
         * Kích hoạt vinh danh bằng Báo Paperboy 1984 Atari
         */
        triggerGazetteCelebration() {
            if (!this.gazette) return;
            const state = (root.App && root.App.state) || {};
            const completed = state.completedSentences ? state.completedSentences.size : 15;
            const total = state.subs ? state.subs.length : 15;

            this.gazette.publish({
                headline: 'AMAZING STUDENT CLEARS ALL GRESTIN AUDIO CHECKPOINTS!',
                subhead: 'PERFECT TRANSCRIPTION EARNS HONORS & BIG BUCKS!',
                score: Math.max(12000, completed * 1500),
                accuracy: 98.6,
                wordsWritten: completed * 16,
                citationsAvoided: this.desk ? this.desk.citations.length : 0
            });
        }

        /**
         * ====================================================================
         * STAGE 7: SHADOWING LAB RETRO GAME COURTROOM & MGS CODEC 140.85
         * ====================================================================
         */

        /**
         * Hook sự kiện khi hoàn tất chấm điểm bản thu Shadowing (Take Evaluation)
         */
        onShadowingEvaluated(data = {}) {
            if (!this.isEnabled) return;

            const rhythmScore = data.rhythmScore || 0;
            const pitchScore = data.pitchScore || rhythmScore;
            const avgScore = Math.round((rhythmScore + pitchScore) / 2);

            if (avgScore >= 80) {
                // Ace Attorney: Lệnh hô [TAKE THAT!] vút cao + búa gõ
                if (this.sfx) {
                    this.sfx.playTakeThatSound();
                }
                if (this.desk) {
                    this.desk.triggerScreenShake(this.dom.deskContainer);
                }
                this._renderTakeThatStarburst();

                // Lời khen từ Inspector Byte
                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cGTAKE THAT!\\cW Giọng nói khớp nhịp \\cY${rhythmScore}%\\cW và cao độ \\cY${pitchScore}%\\cW! Đối chiếu nhân chứng hoàn toàn chuẩn xác.`,
                        avgScore >= 90 ? 'cool' : 'proud'
                    );
                }

                // Cập nhật RPG Stats: Tăng MAGIC & DEF
                if (this.stats) {
                    const char = this.stats.getActiveCharacter();
                    this.stats.updateStats({
                        magic: Math.min(99, char.magic + 2),
                        def: Math.min(99, char.def + 1),
                        hp: Math.min(char.maxHp, char.hp + 5)
                    });
                }

            } else if (avgScore < 70) {
                // Ace Attorney: [OBJECTION!] búa gỗ phản đối
                if (this.sfx) {
                    this.sfx.playGavelKnock();
                }
                if (this.desk) {
                    this.desk.triggerScreenShake(this.dom.deskContainer);
                }
                this._renderStarburst('OBJECTION!', '#dc2626', '#fde047');

                // Lời nhắc sửa lỗi
                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cROBJECTION!\\cW Sai lệch tốc độ hoặc ngữ điệu (${avgScore}%). Hãy nhấn vào các từ vựng để nghe lại nhịp nhấn!`,
                        'sweating'
                    );
                }
            }
        }

        _renderTakeThatStarburst() {
            if (!this.dom.starburstSlot) return;
            this.dom.starburstSlot.innerHTML = `
                <div class="starburst-badge starburst-take-that animate-bounce">
                    <svg viewBox="0 0 170 50" width="170" height="50">
                        <polygon points="5,25 15,6 35,9 60,3 90,8 120,3 145,9 165,6 175,25 165,44 145,41 120,47 90,42 60,47 35,41 15,44" />
                        <text x="88" y="32" font-family="'Press Start 2P', monospace" font-size="12" fill="#fde047" font-weight="bold" text-anchor="middle">TAKE THAT!</text>
                    </svg>
                </div>
            `;
            setTimeout(() => {
                if (this.dom.starburstSlot) this.dom.starburstSlot.innerHTML = '';
            }, 1400);
        }

        /**
         * Khởi tạo màn hình MGS Codec 140.85 Phosphor Oscilloscope
         */
        initCodecOscilloscope(container) {
            if (!container) return;
            container.innerHTML = `
                <div class="pixel-codec-panel p-3 space-y-2 select-none">
                    <div class="flex items-center justify-between text-[9px] px-font-arcade text-[var(--px-codec-green)]">
                        <span class="animate-pulse">● MEMORY 140.85</span>
                        <span>SHADOWING LAB FREQUENCY</span>
                        <span class="text-[8px] text-emerald-400">STEREO 44.1kHz</span>
                    </div>

                    <!-- Phosphor Oscilloscope Bars -->
                    <div class="h-16 bg-black/80 border border-emerald-900/60 p-1.5 flex items-end justify-between gap-0.5 codec-grid-overlay overflow-hidden" id="codecBarsBox">
                    </div>

                    <div class="flex items-center justify-between text-[9px] font-mono text-[var(--px-codec-green)]">
                        <button type="button" id="btnToggleGameBGM" class="pixel-btn !py-1 !px-2 text-[8px] !bg-black border border-emerald-500 text-emerald-300">
                            🎵 BGM: TẮT
                        </button>
                        <span>MGS CODEC ACOUSTIC INTERCOM</span>
                    </div>
                </div>
            `;

            const barsBox = container.querySelector('#codecBarsBox');
            if (barsBox && typeof document !== 'undefined' && typeof document.createElement === 'function') {
                const numBars = 36;
                for (let i = 0; i < numBars; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'w-1 codec-waveform-line rounded-none';
                    bar.style.height = '6%';
                    barsBox.appendChild(bar);
                }

                // Chạy hoạt ảnh dao động khi âm thanh hoạt động
                setInterval(() => {
                    const isAudioPlaying = (root.App && root.App.state && root.App.state.isPlaying) || false;
                    const isRecording = (root.App && root.App.state && root.App.state.isRecording) || false;
                    const bars = barsBox.children;

                    for (let i = 0; i < bars.length; i++) {
                        if (isAudioPlaying || isRecording) {
                            bars[i].style.height = (Math.random() * 85 + 12) + '%';
                        } else {
                            // Nhịp đập đường rải resting pulse
                            const wave = Math.sin(Date.now() / 300 + i * 0.3) * 6 + 10;
                            bars[i].style.height = Math.max(5, wave) + '%';
                        }
                    }
                }, 80);
            }

            // Gắn nút BGM
            const btnBGM = container.querySelector('#btnToggleGameBGM');
            if (btnBGM && typeof btnBGM.addEventListener === 'function' && this.sfx) {
                btnBGM.addEventListener('click', () => {
                    const isPlaying = this.sfx.toggleBGM();
                    btnBGM.textContent = isPlaying ? '🎵 BGM: BẬT' : '🎵 BGM: TẮT';
                    btnBGM.className = isPlaying
                        ? 'pixel-btn !py-1 !px-2 text-[8px] !bg-emerald-900 border border-emerald-400 text-emerald-200'
                        : 'pixel-btn !py-1 !px-2 text-[8px] !bg-black border border-emerald-500 text-emerald-300';
                });
            }
        }

        /**
         * ====================================================================
         * STAGE 8: DAILY GOAL TROPHY & CLOZE PUNCH-CARD HOOKS
         * ====================================================================
         */

        /**
         * Hook sự kiện khi hoàn thành Mục Tiêu Ngày (Daily Goal Reached)
         */
        onDailyGoalAchieved(target = 15, streak = 1) {
            if (!this.isEnabled) return;

            if (this.sfx) {
                this.sfx.playCoinOpChime();
            }

            if (this.dialogue) {
                this.dialogue.say(
                    'Inspector Byte',
                    `\\cGCHIẾN TÍCH XUẤT SẮC!\\cW Hoàn thành mục tiêu ngày: \\cY${target}/${target} câu\\cW. Chuỗi ngày Streak: \\cY${streak} ngày\\cW! Arstotzka trao tặng Huân Chương Danh Dự.`,
                    'cool'
                );
            }

            // Cập nhật RPG Stats: Tăng GUTS và hồi phục HP
            if (this.stats) {
                const char = this.stats.getActiveCharacter();
                this.stats.updateStats({
                    guts: Math.min(5, char.guts + 1),
                    hp: char.maxHp
                });
            }

            this._renderStarburst('GOAL CLEARED!', '#10b981', '#fde047');
        }

        /**
         * Hook sự kiện khi điền đúng một ô khuyết Cloze
         */
        onClozeEvaluated(isCorrect, word = '') {
            if (!this.isEnabled) return;
            if (isCorrect && this.sfx) {
                this.sfx.playTypewriterBlip();
            }
        }

        /**
         * ====================================================================
         * STAGE 7: SHADOWING LAB RETRO GAME COURTROOM & MGS CODEC 140.85
         * ====================================================================
         */

        /**
         * Hook sự kiện khi hoàn tất chấm điểm bản thu Shadowing (Take Evaluation)
         */
        onShadowingEvaluated(data = {}) {
            if (!this.isEnabled) return;

            const rhythmScore = data.rhythmScore || 0;
            const pitchScore = data.pitchScore || rhythmScore;
            const avgScore = Math.round((rhythmScore + pitchScore) / 2);

            if (avgScore >= 80) {
                // Ace Attorney: Lệnh hô [TAKE THAT!] vút cao + búa gõ
                if (this.sfx) {
                    this.sfx.playTakeThatSound();
                }
                if (this.desk) {
                    this.desk.triggerScreenShake(this.dom.deskContainer);
                }
                this._renderTakeThatStarburst();

                // Lời khen từ Inspector Byte
                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cGTAKE THAT!\\cW Giọng nói khớp nhịp \\cY${rhythmScore}%\\cW và cao độ \\cY${pitchScore}%\\cW! Đối chiếu nhân chứng hoàn toàn chuẩn xác.`,
                        avgScore >= 90 ? 'cool' : 'proud'
                    );
                }

                // Cập nhật RPG Stats: Tăng MAGIC & DEF
                if (this.stats) {
                    const char = this.stats.getActiveCharacter();
                    this.stats.updateStats({
                        magic: Math.min(99, char.magic + 2),
                        def: Math.min(99, char.def + 1),
                        hp: Math.min(char.maxHp, char.hp + 5)
                    });
                }

            } else if (avgScore < 70) {
                // Ace Attorney: [OBJECTION!] búa gỗ phản đối
                if (this.sfx) {
                    this.sfx.playGavelKnock();
                }
                if (this.desk) {
                    this.desk.triggerScreenShake(this.dom.deskContainer);
                }
                this._renderStarburst('OBJECTION!', '#dc2626', '#fde047');

                // Lời nhắc sửa lỗi
                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cROBJECTION!\\cW Sai lệch tốc độ hoặc ngữ điệu (${avgScore}%). Hãy nhấn vào các từ vựng để nghe lại nhịp nhấn!`,
                        'sweating'
                    );
                }
            }
        }

        _renderTakeThatStarburst() {
            if (!this.dom.starburstSlot) return;
            this.dom.starburstSlot.innerHTML = `
                <div class="starburst-badge starburst-take-that animate-bounce">
                    <svg viewBox="0 0 170 50" width="170" height="50">
                        <polygon points="5,25 15,6 35,9 60,3 90,8 120,3 145,9 165,6 175,25 165,44 145,41 120,47 90,42 60,47 35,41 15,44" />
                        <text x="88" y="32" font-family="'Press Start 2P', monospace" font-size="12" fill="#fde047" font-weight="bold" text-anchor="middle">TAKE THAT!</text>
                    </svg>
                </div>
            `;
            setTimeout(() => {
                if (this.dom.starburstSlot) this.dom.starburstSlot.innerHTML = '';
            }, 1400);
        }

        /**
         * Khởi tạo màn hình MGS Codec 140.85 Phosphor Oscilloscope
         */
        initCodecOscilloscope(container) {
            if (!container) return;
            container.innerHTML = `
                <div class="pixel-codec-panel p-3 space-y-2 select-none">
                    <div class="flex items-center justify-between text-[9px] px-font-arcade text-[var(--px-codec-green)]">
                        <span class="animate-pulse">● MEMORY 140.85</span>
                        <span>SHADOWING LAB FREQUENCY</span>
                        <span class="text-[8px] text-emerald-400">STEREO 44.1kHz</span>
                    </div>

                    <!-- Phosphor Oscilloscope Bars -->
                    <div class="h-16 bg-black/80 border border-emerald-900/60 p-1.5 flex items-end justify-between gap-0.5 codec-grid-overlay overflow-hidden" id="codecBarsBox">
                    </div>

                    <div class="flex items-center justify-between text-[9px] font-mono text-[var(--px-codec-green)]">
                        <button type="button" id="btnToggleGameBGM" class="pixel-btn !py-1 !px-2 text-[8px] !bg-black border border-emerald-500 text-emerald-300">
                            🎵 BGM: TẮT
                        </button>
                        <span>MGS CODEC ACOUSTIC INTERCOM</span>
                    </div>
                </div>
            `;

            const barsBox = container.querySelector('#codecBarsBox');
            if (barsBox && typeof document !== 'undefined' && typeof document.createElement === 'function') {
                const numBars = 36;
                for (let i = 0; i < numBars; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'w-1 codec-waveform-line rounded-none';
                    bar.style.height = '6%';
                    barsBox.appendChild(bar);
                }

                // Chạy hoạt ảnh dao động khi âm thanh hoạt động
                setInterval(() => {
                    const isAudioPlaying = (root.App && root.App.state && root.App.state.isPlaying) || false;
                    const isRecording = (root.App && root.App.state && root.App.state.isRecording) || false;
                    const bars = barsBox.children;

                    for (let i = 0; i < bars.length; i++) {
                        if (isAudioPlaying || isRecording) {
                            bars[i].style.height = (Math.random() * 85 + 12) + '%';
                        } else {
                            // Nhịp đập đường rải resting pulse
                            const wave = Math.sin(Date.now() / 300 + i * 0.3) * 6 + 10;
                            bars[i].style.height = Math.max(5, wave) + '%';
                        }
                    }
                }, 80);
            }

            // Gắn nút BGM
            const btnBGM = container.querySelector('#btnToggleGameBGM');
            if (btnBGM && typeof btnBGM.addEventListener === 'function' && this.sfx) {
                btnBGM.addEventListener('click', () => {
                    const isPlaying = this.sfx.toggleBGM();
                    btnBGM.textContent = isPlaying ? '🎵 BGM: BẬT' : '🎵 BGM: TẮT';
                    btnBGM.className = isPlaying
                        ? 'pixel-btn !py-1 !px-2 text-[8px] !bg-emerald-900 border border-emerald-400 text-emerald-200'
                        : 'pixel-btn !py-1 !px-2 text-[8px] !bg-black border border-emerald-500 text-emerald-300';
                });
            }
        }

        /**
         * ====================================================================
         * STAGE 8: DAILY GOAL TROPHY & CLOZE PUNCH-CARD HOOKS
         * ====================================================================
         */

        /**
         * Hook sự kiện khi hoàn thành Mục Tiêu Ngày (Daily Goal Reached)
         */
        onDailyGoalAchieved(target = 15, streak = 1) {
            if (!this.isEnabled) return;

            if (this.sfx) {
                this.sfx.playCoinOpChime();
            }

            if (this.dialogue) {
                this.dialogue.say(
                    'Inspector Byte',
                    `\\cGCHIẾN TÍCH XUẤT SẮC!\\cW Hoàn thành mục tiêu ngày: \\cY${target}/${target} câu\\cW. Chuỗi ngày Streak: \\cY${streak} ngày\\cW! Arstotzka trao tặng Huân Chương Danh Dự.`,
                    'cool'
                );
            }

            // Cập nhật RPG Stats: Tăng GUTS và hồi phục HP
            if (this.stats) {
                const char = this.stats.getActiveCharacter();
                this.stats.updateStats({
                    guts: Math.min(5, char.guts + 1),
                    hp: char.maxHp
                });
            }

            this._renderStarburst('GOAL CLEARED!', '#10b981', '#fde047');
        }

        /**
         * Hook sự kiện khi điền đúng một ô khuyết Cloze
         */
        onClozeEvaluated(isCorrect, word = '') {
            if (!this.isEnabled) return;
            if (isCorrect && this.sfx) {
                this.sfx.playTypewriterBlip();
            }
        }
    }

    root.App = root.App || {};
    root.App.PixelGameLoop = new PixelGameLoop();

})(typeof window !== 'undefined' ? window : global);
