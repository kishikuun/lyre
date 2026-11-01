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

                    <!-- 3. Khu vực đứng của Khách Nhập Cảnh (Traveler Sprite) -->
                    <div class="relative z-10 h-full flex items-end justify-between px-3 sm:px-6 pb-1">
                        <!-- Left: Tên & Hồ sơ của khách -->
                        <div class="traveler-dossier-pill flex flex-col gap-0.5 bg-black/85 border border-gray-600 p-1.5 rounded text-[11px] font-mono shadow-md max-w-[140px] sm:max-w-[200px]">
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

                        <!-- Center: Sprite Nhân Vật Pixel 32x32 -->
                        <div class="traveler-sprite-box relative flex items-end justify-center w-24 h-24 sm:w-28 sm:h-28 -mb-1" id="boothTravelerSprite">
                            <!-- Procedural SVG inserted here -->
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

                    <!-- 4. CỬA CUỐN SẮT CƠ HỌC (Mechanical Iron Shutter) -->
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

                    <!-- 5. Khung sắt đinh tán ngoài cùng (Rivet Border) -->
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
        presentTraveler(sentenceIdx, subtitleText) {
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
         * Hoạt ảnh nhép miệng theo âm thanh (Talking mouth-flap animation)
         */
        setTalking(isTalking) {
            if (this.isTalking === isTalking) return;
            this.isTalking = isTalking;

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
                }, 130);
            } else {
                if (this.talkingInterval) {
                    clearInterval(this.talkingInterval);
                    this.talkingInterval = null;
                }
                if (closed) closed.classList.remove('hidden');
                if (open) open.classList.add('hidden');
                if (tongue) tongue.classList.add('hidden');
            }
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

    // Xuất ra root.App
    root.App = root.App || {};
    root.App.PixelTraveler = PixelTraveler;
    root.App.PixelBooth = PixelBooth;
    root.App.PixelCampaignHub = PixelCampaignHub;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
