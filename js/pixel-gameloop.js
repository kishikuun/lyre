/**
 * ============================================================================
 * LYRE STUDIO — RETRO PIXEL GAME LOOP ORCHESTRATION ENGINE
 * Version 5.0 (Unified Single-DOM Acoustic Forensic Workbench)
 * 
 * Bridges core application logic with the Retro Pixel Game visual suite
 * using a unified Single-DOM architecture (zero duplicate textareas):
 * - Manages skin mode transitions: Swiss Editorial (Classic) <-> Retro Pixel (Dark/Paper).
 * - Enhances #dictationSection in-place into the Papers, Please Entry Permit Desk:
 *   1. Deltarune Dialogue Box (Typewriter, Emotion Sprites, Action Choices).
 *   2. Papers, Please Inspection Desk (Entry Permit, Spring-Loaded Stamps, Citation Printer).
 *   3. Ace Attorney Starburst Badges ([HOLD IT!], [OBJECTION!], [TAKE THAT!]).
 *   4. Return of the Obra Dinn Indelible Ink Lock-in & 4-Tab Spiral Rulebook.
 *   5. Deltarune RPG Character Stats Sheet (ATK, DEF, MAGIC, GUTS, Level-up).
 *   6. 1984 Atari Paperboy Gazette Round-End Celebration Modal.
 * - Preserves 100% access to Standard, Cloze, Stream modes, Mini-Waveform A-B loop,
 *   and Word-by-Word Forensic Diff badges with 1-touch Dictionary lookup.
 * ============================================================================
 */

(function (root) {
    'use strict';

    class PixelGameLoop {
        constructor() {
            this.isInitialized = false;
            this.isEnabled = false;
            this.currentSkin = 'pixel-dark'; // 'pixel-dark' | 'pixel-paper'
            this._codecInterval = null;

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
                permitTopStrip: null,
                permitStampStrip: null,
                sideRig: null,
                permitInput: null,
                stampSlot: null,
                citationMount: null,
                rulebookContainer: null,
                statsDrawerModal: null,
                statsMount: null,
                btnOpenStats: null,
                starburstSlot: null,
                charCountBadge: null,
                wordCountBadge: null
            };
        }

        /**
         * Khởi động Game Loop Engine và gắn kết vào Single-DOM Workbench
         */
        init() {
            if (this.isInitialized) return;

            // 1. Khởi tạo Web Audio SFX
            if (root.App && root.App.PixelSFX) {
                this.sfx = root.App.PixelSFX;
                this.sfx.init();
            }

            // 2. Khôi phục tùy chọn skin đã lưu (Mặc định luôn BẬT chế độ Game Pixel V5.0)
            try {
                const savedSkin = localStorage.getItem('lyre_pixel_skin');
                if (savedSkin === 'pixel-paper' || savedSkin === 'pixel-dark') {
                    this.currentSkin = savedSkin;
                }
                const savedEnabled = localStorage.getItem('lyre_pixel_mode_enabled');
                this.isEnabled = savedEnabled === 'false' ? false : true;
            } catch (e) {
                this.isEnabled = true;
            }
            // V5.0 Force Game Pixel Mode active on initial load if skin is set
            this.isEnabled = true;

            // 3. Gắn nút chuyển chế độ vào Header & Arcade Bezel
            this._setupHeaderToggleButton();
            this._setupArcadeTopBezel();
            this._setupTitleScreen();

            // 4. Hợp nhất cấu trúc Single-DOM Game Workbench ngay trên #dictationSection
            this._injectGameWorkbench();

            // 5. Khởi tạo các sub-controller
            this._initSubControllers();

            // 6. Kích hoạt skin nếu đang bật
            if (this.isEnabled) {
                this.activatePixelMode();
            }

            // 7. Stage 8: Khởi tạo Balo Đồ Nghề Thanh Tra
            this._setupInspectorSatchel();

            this.isInitialized = true;
        }

        /**
         * Tạo hoặc gắn sự kiện cho nút bật/tắt chế độ Game Retro Pixel trên Header
         */
        _setupHeaderToggleButton() {
            let btn = document.getElementById('btnTogglePixelMode');
            if (!btn) {
                const headerRight = document.querySelector('header .tactile-rocker') || document.querySelector('header > div:last-child');
                if (headerRight && headerRight.parentNode) {
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
         * Gắn sự kiện cho thanh Arcade Cabinet Top Bezel và Sổ Hồ sơ & Thiết bị in-game
         */
        _setupArcadeTopBezel() {
            if (typeof document === 'undefined') return;

            // Chuyển chế độ: Thẩm tra (Chép) vs Giám sát (Shadowing)
            const arcDict = document.getElementById('arcadeTabDictation');
            const arcShad = document.getElementById('arcadeTabShadowing');
            const tabDict = document.getElementById('tabDictationBtn');
            const tabShad = document.getElementById('tabShadowingBtn');

            if (arcDict && tabDict) {
                arcDict.addEventListener('click', () => {
                    tabDict.click();
                    arcDict.className = 'px-2.5 py-1 text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 cursor-pointer';
                    if (arcShad) arcShad.className = 'px-2.5 py-1 text-[9px] font-bold text-gray-400 hover:text-gray-200 border border-transparent cursor-pointer';
                    if (this.sfx) this.sfx.playTypewriterBlip();
                });
            }
            if (arcShad && tabShad) {
                arcShad.addEventListener('click', () => {
                    tabShad.click();
                    arcShad.className = 'px-2.5 py-1 text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 cursor-pointer';
                    if (arcDict) arcDict.className = 'px-2.5 py-1 text-[9px] font-bold text-gray-400 hover:text-gray-200 border border-transparent cursor-pointer';
                    if (this.sfx) this.sfx.playTypewriterBlip();
                });
            }

            // Mở / Đóng Ngăn kéo Hồ sơ & Thiết bị (#gameDossierDrawer)
            const btnOpenDossier = document.getElementById('btnOpenGameDossierDrawer');
            const btnCloseDossier = document.getElementById('btnCloseGameDossierDrawer');
            const drawer = document.getElementById('gameDossierDrawer');

            const toggleDrawer = (open) => {
                if (!drawer) return;
                const shouldOpen = open !== undefined ? open : drawer.classList.contains('hidden');
                drawer.classList.toggle('hidden', !shouldOpen);
                if (this.sfx) this.sfx.playTypewriterBlip();
            };

            if (btnOpenDossier) btnOpenDossier.addEventListener('click', () => toggleDrawer(true));
            if (btnCloseDossier) btnCloseDossier.addEventListener('click', () => toggleDrawer(false));
            if (drawer) {
                drawer.addEventListener('click', (e) => {
                    if (e.target === drawer) toggleDrawer(false);
                });
            }

            // Gắn sự kiện các nút thiết bị trong Ngăn kéo Hồ sơ
            const mapBtn = (id, targetId) => {
                const b = document.getElementById(id);
                const t = document.getElementById(targetId);
                if (b && t) {
                    b.addEventListener('click', () => {
                        toggleDrawer(false);
                        t.click();
                    });
                }
            };
            mapBtn('dossierBtnCurated', 'btnOpenCuratedLessons');
            mapBtn('dossierBtnCustomAudio', 'btnTriggerAudioInput');
            mapBtn('dossierBtnCustomSRT', 'btnTriggerSrtInput');
            mapBtn('dossierBtnTeletype', 'btnOpenTTSGenerator');
            mapBtn('dossierBtnVocab', 'btnOpenVocabDrawer');
            mapBtn('dossierBtnAnalytics', 'btnOpenAnalytics');
            mapBtn('dossierBtnMixer', 'btnOpenStudioMixer');
            mapBtn('dossierBtnClassicToggle', 'btnTogglePixelMode');

            // Nút bật/tắt lớp sọc quét CRT
            const btnCrt = document.getElementById('btnToggleCrtFilter');
            if (btnCrt) {
                btnCrt.addEventListener('click', () => {
                    document.body.classList.toggle('pixel-scanlines');
                    const on = document.body.classList.contains('pixel-scanlines');
                    btnCrt.classList.toggle('border-emerald-500', on);
                    btnCrt.classList.toggle('text-emerald-300', on);
                    if (this.sfx) this.sfx.playTypewriterBlip();
                });
            }
        }

        /**
         * Khởi tạo và gắn tương tác cho màn hình Title Screen 1984
         */
        _setupTitleScreen() {
            if (typeof document === 'undefined') return;

            const titleScreen = document.getElementById('gameTitleScreen');
            const emptyCard = document.getElementById('emptyStateCard');
            const workspace = document.getElementById('workspaceArea');

            const btnStart = document.getElementById('btnTitleStartShift');
            const btnDossier = document.getElementById('btnTitleDossier');
            const btnRules = document.getElementById('btnTitleRulebook');
            const btnSettings = document.getElementById('btnTitleSettings');
            const btnHome = document.getElementById('arcadeBtnHome');

            // Hàm chuyển từ Title Screen vào Bàn làm việc
            const enterDesk = (lessonId) => {
                if (titleScreen) titleScreen.classList.add('hidden');
                if (emptyCard) emptyCard.classList.add('hidden');
                if (workspace) workspace.classList.remove('hidden');

                const satchelMount = document.getElementById('pixelSatchelMount');
                if (satchelMount) satchelMount.classList.remove('hidden');

                if (this.sfx) this.sfx.playCoinOpChime();

                if (lessonId && root.App && root.App.loadCuratedLesson) {
                    root.App.loadCuratedLesson(lessonId);
                } else if ((!root.App || !root.App.state || !root.App.state.subs || root.App.state.subs.length === 0) && root.App && root.App.loadCuratedLesson) {
                    root.App.loadCuratedLesson('lesson-a2-hotel');
                }

                if (this.dialogue) {
                    this.dialogue.say('Inspector Byte', 'Ca trực đã bắt đầu. Hãy chuẩn bị tai nghe và đối chiếu tài liệu!', 'neutral');
                }
            };

            // Hàm quay về Title Screen từ bàn làm việc
            const returnHome = () => {
                if (workspace) workspace.classList.add('hidden');
                if (emptyCard) emptyCard.classList.add('hidden');
                if (titleScreen) titleScreen.classList.remove('hidden');

                const satchelMount = document.getElementById('pixelSatchelMount');
                if (satchelMount) satchelMount.classList.add('hidden');
                const satchelModal = document.getElementById('inspectorSatchelModal');
                if (satchelModal) satchelModal.classList.add('hidden');

                if (this.sfx) this.sfx.playTypewriterBlip();
            };

            if (btnStart) {
                btnStart.addEventListener('click', () => enterDesk());
            }

            if (btnDossier) {
                btnDossier.addEventListener('click', () => {
                    if (this.sfx) this.sfx.playTypewriterBlip();
                    if (root.App && typeof root.App.openCuratedModal === 'function') {
                        root.App.openCuratedModal();
                    } else {
                        const modal = document.getElementById('curatedLessonsModal');
                        if (modal) {
                            if (root.App && root.App.renderCuratedLessons) root.App.renderCuratedLessons();
                            modal.classList.remove('opacity-0', 'pointer-events-none');
                        }
                    }
                });
            }

            // Sổ Tay Quy Tắc Nhập Cảnh (#pocketRulebookModal)
            const rulebookModal = document.getElementById('pocketRulebookModal');
            const btnCloseRulebookHeader = document.getElementById('btnCloseRulebookHeader');
            const btnCloseRulebookBtn = document.getElementById('btnCloseRulebookBtn');
            const btnRulebookStartShift = document.getElementById('btnRulebookStartShift');
            const chkRulebookDismiss = document.getElementById('chkRulebookDismiss');

            const openRulebook = () => {
                if (rulebookModal) {
                    rulebookModal.classList.remove('opacity-0', 'pointer-events-none');
                    if (this.sfx) this.sfx.playTypewriterBlip();
                }
            };

            const closeRulebook = () => {
                if (rulebookModal) {
                    rulebookModal.classList.add('opacity-0', 'pointer-events-none');
                    if (this.sfx) this.sfx.playTypewriterBlip();
                }
            };

            if (btnRules) {
                btnRules.addEventListener('click', () => openRulebook());
            }

            if (btnCloseRulebookHeader) {
                btnCloseRulebookHeader.addEventListener('click', () => closeRulebook());
            }
            if (btnCloseRulebookBtn) {
                btnCloseRulebookBtn.addEventListener('click', () => closeRulebook());
            }
            if (btnRulebookStartShift) {
                btnRulebookStartShift.addEventListener('click', () => {
                    closeRulebook();
                    enterDesk();
                });
            }
            if (rulebookModal) {
                rulebookModal.addEventListener('click', (e) => {
                    if (e.target === rulebookModal) closeRulebook();
                });
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && !rulebookModal.classList.contains('pointer-events-none')) {
                        closeRulebook();
                    }
                });
            }

            // Sync dismissal status with localStorage
            if (chkRulebookDismiss) {
                try {
                    const dismissed = localStorage.getItem('lyre_rulebook_dismissed') === 'true';
                    chkRulebookDismiss.checked = dismissed;
                    const syncDismiss = () => {
                        if (chkRulebookDismiss.checked) {
                            localStorage.setItem('lyre_rulebook_dismissed', 'true');
                        } else {
                            localStorage.removeItem('lyre_rulebook_dismissed');
                        }
                    };
                    chkRulebookDismiss.addEventListener('change', syncDismiss);
                    chkRulebookDismiss.addEventListener('click', (e) => {
                        e.stopPropagation();
                        syncDismiss();
                    });
                } catch (e) {}
            }

            // =========================================================================
            // BẢNG THIẾT LẬP & CẤU HÌNH CA TRỰC 1984 (#retroSettingsModal)
            // =========================================================================
            const settingsModal = document.getElementById('retroSettingsModal');
            const btnCloseSettingsHeader = document.getElementById('btnCloseSettingsHeader');
            const btnCloseSettingsBtn = document.getElementById('btnCloseSettingsBtn');
            const btnSaveSettings = document.getElementById('btnSaveSettings');
            const btnResetSettings = document.getElementById('btnResetSettings');

            const rangeMasterVol = document.getElementById('rangeMasterVolume');
            const txtMasterVol = document.getElementById('txtMasterVolVal');
            const rangeSfxVol = document.getElementById('rangeSfxVolume');
            const txtSfxVol = document.getElementById('txtSfxVolVal');
            const chkTypewriter = document.getElementById('chkTypewriterSFX');
            const chkShake = document.getElementById('chkScreenShake');
            const chkCrt = document.getElementById('chkCrtScanlines');
            const btnSkin = document.getElementById('btnToggleDeskSkin');
            const speedBtns = document.querySelectorAll('.btn-speed-option');

            const updateSkinButtonText = () => {
                if (!btnSkin) return;
                const skin = document.documentElement.getAttribute('data-skin') || this.currentSkin;
                if (skin === 'pixel-paper') {
                    btnSkin.textContent = '🖥️ MÀN CRT ĐÊM';
                    btnSkin.className = 'px-2.5 py-1 bg-[#0f131a] border border-amber-500 text-amber-300 hover:bg-amber-950 font-bold text-[11px] cursor-pointer';
                } else {
                    btnSkin.textContent = '📜 BÀN GIẤY MANILA';
                    btnSkin.className = 'px-2.5 py-1 bg-[#0f131a] border border-cyan-700 text-cyan-300 hover:bg-cyan-950 font-bold text-[11px] cursor-pointer';
                }
            };

            const applyPlaybackSpeed = (speed) => {
                const s = parseFloat(speed) || 1.0;
                try {
                    localStorage.setItem('lyre_playback_speed', s.toString());
                    if (root.AudioEngine && root.AudioEngine.state) {
                        root.AudioEngine.state.playbackRate = s;
                        if (root.AudioEngine.state.sourceNode) {
                            root.AudioEngine.state.sourceNode.playbackRate.value = s;
                        }
                    }
                } catch (e) {}
                speedBtns.forEach(btn => {
                    const bSpeed = parseFloat(btn.getAttribute('data-speed'));
                    if (Math.abs(bSpeed - s) < 0.01) {
                        btn.classList.add('active-speed', 'bg-amber-600', 'border-amber-400', 'text-black');
                        btn.classList.remove('bg-[#0f131a]', 'border-gray-700', 'text-gray-300');
                    } else {
                        btn.classList.remove('active-speed', 'bg-amber-600', 'border-amber-400', 'text-black');
                        btn.classList.add('bg-[#0f131a]', 'border-gray-700', 'text-gray-300');
                    }
                });
            };

            const applyCrtFilter = (enabled) => {
                const target = document.getElementById('workspaceArea') || document.body;
                if (enabled) {
                    target.classList.add('pixel-scanlines');
                } else {
                    target.classList.remove('pixel-scanlines');
                }
            };

            const loadAndApplyAllSettings = () => {
                try {
                    const savedMaster = localStorage.getItem('lyre_master_vol');
                    const masterVal = savedMaster !== null ? parseInt(savedMaster, 10) : 80;
                    if (rangeMasterVol) rangeMasterVol.value = masterVal;
                    if (txtMasterVol) txtMasterVol.textContent = masterVal + '%';

                    const savedSfx = localStorage.getItem('lyre_sfx_vol');
                    const sfxVal = savedSfx !== null ? parseInt(savedSfx, 10) : 35;
                    if (rangeSfxVol) rangeSfxVol.value = sfxVal;
                    if (txtSfxVol) txtSfxVol.textContent = sfxVal + '%';
                    if (this.sfx && this.sfx.setVolume) this.sfx.setVolume(sfxVal / 100);

                    const savedTw = localStorage.getItem('lyre_typewriter_sfx');
                    const twVal = savedTw !== null ? savedTw === 'true' : true;
                    if (chkTypewriter) chkTypewriter.checked = twVal;
                    if (this.sfx && this.sfx.setTypewriterBlipsEnabled) this.sfx.setTypewriterBlipsEnabled(twVal);

                    const savedShake = localStorage.getItem('lyre_screen_shake');
                    const shakeVal = savedShake !== null ? savedShake === 'true' : true;
                    if (chkShake) chkShake.checked = shakeVal;

                    const savedCrt = localStorage.getItem('lyre_crt_filter');
                    const crtVal = savedCrt !== null ? savedCrt === 'true' : true;
                    if (chkCrt) chkCrt.checked = crtVal;
                    applyCrtFilter(crtVal);

                    const savedSpeed = localStorage.getItem('lyre_playback_speed') || '1.0';
                    applyPlaybackSpeed(savedSpeed);

                    updateSkinButtonText();
                } catch (e) {}
            };

            loadAndApplyAllSettings();

            const openSettings = () => {
                loadAndApplyAllSettings();
                if (settingsModal) {
                    settingsModal.classList.remove('opacity-0', 'pointer-events-none');
                    if (this.sfx) this.sfx.playTypewriterBlip();
                }
            };

            const closeSettings = () => {
                if (settingsModal) {
                    settingsModal.classList.add('opacity-0', 'pointer-events-none');
                    if (this.sfx) this.sfx.playTypewriterBlip();
                }
            };

            if (btnSettings) {
                btnSettings.addEventListener('click', () => openSettings());
            }
            if (btnCloseSettingsHeader) {
                btnCloseSettingsHeader.addEventListener('click', () => closeSettings());
            }
            if (btnCloseSettingsBtn) {
                btnCloseSettingsBtn.addEventListener('click', () => closeSettings());
            }

            if (settingsModal) {
                settingsModal.addEventListener('click', (e) => {
                    if (e.target === settingsModal) closeSettings();
                });
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && !settingsModal.classList.contains('pointer-events-none')) {
                        closeSettings();
                    }
                });
            }

            if (rangeMasterVol) {
                rangeMasterVol.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value, 10);
                    if (txtMasterVol) txtMasterVol.textContent = val + '%';
                    try { localStorage.setItem('lyre_master_vol', val.toString()); } catch (err) {}
                });
            }

            if (rangeSfxVol) {
                rangeSfxVol.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value, 10);
                    if (txtSfxVol) txtSfxVol.textContent = val + '%';
                    if (this.sfx && this.sfx.setVolume) this.sfx.setVolume(val / 100);
                    try { localStorage.setItem('lyre_sfx_vol', val.toString()); } catch (err) {}
                });
                rangeSfxVol.addEventListener('change', () => {
                    if (this.sfx) this.sfx.playCoinOpChime();
                });
            }

            if (chkTypewriter) {
                chkTypewriter.addEventListener('change', () => {
                    const en = chkTypewriter.checked;
                    if (this.sfx && this.sfx.setTypewriterBlipsEnabled) this.sfx.setTypewriterBlipsEnabled(en);
                    try { localStorage.setItem('lyre_typewriter_sfx', en.toString()); } catch (err) {}
                    if (en && this.sfx) this.sfx.playTypewriterBlip();
                });
            }

            if (chkShake) {
                chkShake.addEventListener('change', () => {
                    const en = chkShake.checked;
                    try { localStorage.setItem('lyre_screen_shake', en.toString()); } catch (err) {}
                });
            }

            if (chkCrt) {
                chkCrt.addEventListener('change', () => {
                    const en = chkCrt.checked;
                    applyCrtFilter(en);
                    try { localStorage.setItem('lyre_crt_filter', en.toString()); } catch (err) {}
                });
            }

            speedBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const speed = btn.getAttribute('data-speed');
                    applyPlaybackSpeed(speed);
                    if (this.sfx) this.sfx.playTypewriterBlip();
                });
            });

            if (btnSkin) {
                btnSkin.addEventListener('click', () => {
                    this.currentSkin = this.currentSkin === 'pixel-dark' ? 'pixel-paper' : 'pixel-dark';
                    try { localStorage.setItem('lyre_pixel_skin', this.currentSkin); } catch (e) {}
                    document.documentElement.setAttribute('data-skin', this.currentSkin);
                    updateSkinButtonText();
                    if (this.sfx) this.sfx.playCoinOpChime();
                });
            }

            if (btnResetSettings) {
                btnResetSettings.addEventListener('click', () => {
                    try {
                        localStorage.setItem('lyre_master_vol', '80');
                        localStorage.setItem('lyre_sfx_vol', '70');
                        localStorage.setItem('lyre_typewriter_sfx', 'true');
                        localStorage.setItem('lyre_screen_shake', 'true');
                        localStorage.setItem('lyre_crt_filter', 'true');
                        localStorage.setItem('lyre_playback_speed', '1.0');
                        this.currentSkin = 'pixel-dark';
                        localStorage.setItem('lyre_pixel_skin', 'pixel-dark');
                        document.documentElement.setAttribute('data-skin', 'pixel-dark');
                    } catch (e) {}
                    loadAndApplyAllSettings();
                    if (this.sfx) this.sfx.playCoinOpChime();
                });
            }

            if (btnSaveSettings) {
                btnSaveSettings.addEventListener('click', () => {
                    if (this.sfx) this.sfx.playCoinOpChime();
                    closeSettings();
                });
            }

            if (btnHome) {
                btnHome.addEventListener('click', () => returnHome());
            }

            // Keyboard navigation cho menu Title Screen (ArrowUp / ArrowDown / Enter)
            const menu = document.getElementById('titleScreenMenu');
            if (menu) {
                const buttons = Array.from(menu.querySelectorAll('.title-menu-btn'));
                let focusedIdx = 0;

                window.addEventListener('keydown', (e) => {
                    if (!titleScreen || titleScreen.classList.contains('hidden')) return;

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        focusedIdx = (focusedIdx + 1) % buttons.length;
                        buttons[focusedIdx].focus();
                        if (this.sfx) this.sfx.playTypewriterBlip();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        focusedIdx = (focusedIdx - 1 + buttons.length) % buttons.length;
                        buttons[focusedIdx].focus();
                        if (this.sfx) this.sfx.playTypewriterBlip();
                    }
                });
            }
        }

        /**
         * Đồng bộ chỉ số lên thanh Arcade Top Bezel HUD
         */
        _syncTopBezelStats() {
            if (typeof document === 'undefined') return;
            const wallet = document.getElementById('arcadeTopWallet');
            const tp = document.getElementById('arcadeTopTp');
            const shift = document.getElementById('arcadeShiftIndicator');

            if (wallet && this.hud) wallet.textContent = `$${this.hud.credits}`;
            if (tp && this.hud) tp.textContent = `${this.hud.tp}%`;

            if (shift && root.App && root.App.state) {
                const s = root.App.state;
                const idx = (s.currentIdx || 0) + 1;
                const total = s.subs ? s.subs.length : 0;
                const title = s.currentLessonTitle || 'GRESTIN';
                shift.textContent = total > 0 ? `CÂU #${idx.toString().padStart(2, '0')}/${total} · ${title}` : 'SẴN SÀNG NHẬN CA';
            }
        }

        /**
         * Hợp nhất Single-DOM Game Workbench trực tiếp vào #dictationSection & #standardModeArea
         * Không tạo textarea thứ hai, giữ nguyên 100% tính năng gốc (Standard, Cloze, Stream, Waveform, Diff)
         */
        _injectGameWorkbench() {
            const workspaceArea = document.getElementById('workspaceArea');
            const dictSection = document.getElementById('dictationSection');
            const standardArea = document.getElementById('standardModeArea');
            if (!workspaceArea || !dictSection || !standardArea) return;

            // 0. Top: Grestin Border Checkpoint Booth Window (#pixelBoothMount)
            let boothMount = document.getElementById('pixelBoothMount');
            if (!boothMount) {
                boothMount = document.createElement('div');
                boothMount.id = 'pixelBoothMount';
                boothMount.className = 'hidden w-full select-none';
            }

            // 1. Top Ribbon: Deltarune Dialogue Guidance Bar
            let dialogueSlot = document.getElementById('gameDialogueSlot');
            if (!dialogueSlot) {
                dialogueSlot = document.createElement('div');
                dialogueSlot.id = 'gameDialogueSlot';
                dialogueSlot.className = 'hidden w-full select-none';
            }

            // 1b. Deltarune Combat HUD (TP / Combo / Credits + 4-button command bar)
            let hudMount = document.getElementById('pixelHudMount');
            if (!hudMount) {
                hudMount = document.createElement('div');
                hudMount.id = 'pixelHudMount';
                hudMount.className = 'hidden w-full select-none';
            }

            // 1c. Upper Deck Container (Dual Deck: Booth on left, Dialogue + HUD on right)
            let upperDeck = document.getElementById('gameUpperDeck');
            if (!upperDeck) {
                upperDeck = document.createElement('div');
                upperDeck.id = 'gameUpperDeck';
                upperDeck.className = 'w-full grid grid-cols-1 md:grid-cols-12 gap-3 select-none shrink-0';

                const boothCol = document.createElement('div');
                boothCol.className = 'md:col-span-5 h-full overflow-hidden';
                boothCol.appendChild(boothMount);

                const dialCol = document.createElement('div');
                dialCol.className = 'md:col-span-7 flex flex-col justify-between h-full gap-1.5 overflow-hidden';
                dialCol.appendChild(dialogueSlot);
                dialCol.appendChild(hudMount);

                upperDeck.appendChild(boothCol);
                upperDeck.appendChild(dialCol);
                dictSection.insertBefore(upperDeck, dictSection.firstChild);
            }

            // 2. Bọc các phần tử chính của #dictationSection vào lưới 12 cột #gameDeskContainer
            let deskContainer = document.getElementById('gameDeskContainer');
            let mainCol = document.getElementById('gamePermitMainCol');
            let sideRig = document.getElementById('gameSideRig');

            if (!deskContainer) {
                deskContainer = document.createElement('div');
                deskContainer.id = 'gameDeskContainer';
                deskContainer.className = 'flex flex-col gap-5';

                mainCol = document.createElement('div');
                mainCol.id = 'gamePermitMainCol';
                mainCol.className = 'lg:col-span-8 flex flex-col gap-5 min-w-0';

                // Chuyển các phần tử con hiện tại (trừ upperDeck và các con của nó) vào mainCol
                const excludedIds = ['gameUpperDeck', 'pixelBoothMount', 'gameDialogueSlot', 'pixelHudMount', 'gameDeskContainer'];
                const childrenToMove = Array.from(dictSection.children).filter(el => !excludedIds.includes(el.id));
                childrenToMove.forEach(child => mainCol.appendChild(child));

                // Tạo cột phải 4-cols chứa Máy in Phiếu phạt & Sổ tay 4-Tab Obra Dinn
                sideRig = document.createElement('div');
                sideRig.id = 'gameSideRig';
                sideRig.className = 'hidden lg:col-span-4 space-y-4 select-none';
                sideRig.innerHTML = `
                    <!-- Citation Printer Slot -->
                    <div class="bg-black/40 border-2 border-gray-800 p-2.5 rounded space-y-1">
                        <div class="flex items-center justify-between text-xs px-font-arcade text-red-400 font-bold">
                            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> MÁY IN PHIẾU PHẠT</span>
                            <span class="text-slate-200 font-bold font-mono text-xs">M.O.A. PRINTER</span>
                        </div>
                        <div id="gameCitationMount" class="max-h-36 overflow-y-auto space-y-2 pt-1">
                            <span class="text-xs font-mono text-slate-200 italic block">Chưa có vi phạm nào.</span>
                        </div>
                    </div>

                    <!-- 4-Tab Investigation Rulebook Ledger -->
                    <div class="pixel-spiral-notebook p-3 space-y-2.5" id="gameRulebookSlot">
                        <div class="pixel-spiral-coil"></div>
                        <div class="flex items-center justify-between border-b border-gray-600/40 pb-1.5 pl-3">
                            <span class="font-mono font-bold text-xs text-amber-300 tracking-wider">SỔ TAY THANH TRA</span>
                            <span class="text-xs font-mono text-amber-400 font-bold">OBRA DINN V.5</span>
                        </div>

                        <div class="pixel-notebook-tabs pl-3 flex gap-1">
                            <button type="button" class="pixel-tab-btn is-active" data-tab="rules">QUY TẮC</button>
                            <button type="button" class="pixel-tab-btn" data-tab="phonetics">BẪY ÂM</button>
                            <button type="button" class="pixel-tab-btn" data-tab="vocab">TỪ VỰNG</button>
                            <button type="button" class="pixel-tab-btn" data-tab="config">CẤU HÌNH</button>
                        </div>

                        <div class="rulebook-pane space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="rules">
                            <ul class="list-disc pl-4 space-y-1.5 text-slate-100 text-xs leading-relaxed font-medium">
                                <li>Nghe kỹ từng cụm phụ âm đuôi và âm nối.</li>
                                <li>Bấm <b class="text-amber-300">Space</b> (khi ô trống) hoặc <b class="text-amber-300">Shift+Space</b> để phát/dừng.</li>
                                <li>Đạt <b class="text-emerald-300">&gt;= 80%</b> để được cấp dấu <b class="text-emerald-300">APPROVED</b>.</li>
                            </ul>
                        </div>

                        <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="phonetics">
                            <div class="p-2 bg-black/20 border border-gray-700/60 space-y-1 text-xs">
                                <b class="text-amber-300 font-bold">Bẫy đuôi -ed & Nối âm:</b>
                                <p class="text-slate-200 leading-relaxed">Âm vô thanh (/p/, /k/, /f/, /s/, /ʃ/, /tʃ/) + -ed phát âm là /t/.</p>
                            </div>
                        </div>

                        <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="vocab">
                            <p class="text-xs text-slate-200 italic leading-relaxed">Nhấp vào bất kỳ từ nào ở bảng Kết quả đối chiếu để tra nghĩa và khóa mực vĩnh viễn.</p>
                        </div>

                        <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-1 pl-3" data-pane="config">
                            <div class="p-2 bg-black/20 border border-gray-700/60 space-y-2 text-xs">
                                <label class="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                                    <input type="checkbox" id="chkGameShake" checked class="accent-amber-500 w-3.5 h-3.5">
                                    <span>Rung bàn khi đập dấu</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                                    <input type="checkbox" id="chkGameBlips" checked class="accent-amber-500 w-3.5 h-3.5">
                                    <span>Âm bíp gõ thoại</span>
                                </label>
                                <button type="button" id="btnSwitchPixelSkin" class="pixel-btn pixel-btn-amber !py-1.5 !px-3 text-xs w-full mt-1 font-bold">
                                    🎨 ĐỔI BÀN GIẤY (CRT / MANILA)
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                deskContainer.appendChild(mainCol);
                deskContainer.appendChild(sideRig);
                dictSection.appendChild(deskContainer);
            }

            // 3. Chèn Header Hộ Chiếu & Kẹp Giấy vào đầu #standardModeArea
            let permitTopStrip = document.getElementById('gamePermitTopStrip');
            if (!permitTopStrip) {
                permitTopStrip = document.createElement('div');
                permitTopStrip.id = 'gamePermitTopStrip';
                permitTopStrip.className = 'hidden space-y-3 mb-4 select-none';
                permitTopStrip.innerHTML = `
                    <div class="pixel-paperclip" title="Kẹp kim loại giữ tờ khai nhập cảnh"></div>
                    <div class="flex items-center justify-between border-b border-gray-600/40 pb-2 pl-6">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span class="px-font-arcade text-[10px] tracking-wider text-amber-300" id="gamePassportHeader">ENTRY PERMIT · CÂU #01</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs font-mono">
                            <span id="gamePermitDuration" class="text-cyan-300 font-bold">THỜI LƯỢNG: 0.0s</span>
                            <span id="gameCharCountBadge" class="text-amber-300 font-bold">0 KÝ TỰ</span>
                            <span id="gameWordCountBadge" class="text-emerald-300 font-bold">0 TỪ</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono bg-black/25 p-2 border border-gray-600/40">
                        <div><span class="text-slate-300 font-bold">QUỐC TỊCH:</span> <b class="text-amber-300 font-bold">ARSTOTZKA</b></div>
                        <div><span class="text-slate-300 font-bold">GIỌNG NÓI:</span> <b class="text-cyan-300 font-bold" id="gameSpeakerBadge">NATIVE US</b></div>
                        <div><span class="text-slate-300 font-bold">TỐC ĐỘ:</span> <b class="text-amber-300 font-bold" id="gameSpeedBadge">1.0x NORMAL</b></div>
                        <div><span class="text-slate-300 font-bold">NHIỆM VỤ:</span> <b class="text-emerald-300 font-bold">THẨM ĐỊNH</b></div>
                    </div>
                `;
                standardArea.insertBefore(permitTopStrip, standardArea.firstChild);
            }

            // 4. Chèn Khay Con Dấu Lò Xo & Thanh Lệnh Hô Ace Attorney ngay trước #diffResultsCard
            let permitStampStrip = document.getElementById('gamePermitStampStrip');
            if (!permitStampStrip) {
                permitStampStrip = document.createElement('div');
                permitStampStrip.id = 'gamePermitStampStrip';
                permitStampStrip.className = 'hidden space-y-3 pt-4 mt-3 border-t border-gray-600/40 select-none';
                permitStampStrip.innerHTML = `
                    <div class="pixel-stamp-drawer" id="gameStampDrawer">
                    <div class="pixel-stamp-tray min-h-[72px] flex flex-wrap items-center justify-between gap-3 p-3 bg-black/20 border border-dashed border-gray-600/50" id="gameStampTray">
                        <button type="button" id="btnStampTrayToggle" class="pixel-stamp-tab" aria-expanded="true" aria-controls="gameStampTray" title="Kéo khay con dấu ra / vào"><span>⇆</span></button>
                        <div class="text-xs font-mono text-gray-400">
                            <span>CON DẤU PHÊ DUYỆT:</span>
                            <div id="gameStampSlot" class="mt-1">
                                <span class="text-xs italic text-gray-500">Chưa đóng dấu phê duyệt.</span>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <button type="button" id="btnGameStampApproved" class="pixel-btn pixel-btn-green flex items-center gap-1.5 cursor-pointer select-none" title="Bấm giữ để nén lò xo, thả tay để dập dấu & chấm điểm">
                                <span class="w-3 h-3 rounded-full stamp-handle-wood inline-block"></span>
                                <span>[✓] APPROVED (LÒ XO)</span>
                            </button>
                            <button type="button" id="btnGameStampDenied" class="pixel-btn pixel-btn-red flex items-center gap-1.5 cursor-pointer select-none" title="Bấm giữ để nén lò xo, thả tay để dập phạt">
                                <span class="w-3 h-3 rounded-full stamp-handle-wood inline-block"></span>
                                <span>[✕] DENIED (LÒ XO)</span>
                            </button>
                            <button type="button" id="btnGameClearStamps" class="pixel-btn !py-1.5 !px-2 text-[8px] bg-gray-700" title="Gỡ dấu">
                                GỠ DẤU
                            </button>
                        </div>
                    </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div class="flex items-center gap-2">
                            <button type="button" id="btnGameHoldIt" class="pixel-btn pixel-btn-amber !py-1 !px-2.5 text-[9px] flex items-center gap-1" title="Lùi lại 2 giây để đối chiếu âm thanh">
                                <span>✋</span> [HOLD IT!] (-2s)
                            </button>
                            <button type="button" id="btnGameObjection" class="pixel-btn pixel-btn-red !py-1 !px-2.5 text-[9px] flex items-center gap-1" title="Chỉ ra bẫy âm vị nuốt âm">
                                <span>⚡</span> [OBJECTION!]
                            </button>
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" id="btnOpenStatsModal" class="pixel-btn !py-1 !px-2.5 text-[9px] flex items-center gap-1 text-amber-300">
                                <span>❤️</span> HỒ SƠ RPG
                            </button>
                            <button type="button" id="btnTriggerGazetteManual" class="pixel-btn !py-1 !px-2.5 text-[9px] flex items-center gap-1 text-cyan-300">
                                <span>📰</span> XUẤT BẢN BÁO
                            </button>
                        </div>
                    </div>

                    <div id="gameStarburstSlot" class="min-h-[4px] flex items-center justify-center"></div>
                `;
                const diffCard = document.getElementById('diffResultsCard');
                if (diffCard && diffCard.parentNode === standardArea) {
                    standardArea.insertBefore(permitStampStrip, diffCard);
                } else {
                    standardArea.appendChild(permitStampStrip);
                }
            }

            // 4c. Stage 7 (V5.0): Máy Cassette Cơ Học 1984 Gắn Trực Tiếp Vào Smart Action Dock
            const smartDock = document.getElementById('smartActionDock');
            if (smartDock && !document.getElementById('pixelCassetteDeckBar')) {
                const deckBar = document.createElement('div');
                deckBar.id = 'pixelCassetteDeckBar';
                deckBar.className = 'pixel-cassette-deck-bar flex items-center gap-2 select-none pr-2.5 border-r border-amber-500/40 mr-1.5';
                deckBar.innerHTML = `
                    <div class="pixel-tape-spool tape-paused" id="tapeReelWheelLeft" title="Trục cuộn băng cassette trái">
                        <div class="spool-cog"></div>
                    </div>
                    <div class="pixel-tape-window flex flex-col items-center justify-center">
                        <div class="tape-magnetic-strip"></div>
                        <span class="text-[7px] font-mono tracking-widest text-amber-300 font-bold uppercase">C-60 TAPE</span>
                    </div>
                    <div class="pixel-tape-spool tape-paused" id="tapeReelWheelRight" title="Trục cuộn băng cassette phải">
                        <div class="spool-cog"></div>
                    </div>
                    <span class="pixel-tape-counter font-mono text-[9px] px-1.5 py-0.5 bg-black border border-gray-700 text-amber-400 font-bold" id="tapeCounterDisplay" title="Bộ đếm mét băng cơ học">00:00.0</span>
                `;
                smartDock.insertBefore(deckBar, smartDock.firstChild);
            }

            // 5. RPG Stats Sheet Modal
            let statsModal = document.getElementById('gameStatsModal');
            if (!statsModal) {
                statsModal = document.createElement('div');
                statsModal.id = 'gameStatsModal';
                statsModal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm';
                statsModal.innerHTML = `
                    <div class="max-w-3xl w-full relative">
                        <button type="button" id="btnCloseStatsModal" class="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white font-bold text-xs border-2 border-black flex items-center justify-center hover:bg-red-700 z-10 shadow-[2px_2px_0px_#000]">
                            ✕
                        </button>
                        <div id="gameStatsSheetMount"></div>
                    </div>
                `;
                dictSection.appendChild(statsModal);
            }

            this.dom.workbench = dictSection;
            this.dom.dialogueSlot = dialogueSlot;
            this.dom.boothMount = boothMount;
            this.dom.hudMount = hudMount;
            this.dom.deskContainer = deskContainer;
            this.dom.permitCard = standardArea;
            this.dom.permitTopStrip = permitTopStrip;
            this.dom.permitStampStrip = permitStampStrip;
            this.dom.sideRig = sideRig;
            this.dom.permitInput = document.getElementById('dictationTextarea');
            this.dom.stampSlot = document.getElementById('gameStampSlot');
            this.dom.citationMount = document.getElementById('gameCitationMount');
            this.dom.rulebookContainer = document.getElementById('gameRulebookSlot');
            this.dom.statsDrawerModal = statsModal;
            this.dom.statsMount = document.getElementById('gameStatsSheetMount');
            this.dom.btnOpenStats = document.getElementById('btnOpenStatsModal');
            this.dom.starburstSlot = document.getElementById('gameStarburstSlot');
            this.dom.charCountBadge = document.getElementById('gameCharCountBadge');
            this.dom.wordCountBadge = document.getElementById('gameWordCountBadge');
        }

        /**
         * Khởi tạo các controller thành phần và gắn các listener
         */
        _initSubControllers() {
            // 0. PixelBooth (Ô kính Buồng gác Grestin & Procedural NPC Traveler)
            if (root.App && root.App.PixelBooth && this.dom.boothMount) {
                this.booth = new root.App.PixelBooth();
                this.booth.init({
                    mountPoint: this.dom.boothMount,
                    onCallNext: () => {
                        if (root.App && root.App.state && root.App.state.subs && root.App.state.subs.length > 0) {
                            if (root.App.state.isPlaying) {
                                if (root.App.AudioEngine) root.App.AudioEngine.replay();
                            } else {
                                if (root.App.AudioEngine) root.App.AudioEngine.play();
                            }
                        } else {
                            const btnLessons = document.getElementById('btnEmptyCuratedLessons');
                            if (btnLessons) btnLessons.click();
                        }
                    }
                });
            }

            // 0b. PixelHUD (TP Bar, Combo, Credits, 4-button command bar)
            if (root.App && root.App.PixelHUD && this.dom.hudMount) {
                this.hud = new root.App.PixelHUD({ actions: this._buildHudActions() });
                this.hud.init(this.dom.hudMount);
                const st = root.App.state;
                this.hud.setModeLabel(st && st.dictationMode ? st.dictationMode : 'standard');
            }

            // 0c. Pull-out stamp tray
            const trayToggle = document.getElementById('btnStampTrayToggle');
            if (trayToggle) {
                trayToggle.addEventListener('click', () => this._setStampTray(!this._stampTrayOpen()));
            }

            // 1. PixelDesk
            if (root.App && root.App.PixelDesk) {
                this.desk = new root.App.PixelDesk({
                    deskContainer: this.dom.deskContainer,
                    permitCard: this.dom.permitCard,
                    stampTarget: this.dom.stampSlot,
                    rulebookContainer: this.dom.rulebookContainer,
                    citationContainer: this.dom.citationMount
                });

                // Gắn cơ chế lò xo dập lún đồng thời kích hoạt chấm điểm nếu có văn bản
                const btnApp = document.getElementById('btnGameStampApproved');
                const btnDen = document.getElementById('btnGameStampDenied');
                if (btnApp) {
                    this.desk.bindSpringStamp(btnApp, 'approved');
                    btnApp.addEventListener('click', () => {
                        if (this.dom.permitInput && this.dom.permitInput.value.trim().length > 0) {
                            if (root.App && root.App.Dictation && typeof root.App.Dictation.checkStandardDictation === 'function') {
                                root.App.Dictation.checkStandardDictation();
                            }
                        }
                    });
                }
                if (btnDen) {
                    this.desk.bindSpringStamp(btnDen, 'denied', 'BẪY ÂM ĐUÔI -ED');
                }

                const btnClear = document.getElementById('btnGameClearStamps');
                if (btnClear) {
                    btnClear.addEventListener('click', () => {
                        this.desk.clearStamps();
                        if (typeof this.desk.clearCitations === 'function') this.desk.clearCitations();
                    });
                }
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

            // 5. Lắng nghe trực tiếp trên #dictationTextarea (Single-DOM)
            if (this.dom.permitInput) {
                let lastBlipTime = 0;
                this.dom.permitInput.addEventListener('input', () => {
                    this._updateInputCounts();
                    const now = Date.now();
                    const isAudioPlaying = root.App && root.App.state && root.App.state.isPlaying;
                    // Khi đang phát bài nghe, tắt tiếng gõ để tập trung nghe rõ phát âm người bản xứ
                    if (!isAudioPlaying && now - lastBlipTime > 110 && this.sfx) {
                        lastBlipTime = now;
                        this.sfx.playTypewriterBlip();
                    }
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

            // 10. Config Toggles & Skin Switcher (CRT Dark <-> Manila Paper)
            const chkBlips = document.getElementById('chkGameBlips');
            if (chkBlips && this.sfx) {
                chkBlips.addEventListener('change', () => {
                    this.sfx.setTypewriterBlipsEnabled(chkBlips.checked);
                });
            }

            const btnSwitchSkin = document.getElementById('btnSwitchPixelSkin');
            if (btnSwitchSkin) {
                btnSwitchSkin.addEventListener('click', () => {
                    this.currentSkin = this.currentSkin === 'pixel-dark' ? 'pixel-paper' : 'pixel-dark';
                    try {
                        localStorage.setItem('lyre_pixel_skin', this.currentSkin);
                    } catch (e) {}
                    if (this.isEnabled) {
                        document.documentElement.setAttribute('data-skin', this.currentSkin);
                    }
                    if (this.sfx) this.sfx.playTypewriterBlip();
                });
            }
        }

        _renderStarburst(text, fillColor, strokeColor) {
            const html = `
                <div class="starburst-badge">
                    <svg viewBox="0 0 160 48" width="160" height="48">
                        <polygon points="5,24 15,8 35,10 55,4 80,9 105,4 125,10 145,8 155,24 145,40 125,38 105,44 80,39 55,44 35,38 15,40"
                            fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" />
                        <text x="80" y="30" font-family="'Press Start 2P', monospace" font-size="12" fill="${strokeColor}" font-weight="bold" text-anchor="middle">${text}</text>
                    </svg>
                </div>
            `;
            if (this.dom.starburstSlot) this.dom.starburstSlot.innerHTML = html;
            const codecSlot = typeof document !== 'undefined' ? document.getElementById('codecVerdictStarburst') : null;
            if (codecSlot) codecSlot.innerHTML = html;
            setTimeout(() => {
                if (this.dom.starburstSlot) this.dom.starburstSlot.innerHTML = '';
                if (codecSlot) codecSlot.innerHTML = '';
            }, 1200);
        }

        _updateInputCounts() {
            if (!this.dom.permitInput) return;
            const text = this.dom.permitInput.value || '';
            if (this.dom.charCountBadge) {
                this.dom.charCountBadge.textContent = `${text.length} KÝ TỰ`;
            }
            if (this.dom.wordCountBadge) {
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                this.dom.wordCountBadge.textContent = `${words} TỪ`;
            }
        }

        /** Facades over existing features: the HUD never re-implements game logic. */
        _buildHudActions() {
            const app = () => root.App || {};
            const mode = () => (app().state && app().state.dictationMode) || 'standard';
            const blip = () => { if (this.sfx) this.sfx.playTypewriterBlip(); };
            const say = (text, emo) => { if (this.dialogue) this.dialogue.say('Inspector Byte', text, emo || 'neutral'); };
            return {
                mode: () => {
                    blip();
                    const next = root.App.PixelHUD.nextMode(mode());
                    const btn = document.getElementById('btnMode' + next.charAt(0).toUpperCase() + next.slice(1));
                    if (btn) btn.click();
                    if (this.hud) this.hud.setModeLabel(mode());
                },
                act: () => {
                    blip();
                    const D = app().Dictation;
                    if (!D) return;
                    if (mode() === 'cloze' && typeof D.provideClozeHint === 'function') D.provideClozeHint();
                    else if (typeof D.provideHint === 'function') D.provideHint();
                },
                item: () => {
                    blip();
                    const btn = document.getElementById('btnOpenVocabDrawer');
                    if (btn) btn.click();
                },
                stamp: () => {
                    blip();
                    const D = app().Dictation;
                    const m = mode();
                    if (m === 'stream') {
                        say('Chế độ \\cYSTREAM\\cW chấm điểm tự động từng từ. Cứ gõ tiếp!');
                    } else if (m === 'cloze') {
                        if (D && typeof D.checkClozeDictation === 'function') D.checkClozeDictation();
                    } else {
                        const ta = document.getElementById('dictationTextarea');
                        if (!ta || !ta.value.trim()) {
                            say('Tờ khai \\cRtrống\\cW! Hãy chép lời khai trước khi đóng dấu.', 'sweating');
                        } else if (D && typeof D.checkStandardDictation === 'function') {
                            D.checkStandardDictation();
                        }
                    }
                }
            };
        }

        _stampTrayOpen() {
            const drawer = document.getElementById('gameStampDrawer');
            return !drawer || !drawer.classList.contains('is-closed');
        }

        _setStampTray(open, silent = false) {
            const drawer = document.getElementById('gameStampDrawer');
            const toggle = document.getElementById('btnStampTrayToggle');
            if (drawer && drawer.classList) drawer.classList[open ? 'remove' : 'add']('is-closed');
            if (toggle && typeof toggle.setAttribute === 'function') toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (!silent && this.sfx) this.sfx.playTypewriterBlip();
        }

        /** Per-sentence anti-farming key; resets when a different lesson/subtitle set is loaded. */
        _hudKey() {
            const st = (root.App && root.App.state) || {};
            if (this._hudSubsRef !== st.subs) {
                this._hudSubsRef = st.subs;
                if (this.hud) this.hud.cleared.clear();
            }
            return (this.currentShiftId || 'custom') + ':' + (st.currentIdx || 0);
        }

        _applyHud(accuracy) {
            if (!this.hud) return;
            const res = this.hud.registerResult({ accuracy, key: this._hudKey() });
            this.hud.applyResult(res);
            this._syncTopBezelStats();
            if (res.pass && !res.repeat && this.sfx) this.sfx.playCoinOpChime();
        }

        _checkAndRenderCampaignHub() {
            if (!this.isEnabled || typeof document === 'undefined') return;
            const emptyCard = document.getElementById('emptyStateCard');
            if (!emptyCard) return;

            // Maintain pixelCampaignMount anchor reference for tests & backward compatibility
            let hubMount = document.getElementById('pixelCampaignMount');
            if (!hubMount) {
                hubMount = document.createElement('div');
                hubMount.id = 'pixelCampaignMount';
                hubMount.className = 'w-full hidden';
                emptyCard.appendChild(hubMount);
            }

            // Wire up the 6 Curated Shift Cards directly in emptyStateCard
            const shiftBtns = emptyCard.querySelectorAll('.campaign-shift-card');
            shiftBtns.forEach(btn => {
                if (!btn._wiredShift) {
                    btn._wiredShift = true;
                    btn.addEventListener('click', () => {
                        const shiftId = btn.getAttribute('data-shift-id');
                        this.currentShiftId = shiftId;
                        if (this.sfx) this.sfx.playTypewriterBlip();
                        if (root.App && root.App.loadCuratedLesson) {
                            root.App.loadCuratedLesson(shiftId);
                        }
                    });
                }
            });
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
         * Bật chế độ Game Retro Pixel trên Single-DOM Workbench
         */
        activatePixelMode() {
            this.isEnabled = true;
            if (typeof document !== 'undefined' && document.documentElement) {
                document.documentElement.setAttribute('data-skin', this.currentSkin);
            }

            if (this.dom.toggleBtnText) {
                this.dom.toggleBtnText.textContent = 'GAME: BẬT';
            }
            if (this.dom.toggleBtn) {
                this.dom.toggleBtn.classList.add('border-green-500/60', 'text-green-300', 'bg-green-950/30');
            }

            if (this.dom.dialogueSlot) this.dom.dialogueSlot.classList.remove('hidden');
            if (this.dom.hudMount) this.dom.hudMount.classList.remove('hidden');
            if (this.dom.boothMount) {
                this.dom.boothMount.classList.remove('hidden');
                if (this.booth && root.App && root.App.state && root.App.state.subs && root.App.state.subs.length > 0) {
                    const idx = root.App.state.currentIdx || 0;
                    const sub = root.App.state.subs[idx];
                    this.booth.presentTraveler(idx, sub ? sub.text : '');
                }
            }
            if (this.dom.permitTopStrip) this.dom.permitTopStrip.classList.remove('hidden');
            if (this.dom.permitStampStrip) this.dom.permitStampStrip.classList.remove('hidden');
            if (this.dom.sideRig) this.dom.sideRig.classList.remove('hidden');
            if (this.dom.deskContainer) {
                this.dom.deskContainer.className = 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start';
            }

            this._checkAndRenderCampaignHub();

            if (this.sfx) {
                this.sfx.playCoinOpChime();
            }

            this.syncCurrentSentence();
            this._syncTopBezelStats();

            const codecSlot = typeof document !== 'undefined' ? document.getElementById('gameCodecSlot') : null;
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
            if (typeof document !== 'undefined' && document.documentElement) {
                document.documentElement.removeAttribute('data-skin');
            }

            if (this.dom.toggleBtnText) {
                this.dom.toggleBtnText.textContent = 'GAME PIXEL';
            }
            if (this.dom.toggleBtn) {
                this.dom.toggleBtn.classList.remove('border-green-500/60', 'text-green-300', 'bg-green-950/30');
            }

            if (this.dom.dialogueSlot) this.dom.dialogueSlot.classList.add('hidden');
            if (this.dom.boothMount) this.dom.boothMount.classList.add('hidden');
            if (this.dom.hudMount) this.dom.hudMount.classList.add('hidden');
            if (this.dom.permitTopStrip) this.dom.permitTopStrip.classList.add('hidden');
            if (this.dom.permitStampStrip) this.dom.permitStampStrip.classList.add('hidden');
            if (this.dom.sideRig) this.dom.sideRig.classList.add('hidden');
            if (this.dom.deskContainer) {
                this.dom.deskContainer.className = 'flex flex-col gap-5';
            }


            const codecSlot = typeof document !== 'undefined' ? document.getElementById('gameCodecSlot') : null;
            if (codecSlot) {
                codecSlot.classList.add('hidden');
            }

            if (this.sfx) {
                this.sfx.stopLofiChiptuneBGM();
            }
        }

        /**
         * Đồng bộ câu hiện tại từ App.state vào Header Hộ chiếu trên bàn làm việc
         */
        syncCurrentSentence() {
            if (!root.App || !root.App.state) return;
            const state = root.App.state;
            const currentSub = state.subs && state.subs[state.currentIdx];

            this._updateInputCounts();

            if (typeof document !== 'undefined') {
                const passportHeader = document.getElementById('gamePassportHeader');
                if (passportHeader && currentSub) {
                    const total = state.subs ? state.subs.length : 1;
                    const cur = state.currentIdx + 1;
                    passportHeader.textContent = `ENTRY PERMIT · CÂU #${cur.toString().padStart(2, '0')} / ${total.toString().padStart(2, '0')}`;
                }

                const durationSpan = document.getElementById('gamePermitDuration');
                if (durationSpan && currentSub) {
                    const dur = (currentSub.end - currentSub.start).toFixed(1);
                    durationSpan.textContent = `THỜI LƯỢNG: ${dur}s`;
                }

                const tapeCounter = document.getElementById('tapeCounterDisplay');
                if (tapeCounter && currentSub) {
                    tapeCounter.textContent = '00:00.0';
                }
            }

            if (this.desk) {
                this.desk.clearStamps();
            }
            this._syncTopBezelStats();
        }

        /**
         * Hook sự kiện khi người dùng chuyển sang câu mới
         */
        onSentenceChanged(idx) {
            this.syncCurrentSentence();
            if (!this.isEnabled) return;

            if (this.hud && root.App && root.App.state) this.hud.setModeLabel(root.App.state.dictationMode || 'standard');

            if (this.booth && root.App && root.App.state && root.App.state.subs) {
                const sub = root.App.state.subs[idx];
                this.booth.presentTraveler(idx, sub ? sub.text : '');
            }

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

            if (this.booth) {
                this.booth.setVerdict(accuracy >= 80);
            }

            this._setStampTray(true, true);
            this._applyHud(accuracy);

            if (accuracy >= 80) {
                if (this.desk) {
                    this.desk.stampApproved(`ACOUSTIC CLEARANCE ★ ${accuracy}%`);
                }

                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cGXUẤT SẮC!\\cW Đạt độ chuẩn xác \\cY${accuracy}%\\cW! Con dấu \\cGAPPROVED\\cW đã được cấp phép hợp lệ.`,
                        accuracy >= 95 ? 'cool' : 'proud'
                    );
                }

                if (this.stats) {
                    const char = this.stats.getActiveCharacter();
                    this.stats.updateStats({
                        atk: Math.min(99, char.atk + 1),
                        hp: Math.min(char.maxHp, char.hp + 5)
                    });
                }

                if (root.App && root.App.state) {
                    const state = root.App.state;
                    if (state.subs && state.subs.length > 0 && state.completedSentences && state.completedSentences.size === state.subs.length) {
                        setTimeout(() => {
                            this.triggerGazetteCelebration();
                        }, 1200);
                    }
                }
            } else {
                const misheardReason = this._diagnosePhoneticDiscrepancy(diffResult, sentenceText);
                if (this.desk) {
                    this.desk.stampDenied(misheardReason);
                }

                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cRCẢNH BÁO VI PHẠM!\\cW Phát hiện sai lệch âm vị: \\cR${misheardReason}\\cW. Phiếu phạt đã được chuyển vào hồ sơ!`,
                        'sweating'
                    );
                }

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

        /** One-time shift bounty ($Credits) when every sentence of a campaign shift is cleared. */
        _paySectionBonus() {
            const id = this.currentShiftId;
            const Hub = root.App && root.App.PixelCampaignHub;
            if (!this.hud || !id || !Hub) return;
            this._shiftBonusPaid = this._shiftBonusPaid || {};
            if (this._shiftBonusPaid[id]) return;
            const bounty = Hub.getBounty(id);
            if (bounty <= 0) return;
            this._shiftBonusPaid[id] = true;
            this.hud.awardBonus(bounty);
            this.hud.update();
            this.hud.popup('SHIFT BONUS +$' + bounty, 'green');
        }

        /**
         * Kích hoạt vinh danh bằng Báo Paperboy 1984 Atari
         */
        triggerGazetteCelebration() {
            this._paySectionBonus();
            if (!this.gazette) return;
            const state = (root.App && root.App.state) || {};
            const completed = state.completedSentences ? state.completedSentences.size : 15;

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
         * Hook sự kiện khi hoàn tất chấm điểm bản thu Shadowing (Take Evaluation)
         */
        onShadowingEvaluated(data = {}) {
            if (!this.isEnabled) return;

            const rhythmScore = data.rhythmScore || 0;
            const pitchScore = data.pitchScore || rhythmScore;
            const avgScore = Math.round((rhythmScore + pitchScore) / 2);

            if (avgScore >= 80) {
                if (this.sfx) this.sfx.playTakeThatSound();
                if (this.desk) this.desk.triggerScreenShake(this.dom.deskContainer);
                this._renderTakeThatStarburst();

                if (this.dialogue) {
                    this.dialogue.say(
                        'Inspector Byte',
                        `\\cGTAKE THAT!\\cW Giọng nói khớp nhịp \\cY${rhythmScore}%\\cW và cao độ \\cY${pitchScore}%\\cW! Đối chiếu nhân chứng hoàn toàn chuẩn xác.`,
                        avgScore >= 90 ? 'cool' : 'proud'
                    );
                }

                if (this.stats) {
                    const char = this.stats.getActiveCharacter();
                    this.stats.updateStats({
                        magic: Math.min(99, char.magic + 2),
                        def: Math.min(99, char.def + 1),
                        hp: Math.min(char.maxHp, char.hp + 5)
                    });
                }
            } else if (avgScore < 70) {
                if (this.sfx) this.sfx.playGavelKnock();
                if (this.desk) this.desk.triggerScreenShake(this.dom.deskContainer);
                this._renderStarburst('OBJECTION!', '#dc2626', '#fde047');

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
            const html = `
                <div class="starburst-badge starburst-take-that animate-bounce">
                    <svg viewBox="0 0 170 50" width="170" height="50">
                        <polygon points="5,25 15,6 35,9 60,3 90,8 120,3 145,9 165,6 175,25 165,44 145,41 120,47 90,42 60,47 35,41 15,44" />
                        <text x="88" y="32" font-family="'Press Start 2P', monospace" font-size="12" fill="#fde047" font-weight="bold" text-anchor="middle">TAKE THAT!</text>
                    </svg>
                </div>
            `;
            if (this.dom.starburstSlot) this.dom.starburstSlot.innerHTML = html;
            const codecSlot = typeof document !== 'undefined' ? document.getElementById('codecVerdictStarburst') : null;
            if (codecSlot) codecSlot.innerHTML = html;
            setTimeout(() => {
                if (this.dom.starburstSlot) this.dom.starburstSlot.innerHTML = '';
                if (codecSlot) codecSlot.innerHTML = '';
            }, 1400);
        }

        /**
         * Khởi tạo màn hình MGS Codec 140.85 Phosphor Oscilloscope
         */
        initCodecOscilloscope(container) {
            if (!container) return;
            container.innerHTML = `
                <div class="pixel-codec-panel p-2.5 sm:p-3 space-y-2 select-none" id="pixelCodecMainPanel">
                    <div class="flex items-center justify-between text-xs font-mono font-bold text-[var(--px-codec-green)]">
                        <div class="flex items-center gap-2">
                            <span class="animate-pulse text-emerald-300">● MEMORY 140.85</span>
                            <span class="hidden sm:inline text-xs text-emerald-400 font-semibold">| PHÒNG GIÁM SÁT SHADOWING</span>
                        </div>
                        <button type="button" id="btnCodecReturnToDesk" class="pixel-btn !py-1.5 !px-2.5 text-xs font-bold !bg-emerald-950/90 border border-emerald-400 text-emerald-200 hover:!bg-emerald-800 transition">
                            ↩ BÀN THẨM TRA [ESC]
                        </button>
                    </div>

                    <div class="relative h-14 sm:h-16 bg-black/80 border border-emerald-900/60 p-1 flex items-end justify-between gap-0.5 codec-grid-overlay overflow-hidden" id="codecBarsBox">
                        <div id="codecVerdictStarburst" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"></div>
                    </div>

                    <div class="flex items-center justify-between text-xs font-mono text-[var(--px-codec-green)]">
                        <button type="button" id="btnToggleGameBGM" class="pixel-btn !py-1.5 !px-2.5 text-xs font-semibold !bg-black border border-emerald-500 text-emerald-300">
                            🎵 BGM: TẮT
                        </button>
                        <span class="text-[11px] font-mono text-emerald-400 font-medium">MGS CODEC ACOUSTIC INTERCOM · STEREO 44.1kHz</span>
                    </div>
                </div>
            `;

            const btnReturn = container.querySelector('#btnCodecReturnToDesk');
            if (btnReturn && typeof btnReturn.addEventListener === 'function') {
                btnReturn.addEventListener('click', () => {
                    const tabDesk = document.getElementById('tabDictationBtn');
                    if (tabDesk) tabDesk.click();
                    if (this.sfx) this.sfx.playTypewriterBlip();
                });
            }

            const barsBox = container.querySelector('#codecBarsBox');
            if (barsBox && typeof document !== 'undefined' && typeof document.createElement === 'function') {
                const numBars = 36;
                for (let i = 0; i < numBars; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'w-1 codec-waveform-line rounded-none';
                    bar.style.height = '6%';
                    barsBox.appendChild(bar);
                }

                if (this._codecInterval) clearInterval(this._codecInterval);
                this._codecInterval = setInterval(() => {
                    const isAudioPlaying = (root.App && root.App.state && root.App.state.isPlaying) || false;
                    const isRecording = (root.App && root.App.state && root.App.state.isRecording) || false;
                    const bars = barsBox.children;

                    for (let i = 0; i < bars.length; i++) {
                        if (isAudioPlaying || isRecording) {
                            bars[i].style.height = (Math.random() * 85 + 12) + '%';
                        } else {
                            const wave = Math.sin(Date.now() / 300 + i * 0.3) * 6 + 10;
                            bars[i].style.height = Math.max(5, wave) + '%';
                        }
                    }
                }, 80);
            }

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
        /** Hook: whole cloze card graded (accuracy 0-100). */
        onClozeGraded(accuracy) {
            if (!this.isEnabled) return;
            if (this.booth) this.booth.setVerdict(accuracy >= 80);
            this._applyHud(accuracy);
        }

        onClozeEvaluated(isCorrect, word = '') {
            if (!this.isEnabled) return;
            if (isCorrect && this.sfx) {
                this.sfx.playTypewriterBlip();
            }
        }

        /**
         * Giai Đoạn 8: Balo Đồ Nghề Thanh Tra (Inspector's Inventory Satchel 🎒)
         * Gom toàn bộ công cụ nghiệp vụ vào ngăn kéo Balo da ở góc màn hình,
         * giữ mặt bàn trực luôn sạch sẽ 100%.
         */
        _setupInspectorSatchel() {
            if (typeof document === 'undefined') return;

            // 1. Nút bấm Balo da pixel ở góc dưới bên phải màn hình
            let satchelMount = document.getElementById('pixelSatchelMount');
            if (!satchelMount) {
                satchelMount = document.createElement('div');
                satchelMount.id = 'pixelSatchelMount';
                satchelMount.className = 'pixel-satchel-mount fixed bottom-3 right-4 z-40 select-none hidden';
                satchelMount.innerHTML = `
                    <button type="button" id="btnSatchelToggle" class="pixel-satchel-btn flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold tracking-wider cursor-pointer" title="Mở Balo Đồ Nghề Thanh Tra [Phím I hoặc ESC]">
                        <span class="text-base select-none">🎒</span>
                        <span class="hidden sm:inline">BALO ĐỒ NGHỀ</span>
                        <span class="pixel-satchel-badge bg-amber-500 text-stone-950 px-1.5 py-0.2 text-[9px] font-bold rounded">6</span>
                        <kbd class="text-[9px] px-1 py-0.2 bg-black/50 text-amber-300 border border-amber-600/50 rounded font-mono">I</kbd>
                    </button>
                `;
                document.body.appendChild(satchelMount);
            }

            // 2. Modal Balo Đồ Nghề kiểu Túi da 9-slice retro
            let satchelModal = document.getElementById('inspectorSatchelModal');
            if (!satchelModal) {
                satchelModal = document.createElement('div');
                satchelModal.id = 'inspectorSatchelModal';
                satchelModal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none';
                satchelModal.innerHTML = `
                    <div class="pixel-satchel-card max-w-2xl w-full p-4 sm:p-5 relative space-y-4" id="inspectorSatchelCard">
                        <div class="flex items-center justify-between border-b-2 border-amber-700/60 pb-2.5">
                            <div class="flex items-center gap-2.5">
                                <span class="text-2xl select-none">🎒</span>
                                <div>
                                    <h2 class="px-font-arcade text-xs sm:text-sm text-amber-300 font-bold tracking-wider">BALO ĐỒ NGHỀ THANH TRA GRESTIN</h2>
                                    <p class="text-[10px] font-mono text-amber-200/80">INSPECTOR'S SATCHEL · TRANG THIẾT BỊ NGHIỆP VỤ & CÔNG CỤ HỖ TRỢ</p>
                                </div>
                            </div>
                            <button type="button" id="btnCloseSatchelModal" class="pixel-btn !py-1 !px-2.5 text-xs text-red-300 bg-red-950/60 border border-red-500/50 hover:bg-red-900/80 cursor-pointer" title="Đóng Balo [ESC]">✕ ĐÓNG [ESC]</button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="satchelToolsGrid">
                            <button type="button" id="satchelBtnShadowing" class="satchel-tool-card flex flex-col items-start gap-1 p-3 text-left cursor-pointer">
                                <div class="flex items-center justify-between w-full"><span class="text-xl">🎙️</span><span class="satchel-tool-tag text-[8px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.5 border border-emerald-500/40">GIÁM SÁT</span></div>
                                <span class="font-bold text-xs text-emerald-300 font-mono mt-1">[1] PHÒNG SHADOWING</span>
                                <p class="text-[10px] text-gray-300 leading-tight">Phân tích sóng âm & luyện phát âm nói đuổi theo băng chuẩn.</p>
                            </button>
                            <button type="button" id="satchelBtnVocab" class="satchel-tool-card flex flex-col items-start gap-1 p-3 text-left cursor-pointer">
                                <div class="flex items-center justify-between w-full"><span class="text-xl">📖</span><span class="satchel-tool-tag text-[8px] font-mono text-amber-400 bg-amber-950/80 px-1 py-0.5 border border-amber-500/40">SỔ TAY</span></div>
                                <span class="font-bold text-xs text-amber-300 font-mono mt-1">[2] SỔ TỪ VỰNG</span>
                                <p class="text-[10px] text-gray-300 leading-tight">Tra cứu kho từ vựng, bẫy âm vị & các cụm từ quan trọng.</p>
                            </button>
                            <button type="button" id="satchelBtnFlashcards" class="satchel-tool-card flex flex-col items-start gap-1 p-3 text-left cursor-pointer">
                                <div class="flex items-center justify-between w-full"><span class="text-xl">🎴</span><span class="satchel-tool-tag text-[8px] font-mono text-cyan-400 bg-cyan-950/80 px-1 py-0.5 border border-cyan-500/40">THẺ NHỚ</span></div>
                                <span class="font-bold text-xs text-cyan-300 font-mono mt-1">[3] FLASHCARDS SM-2</span>
                                <p class="text-[10px] text-gray-300 leading-tight">Luyện phản xạ ngắt quãng (SRS) ghi nhớ từ vựng và câu khó.</p>
                            </button>
                            <button type="button" id="satchelBtnAnalytics" class="satchel-tool-card flex flex-col items-start gap-1 p-3 text-left cursor-pointer">
                                <div class="flex items-center justify-between w-full"><span class="text-xl">📊</span><span class="satchel-tool-tag text-[8px] font-mono text-purple-400 bg-purple-950/80 px-1 py-0.5 border border-purple-500/40">TIẾN ĐỘ</span></div>
                                <span class="font-bold text-xs text-purple-300 font-mono mt-1">[4] BẢNG TIẾN ĐỘ & LỖI</span>
                                <p class="text-[10px] text-gray-300 leading-tight">Thống kê tốc độ WPM, tỷ lệ chính xác và túi câu lỗi cần ôn.</p>
                            </button>
                            <button type="button" id="satchelBtnMixer" class="satchel-tool-card flex flex-col items-start gap-1 p-3 text-left cursor-pointer">
                                <div class="flex items-center justify-between w-full"><span class="text-xl">🎛️</span><span class="satchel-tool-tag text-[8px] font-mono text-orange-400 bg-orange-950/80 px-1 py-0.5 border border-orange-500/40">EQUALIZER</span></div>
                                <span class="font-bold text-xs text-orange-300 font-mono mt-1">[5] STUDIO MIXER</span>
                                <p class="text-[10px] text-gray-300 leading-tight">Điều chỉnh cao độ, tốc độ phát, lọc tạp âm và âm lượng SFX.</p>
                            </button>
                            <button type="button" id="satchelBtnExitTitle" class="satchel-tool-card flex flex-col items-start gap-1 p-3 text-left cursor-pointer">
                                <div class="flex items-center justify-between w-full"><span class="text-xl">🏠</span><span class="satchel-tool-tag text-[8px] font-mono text-rose-400 bg-rose-950/80 px-1 py-0.5 border border-rose-500/40">CA TRỰC</span></div>
                                <span class="font-bold text-xs text-rose-300 font-mono mt-1">[6] VỀ TRANG CHỦ</span>
                                <p class="text-[10px] text-gray-300 leading-tight">Kết thúc ca trực hiện tại, hoàn trả hồ sơ về màn hình Title Screen.</p>
                            </button>
                        </div>
                        <div class="flex items-center justify-between pt-2 border-t border-amber-800/40 text-[10px] font-mono text-amber-200/70">
                            <div class="flex items-center gap-2">
                                <span>PHÍM TẮT:</span>
                                <kbd class="px-1.5 py-0.5 bg-black/40 border border-amber-600/50 rounded text-amber-300">[I] BẬT/TẮT</kbd>
                                <kbd class="px-1.5 py-0.5 bg-black/40 border border-amber-600/50 rounded text-amber-300">[ESC] ĐÓNG</kbd>
                            </div>
                            <span class="text-amber-400/90 italic hidden sm:inline">Mặt bàn trực luôn sạch sẽ & tối giản 100%</span>
                        </div>
                    </div>
                `;
                document.body.appendChild(satchelModal);
            }

            // 3. Controller methods
            this.openSatchel = () => {
                const modal = document.getElementById('inspectorSatchelModal');
                if (!modal) return;
                modal.classList.remove('hidden');
                if (this.sfx) this.sfx.playTypewriterBlip();
            };

            this.closeSatchel = () => {
                const modal = document.getElementById('inspectorSatchelModal');
                if (!modal) return;
                modal.classList.add('hidden');
                if (this.sfx) this.sfx.playTypewriterBlip();
            };

            this.toggleSatchel = () => {
                const modal = document.getElementById('inspectorSatchelModal');
                if (!modal) return;
                if (modal.classList.contains('hidden')) {
                    this.openSatchel();
                } else {
                    this.closeSatchel();
                }
            };

            // 4. Gắn sự kiện mở/đóng
            const btnToggle = document.getElementById('btnSatchelToggle');
            const btnClose = document.getElementById('btnCloseSatchelModal');
            if (btnToggle) btnToggle.addEventListener('click', () => this.toggleSatchel());
            if (btnClose) btnClose.addEventListener('click', () => this.closeSatchel());
            satchelModal.addEventListener('click', (e) => {
                if (e.target === satchelModal) this.closeSatchel();
            });

            // 5. Gắn sự kiện cho 6 công cụ trong Balo
            const mapTool = (id, action) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        this.closeSatchel();
                        action();
                    });
                }
            };

            // Tool 1: Shadowing
            mapTool('satchelBtnShadowing', () => {
                const tabShad = document.getElementById('tabShadowingBtn') || document.getElementById('arcadeTabShadowing');
                if (tabShad) tabShad.click();
            });

            // Tool 2: Vocab Ledger
            mapTool('satchelBtnVocab', () => {
                const btn = document.getElementById('btnOpenVocabDrawer');
                if (btn) btn.click();
            });

            // Tool 3: Flashcards
            mapTool('satchelBtnFlashcards', () => {
                const btn = document.getElementById('btnOpenFlashcards');
                if (btn) {
                    btn.click();
                } else if (root.App && root.App.Dictionary && typeof root.App.Dictionary.openFlashcardModal === 'function') {
                    root.App.Dictionary.openFlashcardModal();
                }
            });

            // Tool 4: Analytics
            mapTool('satchelBtnAnalytics', () => {
                const btn = document.getElementById('btnOpenAnalytics');
                if (btn) btn.click();
            });

            // Tool 5: Mixer
            mapTool('satchelBtnMixer', () => {
                const btn = document.getElementById('btnOpenStudioMixer') || document.getElementById('btnExpandRackDetails');
                if (btn) btn.click();
            });

            // Tool 6: Exit to Title Screen
            mapTool('satchelBtnExitTitle', () => {
                const btnHome = document.getElementById('arcadeBtnHome');
                if (btnHome) {
                    btnHome.click();
                } else {
                    const workspace = document.getElementById('workspaceArea');
                    const emptyCard = document.getElementById('emptyStateCard');
                    const titleScreen = document.getElementById('gameTitleScreen');
                    if (workspace) workspace.classList.add('hidden');
                    if (emptyCard) emptyCard.classList.add('hidden');
                    if (titleScreen) titleScreen.classList.remove('hidden');
                    const mount = document.getElementById('pixelSatchelMount');
                    if (mount) mount.classList.add('hidden');
                }
            });

            // Đồng bộ trạng thái hiển thị của nút Balo theo workspace
            const workspace = document.getElementById('workspaceArea');
            if (workspace && !workspace.classList.contains('hidden') && satchelMount) {
                satchelMount.classList.remove('hidden');
            }
        }
    }

    root.App = root.App || {};
    root.App.PixelGameLoop = new PixelGameLoop();
    root.PixelGameLoop = root.App.PixelGameLoop;

})(typeof window !== 'undefined' ? window : global);
