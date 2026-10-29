/**
 * DictaShadow Studio - Dictation Engine (js/dictation.js)
 * Optical Typewriter & Editorial Manuscript Dictation
 */
(function (root) {
    'use strict';

    const state = root.App.state;
    const DiffChecker = root.App.DiffChecker;
    const SRTParser = root.App.SRTParser;
    const AudioEngine = root.App.AudioEngine;

    function initDictation() {
        const dictationTextarea = document.getElementById('dictationTextarea');
        const btnCheckDiff = document.getElementById('btnCheckDiff');
        const btnClearDictation = document.getElementById('btnClearDictation');
        const btnHintLetter = document.getElementById('btnHintLetter');
        const diffResultsCard = document.getElementById('diffResultsCard');
        const btnToggleSoundFX = document.getElementById('btnToggleSoundFX');
        const soundFXLabel = document.getElementById('soundFXLabel');
        const soundFXIcon = document.getElementById('soundFXIcon');

        // Stream Mode Elements
        const streamTypeInput = document.getElementById('streamTypeInput');

        // Tactile Sound FX Toggle
        if (btnToggleSoundFX) {
            btnToggleSoundFX.addEventListener('click', () => {
                state.soundFXEnabled = !state.soundFXEnabled;
                if (soundFXLabel) soundFXLabel.textContent = state.soundFXEnabled ? 'Âm phím: Bật' : 'Âm phím: Tắt';
                if (soundFXIcon) {
                    soundFXIcon.setAttribute('data-lucide', state.soundFXEnabled ? 'volume-2' : 'volume-x');
                    if (window.lucide) lucide.createIcons();
                }
                if (state.soundFXEnabled) AudioEngine.playSynthesizedSound('click');
            });
        }

        // Standard Mode Input Handler & Zen Focus
        if (dictationTextarea) {
            dictationTextarea.addEventListener('input', () => {
                state.standardInputText = dictationTextarea.value;
                updateWordStats();
            });

            dictationTextarea.addEventListener('focus', () => {
                document.body.classList.add('zen-focus-active');
            });

            dictationTextarea.addEventListener('blur', () => {
                document.body.classList.remove('zen-focus-active');
            });

            // Physical typewriter audio feedback on keypress
            dictationTextarea.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.code === 'Space') {
                    AudioEngine.playSynthesizedSound('typewriter-space');
                } else if (e.key === 'Enter') {
                    AudioEngine.playSynthesizedSound('carriage-return');
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    AudioEngine.playSynthesizedSound('tick');
                } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    AudioEngine.playSynthesizedSound('tick');
                }
            });
        }

        // Check & Diff Button
        if (btnCheckDiff) {
            btnCheckDiff.addEventListener('click', checkStandardDictation);
        }

        // Clear Button
        if (btnClearDictation) {
            btnClearDictation.addEventListener('click', () => {
                if (dictationTextarea) {
                    dictationTextarea.value = '';
                    state.standardInputText = '';
                    updateWordStats();
                    if (diffResultsCard) diffResultsCard.classList.add('hidden');
                    dictationTextarea.focus();
                    AudioEngine.playSynthesizedSound('click');
                }
            });
        }

        // Hint Letter Button
        if (btnHintLetter) {
            btnHintLetter.addEventListener('click', provideHint);
        }

        // Tab Mode Switching (Swiss Tactile Rocker)
        const btnModeStandard = document.getElementById('btnModeStandard');
        const btnModeStream = document.getElementById('btnModeStream');
        const standardModeArea = document.getElementById('standardModeArea');
        const streamModeArea = document.getElementById('streamModeArea');

        if (btnModeStandard && btnModeStream) {
            btnModeStandard.addEventListener('click', () => {
                state.dictationMode = 'standard';
                btnModeStandard.className = "rocker-pill active";
                btnModeStream.className = "rocker-pill";
                if (standardModeArea) standardModeArea.classList.remove('hidden');
                if (streamModeArea) streamModeArea.classList.add('hidden');
                if (dictationTextarea) dictationTextarea.focus();
                AudioEngine.playSynthesizedSound('click');
            });

            btnModeStream.addEventListener('click', () => {
                state.dictationMode = 'stream';
                btnModeStream.className = "rocker-pill active";
                btnModeStandard.className = "rocker-pill";
                if (streamModeArea) streamModeArea.classList.remove('hidden');
                if (standardModeArea) standardModeArea.classList.add('hidden');
                initStreamModeForCurrentSegment();
                AudioEngine.playSynthesizedSound('click');
            });
        }

        // Stream Mode Input Handler & Zen Focus
        if (streamTypeInput) {
            streamTypeInput.addEventListener('input', handleStreamInput);

            streamTypeInput.addEventListener('focus', () => {
                document.body.classList.add('zen-focus-active');
            });

            streamTypeInput.addEventListener('blur', () => {
                document.body.classList.remove('zen-focus-active');
            });

            streamTypeInput.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.code === 'Space') {
                    AudioEngine.playSynthesizedSound('typewriter-space');
                } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    AudioEngine.playSynthesizedSound('tick');
                }
            });
        }
    }

    /**
     * Load current segment into dictation workspace
     */
    function loadCurrentSegment() {
        const seg = AudioEngine.getCurrentSegment();
        const dictationTextarea = document.getElementById('dictationTextarea');
        const diffResultsCard = document.getElementById('diffResultsCard');

        // Reset Standard Mode input
        if (dictationTextarea) {
            dictationTextarea.value = '';
            state.standardInputText = '';
            dictationTextarea.focus();
        }
        if (diffResultsCard) {
            diffResultsCard.classList.add('hidden');
        }

        // Reset Subtitle Reference Display (Hidden by default)
        state.isSubRevealed = false;
        updateSubDisplay();

        // Update Shadowing Lab prompt text
        const shadowingPromptText = document.getElementById('shadowingPromptText');
        if (shadowingPromptText && seg) {
            shadowingPromptText.textContent = seg.text;
        }

        // If in stream mode, initialize masked stream
        if (state.dictationMode === 'stream') {
            initStreamModeForCurrentSegment();
        }

        updateWordStats();
    }

    /**
     * Standard Dictation Diff Check & Multi-Tier Embossed Quality Stamp
     */
    function checkStandardDictation() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;

        const userInput = state.standardInputText;
        const diffResult = DiffChecker.computeDiff(userInput, seg.text);
        state.lastDiffResult = diffResult;

        const diffResultsCard = document.getElementById('diffResultsCard');
        const diffBadgesContainer = document.getElementById('diffBadgesContainer');
        const diffScoreText = document.getElementById('diffScoreText');
        const diffGradeText = document.getElementById('diffGradeText');
        const embossedStamp = document.getElementById('embossedStamp');

        if (diffResultsCard && diffBadgesContainer) {
            diffBadgesContainer.innerHTML = DiffChecker.renderDiffHTML(diffResult);

            // Calculate Grade & Stamp Aesthetic
            let grade = 'C';
            let stampClass = 'stamp-grade-c';
            let label = 'CẦN CẢI THIỆN';

            if (diffResult.accuracy >= 95) {
                grade = 'S';
                stampClass = 'stamp-grade-s';
                label = 'XUẤT SẮC';
            } else if (diffResult.accuracy >= 85) {
                grade = 'A';
                stampClass = 'stamp-grade-a';
                label = 'RẤT TỐT';
            } else if (diffResult.accuracy >= 70) {
                grade = 'B';
                stampClass = 'stamp-grade-b';
                label = 'ĐẠT CHUẨN';
            }

            if (embossedStamp) {
                embossedStamp.className = `embossed-stamp ${stampClass}`;
                embossedStamp.style.animation = 'none';
                void embossedStamp.offsetWidth; // Force reflow
                embossedStamp.style.animation = 'stamp-drop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            }

            if (diffGradeText) diffGradeText.textContent = `GRADE ${grade}`;
            if (diffScoreText) {
                diffScoreText.textContent = `${diffResult.accuracy}% · ${diffResult.matchCount}/${diffResult.totalExpected} TỪ (${label})`;
            }

            diffResultsCard.classList.remove('hidden');

            // Trigger Thermal Scanline Animation
            const scanline = document.getElementById('thermalScanline');
            if (scanline) {
                scanline.style.animation = 'none';
                void scanline.offsetWidth; // Trigger reflow
                scanline.style.animation = 'thermal-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            }

            // Play mechanical stamp feedback sound
            AudioEngine.playSynthesizedSound('stamp');

            if (diffResult.accuracy >= 80) {
                setTimeout(() => AudioEngine.playSynthesizedSound('success'), 220);
                state.completedSentences.add(state.currentIdx);
                const badge = document.getElementById('headerProgressBadge');
                if (badge) badge.textContent = `(${state.completedSentences.size}/${state.subs.length})`;
            } else {
                setTimeout(() => AudioEngine.playSynthesizedSound('wrong'), 220);
            }
        }
    }

    function provideHint() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;

        const dictationTextarea = document.getElementById('dictationTextarea');
        if (!dictationTextarea) return;

        const words = seg.text.trim().split(/\s+/);
        const typedWords = dictationTextarea.value.trim().split(/\s+/).filter(w => w.length > 0);
        const nextIdx = typedWords.length;

        if (nextIdx < words.length) {
            const nextWord = SRTParser.cleanWord(words[nextIdx]);
            if (nextWord.length > 0) {
                dictationTextarea.value = (dictationTextarea.value.trim() + ' ' + nextWord[0]).trim();
                state.standardInputText = dictationTextarea.value;
                dictationTextarea.focus();
                updateWordStats();
                AudioEngine.playSynthesizedSound('tick');
            }
        }
    }

    function updateWordStats() {
        const seg = AudioEngine.getCurrentSegment();
        const statWords = document.getElementById('statWordsCount');
        const dictationTextarea = document.getElementById('dictationTextarea');

        if (statWords && seg && dictationTextarea) {
            const currentCount = dictationTextarea.value.trim().split(/\s+/).filter(w => w.length > 0).length;
            const targetCount = seg.text.trim().split(/\s+/).filter(w => w.length > 0).length;
            statWords.textContent = `${currentCount}/${targetCount}`;
        }
    }

    // ==========================================================================
    // OPTICAL MASKED STREAM MODE (Swiss Editorial Typesetting & Laser Caret)
    // ==========================================================================
    function initStreamModeForCurrentSegment() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;

        state.streamTargetWords = seg.text.trim().split(/\s+/).filter(w => w.length > 0);
        state.streamCurrentWordIdx = 0;
        state.streamWordStatus = new Array(state.streamTargetWords.length).fill(null);
        state.correctCharCount = 0;
        state.totalCharCount = 0;
        state.sessionStartTime = Date.now();

        const streamTypeInput = document.getElementById('streamTypeInput');
        if (streamTypeInput) {
            streamTypeInput.value = '';
            streamTypeInput.focus();
        }

        renderMaskedStream();
    }

    function renderMaskedStream() {
        const streamContainer = document.getElementById('streamContainer');
        const streamTypeInput = document.getElementById('streamTypeInput');
        if (!streamContainer) return;

        if (!state.streamTargetWords.length) {
            streamContainer.innerHTML = `<span class="text-gray-500 italic text-sm font-sans">Chưa có dữ liệu câu...</span>`;
            return;
        }

        const currentInput = streamTypeInput ? streamTypeInput.value.trim() : '';
        const escapeHTML = SRTParser.escapeHTML;

        streamContainer.innerHTML = state.streamTargetWords.map((word, idx) => {
            const trailingPunc = SRTParser.extractTrailingPunctuation(word);
            const coreWord = word.slice(0, word.length - trailingPunc.length);
            const safeWord = escapeHTML(word);
            const safeTrailingPunc = escapeHTML(trailingPunc);

            if (idx < state.streamCurrentWordIdx) {
                // Completed Words: Crisp Titanium Ink
                if (state.streamWordStatus[idx] === 'correct') {
                    return `<span class="px-2 py-1 rounded font-mono text-base sm:text-lg font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm">${safeWord}</span>`;
                } else {
                    return `<span class="px-2 py-1 rounded font-mono text-base sm:text-lg font-semibold text-rose-400 bg-rose-500/10 line-through border border-rose-500/20 shadow-sm">${safeWord}</span>`;
                }
            } else if (idx === state.streamCurrentWordIdx) {
                // Active Word: Optical Typewriter Box with Laser Caret
                let charElements = "";
                if (currentInput.length > 0) {
                    const normInput = SRTParser.normalizeTypography ? SRTParser.normalizeTypography(currentInput) : currentInput;
                    const normCore = SRTParser.normalizeTypography ? SRTParser.normalizeTypography(coreWord) : coreWord;
                    for (let i = 0; i < currentInput.length; i++) {
                        const safeChar = escapeHTML(currentInput[i]);
                        if (i < coreWord.length) {
                            if (normInput[i].toLowerCase() === normCore[i].toLowerCase()) {
                                charElements += `<span class="flow-char-correct">${safeChar}</span>`;
                            } else {
                                charElements += `<span class="flow-char-error">${safeChar}</span>`;
                            }
                        } else {
                            charElements += `<span class="flow-char-error underline">${safeChar}</span>`;
                        }
                    }

                    // Remaining untyped letters shown as elegant dots
                    const remainingDotsCount = Math.max(0, coreWord.length - currentInput.length);
                    const remainingDots = '·'.repeat(remainingDotsCount);
                    charElements += `<span class="text-gray-500 font-mono tracking-widest">${remainingDots}</span>`;
                } else {
                    // Before typing starts: show dots matching word length
                    const dots = '·'.repeat(Math.max(1, coreWord.length));
                    charElements = `<span class="text-gray-500 font-mono tracking-widest">${dots}</span>`;
                }

                return `<span class="flow-active-word font-mono text-base sm:text-lg">
                    ${charElements}
                    <span class="laser-caret"></span>
                    <span class="text-gray-500">${safeTrailingPunc}</span>
                </span>`;
            } else {
                // Future Words: Masked confidential dashed glyphs
                const dashCount = Math.min(6, Math.max(2, coreWord.length));
                const dashes = '—'.repeat(dashCount);
                return `<span class="px-2 py-1 text-gray-600 font-mono text-sm tracking-widest select-none">${dashes}${safeTrailingPunc}</span>`;
            }
        }).join(' ');

        // Update WPM & Accuracy
        updateStreamStats();
    }

    function handleStreamInput(e) {
        const streamTypeInput = document.getElementById('streamTypeInput');
        if (!streamTypeInput) return;

        const val = streamTypeInput.value;

        // Bấm Space để xác nhận từ và lướt sang từ kế tiếp
        if (val.endsWith(' ')) {
            const typed = val.trim();
            if (typed.length > 0 && state.streamCurrentWordIdx < state.streamTargetWords.length) {
                const target = state.streamTargetWords[state.streamCurrentWordIdx];
                const isMatch = SRTParser.cleanWord(typed) === SRTParser.cleanWord(target);

                state.streamWordStatus[state.streamCurrentWordIdx] = isMatch ? 'correct' : 'wrong';
                state.totalCharCount += target.length;
                if (isMatch) {
                    state.correctCharCount += target.length;
                    AudioEngine.playSynthesizedSound('tick');
                } else {
                    AudioEngine.playSynthesizedSound('wrong');
                }

                state.streamCurrentWordIdx++;
                streamTypeInput.value = '';

                // Nếu hoàn thành toàn bộ các từ trong câu
                if (state.streamCurrentWordIdx >= state.streamTargetWords.length) {
                    AudioEngine.playSynthesizedSound('carriage-return');
                    setTimeout(() => AudioEngine.playSynthesizedSound('success'), 120);
                    state.completedSentences.add(state.currentIdx);
                    setTimeout(() => {
                        if (state.currentIdx + state.groupSize < state.subs.length) {
                            state.currentIdx += state.groupSize;
                            loadCurrentSegment();
                            if (state.audioBuffer) AudioEngine.play(0);
                        } else {
                            alert("🎉 Chúc mừng! Bạn đã hoàn thành toàn bộ các câu trong bài!");
                        }
                    }, 400);
                }
            } else {
                streamTypeInput.value = '';
            }
        }

        renderMaskedStream();
    }

    function updateStreamStats() {
        if (!state.sessionStartTime) return;
        const minutes = (Date.now() - state.sessionStartTime) / 60000;
        const statWPM = document.getElementById('statWPM');
        const statAcc = document.getElementById('statAccuracy');

        if (minutes > 0.03 && state.correctCharCount > 0 && statWPM) {
            statWPM.textContent = Math.round((state.correctCharCount / 5) / minutes);
        }
        if (state.totalCharCount > 0 && statAcc) {
            statAcc.textContent = Math.round((state.correctCharCount / state.totalCharCount) * 100) + '%';
        }
    }

    function updateSubDisplay() {
        const seg = AudioEngine.getCurrentSegment();
        const subDisplayCard = document.getElementById('subDisplayCard');
        const subDisplayText = document.getElementById('subDisplayText');
        const subToggleIcon = document.getElementById('subToggleIcon');
        const subToggleLabel = document.getElementById('subToggleLabel');

        if (!seg || !subDisplayText) return;

        if (state.isSubRevealed) {
            subDisplayText.textContent = seg.text;
            subDisplayText.className = "font-editorial italic text-lg sm:text-xl text-amber-200/95 leading-relaxed select-text";
            if (subToggleLabel) subToggleLabel.textContent = "Ẩn phụ đề (F5)";
            if (subToggleIcon) subToggleIcon.setAttribute('data-lucide', 'eye');
            if (subDisplayCard) subDisplayCard.classList.remove('hidden');
        } else {
            subDisplayText.textContent = "[Phụ đề đang ẩn để bạn tập trung luyện nghe. Bấm F5 để xem]";
            subDisplayText.className = "text-gray-500 italic text-sm select-none leading-relaxed font-sans";
            if (subToggleLabel) subToggleLabel.textContent = "Xem phụ đề (F5)";
            if (subToggleIcon) subToggleIcon.setAttribute('data-lucide', 'eye-off');
            if (subDisplayCard) subDisplayCard.classList.add('hidden');
        }

        if (window.lucide) lucide.createIcons();
    }

    function toggleSubReveal() {
        state.isSubRevealed = !state.isSubRevealed;
        updateSubDisplay();
    }

    root.App = root.App || {};
    root.App.Dictation = {
        initDictation,
        loadCurrentSegment,
        checkStandardDictation,
        toggleSubReveal,
        updateSubDisplay,
        updateWordStats
    };

})(window);
