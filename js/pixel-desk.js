/**
 * ============================================================================
 * LYRE STUDIO — PAPERS, PLEASE INSPECTION DESK & RULEBOOK CONTROLLER
 * Version 5.2 (Tactile Draggable Desk Sandbox, Multi-Tab Rulebook & Discrepancy Inspection Mode)
 * 
 * Directly modeled after Lucas Pope's Papers, Please & Return of the Obra Dinn:
 * 1. Physical Drag-and-Drop Desk Engine with pointer capture & desk bounding clamping.
 * 2. Complete Draggable Document Suite:
 *    - Hộ Chiếu (Passport): Dual-page booklet with national crest, SVG portrait,
 *      entrant bio & [STAMP HERE] Entry Visa landing slot.
 *    - Giấy Phép Lao Động (Work Pass): Ministry of Labor seal & employment field.
 *    - Thẻ Bổ Sung Nhận Dạng (ID Supplement): Fingerprint, weight, height & physical appearance.
 *    - Tờ Rơi Bí Mật (Secret Flyer): "The Pink Vice" nightclub card with clandestine note.
 *    - Tờ Khai Nhập Cảnh (Entry Permit): Manila workbench hosting the dictation textarea.
 * 3. Interactive Spiral-Bound Rulebook Ledger (Stage 5):
 *    - Tab 1 [RULES]: 2-page border directives & forensic audio/dictation rules.
 *    - Tab 2 [MAP]: Interactive geopolitical map & list of authentic issuing cities.
 *    - Tab 3 [DOCS]: Valid M.O.A. & M.O.L. seal specimens and required document matrix.
 *    - Tab 4 [CONF.]: Ministry of Justice wanted criminal bulletin with mugshot.
 *    - Tab 5 [VOCAB]: Indelible ink lock dictionary (Return of the Obra Dinn).
 *    - Tab 6 [CONFIG]: Screen shake, typewriter blips & visual skin switcher.
 *    - Dual-Page Toggle ([📖 2 TRANG]): Expands notebook to full 2-page open desk ledger.
 * 4. Heavy mechanical rubber stamps (APPROVED & DENIED) with procedural desk thud & screen shake.
 * 5. The infamous Citation Slip Printer: ejects ticker tape slip when discrepancies are found.
 * 6. Discrepancy Inspection Mode & Interrogation System (Stage 7):
 *    - Triangular [ ! ] button activating radar crosshair inspection mode.
 *    - Pair Matcher algorithm comparing weights, dates, cities, and acoustic speech.
 *    - [REASON] Interrogation tab lighting up on booth ledge with speech bubble confrontation.
 * 7. Smart Tidy Desk alignment button ([🗂 SẮP XẾP BÀN]) for instant cascading on any screen.
 * ============================================================================
 */

(function (root) {
    'use strict';

    function escapeHTML(str) {
        if (!str) return '';
        if (root.App && root.App.SRTParser && typeof root.App.SRTParser.escapeHTML === 'function') {
            return root.App.SRTParser.escapeHTML(str);
        }
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    class PixelDesk {
        static get NATIONS_DB() {
            return {
                'ARSTOTZKA': {
                    name: 'ARSTOTZKA',
                    crest: '✦',
                    color: '#34d399',
                    bg: '#24341c',
                    capital: 'Paradizna',
                    cities: ['Orvech Von', 'East Grestin', 'Paradizna'],
                    desc: 'Tổ quốc vinh quang. Cửa khẩu Grestin mở lại sau 6 năm chiến tranh với Kolechia.'
                },
                'KOLECHIA': {
                    name: 'KOLECHIA',
                    crest: '◆',
                    color: '#f97316',
                    bg: '#3e2413',
                    capital: 'Yurko City',
                    cities: ['Yurko City', 'Vraden', 'West Grestin'],
                    desc: 'Quốc gia láng giềng phía tây. Cần kiểm tra kỹ con dấu M.O.A. trên giấy phép.'
                },
                'OBRISTAN': {
                    name: 'OBRISTAN',
                    crest: '★',
                    color: '#f43f5e',
                    bg: '#451417',
                    capital: 'Skal',
                    cities: ['Skal', 'Lorndaz', 'Mergerous'],
                    desc: 'Xứ tuyết phía bắc. Hộ chiếu màu đỏ gạch. Đề phòng công dân mang giấy tờ giả.'
                },
                'ANTEGRIA': {
                    name: 'ANTEGRIA',
                    crest: '▲',
                    color: '#38bdf8',
                    bg: '#172738',
                    capital: 'Glorian',
                    cities: ['St. Marmero', 'Glorian', 'Outer Grouse'],
                    desc: 'Chính quyền độc tài khắt khe. Cảnh giác với những người tị nạn chính trị.'
                },
                'REPUBLIA': {
                    name: 'REPUBLIA',
                    crest: '▼',
                    color: '#eab308',
                    bg: '#473814',
                    capital: 'True Glorian',
                    cities: ['True Glorian', 'Lesrenadi', 'Bostan'],
                    desc: 'Quốc gia ven biển. Hộ chiếu màu vàng đồng. Kiểm tra kỹ thời hạn thị thực.'
                },
                'UNITED FED.': {
                    name: 'UNITED FEDERATION',
                    crest: '●',
                    color: '#c084fc',
                    bg: '#20242e',
                    capital: 'Sanctuary',
                    cities: ['Enfield', 'Concordia', 'Sanctuary'],
                    desc: 'Liên bang lục địa xanh. Đang có dịch bệnh bại liệt, cần kiểm tra chứng nhận tiêm.'
                }
            };
        }

        constructor(options = {}) {
            this.deskContainer = options.deskContainer || null;
            this.permitCard = options.permitCard || null;
            this.stampTarget = options.stampTarget || null;
            this.rulebookContainer = options.rulebookContainer || null;
            this.citationContainer = options.citationContainer || null;

            this.currentTab = 'rules';
            this.stampCount = 0;
            this.citations = [];
            this.activeStamp = null;

            // Stage 4, 5, 7 State
            this.highestZIndex = 25;
            this.draggableDocs = [];
            this.currentTraveler = null;
            this.sandboxContainer = null;
            this.isDualPage = false;
            this.selectedNationKey = 'ARSTOTZKA';

            // Stage 7: Discrepancy & Interrogation State
            this.isInspectionMode = false;
            this.inspectSelection = [];
            this.activeDiscrepancy = null;
            this._hasInspectListenerBound = false;

            if (this.deskContainer && typeof this.deskContainer.insertBefore === 'function') {
                this.initDeskSandbox();
                this.bindEvents();
            }

            if (this.rulebookContainer && typeof this.rulebookContainer.querySelectorAll === 'function') {
                this.initRulebook();
            }

            if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
                this.initStampRig();
                this.initInspectionMode();
            }
        }

        /**
         * Khởi tạo Hộp cát Bàn làm việc Vật lý (Physical Desk Sandbox)
         */
        initDeskSandbox() {
            if (typeof document === 'undefined' || !this.deskContainer || typeof this.deskContainer.insertBefore !== 'function') return;

            let sandbox = document.getElementById('pixelDeskSandbox');
            if (!sandbox) {
                sandbox = document.createElement('div');
                sandbox.id = 'pixelDeskSandbox';
                sandbox.className = 'pixel-desk-sandbox select-none';
                sandbox.innerHTML = `
                    <!-- Desk Toolbar: Sắp xếp tài liệu & Thanh chỉ báo & Nút Tam Giác Soi Lỗi [!] -->
                    <div class="desk-sandbox-toolbar flex items-center justify-between pb-1.5 mb-2 border-b border-gray-700/60 font-mono text-[10px]">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span class="text-amber-300 font-bold tracking-wider uppercase">BÀN KHẢO TÀI LIỆU VẬT LÝ · GRESTIN POST</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" id="btnDeskCascade" class="btn-desk-action px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-600 rounded cursor-pointer" title="Sắp xếp lại tài liệu trên bàn theo thứ tự ngăn nắp">
                                🗂 SẮP XẾP BÀN
                            </button>
                            <button type="button" id="btnInspectionMode" class="btn-inspection-triangular ml-1 select-none cursor-pointer" title="Bật/Tắt Chế Độ Điều Tra Soi Lỗi Đối Chất (Discrepancy Inspection Mode) [Phím Space]">
                                <span class="inspect-exclamation">!</span>
                            </button>
                        </div>
                    </div>
                    <!-- Documents Bay: Nơi các tài liệu Hộ Chiếu, Thẻ Lao Động, Thẻ Bổ Sung, Tờ Rơi xuất hiện -->
                    <div id="deskDocumentsBay" class="desk-documents-bay relative w-full min-h-[300px] sm:min-h-[330px]"></div>
                `;

                if (this.permitCard && this.permitCard.parentNode === this.deskContainer) {
                    this.deskContainer.insertBefore(sandbox, this.permitCard);
                } else {
                    this.deskContainer.insertBefore(sandbox, this.deskContainer.firstChild);
                }
            }

            this.sandboxContainer = sandbox;
            const btnCascade = sandbox.querySelector('#btnDeskCascade');
            if (btnCascade) {
                btnCascade.addEventListener('click', () => this.tidyDesk());
            }

            const btnInspect = sandbox.querySelector('#btnInspectionMode');
            if (btnInspect) {
                btnInspect.addEventListener('click', () => this.toggleInspectionMode());
            }

            if (typeof window !== 'undefined' && !this._resizeBound) {
                this._resizeBound = true;
                let resizeTimer = null;
                window.addEventListener('resize', () => {
                    if (resizeTimer) clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        this.tidyDesk(false);
                    }, 120);
                });
            }
        }

        /**
         * Khởi tạo Sổ tay Quy tắc gáy xoắn đa ngăn (Stage 5: Interactive Tabbed Rulebook & Map)
         */
        initRulebook() {
            if (typeof document === 'undefined' || !this.rulebookContainer) return;
            if (typeof this.rulebookContainer.querySelectorAll !== 'function') return;
            if (this.rulebookContainer._isEnhancedRulebook) return;
            this.rulebookContainer._isEnhancedRulebook = true;

            const nDb = PixelDesk.NATIONS_DB;
            const activeNation = nDb[this.selectedNationKey] || nDb['ARSTOTZKA'];

            this.rulebookContainer.innerHTML = `
                <div class="rulebook-ribbon" title="Dải ruy-băng đánh dấu trang M.O.A."></div>
                <div class="pixel-spiral-coil" id="rulebookSpiralCoil"></div>

                <div class="flex items-center justify-between border-b border-gray-600/40 pb-1.5 pl-3 select-none">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm">📖</span>
                        <span class="font-mono font-bold text-xs text-amber-300 tracking-wider">SỔ TAY QUY TẮC M.O.A.</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" id="btnToggleDualPage" class="text-[9px] font-mono px-1.5 py-0.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded cursor-pointer transition" title="Bật/Tắt chế độ mở rộng 2 trang trên bàn">
                            📖 2 TRANG
                        </button>
                        <span class="text-[10px] font-mono text-amber-400 font-bold">1984 V.5</span>
                    </div>
                </div>

                <div class="pixel-notebook-tabs pl-3 flex flex-wrap gap-1 select-none pt-1">
                    <button type="button" class="pixel-tab-btn is-active" data-tab="rules">RULES</button>
                    <button type="button" class="pixel-tab-btn" data-tab="map">MAP</button>
                    <button type="button" class="pixel-tab-btn" data-tab="docs">DOCS</button>
                    <button type="button" class="pixel-tab-btn" data-tab="conf">CONF.</button>
                    <button type="button" class="pixel-tab-btn" data-tab="vocab">VOCAB</button>
                    <button type="button" class="pixel-tab-btn" data-tab="config">CONFIG</button>
                </div>

                <!-- TAB 1: RULES -->
                <div class="rulebook-pane space-y-2 text-xs font-mono pt-2 pl-3" data-pane="rules">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="p-2 bg-black/25 border border-gray-700/60 space-y-1.5 rounded">
                            <b class="text-amber-300 font-bold flex items-center gap-1 text-[11px] pb-1 border-b border-gray-700">
                                <span>⚖️</span> QUY ĐỊNH CỬA KHẨU:
                            </b>
                            <ul class="list-disc pl-4 space-y-1 text-slate-200 text-[10px] leading-relaxed">
                                <li class="inspectable-item" data-inspect-id="rule-passport">Mọi người nhập cảnh phải có <b class="text-white">Hộ chiếu</b> hợp lệ.</li>
                                <li class="inspectable-item" data-inspect-id="rule-expiry">Mọi tài liệu phải còn hạn sử dụng (trước <b class="text-amber-300">1983.11.26</b>).</li>
                                <li class="inspectable-item" data-inspect-id="rule-citizen">Công dân Arstotzka phải có <b class="text-emerald-300">Thẻ Căn Cước</b>.</li>
                                <li class="inspectable-item" data-inspect-id="rule-foreigner">Người nước ngoài bắt buộc có <b class="text-cyan-300">Giấy Phép Nhập Cảnh</b>.</li>
                                <li class="inspectable-item" data-inspect-id="rule-worker">Công nhân nước ngoài phải có <b class="text-indigo-300">Giấy Phép Lao Động</b>.</li>
                            </ul>
                        </div>
                        <div class="p-2 bg-black/25 border border-gray-700/60 space-y-1.5 rounded">
                            <b class="text-amber-300 font-bold flex items-center gap-1 text-[11px] pb-1 border-b border-gray-700">
                                <span>🔍</span> CHỈ THỊ AN NINH & THẨM ÂM:
                            </b>
                            <ul class="list-disc pl-4 space-y-1 text-slate-200 text-[10px] leading-relaxed">
                                <li class="inspectable-item" data-inspect-id="rule-contraband">Nghiêm cấm mang vũ khí và hàng lậu qua biên giới.</li>
                                <li class="inspectable-item" data-inspect-id="rule-id-supp">Người ngoại quốc phải có <b class="text-amber-200">Thẻ Bổ Sung Nhận Dạng</b>.</li>
                                <li class="inspectable-item" data-inspect-id="rule-dictation">Chép chính tả lời khai đạt <b class="text-emerald-300">&gt;= 80%</b> để cấp dấu <b class="text-emerald-300">APPROVED</b>.</li>
                                <li class="inspectable-item" data-inspect-id="rule-denied">Dưới 80% sẽ dập <b class="text-red-400">DENIED</b> và kích hoạt máy in phiếu phạt.</li>
                                <li class="inspectable-item" data-inspect-id="rule-weight">Cân nặng và chiều cao phải khớp với số liệu đo tại buồng gác.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: MAP -->
                <div class="rulebook-pane hidden space-y-2 text-xs font-mono pt-2 pl-3" data-pane="map">
                    <div class="flex flex-wrap gap-1 pb-1.5 border-b border-gray-700/60">
                        ${Object.keys(nDb).map(key => `
                            <button type="button" class="map-nation-btn px-2 py-1 text-[9px] font-bold rounded border ${key === this.selectedNationKey ? 'border-amber-400 bg-amber-950/80 text-amber-200 is-active' : 'border-gray-700 bg-black/40 text-gray-400'} cursor-pointer" data-nation="${key}">
                                ${nDb[key].crest} ${key}
                            </button>
                        `).join('')}
                    </div>
                    <div id="rulebookMapDetails" class="p-2.5 bg-black/30 border border-gray-700/80 rounded space-y-2">
                        <div class="flex items-center justify-between pb-1 border-b border-gray-700">
                            <span class="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                                <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${activeNation.color}"></span>
                                ${activeNation.name}
                            </span>
                            <span class="text-[9px] text-gray-400 font-mono">THỦ ĐÔ: <b class="text-white">${activeNation.capital}</b></span>
                        </div>
                        <p class="text-[10px] text-slate-300 italic">${activeNation.desc}</p>
                        <div>
                            <span class="text-[9px] font-bold text-emerald-400 block mb-1">CÁC THÀNH PHỐ CẤP PHÉP HỢP LỆ (ISSUING CITIES):</span>
                            <div class="flex flex-wrap gap-1.5">
                                ${activeNation.cities.map(c => `
                                    <span class="px-2 py-0.5 bg-slate-800 border border-slate-600 text-[9px] text-cyan-200 rounded font-bold inspectable-item" data-inspect-id="map-city" data-inspect-val="${c}">✓ ${c}</span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="p-1.5 bg-red-950/40 border border-red-500/40 text-[9px] text-red-300 flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Hộ chiếu mang tên thành phố giả mạo (Cobrastan, Bestburg...) phải bị <b>DẬP DENIED</b> ngay!</span>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: DOCS -->
                <div class="rulebook-pane hidden space-y-2 text-xs font-mono pt-2 pl-3" data-pane="docs">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div class="p-2 bg-black/30 border border-red-500/50 rounded space-y-1.5 text-center">
                            <span class="text-[10px] font-bold text-red-400 tracking-wider">MẪU DẤU CHUẨN M.O.A.</span>
                            <div class="flex items-center justify-center gap-3 py-1">
                                <div class="rulebook-seal-badge w-12 h-12 bg-red-950 border-2 border-red-500 text-red-300 flex flex-col items-center justify-center text-[8px] shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                                    <span>🛡️</span>
                                    <span class="font-bold">M.O.A.</span>
                                </div>
                                <div class="rulebook-seal-badge w-10 h-10 bg-red-900 border-2 border-red-400 text-red-200 flex items-center justify-center text-[14px]">
                                    <span>🛡️</span>
                                </div>
                            </div>
                            <span class="text-[8px] text-gray-400 block">Dấu thị thực nhập cảnh hợp lệ của Bộ Nhập Cảnh</span>
                        </div>
                        <div class="p-2 bg-black/30 border border-indigo-500/50 rounded space-y-1.5 text-center">
                            <span class="text-[10px] font-bold text-indigo-300 tracking-wider">MẪU DẤU BỘ LAO ĐỘNG (M.O.L.)</span>
                            <div class="flex items-center justify-center py-1">
                                <div class="rulebook-seal-badge w-12 h-12 bg-indigo-950 border-2 border-indigo-400 text-indigo-300 flex flex-col items-center justify-center text-[8px] shadow-[0_0_8px_rgba(129,140,248,0.4)]">
                                    <span>⚙️</span>
                                    <span class="font-bold">M.O.L.</span>
                                </div>
                            </div>
                            <span class="text-[8px] text-gray-400 block">Dấu tím bắt buộc trên Giấy Phép Lao Động</span>
                        </div>
                    </div>
                </div>

                <!-- TAB 4: CONF. -->
                <div class="rulebook-pane hidden space-y-2 text-xs font-mono pt-2 pl-3" data-pane="conf">
                    <div class="p-2.5 bg-[#171110] border-2 border-red-600/80 rounded space-y-2 text-slate-200">
                        <div class="flex items-center justify-between pb-1 border-b border-red-700/60">
                            <span class="text-[10px] font-bold text-red-400 tracking-widest uppercase">LỆNH TRUY NÃ BỘ TƯ PHÁP</span>
                            <span class="px-1.5 py-0.2 bg-red-900 border border-red-500 text-[8px] text-white font-bold">WANTED</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-16 h-16 bg-black border border-red-500/60 shrink-0 flex items-center justify-center rounded">
                                <svg viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
                                    <rect x="8" y="20" width="16" height="12" fill="#2d1c1a"/>
                                    <rect x="10" y="10" width="12" height="10" fill="#c68642"/>
                                    <rect x="9" y="7" width="14" height="4" fill="#1a1a1a"/>
                                    <rect x="11" y="12" width="4" height="3" fill="#1a1e24"/>
                                    <rect x="17" y="12" width="4" height="3" fill="#1a1e24"/>
                                    <line x1="15" y1="12" x2="17" y2="12" stroke="#444" stroke-width="1"/>
                                    <rect x="12" y="16" width="8" height="2" fill="#1a1a1a"/>
                                </svg>
                            </div>
                            <div class="space-y-0.5 text-[9px]">
                                <div><span class="text-gray-400">TÊN:</span> <b class="text-red-300">Vince "Echo" Rostov</b></div>
                                <div><span class="text-gray-400">TỘI DANH:</span> <span class="text-white">Giả mạo âm học & Tuồn băng lậu</span></div>
                                <div><span class="text-gray-400">ĐẶC ĐIỂM:</span> <span class="text-amber-200">Kính đen Aviator, Râu mép</span></div>
                                <div><span class="text-gray-400">TIỀN THƯỞNG:</span> <b class="text-emerald-400 font-bold">+$20 CREDITS</b></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 5: VOCAB -->
                <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-2 pl-3" data-pane="vocab">
                    <p class="text-[10px] text-slate-200 italic leading-relaxed">
                        Nhấp vào bất kỳ từ nào ở bảng Kết quả đối chiếu để tra nghĩa và khóa mực vĩnh viễn (Return of the Obra Dinn).
                    </p>
                    <div id="rulebookVocabList" class="space-y-1 pt-1">
                        <div class="p-1.5 bg-black/30 border border-gray-700 text-[9px] flex items-center justify-between">
                            <span class="text-amber-300 font-bold">discrepancy</span>
                            <span class="text-gray-400 italic">sự mâu thuẫn</span>
                            <span class="text-emerald-400 text-[8px]">✓ ĐÃ LƯU</span>
                        </div>
                    </div>
                </div>

                <!-- TAB 6: CONFIG -->
                <div class="rulebook-pane hidden space-y-1.5 text-xs font-mono pt-2 pl-3" data-pane="config">
                    <div class="p-2 bg-black/20 border border-gray-700/60 space-y-2 text-xs">
                        <label class="flex items-center gap-2 cursor-pointer text-slate-200 font-medium text-[10px]">
                            <input type="checkbox" id="chkGameShake" checked class="accent-amber-500 w-3.5 h-3.5">
                            <span>Rung bàn khi đập dấu</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer text-slate-200 font-medium text-[10px]">
                            <input type="checkbox" id="chkGameBlips" checked class="accent-amber-500 w-3.5 h-3.5">
                            <span>Âm bíp gõ thoại</span>
                        </label>
                        <button type="button" id="btnSwitchPixelSkin" class="pixel-btn pixel-btn-amber !py-1.5 !px-3 text-[10px] w-full mt-1 font-bold">
                            🎨 ĐỔI BÀN GIẤY (CRT / MANILA)
                        </button>
                    </div>
                </div>
            `;

            const tabs = this.rulebookContainer.querySelectorAll('.pixel-tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    this.switchRulebookTab(tabName);
                });
            });

            const nationBtns = this.rulebookContainer.querySelectorAll('.map-nation-btn');
            nationBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const nationKey = btn.getAttribute('data-nation');
                    this.selectMapNation(nationKey);
                });
            });

            const btnDual = this.rulebookContainer.querySelector('#btnToggleDualPage');
            if (btnDual) {
                btnDual.addEventListener('click', () => this.toggleDualPage());
            }

            const ribbon = this.rulebookContainer.querySelector('.rulebook-ribbon');
            if (ribbon) {
                ribbon.style.cursor = 'pointer';
                ribbon.addEventListener('click', () => {
                    const tabList = ['rules', 'map', 'docs', 'conf', 'vocab', 'config'];
                    const curIdx = tabList.indexOf(this.currentTab);
                    const nextTab = tabList[(curIdx + 1) % tabList.length];
                    this.switchRulebookTab(nextTab);
                });
            }
        }

        /**
         * Chọn quốc gia tra cứu trên Bản đồ (Tab MAP)
         */
        selectMapNation(nationKey) {
            this.selectedNationKey = nationKey;
            const nDb = PixelDesk.NATIONS_DB;
            const nation = nDb[nationKey];
            if (!nation || typeof document === 'undefined') return;

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx && typeof sfx.playTypewriterBlip === 'function') {
                sfx.playTypewriterBlip();
            }

            if (this.rulebookContainer && typeof this.rulebookContainer.querySelectorAll === 'function') {
                const btns = this.rulebookContainer.querySelectorAll('.map-nation-btn');
                btns.forEach(b => {
                    if (b.getAttribute('data-nation') === nationKey) {
                        b.classList.add('border-amber-400', 'bg-amber-950/80', 'text-amber-200', 'is-active');
                        b.classList.remove('border-gray-700', 'bg-black/40', 'text-gray-400');
                    } else {
                        b.classList.remove('border-amber-400', 'bg-amber-950/80', 'text-amber-200', 'is-active');
                        b.classList.add('border-gray-700', 'bg-black/40', 'text-gray-400');
                    }
                });
            }

            const details = document.getElementById('rulebookMapDetails');
            if (details) {
                details.innerHTML = `
                    <div class="flex items-center justify-between pb-1 border-b border-gray-700">
                        <span class="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${nation.color}"></span>
                            ${nation.name}
                        </span>
                        <span class="text-[9px] text-gray-400 font-mono">THỦ ĐÔ: <b class="text-white">${nation.capital}</b></span>
                    </div>
                    <p class="text-[10px] text-slate-300 italic">${nation.desc}</p>
                    <div>
                        <span class="text-[9px] font-bold text-emerald-400 block mb-1">CÁC THÀNH PHỐ CẤP PHÉP HỢP LỆ (ISSUING CITIES):</span>
                        <div class="flex flex-wrap gap-1.5">
                            ${nation.cities.map(c => `
                                <span class="px-2 py-0.5 bg-slate-800 border border-slate-600 text-[9px] text-cyan-200 rounded font-bold inspectable-item" data-inspect-id="map-city" data-inspect-val="${c}">✓ ${c}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="p-1.5 bg-red-950/40 border border-red-500/40 text-[9px] text-red-300 flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>Hộ chiếu mang tên thành phố giả mạo (Cobrastan, Bestburg...) phải bị <b>DẬP DENIED</b> ngay!</span>
                    </div>
                `;
            }
        }

        /**
         * Bật/Tắt chế độ hiển thị 2 trang (Dual-Page View) trên mặt bàn
         */
        toggleDualPage() {
            this.isDualPage = !this.isDualPage;
            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx && typeof sfx.playPaperRustle === 'function') {
                sfx.playPaperRustle();
            }

            if (this.rulebookContainer && typeof this.rulebookContainer.querySelector === 'function') {
                this.rulebookContainer.classList.toggle('rulebook-dual-page', this.isDualPage);
                const btnDual = this.rulebookContainer.querySelector('#btnToggleDualPage');
                if (btnDual) {
                    btnDual.textContent = this.isDualPage ? '✕ THU GỌN' : '📖 2 TRANG';
                }
            }
        }

        /**
         * Khởi tạo và đồng bộ Thanh Dập Dấu Lò Xo Trượt (Pull-Down Mechanical Stamp Rig - Stage 6)
         */
        initStampRig() {
            if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
            const drawer = document.getElementById('gameStampDrawer');
            if (!drawer || typeof drawer.querySelector !== 'function') return;

            drawer.classList.add('stamp-rig-frame');

            const tray = document.getElementById('gameStampTray');
            if (tray && typeof tray.querySelector === 'function') {
                let plate = tray.querySelector('.stamp-metal-plate');
                if (!plate && typeof document.createElement === 'function') {
                    plate = document.createElement('div');
                    plate.className = 'stamp-metal-plate text-center font-bold tracking-widest my-1 select-none';
                    plate.textContent = 'ALIGN VISA BENEATH STAMP';
                    tray.insertBefore(plate, tray.children[1] || null);
                }
            }

            const btnToggle = document.getElementById('btnStampTrayToggle');
            if (btnToggle && !btnToggle._isRigBound) {
                btnToggle._isRigBound = true;
                btnToggle.addEventListener('click', () => {
                    const isClosed = drawer.classList.toggle('is-closed');
                    btnToggle.setAttribute('aria-expanded', !isClosed);
                    const sfx = (root.App && root.App.PixelSFX) || null;
                    if (sfx && typeof sfx.playPaperRustle === 'function') {
                        sfx.playPaperRustle();
                    }
                });
            }
        }

        /**
         * Khởi tạo Chế Độ Điều Tra Soi Lỗi Đối Chất (Discrepancy Inspection Mode - Stage 7)
         */
        initInspectionMode() {
            if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;

            const counterBar = (typeof document.querySelector === 'function') ? document.querySelector('.booth-counter-bar') : null;
            if (counterBar && !document.getElementById('boothReasonTab') && typeof document.createElement === 'function') {
                const reasonTab = document.createElement('div');
                reasonTab.id = 'boothReasonTab';
                reasonTab.className = 'hidden booth-reason-tab flex items-center gap-1.5 cursor-pointer select-none';
                reasonTab.title = 'Nhấp để thanh tra chất vấn hành khách về điểm mâu thuẫn đối chiếu';
                reasonTab.innerHTML = `
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span class="reason-label font-mono font-bold text-[9px] tracking-wider text-cyan-300">REASON</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                `;
                reasonTab.addEventListener('click', () => this.executeInterrogation());
                if (typeof counterBar.insertBefore === 'function') {
                    counterBar.insertBefore(reasonTab, (counterBar.children && counterBar.children[1]) || null);
                }
            }

            if (!this._hasInspectListenerBound && typeof window !== 'undefined' && typeof document.addEventListener === 'function') {
                this._hasInspectListenerBound = true;
                document.addEventListener('click', (e) => {
                    if (!this.isInspectionMode) return;
                    const item = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.inspectable-item') : null;
                    if (item) {
                        if (typeof e.stopPropagation === 'function') e.stopPropagation();
                        this.handleInspectItem(item);
                    }
                }, true);
            }
        }

        /**
         * Bật / Tắt Chế độ Soi Lỗi Đối Chất
         */
        toggleInspectionMode(forceState) {
            this.isInspectionMode = typeof forceState === 'boolean' ? forceState : !this.isInspectionMode;
            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx && typeof sfx.playTypewriterBlip === 'function') {
                sfx.playTypewriterBlip();
            }

            if (typeof document !== 'undefined') {
                const target = this.deskContainer || (typeof document.getElementById === 'function' ? document.getElementById('pixelDeskMount') : null);
                if (target && target.classList && typeof target.classList.toggle === 'function') {
                    target.classList.toggle('is-inspection-mode', this.isInspectionMode);
                }
                const btnInspect = typeof document.getElementById === 'function' ? document.getElementById('btnInspectionMode') : null;
                if (btnInspect && btnInspect.classList && typeof btnInspect.classList.toggle === 'function') {
                    btnInspect.classList.toggle('is-active-inspect', this.isInspectionMode);
                }
            }

            this.clearInspectSelections();
        }

        /**
         * Xóa các mục đang chọn đối chiếu
         */
        clearInspectSelections() {
            if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
                const prev1 = document.querySelectorAll('.inspect-selected-1');
                if (prev1 && typeof prev1.forEach === 'function') {
                    prev1.forEach(el => el.classList && el.classList.remove('inspect-selected-1'));
                }
                const prev2 = document.querySelectorAll('.inspect-selected-2');
                if (prev2 && typeof prev2.forEach === 'function') {
                    prev2.forEach(el => el.classList && el.classList.remove('inspect-selected-2'));
                }
            }
            this.inspectSelection = [];
        }

        /**
         * Xử lý khi nhấp chọn 1 chi tiết trong chế độ soi lỗi
         */
        handleInspectItem(itemEl) {
            if (!this.isInspectionMode || !itemEl) return;
            if (this.inspectSelection.includes(itemEl)) return;

            const sfx = (root.App && root.App.PixelSFX) || null;

            this.inspectSelection.push(itemEl);

            if (this.inspectSelection.length === 1) {
                if (itemEl.classList && typeof itemEl.classList.add === 'function') {
                    itemEl.classList.add('inspect-selected-1');
                }
                if (sfx && typeof sfx.playTypewriterBlip === 'function') sfx.playTypewriterBlip();
            } else if (this.inspectSelection.length === 2) {
                if (itemEl.classList && typeof itemEl.classList.add === 'function') {
                    itemEl.classList.add('inspect-selected-2');
                }

                const disc = this.evaluateDiscrepancy(this.inspectSelection[0], this.inspectSelection[1]);
                this.activeDiscrepancy = disc;

                if (disc.hasDiscrepancy) {
                    if (sfx) {
                        if (typeof sfx.playHoldItSound === 'function') sfx.playHoldItSound();
                        else if (typeof sfx.playGavelKnock === 'function') sfx.playGavelKnock();
                    }
                    this.triggerScreenShake();

                    const reasonTab = typeof document.getElementById === 'function' ? document.getElementById('boothReasonTab') : null;
                    if (reasonTab && reasonTab.classList && typeof reasonTab.classList.remove === 'function') {
                        reasonTab.classList.remove('hidden');
                        const label = typeof reasonTab.querySelector === 'function' ? reasonTab.querySelector('.reason-label') : null;
                        if (label) label.textContent = 'REASON';
                    }
                } else {
                    if (sfx && typeof sfx.playTypewriterBlip === 'function') sfx.playTypewriterBlip();
                    setTimeout(() => this.clearInspectSelections(), 450);
                }
            } else {
                this.clearInspectSelections();
            }
        }

        /**
         * So khớp cặp dữ liệu (Pair Matcher Algorithm)
         */
        evaluateDiscrepancy(itemA, itemB) {
            const idA = itemA.getAttribute('data-inspect-id') || '';
            const idB = itemB.getAttribute('data-inspect-id') || '';
            const valA = itemA.getAttribute('data-inspect-val') || itemA.textContent.trim();
            const valB = itemB.getAttribute('data-inspect-val') || itemB.textContent.trim();

            const pair = [idA, idB].sort().join('::');

            // Cân nặng bàn cân vs Cân nặng trên Thẻ bổ sung
            if (pair === 'doc-weight::scale-weight') {
                const w1 = parseInt(valA.replace(/\D/g, ''), 10);
                const w2 = parseInt(valB.replace(/\D/g, ''), 10);
                if (w1 !== w2) {
                    return {
                        hasDiscrepancy: true,
                        title: 'CÂN NẶNG KHÔNG KHỚP',
                        inspectorLine: `Cân nặng thực tế trên cân (${w1 > w2 ? w1 : w2}kg) lệch so với giấy tờ (${w1 > w2 ? w2 : w1}kg)!`,
                        entrantLine: 'Tôi mặc áo khoác mùa đông quá nặng thôi thanh tra, không có giấu vũ khí đâu!'
                    };
                }
            }

            // Thành phố cấp phép vs Bản đồ hợp lệ
            if (idA === 'passport-city' || idB === 'passport-city') {
                const cityVal = idA === 'passport-city' ? valA : valB;
                return {
                    hasDiscrepancy: true,
                    title: 'ĐỊA DANH CẤP PHÉP BẤT THƯỜNG',
                    inspectorLine: `Thành phố cấp phép "${cityVal}" có dấu hiệu không nằm trong bản đồ hợp lệ!`,
                    entrantLine: 'Ơ... đó là tên thị trấn địa phương của tôi mà, giấy tờ tôi thật 100%!'
                };
            }

            // Ngày hết hạn vs Ngày trực
            if (pair === 'booth-date::passport-exp') {
                return {
                    hasDiscrepancy: true,
                    title: 'HẠN SỬ DỤNG GIẤY TỜ',
                    inspectorLine: 'Hạn sử dụng giấy tờ của bạn cần được kiểm tra lại so với ngày trực hôm nay!',
                    entrantLine: 'Tôi tưởng tuần sau mới hết hạn... xin thanh tra châm chước!'
                };
            }

            // Lời khai âm học vs Giấy phép
            if (idA === 'spoken-testimony' || idB === 'spoken-testimony') {
                return {
                    hasDiscrepancy: true,
                    title: 'LỜI KHAI ÂM HỌC BẤT NHẤT',
                    inspectorLine: 'Lời khai vừa phát ra qua micro có sự sai lệch so với hồ sơ nhập cảnh!',
                    entrantLine: 'Tôi vừa phát âm hơi vấp do trời lạnh quá... xin thanh tra hãy nghe lại băng cassette!'
                };
            }

            return {
                hasDiscrepancy: true,
                title: 'NGHI VẤN HỒ SƠ',
                inspectorLine: 'Hai chi tiết này có dấu hiệu mâu thuẫn trực tiếp. Hãy giải trình!',
                entrantLine: 'Tôi xin cam đoan mọi lời khai của tôi hoàn toàn trung thực trước Bộ Nhập Cảnh!'
            };
        }

        /**
         * Thanh tra chất vấn hành khách qua tab [REASON]
         */
        executeInterrogation() {
            if (!this.activeDiscrepancy) return;

            const disc = this.activeDiscrepancy;
            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                if (typeof sfx.playGavelKnock === 'function') sfx.playGavelKnock();
                else if (typeof sfx.playHoldItSound === 'function') sfx.playHoldItSound();
            }

            this.triggerScreenShake();

            // Hiển thị lời thoại thanh tra trong Deltarune Dialogue nếu có
            const loopInstance = (root.App && root.App.PixelGameLoop) || null;
            const dialogue = loopInstance && (loopInstance.dialogue || (loopInstance.instance && loopInstance.instance.dialogue));
            if (dialogue && typeof dialogue.say === 'function') {
                dialogue.say('Inspector Byte', `[${disc.title}] ${disc.inspectorLine}`, 'threat');
            }

            // Hiển thị lời thanh minh của hành khách qua speech bubble buồng gác
            const bubble = typeof document.getElementById === 'function' ? document.getElementById('boothSpeechBubble') : null;
            const speechText = typeof document.getElementById === 'function' ? document.getElementById('boothSpeechText') : null;
            if (bubble && speechText && bubble.classList && typeof bubble.classList.remove === 'function') {
                speechText.textContent = disc.entrantLine;
                bubble.classList.remove('hidden');
                setTimeout(() => {
                    if (bubble.classList && typeof bubble.classList.add === 'function') {
                        bubble.classList.add('hidden');
                    }
                }, 4500);
            }

            const reasonTab = typeof document.getElementById === 'function' ? document.getElementById('boothReasonTab') : null;
            if (reasonTab && reasonTab.classList && typeof reasonTab.classList.add === 'function') {
                reasonTab.classList.add('hidden');
            }

            this.clearInspectSelections();
            this.toggleInspectionMode(false);
        }

        bindEvents() {
            // Placeholder for interactive event delegation
        }

        /**
         * Đăng ký một phần tử tài liệu thành vật thể kéo thả tự do (Pointer Events Drag)
         */
        makeDraggable(element, options = {}) {
            if (!element) return;
            if (element._isDraggableBound) return;
            element._isDraggableBound = true;

            element.classList.add('desk-draggable-doc');

            let isDragging = false;
            let startPointerX = 0;
            let startPointerY = 0;
            let startElemLeft = 0;
            let startElemTop = 0;

            const onPointerDown = (e) => {
                if (e.target.closest('button, input, textarea, select, a, .no-drag, [data-no-drag]')) {
                    return;
                }

                this.highestZIndex++;
                element.style.zIndex = this.highestZIndex;
                element.classList.add('is-dragging');

                isDragging = true;
                startPointerX = e.clientX;
                startPointerY = e.clientY;

                startElemLeft = element.offsetLeft;
                startElemTop = element.offsetTop;

                const sfx = (root.App && root.App.PixelSFX) || null;
                if (sfx && typeof sfx.playPaperRustle === 'function') {
                    sfx.playPaperRustle();
                }

                try {
                    element.setPointerCapture(e.pointerId);
                } catch (err) {}

                e.preventDefault();
            };

            const onPointerMove = (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - startPointerX;
                const deltaY = e.clientY - startPointerY;

                let targetLeft = startElemLeft + deltaX;
                let targetTop = startElemTop + deltaY;

                const parent = element.offsetParent || this.sandboxContainer || document.body;
                const maxLeft = Math.max(0, parent.clientWidth - element.offsetWidth);
                const maxTop = Math.max(0, parent.clientHeight - element.offsetHeight);

                targetLeft = Math.max(0, Math.min(targetLeft, maxLeft));
                targetTop = Math.max(0, Math.min(targetTop, maxTop));

                element.style.left = `${targetLeft}px`;
                element.style.top = `${targetTop}px`;
            };

            const onPointerUp = (e) => {
                if (!isDragging) return;
                isDragging = false;
                element.classList.remove('is-dragging');

                try {
                    if (element.hasPointerCapture(e.pointerId)) {
                        element.releasePointerCapture(e.pointerId);
                    }
                } catch (err) {}
            };

            element.addEventListener('pointerdown', onPointerDown);
            element.addEventListener('pointermove', onPointerMove);
            element.addEventListener('pointerup', onPointerUp);
            element.addEventListener('pointercancel', onPointerUp);

            this.draggableDocs.push(element);
        }

        /**
         * Sinh bộ tài liệu vật lý hoàn chỉnh khi hành khách mới bước vào quầy (Stage 4)
         */
        spawnDocuments(traveler) {
            this.currentTraveler = traveler || this.currentTraveler;
            if (!this.currentTraveler || typeof document === 'undefined') return;

            const t = this.currentTraveler;
            const bay = document.getElementById('deskDocumentsBay');
            if (!bay) return;

            const nationColors = {
                'ARSTOTZKA': { bg: '#293a20', border: '#446132', text: '#d8e5cc', crest: '✦' },
                'KOLECHIA': { bg: '#482a17', border: '#6c4125', text: '#edd9cc', crest: '◆' },
                'OBRISTAN': { bg: '#54191c', border: '#7b272b', text: '#f1d6d8', crest: '★' },
                'ANTEGRIA': { bg: '#1c2e42', border: '#2d4766', text: '#d3e2f2', crest: '▲' },
                'REPUBLIA': { bg: '#574619', border: '#7a6428', text: '#f3ebd4', crest: '▼' },
                'UNITED FED.': { bg: '#242831', border: '#3b414f', text: '#dcdfe6', crest: '●' }
            };
            const nColor = nationColors[t.nationality] || nationColors['ARSTOTZKA'];

            bay.innerHTML = `
                <!-- 1. HỘ CHIẾU (PASSPORT BOOKLET) -->
                <div id="docPassport" class="desk-draggable-doc doc-passport select-none" style="background-color: ${nColor.bg}; border-color: ${nColor.border};">
                    <div class="passport-header flex items-center justify-between px-3 py-1.5 border-b border-white/10 text-xs font-mono cursor-grab active:cursor-grabbing">
                        <span class="font-bold tracking-widest text-amber-300">::: ${escapeHTML(t.nationality)} PASSPORT :::</span>
                        <span class="text-white/80 text-[11px] font-mono font-bold inspectable-item" data-inspect-id="passport-id" data-inspect-val="${escapeHTML(t.passportId)}">${escapeHTML(t.passportId)}</span>
                    </div>
                    <div class="passport-body grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 text-xs font-mono">
                        <div class="passport-page-bio space-y-1.5 pr-1 border-b sm:border-b-0 sm:border-r border-white/10 pb-2 sm:pb-0">
                            <div class="flex items-center gap-2.5">
                                <div class="passport-photo w-16 h-16 bg-black/40 border border-white/20 shrink-0 overflow-hidden rounded">
                                    ${t.svg || '<div class="w-full h-full bg-gray-700"></div>'}
                                </div>
                                <div class="space-y-1 text-xs leading-snug text-slate-200">
                                    <div><span class="text-gray-400 font-semibold text-[11px]">NAME:</span> <b class="text-white font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="passport-name" data-inspect-val="${escapeHTML(t.fullName)}">${escapeHTML(t.fullName)}</b></div>
                                    <div><span class="text-gray-400 font-semibold text-[11px]">DOB:</span> <span class="text-white font-bold text-xs inspectable-item" data-inspect-id="passport-dob" data-inspect-val="${escapeHTML(t.birthDate)}">${escapeHTML(t.birthDate)}</span></div>
                                    <div><span class="text-gray-400 font-semibold text-[11px]">SEX:</span> <span class="text-white font-bold text-xs inspectable-item" data-inspect-id="passport-sex" data-inspect-val="${escapeHTML(t.gender)}">${escapeHTML(t.gender)}</span></div>
                                    <div><span class="text-gray-400 font-semibold text-[11px]">ISS:</span> <span class="text-amber-300 font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="passport-city" data-inspect-val="${escapeHTML(t.issuingCity)}">${escapeHTML(t.issuingCity)}</span></div>
                                    <div><span class="text-gray-400 font-semibold text-[11px]">EXP:</span> <span class="text-white font-bold text-xs inspectable-item" data-inspect-id="passport-exp" data-inspect-val="1983.11.14">1983.11.14</span></div>
                                </div>
                            </div>
                        </div>
                        <div class="passport-page-visa flex flex-col justify-between pl-1 space-y-1.5">
                            <div class="border border-dashed border-amber-500/50 p-1.5 bg-black/20 text-center rounded">
                                <span class="text-[10px] font-bold text-amber-400 tracking-wider block mb-0.5">ENTRY VISA</span>
                                <div id="passportStampSlot" class="passport-stamp-slot min-h-[58px] flex items-center justify-center my-1 rounded bg-black/30">
                                    <span class="text-xs text-amber-400/70 font-bold italic tracking-widest">[STAMP HERE]</span>
                                </div>
                            </div>
                            <div class="text-[9px] text-gray-400 text-center font-bold uppercase tracking-wider">ARSTOTZKA MINISTRY OF ADMISSION</div>
                        </div>
                    </div>
                </div>

                <!-- 2. GIẤY PHÉP LAO ĐỘNG (WORK PASS) -->
                <div id="docWorkPass" class="desk-draggable-doc doc-work-pass select-none">
                    <div class="work-pass-header flex items-center justify-between px-3 py-1.5 bg-indigo-950/70 border-b border-indigo-500/40 text-[11px] font-mono cursor-grab active:cursor-grabbing">
                        <span class="font-bold text-indigo-300">MINISTRY OF LABOR · WORK PASS</span>
                        <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    </div>
                    <div class="p-2.5 space-y-1.5 text-xs font-mono text-slate-200">
                        <div class="flex items-center gap-2 pb-1 border-b border-gray-700/60">
                            <span class="text-base">⚙️</span>
                            <div>
                                <div class="text-[10px] text-gray-400 font-semibold">HOLDER:</div>
                                <b class="text-indigo-200 font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="work-holder" data-inspect-val="${escapeHTML(t.fullName)}">${escapeHTML(t.fullName)}</b>
                            </div>
                        </div>
                        <div class="flex justify-between items-center pt-0.5 text-xs">
                            <div><span class="text-gray-400 font-semibold text-[10px]">FIELD:</span> <b class="text-emerald-300 font-bold text-xs inspectable-item" data-inspect-id="work-field" data-inspect-val="${escapeHTML(t.profession || 'ACOUSTIC LAB')}">${escapeHTML(t.profession || 'ACOUSTIC LAB')}</b></div>
                            <div><span class="text-gray-400 font-semibold text-[10px]">VALID:</span> <span class="text-white font-bold font-mono">1983.12.01</span></div>
                        </div>
                        <div class="pt-1 flex items-center justify-between text-[10px] text-purple-300 font-bold border-t border-gray-700/40">
                            <span>SEAL: M.O.L. CERTIFIED</span>
                            <span class="text-xs">⚖️</span>
                        </div>
                    </div>
                </div>

                <!-- 3. THẺ BỔ SUNG NHẬN DẠNG (ID SUPPLEMENT) -->
                <div id="docIdSupplement" class="desk-draggable-doc doc-id-supplement select-none">
                    <div class="id-supp-header flex items-center justify-between px-3 py-1.5 bg-amber-950/60 border-b border-amber-600/40 text-[11px] font-mono cursor-grab active:cursor-grabbing">
                        <span class="font-bold text-amber-300">IDENTITY SUPPLEMENT</span>
                        <span class="text-[10px] text-amber-400 font-bold">M.O.A. #82</span>
                    </div>
                    <div class="p-2.5 grid grid-cols-3 gap-2 text-xs font-mono text-slate-200">
                        <div class="col-span-1 flex flex-col items-center justify-center p-1.5 bg-black/40 border border-gray-700 rounded">
                            <span class="text-lg">🖐️</span>
                            <span class="text-[9px] text-gray-400 font-bold mt-0.5">FINGERPRINT</span>
                        </div>
                        <div class="col-span-2 space-y-1 text-xs">
                            <div><span class="text-gray-400 font-semibold text-[10px]">HEIGHT:</span> <b class="text-cyan-300 font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="doc-height" data-inspect-val="${escapeHTML(String(t.heightCm))}">${escapeHTML(String(t.heightCm))} cm</b></div>
                            <div><span class="text-gray-400 font-semibold text-[10px]">WEIGHT:</span> <b class="text-amber-300 font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="doc-weight" data-inspect-val="${escapeHTML(String(t.weightKg))}">${escapeHTML(String(t.weightKg))} kg</b></div>
                            <div><span class="text-gray-400 font-semibold text-[10px]">DESC:</span> <span class="text-white font-medium text-[11px]">${t.gender === 'M' ? 'BEARD / NO SCARS' : 'CLEAR APPEARANCE'}</span></div>
                            <div><span class="text-gray-400 font-semibold text-[10px]">ENTER BY:</span> <span class="text-emerald-300 font-bold text-[11px]">1982.12.30</span></div>
                        </div>
                    </div>
                </div>

                <!-- 4. TỜ RƠI BÍ MẬT "THE PINK VICE" (SECRET FLYER) -->
                <div id="docFlyerSecret" class="desk-draggable-doc doc-flyer-secret select-none">
                    <div class="flyer-front p-2.5 text-center font-mono space-y-1">
                        <div class="flex items-center justify-between text-xs text-pink-400">
                            <span>👠</span>
                            <span class="font-bold tracking-widest text-xs text-pink-300 drop-shadow-[0_0_5px_#f43f5e]">THE PINK VICE</span>
                            <span>👠</span>
                        </div>
                        <p class="text-xs text-pink-200 italic leading-snug inspectable-item" data-inspect-id="spoken-testimony" data-inspect-val="1-603-4 East Grestin">1-603-4 East Grestin · FOR ALL YOUR FANTASIES!</p>
                        <div class="pt-0.5 flex items-center justify-center gap-1 text-[9px] text-pink-400/90 font-bold">
                            <span>★ OPEN TIL DAWN ★</span>
                        </div>
                        <button type="button" class="btn-flip-flyer text-[9px] font-bold px-2 py-0.5 bg-pink-950/80 hover:bg-pink-900 border border-pink-500/40 text-pink-200 rounded cursor-pointer mt-1" title="Lật mặt sau xem manh mối">
                            ↻ LẬT MẶT SAU
                        </button>
                    </div>
                    <div class="flyer-back hidden p-2.5 text-xs font-mono text-amber-200 bg-black/90 border border-dashed border-red-500/50 space-y-1">
                        <b class="text-red-400 tracking-wider text-[11px] block">EZIC ORDER MESSAGE:</b>
                        <p class="italic text-slate-300 text-xs leading-snug">"The Order awaits. Let the courier pass through."</p>
                        <button type="button" class="btn-flip-flyer text-[9px] font-bold px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-slate-200 rounded cursor-pointer mt-1">
                            ↻ LẬT LẠI
                        </button>
                    </div>
                </div>

                <!-- 5. TỜ KHAI NHẬP CẢNH (ENTRY PERMIT / ACCESS PERMIT - STAGE 8) -->
                <div id="docEntryPermit" class="desk-draggable-doc doc-entry-permit select-none">
                    <div class="permit-stamp-scallop flex items-center justify-between px-3 py-1.5 text-[#1b1c1a] font-mono cursor-grab active:cursor-grabbing">
                        <span class="font-bold text-xs tracking-wider text-[#3c3726]">::: ARSTOTZKA ::: Access Permit</span>
                        <span class="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center border border-red-800">M</span>
                    </div>
                    <div class="p-2.5 space-y-1.5 text-xs font-mono text-[#2c2b27]">
                        <div class="border-b border-[#d8cfb4] pb-1">
                            <span class="text-[10px] text-gray-600 font-semibold">NAME:</span>
                            <b class="text-[#1a1917] block truncate font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="permit-name" data-inspect-val="${escapeHTML(t.fullName)}">${escapeHTML(t.fullName)}</b>
                        </div>
                        <div class="grid grid-cols-2 gap-1.5 text-xs">
                            <div><span class="text-gray-600 font-semibold text-[10px]">PURPOSE:</span> <b class="text-[#1a1917] font-bold inspectable-item" data-inspect-id="permit-purpose" data-inspect-val="${escapeHTML(t.profession || 'TRANSIT')}">${escapeHTML(t.profession || 'TRANSIT')}</b></div>
                            <div><span class="text-gray-600 font-semibold text-[10px]">DURATION:</span> <b class="text-[#1a1917] font-bold inspectable-item" data-inspect-id="permit-duration" data-inspect-val="2 MONTHS">2 MONTHS</b></div>
                            <div><span class="text-gray-600 font-semibold text-[10px]">WEIGHT:</span> <b class="text-[#1a1917] font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="permit-weight" data-inspect-val="${escapeHTML(String(t.weightKg))}kg">${escapeHTML(String(t.weightKg))}kg</b></div>
                            <div><span class="text-gray-600 font-semibold text-[10px]">HEIGHT:</span> <b class="text-[#1a1917] font-bold text-xs sm:text-[13px] inspectable-item" data-inspect-id="permit-height" data-inspect-val="${escapeHTML(String(t.heightCm))}cm">${escapeHTML(String(t.heightCm))}cm</b></div>
                        </div>
                        <div class="pt-1 flex items-center justify-between border-t border-[#d8cfb4] text-[10px] text-gray-700 font-semibold">
                            <span>ENTER BY: 1983.03.19</span>
                            <span class="font-bold text-red-700">M.O.A. CERTIFIED</span>
                        </div>
                    </div>
                </div>
            `;

            // Đánh dấu inspectable cho bàn cân, ngày trực và lời thoại nếu có
            const scaleVal = document.getElementById('boothScaleVal');
            if (scaleVal) {
                scaleVal.classList.add('inspectable-item');
                scaleVal.setAttribute('data-inspect-id', 'scale-weight');
                scaleVal.setAttribute('data-inspect-val', `${t.weightKg} kg`);
            }
            const dateVal = document.getElementById('boothDateVal');
            if (dateVal) {
                dateVal.classList.add('inspectable-item');
                dateVal.setAttribute('data-inspect-id', 'booth-date');
                dateVal.setAttribute('data-inspect-val', '82.11.26');
            }
            const speechText = document.getElementById('boothSpeechText');
            if (speechText) {
                speechText.classList.add('inspectable-item');
                speechText.setAttribute('data-inspect-id', 'spoken-testimony');
            }

            const flyer = (bay && typeof bay.querySelector === 'function') ? bay.querySelector('#docFlyerSecret') : null;
            if (flyer && typeof flyer.querySelectorAll === 'function') {
                const flipBtns = flyer.querySelectorAll('.btn-flip-flyer');
                if (flipBtns && typeof flipBtns.forEach === 'function') {
                    flipBtns.forEach(btn => {
                        if (btn && typeof btn.addEventListener === 'function') {
                            btn.addEventListener('click', (e) => {
                                if (typeof e.stopPropagation === 'function') e.stopPropagation();
                                const front = typeof flyer.querySelector === 'function' ? flyer.querySelector('.flyer-front') : null;
                                const back = typeof flyer.querySelector === 'function' ? flyer.querySelector('.flyer-back') : null;
                                if (front && back && front.classList && back.classList) {
                                    front.classList.toggle('hidden');
                                    back.classList.toggle('hidden');
                                }
                            });
                        }
                    });
                }
            }

            const docs = (bay && typeof bay.querySelectorAll === 'function') ? bay.querySelectorAll('.desk-draggable-doc') : [];
            if (docs && typeof docs.forEach === 'function') {
                docs.forEach(doc => this.makeDraggable(doc));
            }

            this.tidyDesk(false);
        }

        /**
         * Sắp xếp các tài liệu trên bàn gọn gàng chống đè lấn (Tidy Desk Auto-Resize Engine)
         */
        tidyDesk(playSound = true) {
            if (typeof document === 'undefined') return;

            const passport = document.getElementById('docPassport');
            const entryPermit = document.getElementById('docEntryPermit');
            const workPass = document.getElementById('docWorkPass');
            const idSupp = document.getElementById('docIdSupplement');
            const flyer = document.getElementById('docFlyerSecret');

            if (playSound) {
                const sfx = (root.App && root.App.PixelSFX) || null;
                if (sfx && typeof sfx.playPaperRustle === 'function') {
                    sfx.playPaperRustle();
                }
            }

            const bay = document.getElementById('deskDocumentsBay') || this.sandboxContainer;
            const bayW = bay ? bay.clientWidth : (typeof window !== 'undefined' ? window.innerWidth * 0.6 : 800);
            const bayH = bay ? bay.clientHeight : 300;

            const applyPos = (el, left, top) => {
                if (!el) return;
                el.style.transition = 'left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
                el.style.left = typeof left === 'number' ? `${Math.round(left)}px` : left;
                el.style.top = typeof top === 'number' ? `${Math.round(top)}px` : top;
                setTimeout(() => {
                    if (el) el.style.transition = '';
                }, 260);
            };

            if (bayW >= 760) {
                // Wide Desktop: Side-by-side Passport & Entry Permit with Passes on Left
                const passW = passport ? (passport.offsetWidth || 340) : 340;
                const permW = entryPermit ? (entryPermit.offsetWidth || 215) : 215;
                const passLeft = Math.max(bayW - passW - 12, bayW * 0.52);
                const permLeft = Math.max(12 + 220 + 10, passLeft - permW - 14);

                applyPos(passport, passLeft, 8);
                applyPos(entryPermit, permLeft, 8);
                applyPos(workPass, 12, 8);
                applyPos(idSupp, 12, 135);
                applyPos(flyer, Math.min(bayW - 190, permLeft), 170);
            } else if (bayW >= 540) {
                // Medium Laptop / Tablet Landscape
                const passW = passport ? (passport.offsetWidth || 310) : 310;
                const passLeft = Math.max(12, bayW - passW - 8);

                applyPos(passport, passLeft, 8);
                applyPos(entryPermit, 10, 8);
                applyPos(workPass, 10, 145);
                applyPos(idSupp, Math.min(bayW - 215, 235), 145);
                applyPos(flyer, Math.max(10, bayW - 185), 175);
            } else {
                // Mobile / Narrow Portrait: Staggered tabs, headers always reachable
                applyPos(passport, 8, 8);
                applyPos(entryPermit, 12, 65);
                applyPos(workPass, 8, 125);
                applyPos(idSupp, 12, 185);
                applyPos(flyer, 16, 240);
            }
        }

        /**
         * Kích hoạt hiệu ứng rung màn hình bàn làm việc (Screen Shake)
         */
        triggerScreenShake(container = null) {
            const target = container || this.deskContainer || document.body;
            if (!target) return;

            if (typeof window !== 'undefined') {
                if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                try {
                    if (localStorage.getItem('lyre_screen_shake') === 'false') return;
                } catch (e) {}
            }

            target.classList.remove('screen-shake-anim');
            void target.offsetWidth;
            target.classList.add('screen-shake-anim');

            setTimeout(() => {
                target.classList.remove('screen-shake-anim');
            }, 250);
        }

        /**
         * Dập dấu APPROVED (Ngọc bích)
         */
        stampApproved(details = 'ACOUSTIC CLEARANCE ★ 100%') {
            this.stampCount++;
            this.activeStamp = 'approved';

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                sfx.playStampThud();
            }
            this.triggerScreenShake();

            const randomRot = -(4 + Math.random() * 3).toFixed(1);
            const safeDetails = escapeHTML(details);
            const stampHTML = `
                <div class="stamp-seal stamp-approved stamp-slam-animation" style="transform: rotate(${randomRot}deg)">
                    <span class="stamp-title">APPROVED</span>
                    <span class="stamp-sub">${safeDetails}</span>
                </div>
            `;

            const passportSlot = typeof document !== 'undefined' ? document.getElementById('passportStampSlot') : null;
            if (passportSlot) {
                passportSlot.innerHTML = stampHTML;
            }

            if (this.stampTarget) {
                this.stampTarget.innerHTML = stampHTML;
            }

            return { status: 'approved', count: this.stampCount };
        }

        /**
         * Dập dấu DENIED (Đỏ son) kèm còi báo động và in giấy phạt (Citation)
         */
        stampDenied(reason = 'CONTRABAND DETECTED ★ CITATION') {
            this.stampCount++;
            this.activeStamp = 'denied';

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                sfx.playDeniedBuzzer();
            }
            this.triggerScreenShake();

            const randomRot = (3 + Math.random() * 3).toFixed(1);
            const safeReason = escapeHTML(reason);
            const stampHTML = `
                <div class="stamp-seal stamp-denied stamp-slam-animation" style="transform: rotate(${randomRot}deg)">
                    <span class="stamp-title">DENIED</span>
                    <span class="stamp-sub">${safeReason}</span>
                </div>
            `;

            const passportSlot = typeof document !== 'undefined' ? document.getElementById('passportStampSlot') : null;
            if (passportSlot) {
                passportSlot.innerHTML = stampHTML;
            }

            if (this.stampTarget) {
                this.stampTarget.innerHTML = stampHTML;
            }

            this.issueCitation(reason);

            return { status: 'denied', count: this.stampCount, reason };
        }

        /**
         * In phiếu phạt Citation Slip từ máy in cơ học
         */
        issueCitation(reason) {
            const citationId = this.citations.length + 1;
            const citation = {
                id: citationId,
                reason: reason,
                timestamp: new Date().toLocaleTimeString()
            };
            this.citations.push(citation);

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx && typeof sfx.playTypewriterBlip === 'function') {
                sfx.playTypewriterBlip();
            }

            if (this.citationContainer) {
                const safeReason = escapeHTML(reason);
                if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
                    const slip = document.createElement('div');
                    slip.className = 'pixel-citation-slip animate-citation-print';
                    slip.innerHTML = `
                        <div class="citation-header">
                            <span>MINISTRY OF ADMISSION</span>
                            <span>M.O.A. PROTOCOL #83</span>
                        </div>
                        <div class="citation-body">
                            <b>CITATION #${citationId.toString().padStart(2, '0')}:</b>
                            <p>${safeReason}</p>
                        </div>
                        <div class="citation-footer flex items-center justify-between">
                            <span>PENALTY: RECORDED IN DOSSIER</span>
                            <button type="button" class="btn-tear-citation text-[8px] px-1.5 py-0.5 bg-gray-200 hover:bg-red-600 hover:text-white border border-gray-400 font-bold uppercase cursor-pointer" title="Xé phiếu phạt khỏi bàn">✕ XÉ</button>
                        </div>
                    `;
                    const tearBtn = (typeof slip.querySelector === 'function') ? slip.querySelector('.btn-tear-citation') : null;
                    if (tearBtn && typeof tearBtn.addEventListener === 'function') {
                        tearBtn.addEventListener('click', (e) => {
                            if (typeof e.stopPropagation === 'function') e.stopPropagation();
                            if (slip.classList && typeof slip.classList.add === 'function') {
                                slip.classList.add('citation-torn-away');
                            }
                            const sfxLocal = (root.App && root.App.PixelSFX) || null;
                            if (sfxLocal && typeof sfxLocal.playTypewriterBlip === 'function') sfxLocal.playTypewriterBlip();
                            setTimeout(() => {
                                if (typeof slip.remove === 'function') slip.remove();
                            }, 250);
                        });
                    }
                    if (typeof this.citationContainer.prepend === 'function') {
                        this.citationContainer.prepend(slip);
                    }
                } else if (typeof this.citationContainer.prepend === 'function') {
                    this.citationContainer.prepend({
                        innerHTML: `<p>${safeReason}</p>`
                    });
                }
            }
        }

        /**
         * Chuyển tab Sổ tay điều tra gáy xoắn (Rules, Map, Docs, Conf, Vocab, Config)
         */
        switchRulebookTab(tabName) {
            this.currentTab = tabName;
            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                if (typeof sfx.playPaperRustle === 'function') {
                    sfx.playPaperRustle();
                } else if (typeof sfx.playTypewriterBlip === 'function') {
                    sfx.playTypewriterBlip();
                }
            }

            if (this.rulebookContainer && typeof this.rulebookContainer.querySelectorAll === 'function') {
                const tabs = this.rulebookContainer.querySelectorAll('.pixel-tab-btn');
                tabs.forEach(tab => {
                    const t = tab.getAttribute('data-tab');
                    if (t === tabName) {
                        tab.classList.add('is-active');
                    } else {
                        tab.classList.remove('is-active');
                    }
                });

                const panes = this.rulebookContainer.querySelectorAll('.rulebook-pane');
                panes.forEach(pane => {
                    const p = pane.getAttribute('data-pane');
                    if (p === tabName) {
                        pane.classList.remove('hidden');
                    } else {
                        pane.classList.add('hidden');
                    }
                });
            }

            return this.currentTab;
        }

        /**
         * Khóa mực vĩnh viễn (Return of the Obra Dinn Ink Lock)
         */
        lockInWord(elementId) {
            const el = document.getElementById(elementId);
            if (!el) return;

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                sfx.playInkLockSound();
            }

            el.classList.add('is-ink-locked');
            el.innerHTML += ` <span class="px-font-arcade text-[8px] text-green-400">✓ ĐÃ KHÓA</span>`;
        }

        /**
         * Gắn cơ chế lò xo nén dập cơ học vào nút con dấu (Spring-Loaded Stamp)
         */
        bindSpringStamp(buttonEl, type = 'approved', reason = '') {
            if (!buttonEl) return;
            if (buttonEl._isSpringBound) return;
            buttonEl._isSpringBound = true;

            let isPressed = false;
            const pressDown = (e) => {
                isPressed = true;
                buttonEl.classList.add('stamp-spring-tension');
                const sfx = (root.App && root.App.PixelSFX) || null;
                if (sfx) {
                    sfx.playTypewriterBlip();
                }
            };

            const releaseSlam = (e) => {
                if (!isPressed) return;
                isPressed = false;
                buttonEl.classList.remove('stamp-spring-tension');
                if (type === 'approved') {
                    this.stampApproved();
                } else {
                    this.stampDenied(reason || 'DISCREPANCY DETECTED');
                }
            };

            buttonEl.addEventListener('mousedown', pressDown);
            window.addEventListener('mouseup', releaseSlam);
            buttonEl.addEventListener('touchstart', pressDown, { passive: true });
            window.addEventListener('touchend', releaseSlam, { passive: true });
        }

        /**
         * Kích hoạt dập lò xo tự động
         */
        triggerSpringSlam(type = 'approved', reason = '') {
            if (type === 'approved') {
                return this.stampApproved();
            } else {
                return this.stampDenied(reason || 'PHONETIC PENALTY');
            }
        }

        /**
         * Xóa sạch các con dấu hiện tại
         */
        clearStamps() {
            const passportSlot = typeof document !== 'undefined' ? document.getElementById('passportStampSlot') : null;
            if (passportSlot) {
                passportSlot.innerHTML = `
                    <span class="text-[9px] text-amber-400/60 italic tracking-widest">[STAMP HERE]</span>
                `;
            }

            if (this.stampTarget) {
                this.stampTarget.innerHTML = `
                    <span class="text-xs italic text-gray-500">Chưa đóng dấu phê duyệt.</span>
                `;
            }
            this.activeStamp = null;
        }

        /**
         * Dọn sạch toàn bộ phiếu phạt trên khay máy in M.O.A.
         */
        clearCitations() {
            this.citations = [];
            if (this.citationContainer) {
                this.citationContainer.innerHTML = `
                    <span class="text-[10px] font-mono text-slate-300 italic block">Chưa có vi phạm nào.</span>
                `;
            }
        }
    }

    // UMD Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PixelDesk;
    }
    root.App = root.App || {};
    root.App.PixelDesk = PixelDesk;

})(typeof window !== 'undefined' ? window : global);
