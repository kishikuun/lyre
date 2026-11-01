/**
 * DictaShadow Studio - Ergonomic Transcription Hotkeys Manager (js/hotkeys.js)
 * Designed for 0 hand contortion and touch typing flow.
 */
(function (root) {
    'use strict';

    const state = root.App.state;

    function initHotkeys() {
        window.addEventListener('keydown', (e) => {
            const AudioEngine = root.App.AudioEngine;
            const Dictation = root.App.Dictation;
            const Shadowing = root.App.Shadowing;

            // 1. Check for Active Modals
            const modalSelectors = '#srtEditorModal:not(.pointer-events-none), #hotkeysModal:not(.pointer-events-none), #sentenceDrawer:not(.pointer-events-none), #quickPasteModal:not(.pointer-events-none), #vadTuningModal:not(.pointer-events-none), #mobileSettingsDrawer:not(.pointer-events-none), #studioMixerDrawer:not(.pointer-events-none), #analyticsModal:not(.pointer-events-none), #curatedLessonsModal:not(.pointer-events-none), #ttsGeneratorModal:not(.pointer-events-none), #flashcardModal:not(.pointer-events-none), #vocabDrawer:not(.hidden), #gameStatsModal:not(.hidden), #inspectorSatchelModal:not(.hidden), #pixelGazetteModal';
            const activeModal = document.querySelector(modalSelectors);

            if (e.key === 'Escape') {
                if (activeModal) {
                    if (activeModal.id === 'flashcardModal') {
                        if (root.App && root.App.Dictionary && typeof root.App.Dictionary.closeFlashcardModal === 'function') {
                            root.App.Dictionary.closeFlashcardModal();
                        } else {
                            activeModal.classList.add('opacity-0', 'pointer-events-none');
                        }
                    } else if (activeModal.id === 'vocabDrawer') {
                        if (root.App && root.App.Dictionary && typeof root.App.Dictionary.closeVocabDrawer === 'function') {
                            root.App.Dictionary.closeVocabDrawer();
                        } else {
                            activeModal.classList.add('hidden');
                        }
                    } else if (activeModal.id === 'inspectorSatchelModal') {
                        if (root.App && root.App.PixelGameLoop && typeof root.App.PixelGameLoop.closeSatchel === 'function') {
                            root.App.PixelGameLoop.closeSatchel();
                        } else {
                            activeModal.classList.add('hidden');
                        }
                        const btnToggle = document.getElementById('btnSatchelToggle');
                        if (btnToggle) btnToggle.focus();
                    } else if (activeModal.id === 'gameStatsModal') {
                        activeModal.classList.add('hidden');
                    } else if (activeModal.id === 'pixelGazetteModal') {
                        if (root.App && root.App.PixelGameLoop && root.App.PixelGameLoop.gazette && typeof root.App.PixelGameLoop.gazette.close === 'function') {
                            root.App.PixelGameLoop.gazette.close();
                        } else if (activeModal.parentNode) {
                            activeModal.parentNode.removeChild(activeModal);
                        }
                    } else {
                        activeModal.classList.add('opacity-0', 'pointer-events-none');
                    }
                    e.stopImmediatePropagation();
                    return;
                }
                if (state.activeTab === 'shadowing') {
                    e.preventDefault();
                    const tabDict = document.getElementById('tabDictationBtn') || document.getElementById('arcadeTabDictation');
                    if (tabDict) tabDict.click();
                    return;
                }
                e.preventDefault();
                AudioEngine.togglePlay();
                return;
            }

            // If a modal is open, let inputs inside modal function normally
            if (activeModal) return;

            const isTypingInInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

            // =================================================================
            // 2. SMART SPACE & ARROWS WHEN TYPING IN TEXTAREA / INPUT
            // =================================================================
            if (isTypingInInput) {
                const activeEl = document.activeElement;
                const isDictationArea = activeEl.id === 'dictationTextarea' || activeEl.id === 'gamePermitInput';

                // A. Shift + Space or Ctrl + Space: Instant Play/Pause without leaving typing cursor!
                if ((e.shiftKey || e.ctrlKey) && (e.key === ' ' || e.code === 'Space')) {
                    e.preventDefault();
                    AudioEngine.togglePlay();
                    return;
                }

                // B. Smart Empty Space: If textarea is currently empty, Space toggles play/pause instead of adding whitespace
                if (isDictationArea && !e.shiftKey && !e.ctrlKey && !e.altKey && (e.key === ' ' || e.code === 'Space')) {
                    if (activeEl.value.trim().length === 0) {
                        e.preventDefault();
                        AudioEngine.togglePlay();
                        return;
                    }
                }

                // C. Alt + Navigation: Rewind / Forward / Replay / Subtitle Peek
                if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J')) {
                    e.preventDefault();
                    AudioEngine.rewind(2.0);
                    return;
                }
                if (e.altKey && (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L')) {
                    e.preventDefault();
                    AudioEngine.forward(2.0);
                    return;
                }
                if (e.altKey && (e.key === 'ArrowUp' || e.key === 'r' || e.key === 'R' || e.key === 'k' || e.key === 'K')) {
                    e.preventDefault();
                    AudioEngine.replay();
                    return;
                }
                if (e.altKey && e.key === 'ArrowDown') {
                    e.preventDefault();
                    Dictation.toggleSubReveal();
                    return;
                }
                if (e.altKey && (e.key === '[' || e.key === '{')) {
                    e.preventDefault();
                    const btnPrev = document.getElementById('btnPrev');
                    if (btnPrev) btnPrev.click();
                    return;
                }
                if (e.altKey && (e.key === ']' || e.key === '}')) {
                    e.preventDefault();
                    const btnNext = document.getElementById('btnNext');
                    if (btnNext) btnNext.click();
                    return;
                }

                // D. Alt+H or Ctrl+H: Provide Progressive Hint Letter
                if ((e.altKey || e.ctrlKey) && (e.key === 'h' || e.key === 'H')) {
                    e.preventDefault();
                    if (state.dictationMode === 'cloze' && Dictation && typeof Dictation.provideClozeHint === 'function') {
                        Dictation.provideClozeHint();
                    } else if (Dictation && typeof Dictation.provideHint === 'function') {
                        Dictation.provideHint();
                    }
                    return;
                }

                // E. Enter / Ctrl + Enter: Check dictation OR Advance to next sentence if already graded
                if (e.key === 'Enter') {
                    if (e.ctrlKey) {
                        e.preventDefault();
                        if (state.dictationMode === 'cloze' && Dictation && typeof Dictation.checkClozeDictation === 'function') {
                            Dictation.checkClozeDictation();
                        } else if (Dictation && typeof Dictation.checkStandardDictation === 'function') {
                            Dictation.checkStandardDictation();
                        }
                        return;
                    }
                    if (!e.shiftKey && !e.altKey) {
                        e.preventDefault();
                        if (state.dictationMode === 'cloze') {
                            const clozeScore = document.getElementById('clozeScoreBadge');
                            const isGraded = clozeScore && !clozeScore.classList.contains('hidden');
                            if (isGraded) {
                                const btnNext = document.getElementById('btnNext');
                                if (btnNext) btnNext.click();
                            } else if (Dictation && typeof Dictation.checkClozeDictation === 'function') {
                                Dictation.checkClozeDictation();
                            }
                        } else {
                            const diffCard = document.getElementById('diffResultsCard');
                            const isGraded = diffCard && !diffCard.classList.contains('hidden');
                            if (isGraded) {
                                const btnNext = document.getElementById('btnNext');
                                if (btnNext) btnNext.click();
                            } else if (Dictation && typeof Dictation.checkStandardDictation === 'function') {
                                Dictation.checkStandardDictation();
                            }
                        }
                        return;
                    }
                }

                // F. Ergonomic TAB for Instant Rewind 2s, Shift+TAB for Forward 2s (Zero hand contortion)
                if (e.key === 'Tab') {
                    if (activeEl.classList.contains('cloze-blank-input')) {
                        // Let cloze-blank-input keydown listener navigate between blanks naturally
                        return;
                    }
                    e.preventDefault();
                    if (e.shiftKey) {
                        AudioEngine.forward(2.0);
                    } else {
                        AudioEngine.rewind(2.0);
                    }
                    return;
                }

                // F. F1 - F5 function keys
                if (e.key === 'F1') { e.preventDefault(); AudioEngine.togglePlay(); return; }
                if (e.key === 'F2') { e.preventDefault(); AudioEngine.rewind(2.0); return; }
                if (e.key === 'F3') { e.preventDefault(); AudioEngine.forward(2.0); return; }
                if (e.key === 'F4') { e.preventDefault(); AudioEngine.replay(); return; }
                if (e.key === 'F5') { e.preventDefault(); Dictation.toggleSubReveal(); return; }

                // G. Ctrl+I or Alt+I: Quick toggle Inspector's Satchel even while typing
                if ((e.ctrlKey || e.altKey) && (e.key === 'i' || e.key === 'I')) {
                    e.preventDefault();
                    if (root.App && root.App.PixelGameLoop && typeof root.App.PixelGameLoop.toggleSatchel === 'function') {
                        root.App.PixelGameLoop.toggleSatchel();
                    }
                    return;
                }

                return; // Allow normal character typing to continue without interruption
            }

            // =================================================================
            // 3. NATURAL GLOBAL SHORTCUTS WHEN NOT TYPING (Player & Shadowing Mode)
            // =================================================================
            // Space: Global Play / Pause, or Shadowing Record in Shadowing tab
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                // Hỗ trợ người dùng mới: Nếu đang ở Title Screen, Space kích hoạt vào ca trực
                const titleScreen = document.getElementById('gameTitleScreen');
                if (titleScreen && !titleScreen.classList.contains('hidden')) {
                    const btnStart = document.getElementById('btnTitleStartShift');
                    if (btnStart) {
                        btnStart.click();
                        return;
                    }
                }
                if (state.activeTab === 'shadowing' && Shadowing && typeof Shadowing.toggleRecording === 'function') {
                    Shadowing.toggleRecording();
                    return;
                }
                AudioEngine.togglePlay();
                return;
            }

            // Left / Right Arrow: Rewind / Forward 2s
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                AudioEngine.rewind(2.0);
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                AudioEngine.forward(2.0);
                return;
            }

            // Up / Down Arrow or [ / ]: Previous / Next sentence
            if (e.key === 'ArrowUp' || e.key === '[') {
                e.preventDefault();
                const btnPrev = document.getElementById('btnPrev');
                if (btnPrev) btnPrev.click();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === ']') {
                e.preventDefault();
                const btnNext = document.getElementById('btnNext');
                if (btnNext) btnNext.click();
                return;
            }

            // T: Toggle Interactive Karaoke Transcript Drawer (Phase 4)
            if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                const btnOpenDrawer = document.getElementById('btnOpenDrawer');
                if (btnOpenDrawer) btnOpenDrawer.click();
                return;
            }

            // I: Toggle Inspector's Inventory Satchel (Phase 8)
            if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                if (root.App && root.App.PixelGameLoop && typeof root.App.PixelGameLoop.toggleSatchel === 'function') {
                    root.App.PixelGameLoop.toggleSatchel();
                }
                return;
            }

            // Tab / Shift + Tab as alternative rewind / forward
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                AudioEngine.rewind(2.0);
                return;
            }
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                AudioEngine.forward(2.0);
                return;
            }

            // Shadowing Specific Single-Key Hotkeys
            if (state.activeTab === 'shadowing') {
                // Enter in Dual Mastery loop proceeds to next sentence in Dictation
                if (state.isDualMasteryActive && e.key === 'Enter') {
                    e.preventDefault();
                    if (root.App && typeof root.App.continueDualMasteryNextSentence === 'function') {
                        root.App.continueDualMasteryNextSentence();
                    }
                    return;
                }

                if (e.key.toLowerCase() === 'r') {
                    e.preventDefault();
                    Shadowing.toggleRecording();
                    return;
                }
                if (e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    AudioEngine.toggleABTrack();
                    Shadowing.updateABButtonUI();
                    return;
                }
                if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    AudioEngine.playStereoContrast(0);
                    return;
                }
                if (e.key.toLowerCase() === 'p') {
                    e.preventDefault();
                    const btnTogglePitch = document.getElementById('btnTogglePitch');
                    if (btnTogglePitch) btnTogglePitch.click();
                    return;
                }
                if (e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    Shadowing.toggleBlindMode();
                    return;
                }
                if (['1', '2', '3', '4'].includes(e.key)) {
                    e.preventDefault();
                    Shadowing.setShadowingStep(parseInt(e.key, 10));
                    return;
                }
            } else if (state.activeTab === 'dictation') {
                // Single-key shortcuts in dictation mode when not typing
                if (e.key.toLowerCase() === 'r') {
                    e.preventDefault();
                    AudioEngine.replay();
                    return;
                }
                if (e.key.toLowerCase() === 'h') {
                    e.preventDefault();
                    if (Dictation && typeof Dictation.provideHint === 'function') {
                        Dictation.provideHint();
                    }
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const diffCard = document.getElementById('diffResultsCard');
                    const isGraded = diffCard && !diffCard.classList.contains('hidden');
                    if (isGraded) {
                        const btnNext = document.getElementById('btnNext');
                        if (btnNext) btnNext.click();
                    } else if (Dictation && typeof Dictation.checkStandardDictation === 'function') {
                        Dictation.checkStandardDictation();
                    }
                    return;
                }
            }

            // F1 - F5 global fallback
            if (e.key === 'F1') { e.preventDefault(); AudioEngine.togglePlay(); return; }
            if (e.key === 'F2') { e.preventDefault(); AudioEngine.rewind(2.0); return; }
            if (e.key === 'F3') { e.preventDefault(); AudioEngine.forward(2.0); return; }
            if (e.key === 'F4') { e.preventDefault(); AudioEngine.replay(); return; }
            if (e.key === 'F5') { e.preventDefault(); Dictation.toggleSubReveal(); return; }
        });
    }

    root.App = root.App || {};
    root.App.Hotkeys = {
        initHotkeys
    };

})(window);
