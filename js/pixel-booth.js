/**
 * Lyre Studio - Grestin Border Checkpoint Booth & Procedural Traveler Generator (js/pixel-booth.js)
 * True Playable Retro Pixel Game UI (Version 5.0)
 * Inspires by Papers Please, Deltarune, and 1984 Arcade Aesthetics.
 */
(function (root) {
    'use strict';

    /**
     * 1. BỘ SINH NHÂN VẬT PIXEL VECTOR SVG (Procedural Pixel Traveler)
     * Sinh sprite 32x32 SVG chuẩn pixel-art, không dùng file ảnh ngoài, 100% offline & siêu nhẹ.
     */
    class PixelTraveler {
        static get PALETTES() {
            return {
                skin: ['#ffdfc4', '#e0ac69', '#c68642', '#8d5524'],
                arstotzka: { coat: '#384d28', dark: '#223218', trim: '#b89c38', name: 'ARSTOTZKA' },
                kolechia: { coat: '#5c3a21', dark: '#3b2312', trim: '#8c5932', name: 'KOLECHIA' },
                obristan: { coat: '#631f24', dark: '#3f1115', trim: '#b08b35', name: 'OBRISTAN' },
                antegria: { coat: '#223954', dark: '#142335', trim: '#7ca2cf', name: 'ANTEGRIA' },
                republia: { coat: '#6b5823', dark: '#423612', trim: '#c4a749', name: 'REPUBLIA' },
                neutral: { coat: '#2c313d', dark: '#191c24', trim: '#6a7285', name: 'UNITED FED.' }
            };
        }

        static get TRAVELER_NAMES() {
            return [
                { first: 'Jorji', last: 'Costava', nation: 'obristan', prof: 'Buôn Bán Tự Do' },
                { first: 'Dimitri', last: 'Volkov', nation: 'arstotzka', prof: 'Kỹ Sư Âm Học' },
                { first: 'Elisa', last: 'Katsen', nation: 'kolechia', prof: 'Thông Dịch Viên' },
                { first: 'Mikhail', last: 'Danilov', nation: 'antegria', prof: 'Công Chức Ngoại Giao' },
                { first: 'Sonja', last: 'Weiss', nation: 'republia', prof: 'Phóng Viên Báo Chí' },
                { first: 'Sergei', last: 'Orlov', nation: 'arstotzka', prof: 'Thợ Cơ Khí Đồng Hồ' },
                { first: 'Klara', last: 'Vogel', nation: 'obristan', prof: 'Nghệ Sĩ Violin' },
                { first: 'Anton', last: 'Geller', nation: 'kolechia', prof: 'Thương Gia Đá Quý' },
                { first: 'Vera', last: 'Novak', nation: 'antegria', prof: 'Nghiên Cứu Ngữ Âm' },
                { first: 'Roman', last: 'Petrov', nation: 'republia', prof: 'Thư Ký Công Chứng' }
            ];
        }

        /**
         * Sinh dữ liệu và mã SVG của một hành khách dựa trên seed
         */
        static generate(seed) {
            const s = Math.abs(seed || 0);
            const nameObj = this.TRAVELER_NAMES[s % this.TRAVELER_NAMES.length];
            const nationKeys = ['arstotzka', 'kolechia', 'obristan', 'antegria', 'republia', 'neutral'];
            const nationKey = nationKeys[(s * 3) % nationKeys.length];
            const palette = this.PALETTES[nationKey];
            const skinColor = this.PALETTES.skin[(s * 7) % this.PALETTES.skin.length];

            const hatType = s % 6; // 0: Ushanka, 1: Fedora, 2: Beret, 3: Flatcap, 4: Hood, 5: Hair
            const eyeType = (s * 5) % 5; // 0: Normal, 1: Squint, 2: Glasses, 3: Aviators, 4: Monocle
            const beardType = (s * 11) % 4; // 0: Mustache, 1: Full beard, 2: Stubble, 3: Clean

            const passportId = `AR-${1000 + (s * 37) % 8999}`;

            // Tạo các khối hình chữ nhật của lưới pixel 32x32
            let rects = [];

            // 1. Vai & Áo khoác (Rows 20-31, Cols 6-25)
            rects.push(`<rect x="8" y="20" width="16" height="12" fill="${palette.coat}"/>`);
            rects.push(`<rect x="6" y="22" width="20" height="10" fill="${palette.coat}"/>`);
            rects.push(`<rect x="5" y="24" width="22" height="8" fill="${palette.coat}"/>`);
            // Cổ áo chữ V & ve áo
            rects.push(`<polygon points="12,20 16,26 20,20" fill="${palette.dark}"/>`);
            rects.push(`<rect x="15" y="20" width="2" height="7" fill="#ffffff"/>`); // Cổ áo sơ mi
            rects.push(`<rect x="15" y="22" width="2" height="6" fill="${palette.trim}"/>`); // Cà vạt / Huy hiệu

            // 2. Cổ & Khuôn mặt (Rows 10-19, Cols 10-21)
            rects.push(`<rect x="13" y="18" width="6" height="3" fill="${skinColor}"/>`); // Cổ
            rects.push(`<rect x="10" y="10" width="12" height="9" fill="${skinColor}"/>`); // Đầu
            rects.push(`<rect x="9" y="12" width="14" height="6" fill="${skinColor}"/>`); // Hai má

            // 3. Tóc / Mũ
            const hairColor = ['#1a1a1a', '#4a3319', '#7a4b22', '#c29b62', '#e8e8e8'][(s * 13) % 5];
            if (hatType === 0) {
                // Ushanka (Mũ lông Arstotzka có tai cụp)
                rects.push(`<rect x="8" y="5" width="16" height="6" fill="#2d3036"/>`);
                rects.push(`<rect x="9" y="4" width="14" height="2" fill="#2d3036"/>`);
                rects.push(`<rect x="7" y="7" width="3" height="8" fill="#1f2126"/>`); // Tai trái
                rects.push(`<rect x="22" y="7" width="3" height="8" fill="#1f2126"/>`); // Tai phải
                rects.push(`<rect x="15" y="6" width="2" height="2" fill="#d9383a"/>`); // Sao đỏ
            } else if (hatType === 1) {
                // Fedora (Mũ phớt)
                rects.push(`<rect x="7" y="8" width="18" height="2" fill="#3b2b20"/>`); // Vành
                rects.push(`<rect x="10" y="4" width="12" height="4" fill="#3b2b20"/>`); // Chóp
                rects.push(`<rect x="10" y="7" width="12" height="1" fill="${palette.trim}"/>`); // Dải băng
            } else if (hatType === 2) {
                // Beret (Nón nồi)
                rects.push(`<rect x="9" y="6" width="16" height="4" fill="#243328"/>`);
                rects.push(`<rect x="8" y="7" width="16" height="3" fill="#243328"/>`);
                rects.push(`<rect x="23" y="6" width="2" height="1" fill="#243328"/>`);
            } else if (hatType === 3) {
                // Flat cap (Nón phẳng công nhân)
                rects.push(`<rect x="9" y="6" width="14" height="4" fill="#4a443b"/>`);
                rects.push(`<rect x="8" y="9" width="16" height="2" fill="#38332c"/>`);
            } else if (hatType === 4) {
                // Hood (Mũ trùm đầu trùm kín)
                rects.push(`<rect x="8" y="7" width="16" height="5" fill="${palette.coat}"/>`);
                rects.push(`<rect x="8" y="10" width="3" height="8" fill="${palette.coat}"/>`);
                rects.push(`<rect x="21" y="10" width="3" height="8" fill="${palette.coat}"/>`);
            } else {
                // Tóc thường
                rects.push(`<rect x="9" y="7" width="14" height="4" fill="${hairColor}"/>`);
                rects.push(`<rect x="8" y="9" width="3" height="5" fill="${hairColor}"/>`);
                rects.push(`<rect x="21" y="9" width="3" height="5" fill="${hairColor}"/>`);
            }

            // 4. Mắt & Kính (Hàng 13-14)
            if (eyeType === 0) {
                // Mắt thường
                rects.push(`<rect x="12" y="13" width="2" height="2" fill="#111111" class="px-eye-pupil"/>`);
                rects.push(`<rect x="18" y="13" width="2" height="2" fill="#111111" class="px-eye-pupil"/>`);
            } else if (eyeType === 1) {
                // Mắt híp nghi ngờ
                rects.push(`<rect x="12" y="14" width="3" height="1" fill="#111111" class="px-eye-pupil"/>`);
                rects.push(`<rect x="17" y="14" width="3" height="1" fill="#111111" class="px-eye-pupil"/>`);
            } else if (eyeType === 2) {
                // Mắt kính tròn trí thức
                rects.push(`<rect x="11" y="12" width="4" height="4" fill="none" stroke="#b08b35" stroke-width="1"/>`);
                rects.push(`<rect x="17" y="12" width="4" height="4" fill="none" stroke="#b08b35" stroke-width="1"/>`);
                rects.push(`<line x1="15" y1="13" x2="17" y2="13" stroke="#b08b35" stroke-width="1"/>`);
                rects.push(`<rect x="12" y="13" width="2" height="2" fill="#111111" class="px-eye-pupil"/>`);
                rects.push(`<rect x="18" y="13" width="2" height="2" fill="#111111" class="px-eye-pupil"/>`);
                rects.push(`<rect x="12" y="12" width="1" height="1" fill="#ffffff" opacity="0.8"/>`);
                rects.push(`<rect x="18" y="12" width="1" height="1" fill="#ffffff" opacity="0.8"/>`);
            } else if (eyeType === 3) {
                // Kính phi công Aviator đen ngầu
                rects.push(`<rect x="11" y="12" width="4" height="3" fill="#1a1e24"/>`);
                rects.push(`<rect x="17" y="12" width="4" height="3" fill="#1a1e24"/>`);
                rects.push(`<line x1="15" y1="12" x2="17" y2="12" stroke="#444" stroke-width="1"/>`);
                rects.push(`<line x1="11" y1="12" x2="13" y2="14" stroke="#88ccff" stroke-width="0.8"/>`);
                rects.push(`<line x1="17" y1="12" x2="19" y2="14" stroke="#88ccff" stroke-width="0.8"/>`);
            } else {
                // Kính 1 mắt Monocle bên phải
                rects.push(`<rect x="12" y="13" width="2" height="2" fill="#111111" class="px-eye-pupil"/>`);
                rects.push(`<rect x="17" y="12" width="4" height="4" fill="none" stroke="#e0ac38" stroke-width="1"/>`);
                rects.push(`<rect x="18" y="13" width="2" height="2" fill="#111111" class="px-eye-pupil"/>`);
                rects.push(`<line x1="21" y1="16" x2="22" y2="20" stroke="#e0ac38" stroke-width="0.8"/>`);
            }

            // 5. Râu
            if (beardType === 0) {
                // Ria mép cong kiểu thanh tra / quý ông
                rects.push(`<rect x="12" y="16" width="8" height="1" fill="${hairColor}"/>`);
                rects.push(`<rect x="11" y="17" width="2" height="1" fill="${hairColor}"/>`);
                rects.push(`<rect x="19" y="17" width="2" height="1" fill="${hairColor}"/>`);
            } else if (beardType === 1) {
                // Râu quai nón dày
                rects.push(`<rect x="11" y="16" width="10" height="3" fill="${hairColor}"/>`);
                rects.push(`<rect x="12" y="18" width="8" height="2" fill="${hairColor}"/>`);
            } else if (beardType === 2) {
                // Râu lún phún Stubble
                rects.push(`<rect x="12" y="17" width="1" height="1" fill="${hairColor}" opacity="0.6"/>`);
                rects.push(`<rect x="14" y="17" width="1" height="1" fill="${hairColor}" opacity="0.6"/>`);
                rects.push(`<rect x="17" y="17" width="1" height="1" fill="${hairColor}" opacity="0.6"/>`);
                rects.push(`<rect x="19" y="17" width="1" height="1" fill="${hairColor}" opacity="0.6"/>`);
                rects.push(`<rect x="13" y="18" width="1" height="1" fill="${hairColor}" opacity="0.6"/>`);
                rects.push(`<rect x="18" y="18" width="1" height="1" fill="${hairColor}" opacity="0.6"/>`);
            }

            // 6. Miệng (Mặc định: ngậm miệng, có thể đóng mở qua class .is-talking)
            rects.push(`
                <g class="px-traveler-mouth" id="travelerMouthGroup">
                    <rect x="14" y="17" width="4" height="1" fill="#4a221a" class="mouth-closed"/>
                    <rect x="14" y="17" width="4" height="2" fill="#2d100d" class="mouth-open hidden"/>
                    <rect x="15" y="18" width="2" height="1" fill="#e05252" class="mouth-tongue hidden"/>
                </g>
            `);

            // 7. Huy hiệu cảm xúc (Emotion Overlay - ẩn mặc định)
            rects.push(`
                <g id="travelerEmotionOverlay" class="hidden">
                    <!-- Sweat Drop (Denied) -->
                    <path class="emotion-sweat hidden" d="M22,10 Q24,12 24,14 A2,2 0 0,1 20,14 Q20,12 22,10 Z" fill="#38bdf8"/>
                    <!-- Sparkle / Star (Approved) -->
                    <polygon class="emotion-star hidden" points="23,9 24,11 26,11 24.5,12.5 25,15 23,13.5 21,15 21.5,12.5 20,11 22,11" fill="#fbbf24"/>
                </g>
            `);

            const heightCm = 152 + (s * 7) % 36; // 152cm đến 187cm
            const heightM = (heightCm / 100).toFixed(2);
            const weightKg = 48 + (s * 11) % 48; // 48kg đến 95kg
            const birthYear = 1935 + (s * 3) % 28;
            const birthMonth = String(1 + (s * 5) % 12).padStart(2, '0');
            const birthDay = String(1 + (s * 7) % 28).padStart(2, '0');

            const cities = {
                arstotzka: ['Orvech Von', 'East Grestin', 'Paradizna'],
                kolechia: ['Yurko City', 'Vraden', 'West Grestin'],
                obristan: ['Skal', 'Lorndaz', 'Mergerous'],
                antegria: ['St. Marmero', 'Glorian', 'Outer Grouse'],
                republia: ['True Glorian', 'Lesrenadi', 'Bostan'],
                neutral: ['Enfield', 'Concordia', 'Sanctuary']
            };
            const cityList = cities[nationKey] || ['Grestin'];
            const issuingCity = cityList[(s * 2) % cityList.length];

            const svg = `
                <svg viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges" class="pixel-traveler-svg select-none">
                    ${rects.join('\n')}
                </svg>
            `;

            return {
                id: `traveler-${s}`,
                fullName: `${nameObj.first} ${nameObj.last}`,
                nationality: palette.name,
                profession: nameObj.prof,
                passportId: passportId,
                heightCm: heightCm,
                heightM: heightM,
                weightKg: weightKg,
                birthDate: `${birthYear}.${birthMonth}.${birthDay}`,
                issuingCity: issuingCity,
                gender: (s % 2 === 0) ? 'M' : 'F',
                svg: svg
            };
        }
    }

    /**
     * 2. Ô KÍNH BUỒNG KIỂM SOÁT BIÊN GIỚI GRESTIN (PixelBooth)
     */
    class PixelBooth {
        constructor() {
            this.container = null;
            this.viewport = null;
            this.shutter = null;
            this.travelerMount = null;
            this.nameBadge = null;
            this.nationBadge = null;
            this.passportBadge = null;
            this.shutterStatusBadge = null;
            this.btnCallNext = null;

            this.currentTraveler = null;
            this.isShutterOpen = false;
            this.isTalking = false;
            this.talkingInterval = null;
        }

        /**
         * Khởi tạo và gắn Buồng kính vào đầu khu vực làm việc (#dictationSection)
         */
        init(options = {}) {
            const mount = options.mountPoint || document.getElementById('pixelBoothMount');
            if (!mount) return;

            this.container = mount;
            this.container.innerHTML = `
                <div class="pixel-booth-viewport relative overflow-hidden select-none mb-3" id="pixelBoothViewport">
                    <!-- 1. Hậu cảnh: Tháp canh biên giới & Đèn rà quét -->
                    <div class="booth-backdrop absolute inset-0">
                        <div class="searchlight-beam"></div>
                        <div class="border-fence-silhouette"></div>
                        <div class="border-queue-shadows"></div>
                        <div class="snow-particles-canvas"></div>
                    </div>

                    <!-- 2. Kính chắn gió phản quang với vết ố kính -->
                    <div class="booth-glass-overlay absolute inset-0 pointer-events-none"></div>

                    <!-- 2b. Thước vạch đo chiều cao trên tường (Height Scale: 1.1m - 1.9m) -->
                    <div class="booth-height-ruler absolute left-2 top-2 bottom-10 z-10 flex flex-col justify-between text-[8px] font-mono font-bold text-amber-400/80 border-r border-amber-500/40 pr-1 select-none pointer-events-none" title="Thước đo chiều cao hành khách">
                        <span>1.9</span>
                        <span>1.8</span>
                        <span>1.7</span>
                        <span>1.6</span>
                        <span>1.5</span>
                        <span>1.4</span>
                        <span>1.3</span>
                        <span>1.2</span>
                        <span>1.1</span>
                    </div>

                    <!-- 3. Khu vực đứng của Khách Nhập Cảnh (Traveler Sprite) & Bóng thoại -->
                    <div class="relative z-10 h-full flex items-end justify-between px-3 sm:px-6 pb-9">
                        <!-- Left: Tên & Hồ sơ của khách & CRT Audio Monitor -->
                        <div class="flex items-center gap-2 ml-4">
                            <div class="traveler-dossier-pill flex flex-col gap-0.5 bg-black/85 border border-gray-600 p-1.5 rounded text-[11px] font-mono shadow-md max-w-[120px] sm:max-w-[160px]">
                                <div class="flex items-center gap-1.5 text-amber-300 font-bold truncate">
                                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span id="boothTravelerName">KHÁCH CHỜ DUYỆT</span>
                                </div>
                                <div class="flex items-center gap-1 text-gray-200 text-[10px] font-semibold truncate">
                                    <span id="boothTravelerNation" class="text-emerald-400 uppercase font-bold">ARSTOTZKA</span>
                                    <span>·</span>
                                    <span id="boothTravelerPassport" class="text-gray-300">AR-8402</span>
                                </div>
                            </div>

                            <!-- CRT Audio Oscilloscope Monitor (Stage 8) -->
                            <div class="booth-crt-monitor hidden sm:flex flex-col justify-between p-1" title="Màn hình giám sát âm học M.O.A. 140.85">
                                <div class="flex items-center justify-between text-[6px] font-mono font-bold text-emerald-400 leading-none">
                                    <span>MIC 140.85</span>
                                    <span class="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                                </div>
                                <canvas id="boothOscilloscopeCanvas" class="booth-crt-canvas" width="80" height="30"></canvas>
                                <div class="flex items-center justify-between text-[6px] font-mono text-emerald-500/80 leading-none">
                                    <span>ACOUSTIC</span>
                                    <span id="boothMonitorStatus">STANDBY</span>
                                </div>
                            </div>
                        </div>

                        <!-- Center: Sprite Nhân Vật Pixel 32x32 & Bóng thoại -->
                        <div class="relative flex flex-col items-center">
                            <!-- Speech Bubble -->
                            <div id="boothSpeechBubble" class="hidden absolute -top-9 px-3 py-1.5 bg-[#fefffb] border-2 border-black text-[#181212] text-xs sm:text-sm font-mono font-bold max-w-[280px] sm:max-w-[340px] whitespace-normal text-center shadow-lg speech-bubble-tail z-30">
                                <span id="boothSpeechText">Papers, please.</span>
                            </div>
                            <!-- Sprite Box -->
                            <div class="traveler-sprite-box relative flex items-end justify-center w-24 h-24 sm:w-28 sm:h-28 -mb-1" id="boothTravelerSprite">
                                <!-- Procedural SVG inserted here -->
                            </div>
                        </div>

                        <!-- Right: Loa Phóng Thanh [📢 CALL NEXT] & Cửa Cuốn -->
                        <div class="flex flex-col items-end gap-1.5">
                            <button type="button" id="btnBoothCallNext" class="pixel-btn pixel-btn-amber !py-1.5 !px-3 text-xs flex items-center gap-1.5 shadow-lg group cursor-pointer" title="Gọi khách kế tiếp (Phát câu nghe)">
                                <span class="text-sm group-hover:scale-125 transition-transform">📢</span>
                                <span class="font-bold">CALL NEXT!</span>
                            </button>
                            <button type="button" id="btnBoothToggleShutter" class="text-[10px] font-mono text-gray-300 hover:text-white underline cursor-pointer font-semibold">
                                <span id="boothShutterStatusText">Cửa cuốn: Mở</span>
                            </button>
                        </div>
                    </div>

                    <!-- 4. GỜ BÀN CÂN KIM LOẠI DƯỚI CÙNG (Counter Ledge: Weight Scale, Date Clock, Mic) -->
                    <div class="booth-counter-bar absolute bottom-0 inset-x-0 h-8 bg-[#18202c] border-t-2 border-black z-15 flex items-center justify-between px-3 font-mono text-[10px] select-none">
                        <!-- Left: Cân điện tử kỹ thuật số -->
                        <div class="flex items-center gap-1.5" title="Bàn cân trọng lượng hành khách">
                            <span class="text-[9px] text-gray-400 font-bold uppercase">CÂN:</span>
                            <span id="boothScaleVal" class="px-1.5 py-0.2 bg-black border border-amber-500/70 text-amber-300 font-bold font-mono text-[10px] tracking-wider">55 kg</span>
                        </div>
                        <!-- Center: Đồng hồ ngày trực & Giờ ca trực (06:00 - 18:00) -->
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1.5" title="Đồng hồ ngày trực hải quan">
                                <span class="text-[9px] text-gray-400 font-bold uppercase">NGÀY:</span>
                                <span id="boothDateVal" class="px-1.5 py-0.2 bg-black border border-emerald-500/70 text-emerald-300 font-bold font-mono text-[10px] tracking-wider">82.11.26</span>
                            </div>
                            <div class="flex items-center gap-1.5" title="Đồng hồ đếm giờ ca trực hải quan (06:00 - 18:00)">
                                <span class="text-[9px] text-gray-400 font-bold uppercase">GIỜ:</span>
                                <span id="boothTimeVal" class="px-1.5 py-0.2 bg-black border border-cyan-500/70 text-cyan-300 font-bold font-mono text-[10px] tracking-wider">06:00</span>
                            </div>
                        </div>
                        <!-- Right: Lưới micro đàm thoại -->
                        <div class="flex items-center gap-1" title="Micro thu âm thẩm vấn M.O.A.">
                            <span class="w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-[8px] text-gray-300 shadow-inner">🎙️</span>
                            <span class="text-[9px] text-gray-400 font-bold">01 · MOA</span>
                        </div>
                    </div>

                    <!-- 5. CỬA CUỐN SẮT CƠ HỌC (Mechanical Iron Shutter) -->
                    <div class="pixel-shutter absolute inset-0 z-20 flex flex-col justify-between p-3 select-none transition-transform duration-500 ease-in-out" id="boothIronShutter">
                        <div class="flex items-center justify-between text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/20 pb-1.5">
                            <span>M.O.A. GRESTIN CHECKPOINT</span>
                            <span class="animate-pulse text-red-400 font-bold">● SHUTTER CLOSED</span>
                        </div>
                        <div class="text-center my-auto">
                            <div class="px-font-arcade text-xs sm:text-sm text-gray-200 font-bold tracking-wider">
                                [ CA TRỰC ĐANG TẠM DỪNG ]
                            </div>
                            <p class="text-xs font-mono text-gray-300 mt-1.5 font-medium">Bấm "CALL NEXT!" hoặc nút Cửa cuốn để mở cửa đón khách</p>
                        </div>
                        <div class="flex items-center justify-between text-[11px] font-mono text-gray-300 font-semibold border-t border-white/20 pt-1.5">
                            <span>CABIN INSPECTOR #402</span>
                            <span class="text-amber-300 font-bold">ARSTOTZKA 1984</span>
                        </div>
                    </div>

                    <!-- 6. Khung sắt đinh tán ngoài cùng (Rivet Border) -->
                    <div class="booth-iron-frame absolute inset-0 pointer-events-none"></div>
                </div>
            `;

            this.viewport = this.container.querySelector('#pixelBoothViewport');
            this.shutter = this.container.querySelector('#boothIronShutter');
            this.travelerMount = this.container.querySelector('#boothTravelerSprite');
            this.nameBadge = this.container.querySelector('#boothTravelerName');
            this.nationBadge = this.container.querySelector('#boothTravelerNation');
            this.passportBadge = this.container.querySelector('#boothTravelerPassport');
            this.shutterStatusBadge = this.container.querySelector('#boothShutterStatusText');
            this.btnCallNext = this.container.querySelector('#btnBoothCallNext');

            // Gắn sự kiện nút CALL NEXT
            if (this.btnCallNext) {
                this.btnCallNext.addEventListener('click', () => {
                    this.openShutter();
                    if (typeof options.onCallNext === 'function') {
                        options.onCallNext();
                    } else if (root.App && root.App.AudioEngine) {
                        if (root.App.state && root.App.state.isPlaying) {
                            root.App.AudioEngine.replay();
                        } else {
                            root.App.AudioEngine.play();
                        }
                    }
                    if (root.App && root.App.PixelSFX) {
                        root.App.PixelSFX.playCodecSquelch();
                    }
                });
            }

            // Gắn sự kiện đóng/mở cửa cuốn
            const btnToggleShutter = this.container.querySelector('#btnBoothToggleShutter');
            if (btnToggleShutter) {
                btnToggleShutter.addEventListener('click', () => {
                    this.toggleShutter();
                });
            }

            // Mở cửa cuốn ban đầu
            this.openShutter();
        }

        /**
         * Đón một vị khách mới tương ứng với câu nghe (sentenceIdx)
         */
        presentTraveler(sentenceIdx, subtitleText, options = {}) {
            const seed = (sentenceIdx !== undefined ? sentenceIdx : 0) * 17 + (subtitleText ? subtitleText.length : 12);
            this.currentTraveler = PixelTraveler.generate(seed);

            if (this.travelerMount) {
                this.travelerMount.innerHTML = this.currentTraveler.svg;
                this.travelerMount.classList.remove('animate-traveler-leave', 'animate-traveler-enter');
                void this.travelerMount.offsetWidth; // Trigger reflow
                this.travelerMount.classList.add('animate-traveler-enter');
            }

            // Restart mouth-flap on the freshly rendered sprite (old node refs are stale)
            if (this.isTalking) {
                this.isTalking = false;
                this.setTalking(true);
            }

            if (this.nameBadge) this.nameBadge.textContent = this.currentTraveler.fullName;
            if (this.nationBadge) this.nationBadge.textContent = this.currentTraveler.nationality;
            if (this.passportBadge) this.passportBadge.textContent = this.currentTraveler.passportId;

            // Đồng bộ với tiêu đề hộ chiếu trên bàn
            const passportHeader = document.getElementById('gamePassportHeader');
            if (passportHeader) {
                passportHeader.textContent = `ENTRY PERMIT · ${this.currentTraveler.passportId}`;
            }

            // Cập nhật số cân điện tử buồng gác
            const scaleDisplay = document.getElementById('boothScaleVal');
            if (scaleDisplay) {
                scaleDisplay.textContent = `${this.currentTraveler.weightKg} kg`;
            }

            // Cập nhật ngày trực đồng hồ buồng gác
            const dateDisplay = document.getElementById('boothDateVal');
            if (dateDisplay) {
                dateDisplay.textContent = `82.11.26`;
            }

            // Cập nhật giờ ca trực nếu có
            if (options.shiftTime) {
                this.setTime(options.shiftTime);
            }

            // Hiển thị bóng thoại chào hỏi ngắn gọn
            const bubble = document.getElementById('boothSpeechBubble');
            const speechText = document.getElementById('boothSpeechText');
            if (bubble && speechText) {
                const greetings = [
                    "Glory to Arstotzka.",
                    "Papers, please.",
                    "Here are my documents.",
                    "Just visiting my family.",
                    "Coming for business, officer."
                ];
                speechText.textContent = greetings[seed % greetings.length];
                bubble.classList.remove('hidden');
                setTimeout(() => {
                    bubble.classList.add('hidden');
                }, 3500);
            }

            // Mở cửa cuốn nếu đang đóng
            if (!this.isShutterOpen) {
                this.openShutter();
            }
        }

        /**
         * Mở cửa cuốn cơ học
         */
        openShutter() {
            if (!this.shutter) return;
            this.shutter.classList.add('shutter-opened');
            this.isShutterOpen = true;
            if (this.shutterStatusBadge) this.shutterStatusBadge.textContent = 'Cửa cuốn: Mở';
        }

        /**
         * Đóng cửa cuốn cơ học
         */
        closeShutter() {
            if (!this.shutter) return;
            this.shutter.classList.remove('shutter-opened');
            this.isShutterOpen = false;
            if (this.shutterStatusBadge) this.shutterStatusBadge.textContent = 'Cửa cuốn: Đóng';
        }

        toggleShutter() {
            if (this.isShutterOpen) {
                this.closeShutter();
            } else {
                this.openShutter();
            }
        }

        /**
         * Cập nhật đồng hồ ca trực đếm ngược / đếm tới (Stage 9)
         */
        setTime(timeStr) {
            if (typeof document === 'undefined') return;
            const timeDisplay = document.getElementById('boothTimeVal');
            if (timeDisplay) timeDisplay.textContent = timeStr || '06:00';
        }

        /**
         * Hoạt ảnh nhép miệng theo âm thanh (Talking mouth-flap animation)
         */
        setTalking(isTalking) {
            if (this.isTalking === isTalking) return;
            this.isTalking = isTalking;

            if (typeof document !== 'undefined') {
                const monStatus = document.getElementById('boothMonitorStatus');
                if (monStatus) monStatus.textContent = isTalking ? 'TRANSMITTING' : 'STANDBY';
                this.drawOscilloscope(isTalking);
            }

            const mouthGroup = (this.travelerMount && typeof this.travelerMount.querySelector === 'function')
                ? this.travelerMount.querySelector('#travelerMouthGroup') : null;
            if (!mouthGroup) return;

            const closed = mouthGroup.querySelector('.mouth-closed');
            const open = mouthGroup.querySelector('.mouth-open');
            const tongue = mouthGroup.querySelector('.mouth-tongue');

            if (isTalking) {
                if (this.talkingInterval) clearInterval(this.talkingInterval);
                let frame = 0;
                this.talkingInterval = setInterval(() => {
                    frame = (frame + 1) % 2;
                    if (frame === 1) {
                        if (closed) closed.classList.add('hidden');
                        if (open) open.classList.remove('hidden');
                        if (tongue) tongue.classList.remove('hidden');
                    } else {
                        if (closed) closed.classList.remove('hidden');
                        if (open) open.classList.add('hidden');
                        if (tongue) tongue.classList.add('hidden');
                    }
                    this.drawOscilloscope(true);
                }, 130);
            } else {
                if (this.talkingInterval) {
                    clearInterval(this.talkingInterval);
                    this.talkingInterval = null;
                }
                if (closed) closed.classList.remove('hidden');
                if (open) open.classList.add('hidden');
                if (tongue) tongue.classList.add('hidden');
                this.drawOscilloscope(false);
            }
        }

        /**
         * Vẽ sóng âm phosphor thời gian thực trên màn hình CRT buồng gác (Stage 8)
         */
        drawOscilloscope(active) {
            if (typeof document === 'undefined') return;
            const canvas = document.getElementById('boothOscilloscopeCanvas');
            if (!canvas || typeof canvas.getContext !== 'function') return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const w = canvas.width || 80;
            const h = canvas.height || 30;
            ctx.fillStyle = '#05140d';
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();

            ctx.strokeStyle = active ? '#34d399' : '#059669';
            ctx.lineWidth = active ? 1.8 : 1.2;
            ctx.beginPath();
            const freq = active ? 0.22 : 0.08;
            const amp = active ? (h / 2 - 3) : 2;
            const phase = Date.now() * 0.015;

            for (let x = 0; x < w; x++) {
                const y = h / 2 + Math.sin(x * freq + phase) * amp * (active ? (0.6 + 0.4 * Math.sin(x * 0.12)) : 1);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        /**
         * Hiển thị phản ứng cảm xúc của khách khi được đóng dấu Approved / Denied
         */
        setVerdict(isApproved) {
            if (!this.travelerMount || typeof this.travelerMount.querySelector !== 'function') return;
            const overlay = this.travelerMount.querySelector('#travelerEmotionOverlay');
            if (!overlay) return;

            overlay.classList.remove('hidden');
            const sweat = overlay.querySelector('.emotion-sweat');
            const star = overlay.querySelector('.emotion-star');

            if (isApproved) {
                if (star) star.classList.remove('hidden');
                if (sweat) sweat.classList.add('hidden');
                // Hoạt ảnh vui mừng và bước ra
                setTimeout(() => {
                    this.travelerMount.classList.add('animate-traveler-leave');
                }, 800);
            } else {
                if (sweat) sweat.classList.remove('hidden');
                if (star) star.classList.add('hidden');
            }
        }
    }

    /**
     * 3. TRUNG TÂM ĐIỀU PHÁI 6 CA TRỰC ARCADE (Shift Campaign Hub)
     */
    class PixelCampaignHub {
        static get SHIFTS() {
            return [
                { id: 'lesson-a2-hotel', num: '01', level: 'A2', name: 'HOTEL FRONT DESK', bounty: '$50', exp: '+100 EXP', desc: 'Thẩm tra đặt phòng & đối chiếu thông tin khách sạn' },
                { id: 'lesson-b1-interview', num: '02', level: 'B1', name: 'JOB INTERVIEW PROTOCOL', bounty: '$80', exp: '+150 EXP', desc: 'Kiểm tra lý lịch xin việc & hồ sơ năng lực ứng viên' },
                { id: 'lesson-b2-ai', num: '03', level: 'B2', name: 'MACHINE MIND INQUIRY', bounty: '$120', exp: '+220 EXP', desc: 'Thẩm vấn hồ sơ trí tuệ nhân tạo & thuật ngữ công nghệ' },
                { id: 'lesson-c1-oceans', num: '04', level: 'C1', name: 'DEEP OCEAN MANIFEST', bounty: '$160', exp: '+300 EXP', desc: 'Giải mã báo cáo khoa học đại dương học thuật' },
                { id: 'lesson-ielts-library', num: '05', level: 'IELTS', name: 'LIBRARY REGISTRATION', bounty: '$220', exp: '+400 EXP', desc: 'Hồ sơ đăng ký thư viện chuẩn bài nghe IELTS' },
                { id: 'lesson-phonics-flapt', num: '06', level: 'PHONICS', name: 'FLAP-T CONTRABAND', bounty: '$300', exp: '+500 EXP', desc: 'Bẫy nối âm & âm vỗ T-flap của người bản ngữ' }
            ];;
        }

        /** Numeric bounty ($Credits) of a shift id, 0 if unknown. */
        static getBounty(id) {
            const shift = PixelCampaignHub.SHIFTS.find(item => item.id === id);
            return shift ? parseInt(String(shift.bounty).replace(/[^0-9]/g, ''), 10) || 0 : 0;
        }

        /**
         * Gắn giao diện Arcade 6 Ca Trực vào #emptyStateCard khi ở chế độ Pixel
         */
        static render(container, onSelectShift, onInsertCustom) {
            if (!container) return;

            const shifts = PixelCampaignHub.SHIFTS;

            let html = `
                <div class="pixel-campaign-hub border-2 border-black p-4 sm:p-6 text-left relative overflow-hidden select-none" id="pixelCampaignContainer">
                    <!-- Top Marquee Banner -->
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-gray-700/80 pb-3 gap-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block"></span>
                                <h2 class="px-font-arcade text-sm sm:text-base text-amber-400 tracking-wider uppercase">
                                    LYRE 1984: GRESTIN CAMPAIGN
                                </h2>
                            </div>
                            <p class="text-[10px] font-mono text-gray-400 mt-0.5">
                                CHỌN CA TRỰC ĐỂ NHẬN HỒ SƠ VÀ TIỀN THƯỞNG ($CREDITS)
                            </p>
                        </div>
                        <div class="px-font-arcade text-xs text-emerald-400 bg-black/60 px-3 py-1.5 border border-emerald-500/40 animate-pulse">
                            [🪙 INSERT COIN: READY]
                        </div>
                    </div>

                    <!-- 6 Playable Shift Cards Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
            `;

            shifts.forEach(shift => {
                html += `
                    <div class="pixel-shift-card p-3 border-2 border-gray-700 hover:border-amber-400 bg-black/40 hover:bg-black/70 cursor-pointer transition flex flex-col justify-between group" data-shift-id="${shift.id}">
                        <div>
                            <div class="flex items-center justify-between text-[10px] font-mono mb-1.5">
                                <span class="px-font-arcade text-amber-400">SHIFT #${shift.num}</span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${shift.level.startsWith('A') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : shift.level.startsWith('B') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">${shift.level}</span>
                            </div>
                            <h3 class="font-bold text-xs text-white group-hover:text-amber-300 font-mono tracking-tight leading-snug">
                                ${shift.name}
                            </h3>
                            <p class="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                ${shift.desc}
                            </p>
                        </div>
                        <div class="flex items-center justify-between text-[9px] font-mono border-t border-gray-700/60 pt-2 mt-2">
                            <span class="text-emerald-400 font-bold">${shift.bounty}</span>
                            <span class="text-cyan-400">${shift.exp}</span>
                            <span class="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">BẮT ĐẦU →</span>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>

                    <!-- Custom Cartridge Drives (Nạp bài riêng) -->
                    <div class="flex flex-wrap items-center justify-between gap-3 border-t-2 border-gray-700/80 pt-3 text-xs font-mono">
                        <div class="flex items-center gap-2">
                            <button type="button" id="btnHubCustomAudio" class="pixel-btn pixel-btn-amber !py-1.5 !px-3 text-[10px] flex items-center gap-1.5 cursor-pointer">
                                <span>📼</span> ĐÚT BĂNG MP3 / SRT
                            </button>
                            <button type="button" id="btnHubTeletypeTTS" class="pixel-btn pixel-btn-cyan !py-1.5 !px-3 text-[10px] flex items-center gap-1.5 cursor-pointer">
                                <span>📠</span> TELETYPE TTS
                            </button>
                        </div>
                        <span class="text-[10px] text-gray-400 italic">Hoặc kéo thả file âm thanh trực tiếp vào màn hình</span>
                    </div>
                </div>
            `;

            container.innerHTML = html;

            // Gắn sự kiện click 6 ca trực
            container.querySelectorAll('.pixel-shift-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const shiftId = e.currentTarget.getAttribute('data-shift-id');
                    if (typeof onSelectShift === 'function') {
                        onSelectShift(shiftId);
                    }
                });
            });

            // Gắn sự kiện nút nạp file tùy chọn
            const btnAudio = container.querySelector('#btnHubCustomAudio');
            if (btnAudio) {
                btnAudio.addEventListener('click', () => {
                    const triggerBtn = document.getElementById('btnTriggerAudioInput');
                    if (triggerBtn) triggerBtn.click();
                });
            }

            const btnTTS = container.querySelector('#btnHubTeletypeTTS');
            if (btnTTS) {
                btnTTS.addEventListener('click', () => {
                    const btnEmptyTTS = document.getElementById('btnEmptyTTSGenerator');
                    if (btnEmptyTTS) btnEmptyTTS.click();
                });
            }
        }
    }

    /**
     * 4. KHUNG NHÌN CHECKPOINT NGOÀI TRỜI (Zone 1: PixelCheckpoint Viewport)
     * Thể hiện khung cảnh ngoài trời trạm gác biên giới Grestin 1984:
     * - Bầu trời tuyết rơi lất phất
     * - Hàng người xếp hàng di dân (Queue)
     * - Lính gác tuần tra (Pacing Guard)
     * - Tháp canh và đèn quét tuần tra
     * - Loa phóng thanh gọi "NEXT!"
     * - Hoạt họa khách bước vào buồng gác khi đón khách và bước qua cổng khi được duyệt
     */
    class PixelCheckpoint {
        constructor(options = {}) {
            this.container = options.container || null;
            this.canvas = null;
            this.ctx = null;
            this.animId = null;
            this.snowflakes = [];
            this.guardX = 260;
            this.guardDir = 1;
            this.travelerX = -40;
            this.travelerTargetX = -40;
            this.travelerWalking = false;
            this.travelerVerdict = null; // null | 'approved' | 'denied'
            this.isGateOpen = false;

            this.onCallNext = options.onCallNext || null;
            if (this.container) this.init();
        }

        init(mountPoint = null) {
            const mount = mountPoint || this.container || document.getElementById('pixelCheckpointMount');
            if (!mount) return;
            this.container = mount;

            this.container.innerHTML = `
                <div class="pixel-checkpoint-viewport relative w-full h-[120px] sm:h-[145px] bg-[#0c1017] border-4 border-black overflow-hidden select-none mb-2" id="checkpointViewport">
                    <canvas id="checkpointCanvas" class="w-full h-full block"></canvas>
                    
                    <!-- Loa phóng thanh gọi lượt kế tiếp (Loudspeaker Button) -->
                    <button type="button" id="btnCheckpointLoudspeaker" class="checkpoint-loudspeaker-btn absolute top-2 left-3 sm:left-4 px-2.5 py-1 bg-black/85 border-2 border-amber-500/70 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-amber-950/70 hover:border-amber-400 transition" title="Bấm loa gọi người kế tiếp (Space)">
                        <span class="text-xs animate-bounce inline-block">📢</span>
                        <span>NEXT! [Space]</span>
                    </button>

                    <!-- Cổng chắn Barrier đỏ trắng -->
                    <div id="checkpointBarrierArm" class="checkpoint-gate-arm absolute bottom-4 right-6 w-20 h-2 bg-stripes-hazard border border-black origin-right transition-transform duration-500" title="Cổng biên giới Grestin"></div>

                    <!-- Bảng hiệu Trạm kiểm soát -->
                    <div class="absolute top-2 right-3 sm:right-4 text-[9px] font-mono font-bold text-gray-400 bg-black/75 px-2 py-0.5 border border-gray-700">
                        <span class="text-red-400">●</span> GRESTIN BORDER · 1984
                    </div>
                </div>
            `;

            this.canvas = this.container.querySelector('#checkpointCanvas');
            this.gateArm = this.container.querySelector('#checkpointBarrierArm');
            const btnNext = this.container.querySelector('#btnCheckpointLoudspeaker');

            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.resizeCanvas();
                this.initSnow();
                this.startAnimation();
            }

            if (btnNext) {
                btnNext.addEventListener('click', () => {
                    this.callNext();
                    if (typeof this.onCallNext === 'function') {
                        this.onCallNext();
                    } else if (root.App && root.App.PixelGameLoop && root.App.PixelGameLoop.booth && root.App.PixelGameLoop.booth.btnCallNext) {
                        root.App.PixelGameLoop.booth.btnCallNext.click();
                    }
                });
            }

            if (typeof window !== 'undefined') {
                window.addEventListener('resize', () => this.resizeCanvas());
            }
        }

        resizeCanvas() {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width || 600;
            this.canvas.height = rect.height || 135;
        }

        initSnow() {
            this.snowflakes = [];
            const count = 35;
            const w = this.canvas ? this.canvas.width : 600;
            const h = this.canvas ? this.canvas.height : 135;
            for (let i = 0; i < count; i++) {
                this.snowflakes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: Math.random() * 1.5 + 0.8,
                    speed: Math.random() * 0.8 + 0.4
                });
            }
        }

        startAnimation() {
            if (this.animId) cancelAnimationFrame(this.animId);
            const loop = () => {
                this.render();
                this.animId = requestAnimationFrame(loop);
            };
            this.animId = requestAnimationFrame(loop);
        }

        callNext() {
            this.travelerX = 80;
            this.travelerTargetX = (this.canvas ? this.canvas.width * 0.48 : 240);
            this.travelerWalking = true;
            this.travelerVerdict = null;
            if (this.gateArm) {
                this.gateArm.style.transform = 'rotate(0deg)';
                this.isGateOpen = false;
            }
        }

        setVerdict(approved) {
            this.travelerVerdict = approved ? 'approved' : 'denied';
            if (approved) {
                if (this.gateArm) {
                    this.gateArm.style.transform = 'rotate(-60deg)';
                    this.isGateOpen = true;
                }
                this.travelerTargetX = (this.canvas ? this.canvas.width + 40 : 640);
                this.travelerWalking = true;
            } else {
                if (this.gateArm) {
                    this.gateArm.style.transform = 'rotate(0deg)';
                    this.isGateOpen = false;
                }
                this.travelerTargetX = -40;
                this.travelerWalking = true;
            }
        }

        render() {
            if (!this.ctx || !this.canvas || this.canvas.offsetParent === null) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            // 1. Nền trời xám xịt mùa đông 1984
            ctx.fillStyle = '#0f141f';
            ctx.fillRect(0, 0, w, h);

            // 2. Tường bê tông & Dây thép gai xa
            ctx.fillStyle = '#1b2230';
            ctx.fillRect(0, h * 0.35, w, h * 0.35);

            // Dây thép gai
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x < w; x += 15) {
                ctx.moveTo(x, h * 0.35);
                ctx.lineTo(x + 8, h * 0.35 - 6);
                ctx.lineTo(x + 15, h * 0.35);
            }
            ctx.stroke();

            // 3. Mặt đường nhựa Grestin phủ tuyết
            ctx.fillStyle = '#151a24';
            ctx.fillRect(0, h * 0.7, w, h * 0.3);

            // Vạch sơn đường kẻ
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            for (let rx = 100; rx < w - 80; rx += 50) {
                ctx.fillRect(rx, h * 0.82, 25, 3);
            }

            // 4. Hàng người xếp hàng (Queue Silhouettes bên trái)
            ctx.fillStyle = '#080a0f';
            const queueStartX = 25;
            for (let i = 0; i < 6; i++) {
                const qx = queueStartX + i * 16;
                const qy = h * 0.72;
                ctx.fillRect(qx, qy - 18, 7, 7); // Đầu
                ctx.fillRect(qx - 2, qy - 11, 11, 14); // Thân
            }

            // 5. Lính gác tuần tra (Pacing Guard)
            this.guardX += 0.4 * this.guardDir;
            if (this.guardX > w * 0.75) this.guardDir = -1;
            if (this.guardX < w * 0.45) this.guardDir = 1;

            const gx = this.guardX;
            const gy = h * 0.68;
            ctx.fillStyle = '#1e293b'; // Quân phục
            ctx.fillRect(gx, gy - 20, 8, 8); // Đầu
            ctx.fillRect(gx - 3, gy - 12, 14, 16); // Áo
            ctx.fillStyle = '#000000'; // Súng trường
            ctx.fillRect(gx + (this.guardDir > 0 ? 8 : -4), gy - 18, 2, 20);

            // 6. Hành khách đang di chuyển (Traveler Sprite)
            if (this.travelerWalking) {
                if (Math.abs(this.travelerX - this.travelerTargetX) > 2) {
                    this.travelerX += (this.travelerTargetX > this.travelerX ? 1.5 : -1.5);
                } else {
                    this.travelerWalking = false;
                }
            }

            if (this.travelerX > 0 && this.travelerX < w) {
                const tx = this.travelerX;
                const ty = h * 0.74;
                ctx.fillStyle = this.travelerVerdict === 'denied' ? '#7f1d1d' : (this.travelerVerdict === 'approved' ? '#065f46' : '#d97706');
                ctx.fillRect(tx, ty - 22, 9, 8); // Đầu
                ctx.fillStyle = '#334155'; // Thân
                ctx.fillRect(tx - 3, ty - 14, 15, 16);
            }

            // 7. Tuyết rơi nhẹ hạt pixel
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            for (let i = 0; i < this.snowflakes.length; i++) {
                const sf = this.snowflakes[i];
                sf.y += sf.speed;
                sf.x += Math.sin(sf.y * 0.05) * 0.3;
                if (sf.y > h) {
                    sf.y = 0;
                    sf.x = Math.random() * w;
                }
                ctx.fillRect(sf.x, sf.y, sf.r, sf.r);
            }
        }

        destroy() {
            if (this.animId) cancelAnimationFrame(this.animId);
        }
    }

    // Xuất ra root.App
    root.App = root.App || {};
    root.App.PixelTraveler = PixelTraveler;
    root.App.PixelBooth = PixelBooth;
    root.App.PixelCampaignHub = PixelCampaignHub;
    root.App.PixelCheckpoint = PixelCheckpoint;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
