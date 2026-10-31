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
        let autoResumeTimer = null;
        if (dictationTextarea) {
            dictationTextarea.addEventListener('input', () => {
                state.standardInputText = dictationTextarea.value;
                updateWordStats();

                // Synchronize Single-DOM Retro Game Permit counters
                if (root.App && root.App.PixelGameLoop && typeof root.App.PixelGameLoop._updateInputCounts === 'function') {
                    root.App.PixelGameLoop._updateInputCounts();
                }

                // Phase 1 (Lyre Studio): Update Smart Action Dock state
                if (root.App && typeof root.App.updateSmartActionDock === 'function') {
                    const text = dictationTextarea.value.trim();
                    if (text.length > 0) {
                        root.App.updateSmartActionDock('typing');
                    } else {
                        root.App.updateSmartActionDock(state.isPlaying ? 'playing' : 'idle');
                    }
                }

                // Auto-Pause on Type: pause audio when user starts typing
                if (state.autoPauseOnType && state.isPlaying) {
                    AudioEngine.pause();
                    clearTimeout(autoResumeTimer);
                    autoResumeTimer = setTimeout(() => {
                        if (!state.isPlaying && state.autoPauseOnType && state.activeTab === 'dictation') {
                            AudioEngine.play();
                        }
                    }, 1200);
                }
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
                    dictationTextarea.focus({ preventScroll: true });
                    AudioEngine.playSynthesizedSound('click');
                }
            });
        }

        // Hint Letter Button
        if (btnHintLetter) {
            btnHintLetter.addEventListener('click', provideHint);
        }

        // 1-Touch Word Lookup on Diff Badges
        const diffBadgesContainer = document.getElementById('diffBadgesContainer');
        if (diffBadgesContainer) {
            diffBadgesContainer.addEventListener('click', (e) => {
                const badge = e.target.closest('[data-lookup-word]');
                if (badge) {
                    const word = badge.getAttribute('data-lookup-word');
                    if (word && root.App && root.App.Dictionary) {
                        root.App.Dictionary.showPopover(word, {
                            targetEl: badge,
                            clientX: e.clientX,
                            clientY: e.clientY
                        });
                    }
                }
            });
        }

        // Double-click word lookup on subtitle display
        const subDisplayText = document.getElementById('subDisplayText');
        if (subDisplayText) {
            subDisplayText.addEventListener('dblclick', (e) => {
                const sel = window.getSelection();
                const rawWord = sel ? sel.toString().trim() : '';
                const word = (root.App && root.App.Dictionary && typeof root.App.Dictionary.cleanWord === 'function')
                    ? root.App.Dictionary.cleanWord(rawWord)
                    : rawWord.replace(/^[^\w]+|[^\w]+$/g, '');
                if (word && root.App && root.App.Dictionary) {
                    root.App.Dictionary.showPopover(word, {
                        clientX: e.clientX,
                        clientY: e.clientY
                    });
                }
            });
        }

        // Phase 5: Mini-Waveform A-B Micro-Loop Controls
        document.getElementById('btnSetMarkerA')?.addEventListener('click', setMarkerA);
        document.getElementById('btnSetMarkerB')?.addEventListener('click', setMarkerB);
        document.getElementById('btnClearMicroLoop')?.addEventListener('click', clearMicroLoop);

        // Phase 5: Mini-Waveform Boundary Micro-Nudge (±0.1s)
        document.getElementById('btnNudgeStartBack')?.addEventListener('click', () => nudgeSegmentBoundary('start', -0.1));
        document.getElementById('btnNudgeStartForward')?.addEventListener('click', () => nudgeSegmentBoundary('start', 0.1));
        document.getElementById('btnNudgeEndBack')?.addEventListener('click', () => nudgeSegmentBoundary('end', -0.1));
        document.getElementById('btnNudgeEndForward')?.addEventListener('click', () => nudgeSegmentBoundary('end', 0.1));

        const miniWaveformCanvas = document.getElementById('miniWaveformCanvas');
        if (miniWaveformCanvas) {
            miniWaveformCanvas.addEventListener('click', (e) => {
                const seg = AudioEngine.getCurrentSegment();
                if (!seg) return;
                const rect = miniWaveformCanvas.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                AudioEngine.seek(ratio * seg.duration);
            });
        }

        // Tab Mode Switching (Swiss Tactile Rocker - Standard vs Cloze vs Stream)
        const btnModeStandard = document.getElementById('btnModeStandard');
        const btnModeCloze = document.getElementById('btnModeCloze');
        const btnModeStream = document.getElementById('btnModeStream');
        const standardModeArea = document.getElementById('standardModeArea');
        const clozeModeArea = document.getElementById('clozeModeArea');
        const streamModeArea = document.getElementById('streamModeArea');

        function switchDictationMode(mode) {
            state.dictationMode = mode;
            if (btnModeStandard) btnModeStandard.className = mode === 'standard' ? "rocker-pill active" : "rocker-pill";
            if (btnModeCloze) btnModeCloze.className = mode === 'cloze' ? "rocker-pill active" : "rocker-pill";
            if (btnModeStream) btnModeStream.className = mode === 'stream' ? "rocker-pill active" : "rocker-pill";

            if (standardModeArea) standardModeArea.classList.toggle('hidden', mode !== 'standard');
            if (clozeModeArea) clozeModeArea.classList.toggle('hidden', mode !== 'cloze');
            if (streamModeArea) streamModeArea.classList.toggle('hidden', mode !== 'stream');

            if (mode === 'standard') {
                if (dictationTextarea) dictationTextarea.focus({ preventScroll: true });
            } else if (mode === 'cloze') {
                renderClozeForCurrentSegment();
            } else if (mode === 'stream') {
                initStreamModeForCurrentSegment();
            }

            AudioEngine.playSynthesizedSound('click');
        }

        if (btnModeStandard) {
            btnModeStandard.addEventListener('click', () => switchDictationMode('standard'));
        }
        if (btnModeCloze) {
            btnModeCloze.addEventListener('click', () => switchDictationMode('cloze'));
        }
        if (btnModeStream) {
            btnModeStream.addEventListener('click', () => switchDictationMode('stream'));
        }

        // Cloze Ribbon Action Buttons
        const btnClozeHintCurrent = document.getElementById('btnClozeHintCurrent');
        const btnClozeRevealAll = document.getElementById('btnClozeRevealAll');
        if (btnClozeHintCurrent) {
            btnClozeHintCurrent.addEventListener('click', provideClozeHint);
        }
        if (btnClozeRevealAll) {
            btnClozeRevealAll.addEventListener('click', revealAllClozeBlanks);
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
            dictationTextarea.focus({ preventScroll: true });
        }
        if (diffResultsCard) {
            diffResultsCard.classList.add('hidden');
        }

        // Reset Hint Ladder
        currentHintWordIdx = -1;
        hintLevel = 0;
        const hintDisplayBadge = document.getElementById('hintDisplayBadge');
        if (hintDisplayBadge) hintDisplayBadge.classList.add('hidden');

        // Reset Subtitle Reference Display (Hidden by default)
        state.isSubRevealed = false;
        updateSubDisplay();

        // Update Shadowing Lab prompt text
        const shadowingPromptText = document.getElementById('shadowingPromptText');
        if (shadowingPromptText && seg) {
            shadowingPromptText.textContent = seg.text;
        }

        // If in stream or cloze mode, initialize appropriate view
        const cloozeScoreBadge = document.getElementById('clozeScoreBadge');
        if (clozeScoreBadge) cloozeScoreBadge.classList.add('hidden');

        if (state.dictationMode === 'stream') {
            initStreamModeForCurrentSegment();
        } else if (state.dictationMode === 'cloze') {
            renderClozeForCurrentSegment();
        }

        // Phase 5: Reset micro-loop and render mini-waveform
        state.microLoopA = null;
        state.microLoopB = null;
        updateMicroLoopUI();
        drawMiniWaveform();

        updateWordStats();

        // Phase 1 (Lyre Studio): Reset Smart Action Dock to idle
        if (root.App && typeof root.App.updateSmartActionDock === 'function') {
            root.App.updateSmartActionDock(state.isPlaying ? 'playing' : 'idle');
        }
    }

    /**
     * Standard Dictation Diff Check & Multi-Tier Embossed Quality Stamp
     */
    function checkStandardDictation() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;

        const userInput = state.standardInputText;
        const isStrict = state.gradingStrictness === 'strict';
        const diffResult = DiffChecker.computeDiff(userInput, seg.text, { strict: isStrict });
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

            // Phase 4: Record in Analytics & Mistake Bank
            if (root.App && root.App.Analytics && typeof root.App.Analytics.recordSentenceResult === 'function') {
                root.App.Analytics.recordSentenceResult(state.currentIdx, diffResult, seg.text);
            }

            // Phase 4: Handle Smart Mistake Drill Session Progression
            if (root.App && root.App.Analytics && typeof root.App.Analytics.handleDrillSentenceGraded === 'function') {
                root.App.Analytics.handleDrillSentenceGraded(diffResult.accuracy);
            }

            // Phase 1 (Lyre Studio): Update Smart Action Dock to graded state
            if (root.App && typeof root.App.updateSmartActionDock === 'function') {
                root.App.updateSmartActionDock('graded');
            }

            // Version 4.0: Retro Pixel Game Loop Hook
            if (root.App && root.App.PixelGameLoop && typeof root.App.PixelGameLoop.onDictationGraded === 'function') {
                root.App.PixelGameLoop.onDictationGraded(diffResult, seg.text);
            }
        }
    }

    let currentHintWordIdx = -1;
    let hintLevel = 0;

    /**
     * Progressive 4-Level Hint Ladder
     * Level 1: Length mask (_ _ _ _)
     * Level 2: First & last letter (s _ _ t)
     * Level 3: Slow motion audio replay (0.75x)
     * Level 4: Reveal word directly
     */
    function provideHint() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;

        const dictationTextarea = document.getElementById('dictationTextarea');
        const hintDisplay = document.getElementById('hintDisplayBadge');
        if (!dictationTextarea) return;

        const words = seg.text.trim().split(/\s+/);
        const typedWords = dictationTextarea.value.trim().split(/\s+/).filter(w => w.length > 0);
        const nextIdx = typedWords.length;

        if (nextIdx >= words.length) {
            if (hintDisplay) {
                hintDisplay.textContent = "Bạn đã gõ đủ số từ trong câu! Hãy bấm Chấm điểm.";
                hintDisplay.classList.remove('hidden');
            }
            return;
        }

        if (currentHintWordIdx !== nextIdx) {
            currentHintWordIdx = nextIdx;
            hintLevel = 0;
        }

        hintLevel = (hintLevel % 4) + 1;
        const targetWord = words[nextIdx];
        const clean = SRTParser.cleanWord(targetWord);

        if (hintLevel === 1) {
            // Level 1: Word length mask
            const mask = '_ '.repeat(Math.max(1, clean.length)).trim();
            if (hintDisplay) {
                hintDisplay.innerHTML = `<span class="text-accent-amber font-bold">💡 GỢI Ý CẤP 1 (Độ dài từ):</span> Từ tiếp theo có <b>${clean.length} chữ cái</b>: <span class="font-mono text-amber-300 tracking-widest font-bold">${mask}</span>`;
                hintDisplay.classList.remove('hidden');
            }
            AudioEngine.playSynthesizedSound('tick');
        } else if (hintLevel === 2) {
            // Level 2: First and Last letter
            let masked = clean;
            if (clean.length > 2) {
                masked = clean[0] + ' ' + '_ '.repeat(clean.length - 2) + clean[clean.length - 1];
            } else if (clean.length === 2) {
                masked = clean[0] + ' _';
            }
            if (hintDisplay) {
                hintDisplay.innerHTML = `<span class="text-accent-amber font-bold">💡 GỢI Ý CẤP 2 (Chữ đầu & cuối):</span> <span class="font-mono text-emerald-400 font-bold tracking-widest">${masked}</span>`;
                hintDisplay.classList.remove('hidden');
            }
            AudioEngine.playSynthesizedSound('tick');
        } else if (hintLevel === 3) {
            // Level 3: Slow motion audio replay at 0.75x
            if (hintDisplay) {
                hintDisplay.innerHTML = `<span class="text-accent-cyan font-bold">🎧 GỢI Ý CẤP 3:</span> Đang phát chậm <b class="text-white">0.75x</b> để bạn nghe rõ âm nối và ngữ điệu...`;
                hintDisplay.classList.remove('hidden');
            }
            const oldRate = state.playbackRate;
            state.playbackRate = 0.75;
            AudioEngine.replay();
            setTimeout(() => { state.playbackRate = oldRate; }, 3500);
        } else if (hintLevel === 4) {
            // Level 4: Reveal word directly
            dictationTextarea.value = (dictationTextarea.value.trim() + ' ' + targetWord).trim() + ' ';
            state.standardInputText = dictationTextarea.value;
            dictationTextarea.focus({ preventScroll: true });
            updateWordStats();
            if (hintDisplay) {
                hintDisplay.innerHTML = `<span class="text-accent-sage font-bold">✨ GỢI Ý CẤP 4:</span> Đã điền từ: <b class="text-white font-mono underline">${targetWord}</b>`;
                hintDisplay.classList.remove('hidden');
            }
            AudioEngine.playSynthesizedSound('click');
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
            streamTypeInput.focus({ preventScroll: true });
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

    // ==========================================================================
    // PHASE 3: CLOZE DICTATION MODE (KEYWORD EXTRACTION & INTERACTIVE INLINE BLANKS)
    // ==========================================================================

    const CLOZE_FUNCTION_WORDS = new Set([
        'a', 'an', 'the', 'in', 'on', 'at', 'for', 'of', 'to', 'with', 'by', 'from', 'as',
        'into', 'about', 'through', 'after', 'over', 'between', 'out', 'against', 'during',
        'without', 'before', 'under', 'around', 'among', 'and', 'but', 'or', 'nor', 'so',
        'yet', 'if', 'that', 'although', 'because', 'since', 'unless', 'while', 'where',
        'when', 'he', 'she', 'it', 'they', 'we', 'you', 'i', 'him', 'her', 'them', 'us',
        'me', 'his', 'its', 'their', 'our', 'your', 'my', 'this', 'these', 'those',
        'who', 'whom', 'whose', 'which', 'what', 'is', 'am', 'are', 'was', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will',
        'would', 'shall', 'should', 'may', 'might', 'must', "it's", "that's"
    ]);

    /**
     * Intelligent Keyword & Weak Ending Extraction for Cloze Blanks
     * @param {string} sentenceText
     * @returns {{ tokens: Array, blanks: Array }}
     */
    function selectClozeBlanks(sentenceText) {
        if (!sentenceText || typeof sentenceText !== 'string') {
            return { tokens: [], blanks: [] };
        }

        const rawWords = sentenceText.trim().split(/\s+/).filter(w => w.length > 0);
        const totalWords = rawWords.length;
        if (totalWords === 0) return { tokens: [], blanks: [] };

        // Determine target blanks count
        let targetCount = 1;
        if (totalWords <= 3) {
            targetCount = 1;
        } else if (totalWords <= 6) {
            targetCount = Math.min(2, totalWords);
        } else if (totalWords <= 12) {
            targetCount = Math.min(3, Math.max(2, Math.round(totalWords * 0.35)));
        } else {
            targetCount = Math.min(5, Math.max(3, Math.round(totalWords * 0.3)));
        }

        // Score each candidate word
        const parsedWords = rawWords.map((rawWord, idx) => {
            const normWord = rawWord.replace(/[\u2018\u2019\u201B\u2032]/g, "'");
            const leadingMatch = normWord.match(/^[^a-zA-Z0-9']*/);
            const leadingPunct = leadingMatch ? leadingMatch[0] : '';
            const withoutLeading = normWord.slice(leadingPunct.length);

            const trailingMatch = withoutLeading.match(/[^a-zA-Z0-9']*$/);
            const trailingPunct = trailingMatch ? trailingMatch[0] : '';
            const coreWord = withoutLeading.slice(0, withoutLeading.length - trailingPunct.length);
            const cleanWord = coreWord.toLowerCase().replace(/[^a-z0-9']/g, '');

            let score = 0;
            if (cleanWord.length >= 2) {
                const isFunc = CLOZE_FUNCTION_WORDS.has(cleanWord);
                if (!isFunc && cleanWord.length >= 3) {
                    score += 5; // Content word bonus
                } else if (cleanWord.length >= 4) {
                    score += 2;
                } else {
                    score += 1;
                }

                // Morphological & Weak Phonetic Endings (-ed, -ing, -s, -es, -ly, etc.)
                if (/(ed|ing|s|es|ly|ment|tion|able|ful)$/i.test(cleanWord)) {
                    score += 3;
                }

                // Word length weighting
                score += Math.min(3, Math.floor(cleanWord.length / 3));
            }

            return { idx, rawWord, leadingPunct, trailingPunct, coreWord, cleanWord, score };
        });

        // Rank candidates by priority score descending
        const candidates = parsedWords
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score || a.idx - b.idx);

        const selectedIndices = new Set();

        // 1st Pass: Pick non-adjacent candidates for optimal pedagogical spacing
        for (const cand of candidates) {
            if (selectedIndices.size >= targetCount) break;
            if (!selectedIndices.has(cand.idx - 1) && !selectedIndices.has(cand.idx + 1)) {
                selectedIndices.add(cand.idx);
            }
        }

        // 2nd Pass: If target count not reached, fill with next best candidates
        if (selectedIndices.size < targetCount) {
            for (const cand of candidates) {
                if (selectedIndices.size >= targetCount) break;
                selectedIndices.add(cand.idx);
            }
        }

        // Fallback: If still empty, choose index 0
        if (selectedIndices.size === 0 && totalWords > 0) {
            selectedIndices.add(0);
        }

        const blanks = [];
        let blankCounter = 0;

        const tokens = parsedWords.map((p, idx) => {
            const isBlank = selectedIndices.has(idx);
            let blankIdx = -1;
            if (isBlank) {
                blankIdx = blankCounter++;
                blanks.push({
                    blankIdx,
                    wordIdx: idx,
                    cleanWord: p.cleanWord,
                    originalWord: p.coreWord,
                    leadingPunct: p.leadingPunct,
                    trailingPunct: p.trailingPunct,
                    hintLevel: 0,
                    isRevealed: false,
                    isCorrect: false,
                    userInput: ''
                });
            }

            return {
                idx,
                rawWord: p.rawWord,
                leadingPunct: p.leadingPunct,
                trailingPunct: p.trailingPunct,
                coreWord: p.coreWord,
                cleanWord: p.cleanWord,
                isBlank,
                blankIdx
            };
        });

        return { tokens, blanks };
    }

    /**
     * Render Interactive Cloze Typography & Blanks for Current Segment
     */
    function renderClozeForCurrentSegment() {
        const seg = AudioEngine.getCurrentSegment();
        const clozeContainer = document.getElementById('clozeContainer');
        const clozeProgressBadge = document.getElementById('clozeProgressBadge');
        const clozeScoreBadge = document.getElementById('clozeScoreBadge');

        if (!clozeContainer) return;

        if (clozeScoreBadge) {
            clozeScoreBadge.classList.add('hidden');
            clozeScoreBadge.textContent = '';
        }

        if (!seg || !seg.text) {
            clozeContainer.innerHTML = '<span class="text-gray-500 italic text-sm">Chưa có bài học hoặc câu trống...</span>';
            if (clozeProgressBadge) clozeProgressBadge.textContent = '0/0 Ô';
            state.clozeBlanks = [];
            return;
        }

        const escapeHTML = (SRTParser && SRTParser.escapeHTML) ? SRTParser.escapeHTML : (s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));

        const { tokens, blanks } = selectClozeBlanks(seg.text);
        state.clozeBlanks = blanks;

        // Render HTML for sentence tokens
        const htmlParts = tokens.map(tok => {
            const safeLeading = escapeHTML(tok.leadingPunct);
            const safeTrailing = escapeHTML(tok.trailingPunct);

            if (!tok.isBlank) {
                return `<span class="inline-block text-gray-200 select-none">${safeLeading}${escapeHTML(tok.coreWord)}${safeTrailing}</span>`;
            }

            const blank = blanks[tok.blankIdx];
            const widthCh = Math.max(4, blank.cleanWord.length + 1.8);

            return `<span class="inline-flex items-baseline">
                ${safeLeading ? `<span class="text-gray-400 select-none">${safeLeading}</span>` : ''}
                <input type="text"
                    class="cloze-blank-input"
                    data-blank-idx="${blank.blankIdx}"
                    style="width: ${widthCh}ch"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    aria-label="Ô điền khuyết ${blank.blankIdx + 1}"
                    placeholder=""
                    value="${escapeHTML(blank.userInput)}" />
                ${safeTrailing ? `<span class="text-gray-400 select-none">${safeTrailing}</span>` : ''}
            </span>`;
        });

        clozeContainer.innerHTML = htmlParts.join(' ');

        updateClozeProgress();

        // Attach listeners to all blank inputs
        const inputs = clozeContainer.querySelectorAll('.cloze-blank-input');
        inputs.forEach(input => {
            input.addEventListener('input', handleClozeInput);
            input.addEventListener('keydown', handleClozeKeydown);
            input.addEventListener('focus', () => {
                document.body.classList.add('zen-focus-active');
                if (root.App && typeof root.App.updateSmartActionDock === 'function') {
                    const isAnyGraded = clozeScoreBadge && !clozeScoreBadge.classList.contains('hidden');
                    if (!isAnyGraded) {
                        root.App.updateSmartActionDock('typing');
                    }
                }
            });
            input.addEventListener('blur', () => {
                document.body.classList.remove('zen-focus-active');
            });
        });

        // Focus first blank input automatically
        if (inputs.length > 0) {
            setTimeout(() => {
                try { inputs[0].focus(); } catch (e) {}
            }, 60);
        }
    }

    /**
     * Real-time Validation & Auto-Advancing on Correct Blank
     */
    function handleClozeInput(e) {
        const input = e.target;
        const blankIdx = parseInt(input.dataset.blankIdx, 10);
        if (isNaN(blankIdx) || !state.clozeBlanks || !state.clozeBlanks[blankIdx]) return;

        const blank = state.clozeBlanks[blankIdx];
        const val = input.value.trim();
        blank.userInput = val;

        const isMatch = val.toLowerCase() === blank.cleanWord.toLowerCase();

        if (isMatch) {
            input.classList.add('is-correct');
            input.classList.remove('is-wrong');
            blank.isCorrect = true;
            AudioEngine.playSynthesizedSound('tick');

            if (root.App.PixelGameLoop && typeof root.App.PixelGameLoop.onClozeEvaluated === 'function') {
                root.App.PixelGameLoop.onClozeEvaluated(true, blank.cleanWord);
            }

            updateClozeProgress();

            // Check if all blanks in the sentence are now completed
            const allSolved = state.clozeBlanks.every(b => b.isCorrect || b.isRevealed);
            if (allSolved) {
                checkClozeDictation();
            } else {
                focusNextBlank(blankIdx);
            }
        } else {
            input.classList.remove('is-correct');
            blank.isCorrect = false;
            updateClozeProgress();

            if (root.App && typeof root.App.updateSmartActionDock === 'function') {
                root.App.updateSmartActionDock('typing');
            }
        }
    }

    /**
     * Cloze Blank Key Navigation (Space / Tab / Enter / Backspace)
     */
    function handleClozeKeydown(e) {
        const input = e.target;
        const blankIdx = parseInt(input.dataset.blankIdx, 10);
        if (isNaN(blankIdx)) return;

        // Space: Advance to next blank (prevent entering whitespace inside word input)
        if (e.key === ' ' || e.code === 'Space') {
            if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                AudioEngine.playSynthesizedSound('typewriter-space');
                focusNextBlank(blankIdx);
                return;
            }
        }

        // Tab / Shift+Tab: Jump between blanks
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                focusPrevBlank(blankIdx);
            } else {
                focusNextBlank(blankIdx);
            }
            return;
        }

        // Enter: Check dictation or advance if already graded
        if (e.key === 'Enter') {
            e.preventDefault();
            const clozeScoreBadge = document.getElementById('clozeScoreBadge');
            const isGraded = clozeScoreBadge && !clozeScoreBadge.classList.contains('hidden');
            if (isGraded) {
                const btnNext = document.getElementById('btnNext');
                if (btnNext) btnNext.click();
            } else {
                checkClozeDictation();
            }
            return;
        }

        // Backspace on empty input: Jump to previous blank
        if (e.key === 'Backspace' && input.value.length === 0 && blankIdx > 0) {
            focusPrevBlank(blankIdx);
        }
    }

    function focusNextBlank(currentIdx) {
        const nextInput = document.querySelector(`.cloze-blank-input[data-blank-idx="${currentIdx + 1}"]`);
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        } else {
            // Find first incomplete blank if wrapped
            const firstIncomplete = (state.clozeBlanks || []).find(b => !b.isCorrect && !b.isRevealed);
            if (firstIncomplete && firstIncomplete.blankIdx !== currentIdx) {
                const el = document.querySelector(`.cloze-blank-input[data-blank-idx="${firstIncomplete.blankIdx}"]`);
                if (el) {
                    el.focus();
                    el.select();
                }
            }
        }
    }

    function focusPrevBlank(currentIdx) {
        if (currentIdx > 0) {
            const prevInput = document.querySelector(`.cloze-blank-input[data-blank-idx="${currentIdx - 1}"]`);
            if (prevInput) {
                prevInput.focus();
                prevInput.select();
            }
        }
    }

    function updateClozeProgress() {
        const clozeProgressBadge = document.getElementById('clozeProgressBadge');
        if (!clozeProgressBadge || !state.clozeBlanks) return;

        const total = state.clozeBlanks.length;
        const correctCount = state.clozeBlanks.filter(b => b.isCorrect || b.isRevealed).length;
        clozeProgressBadge.textContent = `${correctCount}/${total} Ô`;

        if (correctCount === total && total > 0) {
            clozeProgressBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-accent-sage border border-emerald-500/40 font-bold';
        } else {
            clozeProgressBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-accent-sage border border-emerald-500/30';
        }
    }

    /**
     * Progressive Hint Ladder for Cloze Blanks (First Letter -> First+Last -> Full Reveal)
     */
    function provideClozeHint() {
        if (!state.clozeBlanks || state.clozeBlanks.length === 0) return;

        // Target: active element if it's a cloze-blank-input, else first unsolved blank
        let targetBlank = null;
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('cloze-blank-input')) {
            const idx = parseInt(activeEl.dataset.blankIdx, 10);
            targetBlank = state.clozeBlanks[idx];
        }

        if (!targetBlank || targetBlank.isCorrect || targetBlank.isRevealed) {
            targetBlank = state.clozeBlanks.find(b => !b.isCorrect && !b.isRevealed);
        }

        if (!targetBlank) return;

        targetBlank.hintLevel = (targetBlank.hintLevel || 0) + 1;
        const inputEl = document.querySelector(`.cloze-blank-input[data-blank-idx="${targetBlank.blankIdx}"]`);
        const clean = targetBlank.cleanWord;

        if (targetBlank.hintLevel === 1) {
            // Level 1: First letter hint as placeholder
            const hintVal = clean[0] + '·'.repeat(Math.max(1, clean.length - 1));
            if (inputEl) {
                inputEl.placeholder = hintVal;
                inputEl.focus();
            }
            AudioEngine.playSynthesizedSound('tick');
        } else if (targetBlank.hintLevel === 2) {
            // Level 2: First and last letter
            let hintVal = clean;
            if (clean.length > 2) {
                hintVal = clean[0] + '·'.repeat(clean.length - 2) + clean[clean.length - 1];
            } else if (clean.length === 2) {
                hintVal = clean[0] + '·';
            }
            if (inputEl) {
                inputEl.placeholder = hintVal;
                inputEl.focus();
            }
            AudioEngine.playSynthesizedSound('tick');
        } else {
            // Level 3: Reveal word directly
            targetBlank.isRevealed = true;
            targetBlank.userInput = targetBlank.originalWord;
            if (inputEl) {
                inputEl.value = targetBlank.originalWord;
                inputEl.classList.add('is-revealed');
                inputEl.classList.remove('is-wrong');
            }
            AudioEngine.playSynthesizedSound('click');
            updateClozeProgress();

            if (state.clozeBlanks.every(b => b.isCorrect || b.isRevealed)) {
                checkClozeDictation();
            } else {
                focusNextBlank(targetBlank.blankIdx);
            }
        }
    }

    /**
     * Reveal All Blanks for the Current Segment
     */
    function revealAllClozeBlanks() {
        if (!state.clozeBlanks || state.clozeBlanks.length === 0) return;

        state.clozeBlanks.forEach(b => {
            b.isRevealed = true;
            b.userInput = b.originalWord;
            const inputEl = document.querySelector(`.cloze-blank-input[data-blank-idx="${b.blankIdx}"]`);
            if (inputEl) {
                inputEl.value = b.originalWord;
                inputEl.classList.add('is-revealed');
                inputEl.classList.remove('is-wrong', 'is-correct');
            }
        });

        updateClozeProgress();

        const clozeScoreBadge = document.getElementById('clozeScoreBadge');
        if (clozeScoreBadge) {
            clozeScoreBadge.textContent = 'ĐÃ MỞ ĐÁP ÁN TOÀN BỘ';
            clozeScoreBadge.className = 'text-xs font-bold font-mono px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';
            clozeScoreBadge.classList.remove('hidden');
        }

        if (root.App && typeof root.App.updateSmartActionDock === 'function') {
            root.App.updateSmartActionDock('graded');
        }

        AudioEngine.playSynthesizedSound('click');
    }

    /**
     * Validate and Grade Cloze Dictation
     */
    function checkClozeDictation() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg || !state.clozeBlanks || state.clozeBlanks.length === 0) return;

        let correctCount = 0;
        let revealedCount = 0;

        state.clozeBlanks.forEach((b, idx) => {
            const inputEl = document.querySelector(`.cloze-blank-input[data-blank-idx="${idx}"]`);
            const val = (inputEl ? inputEl.value : b.userInput).trim();
            b.userInput = val;

            if (b.isRevealed) {
                revealedCount++;
                if (inputEl) {
                    inputEl.classList.add('is-revealed');
                    inputEl.classList.remove('is-wrong');
                }
            } else if (val.toLowerCase() === b.cleanWord.toLowerCase()) {
                b.isCorrect = true;
                correctCount++;
                if (inputEl) {
                    inputEl.classList.add('is-correct');
                    inputEl.classList.remove('is-wrong', 'is-revealed');
                }
            } else {
                b.isCorrect = false;
                if (inputEl) {
                    inputEl.classList.add('is-wrong');
                    inputEl.classList.remove('is-correct', 'is-revealed');
                }
            }
        });

        const total = state.clozeBlanks.length;
        const accuracy = Math.round((correctCount / total) * 100);

        const clozeScoreBadge = document.getElementById('clozeScoreBadge');
        if (clozeScoreBadge) {
            clozeScoreBadge.classList.remove('hidden');
            if (accuracy >= 80) {
                clozeScoreBadge.textContent = `XUẤT SẮC · ${accuracy}% (${correctCount}/${total} Ô ĐÚNG)`;
                clozeScoreBadge.className = 'text-xs font-bold font-mono px-3 py-1 rounded-lg bg-emerald-500/20 text-accent-sage border border-emerald-500/40';
            } else {
                clozeScoreBadge.textContent = `CẦN CẢI THIỆN · ${accuracy}% (${correctCount}/${total} Ô ĐÚNG)`;
                clozeScoreBadge.className = 'text-xs font-bold font-mono px-3 py-1 rounded-lg bg-rose-500/20 text-accent-rose border border-rose-500/40';
            }
        }

        if (root.App && root.App.PixelGameLoop && typeof root.App.PixelGameLoop.onClozeGraded === 'function') {
            root.App.PixelGameLoop.onClozeGraded(accuracy);
        }

        AudioEngine.playSynthesizedSound('stamp');

        if (accuracy >= 80) {
            setTimeout(() => AudioEngine.playSynthesizedSound('success'), 200);
            state.completedSentences.add(state.currentIdx);
            const badge = document.getElementById('headerProgressBadge');
            if (badge) badge.textContent = `(${state.completedSentences.size}/${state.subs.length})`;

            if (state.mistakeSentences && state.mistakeSentences.has(state.currentIdx)) {
                state.mistakeSentences.delete(state.currentIdx);
            }
        } else {
            setTimeout(() => AudioEngine.playSynthesizedSound('wrong'), 200);

            if (state.mistakeSentences) {
                state.mistakeSentences.set(state.currentIdx, {
                    sentenceIdx: state.currentIdx,
                    accuracy,
                    text: seg.text,
                    userText: state.clozeBlanks.map(b => b.userInput || '____').join(' / '),
                    timestamp: Date.now()
                });
            }
        }

        // Phase 4: Handle Smart Mistake Drill Session Progression
        if (root.App && root.App.Analytics && typeof root.App.Analytics.handleDrillSentenceGraded === 'function') {
            root.App.Analytics.handleDrillSentenceGraded(accuracy);
        }

        if (root.App && typeof root.App.updateSmartActionDock === 'function') {
            root.App.updateSmartActionDock('graded');
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

    // ==========================================================================
    // PHASE 5: MINI-WAVEFORM CANVAS & A-B MICRO-LOOP ENGINE
    // ==========================================================================
    let cachedMiniPeaks = null;
    let cachedMiniSegIdx = -1;

    function drawMiniWaveform() {
        const canvas = document.getElementById('miniWaveformCanvas');
        if (!canvas || typeof canvas.getContext !== 'function') return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const seg = AudioEngine.getCurrentSegment();
        if (!seg || !state.audioBuffer) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width || 400;
            canvas.height = rect.height || 32;
        }

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Cache peaks if same segment
        const numBars = Math.floor(width / 3);
        if (cachedMiniSegIdx !== state.currentIdx || !cachedMiniPeaks || cachedMiniPeaks.length !== numBars) {
            const extractFn = AudioEngine.extractWaveformPeaks || AudioEngine.extractPeaks;
            cachedMiniPeaks = extractFn ? extractFn(state.audioBuffer, seg.start, seg.duration, numBars) : [];
            cachedMiniSegIdx = state.currentIdx;
        }

        const peaks = cachedMiniPeaks || [];
        const barWidth = 2;
        const gap = 1;
        const centerY = height / 2;

        // Draw shaded loop zone if micro-loop active
        if (state.microLoopA !== null && state.microLoopB !== null && state.microLoopB > state.microLoopA) {
            const xA = (state.microLoopA / seg.duration) * width;
            const xB = (state.microLoopB / seg.duration) * width;
            ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
            ctx.fillRect(xA, 0, xB - xA, height);

            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(xA, 0, 2, height);
            ctx.fillRect(xB - 2, 0, 2, height);
        }

        // Draw waveform bars
        ctx.fillStyle = 'rgba(217, 119, 6, 0.65)';
        for (let i = 0; i < peaks.length; i++) {
            const x = i * (barWidth + gap);
            const barH = Math.max(2, peaks[i] * (height * 0.85));
            ctx.fillRect(x, centerY - barH / 2, barWidth, barH);
        }

        // Update DOM playhead position (no canvas trail smearing)
        updateMiniWaveformPlayhead(state.pausedAt || 0, seg.duration);
        updateMiniWaveformTimecode();
    }

    /**
     * Nudge segment start or end boundary by delta seconds (Phase 5)
     * @param {'start'|'end'} boundary
     * @param {number} delta e.g. -0.1 or +0.1
     * @returns {Object|null} updated segment
     */
    function nudgeSegmentBoundary(boundary, delta) {
        if (!state.subs || state.subs.length === 0 || state.currentIdx < 0 || state.currentIdx >= state.subs.length) {
            return null;
        }
        const seg = state.subs[state.currentIdx];
        if (!seg) return null;

        const maxDuration = state.audioBuffer ? state.audioBuffer.duration : (state.subs[state.subs.length - 1].end + 30);

        if (boundary === 'start') {
            const newStart = Math.round((seg.start + delta) * 1000) / 1000;
            if (newStart < 0) {
                seg.start = 0;
            } else if (newStart > seg.end - 0.2) {
                seg.start = Math.max(0, Math.round((seg.end - 0.2) * 1000) / 1000);
            } else {
                seg.start = newStart;
            }
        } else if (boundary === 'end') {
            const newEnd = Math.round((seg.end + delta) * 1000) / 1000;
            if (newEnd < seg.start + 0.2) {
                seg.end = Math.round((seg.start + 0.2) * 1000) / 1000;
            } else if (newEnd > maxDuration) {
                seg.end = maxDuration;
            } else {
                seg.end = newEnd;
            }
        }

        seg.duration = Math.round((seg.end - seg.start) * 1000) / 1000;

        // Invalidate cached peaks so waveform re-extracts for the adjusted boundaries
        cachedMiniPeaks = null;
        cachedMiniSegIdx = -1;

        drawMiniWaveform();
        updateMiniWaveformTimecode();

        if (AudioEngine && typeof AudioEngine.playSynthesizedSound === 'function') {
            AudioEngine.playSynthesizedSound('click');
        }

        if (root.App.Storage && typeof root.App.Storage.saveSubtitles === 'function') {
            root.App.Storage.saveSubtitles(state.subs).catch(() => {});
        }

        if (root.App.SrtEditor && typeof root.App.SrtEditor.renderSegmentList === 'function') {
            root.App.SrtEditor.renderSegmentList();
        }

        return seg;
    }

    /**
     * Format and update Mini-Waveform timecode display
     */
    function updateMiniWaveformTimecode() {
        if (typeof document === 'undefined') return;
        const timecodeEl = document.getElementById('miniWaveformTimecode');
        if (!timecodeEl) return;

        const seg = AudioEngine ? AudioEngine.getCurrentSegment() : null;
        if (!seg) {
            timecodeEl.textContent = '00:00.0 - 00:00.0';
            return;
        }

        function fmt(sec) {
            const m = Math.floor(sec / 60);
            const s = (sec % 60).toFixed(1);
            return `${String(m).padStart(2, '0')}:${s < 10 ? '0' : ''}${s}`;
        }

        timecodeEl.textContent = `${fmt(seg.start)} - ${fmt(seg.end)}`;
    }

    function updateMiniWaveformPlayhead(currentPosInSeg, duration) {
        if (!duration) return;
        const playhead = document.getElementById('miniWaveformPlayhead');
        if (playhead) {
            const percent = Math.min(100, Math.max(0, (currentPosInSeg / duration) * 100));
            playhead.style.left = `${percent}%`;
        }
    }

    function setMarkerA() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;
        state.microLoopA = state.pausedAt || 0;
        if (state.microLoopB !== null && state.microLoopB <= state.microLoopA) {
            state.microLoopB = Math.min(seg.duration, state.microLoopA + 1.0);
        }
        updateMicroLoopUI();
        drawMiniWaveform();
        AudioEngine.playSynthesizedSound('click');
    }

    function setMarkerB() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;
        state.microLoopB = state.pausedAt || seg.duration;
        if (state.microLoopA === null || state.microLoopA >= state.microLoopB) {
            state.microLoopA = Math.max(0, state.microLoopB - 1.0);
        }
        updateMicroLoopUI();
        drawMiniWaveform();
        AudioEngine.playSynthesizedSound('click');
    }

    function clearMicroLoop() {
        state.microLoopA = null;
        state.microLoopB = null;
        updateMicroLoopUI();
        drawMiniWaveform();
        AudioEngine.playSynthesizedSound('click');
    }

    function updateMicroLoopUI() {
        const badge = document.getElementById('microLoopBadge');
        if (badge) {
            if (state.microLoopA !== null && state.microLoopB !== null) {
                badge.textContent = `LẶP [${state.microLoopA.toFixed(1)}s - ${state.microLoopB.toFixed(1)}s]`;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    function setFontSize(sizePx) {
        state.fontSize = sizePx;
        const textarea = document.getElementById('dictationTextarea');
        if (textarea) textarea.style.fontSize = `${sizePx}px`;
        try { localStorage.setItem('dictashadow_font_size', sizePx); } catch (e) {}
    }

    root.App = root.App || {};
    root.App.Dictation = {
        initDictation,
        loadCurrentSegment,
        checkStandardDictation,
        selectClozeBlanks,
        renderClozeForCurrentSegment,
        checkClozeDictation,
        provideClozeHint,
        revealAllClozeBlanks,
        provideHint,
        revealNextWord: provideHint,
        toggleSubReveal,
        updateSubDisplay,
        updateWordStats,
        drawMiniWaveform,
        updateMiniWaveformPlayhead,
        updateMiniWaveformTimecode,
        nudgeSegmentBoundary,
        setMarkerA,
        setMarkerB,
        clearMicroLoop,
        setFontSize
    };

})(typeof window !== 'undefined' ? window : this);
