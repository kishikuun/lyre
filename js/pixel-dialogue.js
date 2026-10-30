/**
 * ============================================================================
 * LYRE STUDIO — DELTARUNE DIALOGUE BOX COMPONENT CONTROLLER
 * Version 4.0 (Acoustic Forensic Workbench)
 * 
 * Directly modeled after Toby Fox's Deltarune & Undertale dialogue engine:
 * 1. Synchronized chiptune typewriter sound blips per character.
 * 2. Talking cycle animation: avatar mouth moves during speech, rests when done.
 * 3. Color-code parsing: \cY (yellow), \cR (red), \cG (green), \cC (cyan), \cW (white).
 * 4. Interactive RPG Action Choices with pixel red soul heart (❤️) selector cursor.
 * 5. Instant reveal on Space/Enter/Click, customizable typing speed.
 * 6. Full mobile and keyboard accessibility (Arrow keys, Space, Enter, Tab).
 * ============================================================================
 */

(function (root) {
    'use strict';

    // Face SVG templates for the 4 canonical emotions
    const EMOTION_FACES = {
        neutral: {
            eyes: `
                <rect x="10" y="14" width="3" height="4" fill="#0f172a" />
                <rect x="19" y="14" width="3" height="4" fill="#0f172a" />
            `,
            mouthClosed: `<rect x="13" y="22" width="6" height="2" fill="#0f172a" />`,
            mouthOpen: `
                <rect x="13" y="21" width="6" height="4" fill="#0f172a" />
                <rect x="14" y="22" width="4" height="2" fill="#ffffff" />
            `
        },
        proud: {
            eyes: `
                <rect x="9" y="15" width="4" height="2" fill="#0f172a" />
                <rect x="11" y="13" width="2" height="2" fill="#0f172a" />
                <rect x="19" y="15" width="4" height="2" fill="#0f172a" />
                <rect x="19" y="13" width="2" height="2" fill="#0f172a" />
                <rect x="6" y="18" width="3" height="2" fill="#f87171" />
                <rect x="23" y="18" width="3" height="2" fill="#f87171" />
            `,
            mouthClosed: `<rect x="13" y="21" width="6" height="2" fill="#0f172a" />`,
            mouthOpen: `
                <rect x="12" y="20" width="8" height="4" fill="#0f172a" />
                <rect x="14" y="21" width="4" height="2" fill="#ffffff" />
            `
        },
        sweating: {
            eyes: `
                <rect x="9" y="13" width="4" height="5" fill="#0f172a" />
                <rect x="10" y="14" width="2" height="3" fill="#ffffff" />
                <rect x="19" y="13" width="4" height="5" fill="#0f172a" />
                <rect x="20" y="14" width="2" height="3" fill="#ffffff" />
                <rect x="26" y="10" width="3" height="5" fill="#38bdf8" />
                <rect x="27" y="9" width="1" height="1" fill="#38bdf8" />
            `,
            mouthClosed: `<rect x="13" y="23" width="6" height="2" fill="#0f172a" />`,
            mouthOpen: `
                <rect x="13" y="22" width="6" height="4" fill="#0f172a" />
                <rect x="14" y="23" width="4" height="2" fill="#ffffff" />
            `
        },
        cool: {
            eyes: `
                <rect x="8" y="12" width="16" height="6" fill="#0f172a" />
                <rect x="7" y="14" width="18" height="2" fill="#0f172a" />
                <rect x="10" y="13" width="2" height="2" fill="#ffffff" />
                <rect x="19" y="13" width="2" height="2" fill="#ffffff" />
            `,
            mouthClosed: `
                <rect x="14" y="22" width="6" height="2" fill="#0f172a" />
                <rect x="19" y="21" width="2" height="1" fill="#0f172a" />
            `,
            mouthOpen: `
                <rect x="13" y="21" width="7" height="4" fill="#0f172a" />
                <rect x="15" y="22" width="3" height="2" fill="#ffffff" />
            `
        }
    };

    class PixelDialogue {
        constructor(options = {}) {
            this.container = options.container || null;
            this.speed = options.speed || 32; // ms per char (Deltarune standard: 30-35ms)
            this.currentEmotion = 'neutral';
            this.isTyping = false;
            this.timer = null;
            this.mouthTimer = null;
            this.onCompleteCallback = null;
            this.fullTokens = [];
            this.tokenIndex = 0;
            this.selectedChoiceIndex = 0;
            this.activeChoices = [];

            this.dom = {
                box: null,
                avatarFace: null,
                speakerLabel: null,
                textStream: null,
                choicesContainer: null,
                promptIndicator: null
            };

            if (this.container) {
                this.renderBox();
            }
        }

        /**
         * Xây dựng cấu trúc DOM hoàn chỉnh của hộp thoại Deltarune
         */
        renderBox() {
            if (!this.container) return;
            this.container.innerHTML = `
                <div class="pixel-dialogue-box select-none" role="dialog" aria-live="polite">
                    <div class="flex items-start gap-3 sm:gap-5">
                        <!-- Avatar Frame 64x64 -->
                        <div class="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-[#000000] border-2 border-white p-1 flex items-center justify-center">
                            <svg class="pixel-avatar-svg w-full h-full" id="inspectorAvatar" viewBox="0 0 32 32" shape-rendering="crispEdges">
                                <rect x="6" y="6" width="20" height="20" fill="#fde047" />
                                <rect x="8" y="4" width="16" height="2" fill="#fde047" />
                                <rect x="8" y="26" width="16" height="2" fill="#fde047" />
                                <rect x="4" y="4" width="24" height="4" fill="#1e3a8a" />
                                <rect x="6" y="2" width="20" height="2" fill="#1e40af" />
                                <rect x="2" y="8" width="28" height="2" fill="#0f172a" />
                                <rect x="14" y="3" width="4" height="3" fill="#fbbf24" />
                                <g class="dialogue-face-group"></g>
                            </svg>
                        </div>

                        <!-- Content Area -->
                        <div class="flex-1 min-w-0 space-y-2">
                            <div class="flex items-center justify-between">
                                <div class="px-font-arcade text-[10px] text-amber-400 dialogue-speaker">
                                    * INSPECTOR BYTE:
                                </div>
                                <div class="flex items-center gap-1.5 text-[8px] px-font-arcade text-gray-500">
                                    <span>[SPACE/CLICK: BỎ QUA]</span>
                                </div>
                            </div>

                            <!-- Text Stream Container -->
                            <div class="px-font-dialogue text-white text-lg sm:text-xl min-h-[56px] leading-relaxed relative dialogue-text-stream">
                                <!-- Streamed text injected here -->
                            </div>

                            <!-- Choices / Action Prompts Strip (Deltarune FIGHT/ACT/ITEM/SPARE) -->
                            <div class="hidden pt-2 border-t border-gray-800 flex flex-wrap items-center gap-2 sm:gap-3 dialogue-choices">
                                <!-- Choices injected here -->
                            </div>
                        </div>
                    </div>

                    <!-- Prompt Indicator (Red Soul Heart / Arrow) when waiting for input -->
                    <div class="hidden absolute bottom-2 right-4 dialogue-prompt-heart">
                        <span class="pixel-heart"></span>
                    </div>
                </div>
            `;

            this.dom.box = this.container.querySelector('.pixel-dialogue-box');
            this.dom.avatarFace = this.container.querySelector('.dialogue-face-group');
            this.dom.speakerLabel = this.container.querySelector('.dialogue-speaker');
            this.dom.textStream = this.container.querySelector('.dialogue-text-stream');
            this.dom.choicesContainer = this.container.querySelector('.dialogue-choices');
            this.dom.promptIndicator = this.container.querySelector('.dialogue-prompt-heart');

            this.setEmotion(this.currentEmotion, false);

            // Click on dialogue box instantly reveals all text
            this.dom.box.addEventListener('click', (e) => {
                if (this.isTyping) {
                    this.instantReveal();
                }
            });
        }

        /**
         * Chuyển đổi biểu cảm avatar và hỗ trợ hoạt ảnh nhép miệng (Mouth Flapping)
         */
        setEmotion(emotion = 'neutral', mouthOpen = false) {
            this.currentEmotion = emotion;
            if (!this.dom.avatarFace) return;
            const config = EMOTION_FACES[emotion] || EMOTION_FACES.neutral;
            this.dom.avatarFace.innerHTML = `
                ${config.eyes}
                ${mouthOpen ? config.mouthOpen : config.mouthClosed}
            `;
        }

        /**
         * Phân tích văn bản với mã màu Deltarune:
         * \cY = Yellow, \cR = Red, \cG = Green, \cC = Cyan, \cW = White
         */
        parseTextWithColors(rawText) {
            const tokens = [];
            let currentColor = '#ffffff';
            let i = 0;

            while (i < rawText.length) {
                if (rawText.startsWith('\\c', i) && i + 2 < rawText.length) {
                    const code = rawText[i + 2].toUpperCase();
                    if (code === 'Y') currentColor = '#fde047'; // Vàng nhấn mạnh
                    else if (code === 'R') currentColor = '#ef4444'; // Đỏ cảnh báo / bẫy âm
                    else if (code === 'G') currentColor = '#22c55e'; // Xanh lá gợi ý
                    else if (code === 'C') currentColor = '#38bdf8'; // Xanh cyan thông tin
                    else if (code === 'W') currentColor = '#ffffff'; // Trắng chuẩn
                    i += 3;
                    continue;
                }
                tokens.push({ char: rawText[i], color: currentColor });
                i++;
            }
            return tokens;
        }

        /**
         * Phát một câu thoại mới với đầy đủ tính năng:
         * @param {string} speaker Tên người nói
         * @param {string} rawText Đoạn văn bản (hỗ trợ mã màu)
         * @param {string} emotion 'neutral' | 'proud' | 'sweating' | 'cool'
         * @param {Array} choices Danh sách lựa chọn [{ label, action, isDanger }]
         * @param {Function} onComplete Callback khi chạy xong
         */
        say(speaker, rawText, emotion = 'neutral', choices = [], onComplete = null) {
            this.stopCurrentTypewriter();
            this.currentEmotion = emotion;
            this.activeChoices = choices || [];
            this.onCompleteCallback = onComplete;
            this.selectedChoiceIndex = 0;

            if (this.dom.speakerLabel) {
                this.dom.speakerLabel.textContent = `* ${speaker.toUpperCase()}:`;
            }
            if (this.dom.textStream) {
                this.dom.textStream.innerHTML = `<span class="text-gray-400 mr-2">*</span>`;
            }
            if (this.dom.choicesContainer) {
                this.dom.choicesContainer.classList.add('hidden');
                this.dom.choicesContainer.innerHTML = '';
            }
            if (this.dom.promptIndicator) {
                this.dom.promptIndicator.classList.add('hidden');
            }

            this.setEmotion(emotion, false);

            this.fullTokens = this.parseTextWithColors(rawText);
            this.tokenIndex = 0;
            this.isTyping = true;

            // Bắt đầu hoạt ảnh nhép miệng
            let mouthState = false;
            this.mouthTimer = setInterval(() => {
                if (this.isTyping) {
                    mouthState = !mouthState;
                    this.setEmotion(this.currentEmotion, mouthState);
                } else {
                    this.setEmotion(this.currentEmotion, false);
                    clearInterval(this.mouthTimer);
                }
            }, 120);

            // Bắt đầu nhịp gõ Typewriter
            const sfx = (root.App && root.App.PixelSFX) || null;

            this.timer = setInterval(() => {
                if (this.tokenIndex < this.fullTokens.length) {
                    const token = this.fullTokens[this.tokenIndex];
                    const span = document.createElement('span');
                    span.textContent = token.char;
                    span.style.color = token.color;
                    this.dom.textStream.appendChild(span);

                    // Phát tiếng bíp nếu không phải dấu cách/xuống dòng
                    if (sfx && token.char.trim() !== '') {
                        sfx.playTypewriterBlip();
                    }

                    this.tokenIndex++;
                } else {
                    this.finishTyping();
                }
            }, this.speed);
        }

        /**
         * Hiện ngay toàn bộ chữ (khi bấm Space / Enter / Click)
         */
        instantReveal() {
            if (!this.isTyping) return;
            this.stopCurrentTypewriter();

            if (this.dom.textStream) {
                this.dom.textStream.innerHTML = `<span class="text-gray-400 mr-2">*</span>`;
                this.fullTokens.forEach(t => {
                    const span = document.createElement('span');
                    span.textContent = t.char;
                    span.style.color = t.color;
                    this.dom.textStream.appendChild(span);
                });
            }
            this.finishTyping();
        }

        /**
         * Dừng vòng lặp gõ hiện tại
         */
        stopCurrentTypewriter() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            if (this.mouthTimer) {
                clearInterval(this.mouthTimer);
                this.mouthTimer = null;
            }
            this.isTyping = false;
            this.setEmotion(this.currentEmotion, false);
        }

        /**
         * Hoàn tất quá trình gõ, kích hoạt danh sách lựa chọn nếu có
         */
        finishTyping() {
            this.isTyping = false;
            this.stopCurrentTypewriter();

            // Hiển thị chỉ báo prompt tim đỏ
            if (this.dom.promptIndicator) {
                this.dom.promptIndicator.classList.remove('hidden');
            }

            // Nếu có lựa chọn hành động, hiển thị ra
            if (this.activeChoices.length > 0 && this.dom.choicesContainer) {
                this.renderChoices();
            }

            if (typeof this.onCompleteCallback === 'function') {
                this.onCompleteCallback();
            }
        }

        /**
         * Render thanh lựa chọn phong cách Deltarune
         */
        renderChoices() {
            this.dom.choicesContainer.classList.remove('hidden');
            this.dom.choicesContainer.innerHTML = '';

            this.activeChoices.forEach((choice, idx) => {
                const btn = document.createElement('button');
                btn.className = `pixel-choice-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                    idx === this.selectedChoiceIndex
                        ? 'border-amber-400 text-amber-300 bg-amber-950/40'
                        : 'border-gray-700 text-gray-300 hover:border-gray-500'
                }`;

                const heartIcon = idx === this.selectedChoiceIndex ? '❤️' : '♡';
                btn.innerHTML = `<span class="choice-cursor text-[10px]">${heartIcon}</span> <span>${choice.label}</span>`;

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectChoice(idx);
                });

                this.dom.choicesContainer.appendChild(btn);
            });
        }

        /**
         * Chọn một lựa chọn hành động
         */
        selectChoice(index) {
            if (index < 0 || index >= this.activeChoices.length) return;
            this.selectedChoiceIndex = index;
            const choice = this.activeChoices[index];
            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) sfx.playCoinOpChime();

            if (typeof choice.action === 'function') {
                choice.action();
            }
            this.renderChoices();
        }

        /**
         * Điều hướng lựa chọn bằng phím mũi tên / Tab
         */
        navigateChoices(delta) {
            if (this.activeChoices.length === 0) return;
            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) sfx.playTypewriterBlip();

            this.selectedChoiceIndex = (this.selectedChoiceIndex + delta + this.activeChoices.length) % this.activeChoices.length;
            this.renderChoices();
        }

        setSpeed(ms) {
            this.speed = Math.max(0, ms);
        }
    }

    // UMD Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PixelDialogue;
    }
    root.App = root.App || {};
    root.App.PixelDialogue = PixelDialogue;

})(typeof window !== 'undefined' ? window : global);
