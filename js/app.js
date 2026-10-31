/**
 * DictaShadow Studio - Main Application Controller (js/app.js)
 * Phase 1, Phase 2 & Phase 3 (PWA, IndexedDB Offline, Gestures, Visual SRT Editor)
 */
(function (root) {
    'use strict';

    const state = root.App.state;
    const AudioEngine = root.App.AudioEngine;
    const SRTParser = root.App.SRTParser;
    const Dictation = root.App.Dictation;
    const VinylJog = root.App.VinylJog;
    const Shadowing = root.App.Shadowing;
    const Hotkeys = root.App.Hotkeys;
    const Storage = root.App.Storage;
    const SRTEditor = root.App.SRTEditor;
    const Gestures = root.App.Gestures;
    const VADSlicer = root.App.VADSlicer;
    const Dictionary = root.App.Dictionary;
    const Analytics = root.App.Analytics;

    let deferredInstallPrompt = null;
    let renderCuratedLessons = null;
    let loadCuratedLesson = null;
    let openCuratedModal = null;
    let closeCuratedModal = null;

    const DEMO_SRT_TEXT = `1
00:00:00,000 --> 00:00:09,000
You hear a travel agent leaving a telephone message for a customer called Mr. Hope, who needs help at the airport.

2
00:00:09,000 --> 00:00:13,500
Hello Mr. Hope, it's Sarah from Travel First here.

3
00:00:13,500 --> 00:00:22,000
Sorry that I couldn't reach you earlier, but I've got the information you asked me for about the passenger assistance service at the airport.

4
00:00:22,000 --> 00:00:31,000
Right. Well, firstly, when you arrive at the departures hall at the airport, you will need to find the passenger assistance office.

5
00:00:31,000 --> 00:00:38,000
If you go in through the main departures entrance, you'll see the flight information screen right in front of you.`;

    document.addEventListener('DOMContentLoaded', async () => {
        initUI();
        VinylJog.initVinyl();
        Dictation.initDictation();
        Shadowing.initShadowing();
        SRTEditor.initSRTEditor();
        Gestures.initGestures();
        Hotkeys.initHotkeys();
        if (Dictionary && typeof Dictionary.init === 'function') {
            Dictionary.init();
        }
        if (Analytics && typeof Analytics.init === 'function') {
            Analytics.init();
        }

        initQuickPaste();
        initVADSlicing();
        initDragAndDrop();

        initPWA();
        await restoreSessionFromStorage();

        if (window.lucide) lucide.createIcons();
    });

    /**
     * PWA Service Worker & Install Prompt
     */
    function initPWA() {
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.log("PWA Service Worker note:", err.message);
            });
        }

        const btnInstallPWA = document.getElementById('btnInstallPWA');
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            if (btnInstallPWA) btnInstallPWA.classList.remove('hidden');
        });

        if (btnInstallPWA) {
            btnInstallPWA.addEventListener('click', async () => {
                if (deferredInstallPrompt) {
                    deferredInstallPrompt.prompt();
                    const { outcome } = await deferredInstallPrompt.userChoice;
                    deferredInstallPrompt = null;
                    btnInstallPWA.classList.add('hidden');
                }
            });
        }
    }

    /**
     * Restore previous study session from IndexedDB
     */
    async function restoreSessionFromStorage() {
        if (!Storage) return;
        try {
            const savedSRT = await Storage.getSRT();
            const savedAudio = await Storage.getAudio();
            const savedProgress = await Storage.getProgress();
            const savedRecordings = await Storage.getAllUserRecordings();

            if (savedSRT && savedSRT.text) {
                const srtFileName = document.getElementById('srtFileName');
                if (srtFileName) {
                    srtFileName.textContent = savedSRT.fileName || 'offline_cached.srt';
                    srtFileName.className = "text-[11px] text-accent-indigo font-bold truncate";
                }
                loadSubtitleData(savedSRT.text, false);
            }

            if (savedAudio && savedAudio.buffer) {
                AudioEngine.initAudioContext();
                const audioFileName = document.getElementById('audioFileName');
                if (audioFileName) {
                    audioFileName.textContent = savedAudio.fileName || 'offline_cached.mp3';
                    audioFileName.className = "text-[11px] text-accent-cyan font-bold truncate";
                }
                state.audioBuffer = await state.audioContext.decodeAudioData(savedAudio.buffer.slice(0));
                setAudioStatus('AUDIO READY (CACHED)', 'bg-accent-emerald');
                updatePlaybackDisplay();
                Shadowing.redrawWaveforms();
                checkReadyState();
            }

            // Restore Progress
            if (savedProgress) {
                if (savedProgress.completed && Array.isArray(savedProgress.completed)) {
                    state.completedSentences = new Set(savedProgress.completed);
                }
                if (savedProgress.currentIdx && savedProgress.currentIdx < state.subs.length) {
                    state.currentIdx = savedProgress.currentIdx;
                    Dictation.loadCurrentSegment();
                    updatePlaybackDisplay();
                }
            }

            // Restore User Voice Recordings
            if (savedRecordings && savedRecordings.length) {
                for (const r of savedRecordings) {
                    if (r.blob) {
                        try {
                            const buf = await r.blob.arrayBuffer();
                            const audioBuf = await state.audioContext.decodeAudioData(buf);
                            state.userRecordings[r.sentenceIdx] = {
                                blob: r.blob,
                                buffer: audioBuf,
                                duration: audioBuf.duration
                            };
                        } catch (e) { }
                    }
                }
                Shadowing.redrawWaveforms();
                Shadowing.updateABButtonUI();
            }
        } catch (err) {
            console.log("Storage restore info:", err);
        }
    }

    function initUI() {
        // Workspace Tab Switcher (Dictation Studio vs Shadowing Lab)
        const tabDictationBtn = document.getElementById('tabDictationBtn');
        const tabShadowingBtn = document.getElementById('tabShadowingBtn');
        const dictationSection = document.getElementById('dictationSection');
        const shadowingSection = document.getElementById('shadowingSection');

        if (tabDictationBtn && tabShadowingBtn) {
            tabDictationBtn.addEventListener('click', () => {
                AudioEngine.playSynthesizedSound('click');
                state.activeTab = 'dictation';
                tabDictationBtn.className = "rocker-pill active";
                tabShadowingBtn.className = "rocker-pill";
                if (dictationSection) dictationSection.classList.remove('hidden');
                if (shadowingSection) shadowingSection.classList.add('hidden');
            });

            tabShadowingBtn.addEventListener('click', () => {
                AudioEngine.playSynthesizedSound('click');
                state.activeTab = 'shadowing';
                tabShadowingBtn.className = "rocker-pill active";
                tabDictationBtn.className = "rocker-pill";
                if (shadowingSection) shadowingSection.classList.remove('hidden');
                if (dictationSection) dictationSection.classList.add('hidden');
                setTimeout(() => {
                    Shadowing.redrawWaveforms();
                    Shadowing.updateABButtonUI();
                    if (window.lucide) lucide.createIcons();
                }, 50);
            });
        }

        // Toggle Collapsible Audio Rack Drawer
        const btnToggleAudioRack = document.getElementById('btnToggleAudioRack');
        const btnExpandRackDetails = document.getElementById('btnExpandRackDetails');
        const rackExpandedSection = document.getElementById('rackExpandedSection');
        const audioRackTray = document.getElementById('audioRackTray');

        if (btnToggleAudioRack && audioRackTray) {
            btnToggleAudioRack.addEventListener('click', () => {
                AudioEngine.playSynthesizedSound('click');
                audioRackTray.classList.toggle('hidden');
            });
        }

        if (btnExpandRackDetails && rackExpandedSection) {
            btnExpandRackDetails.addEventListener('click', () => {
                AudioEngine.playSynthesizedSound('click');
                rackExpandedSection.classList.toggle('hidden');
                const rackChevronIcon = document.getElementById('rackChevronIcon');
                if (rackChevronIcon) {
                    rackChevronIcon.setAttribute('data-lucide', rackExpandedSection.classList.contains('hidden') ? 'chevron-up' : 'chevron-down');
                    if (window.lucide) lucide.createIcons();
                }
            });
        }

        // File Pickers & Quick Triggers
        const audioInput = document.getElementById('audioInput');
        const srtInput = document.getElementById('srtInput');
        const btnTriggerAudioInput = document.getElementById('btnTriggerAudioInput');
        const btnTriggerSrtInput = document.getElementById('btnTriggerSrtInput');
        const btnTriggerQuickPaste = document.getElementById('btnTriggerQuickPaste');
        const btnTriggerVADSlicer = document.getElementById('btnTriggerVADSlicer');
        const btnEmptyUploadAudio = document.getElementById('btnEmptyUploadAudio');
        const btnEmptyQuickPaste = document.getElementById('btnEmptyQuickPaste');
        const btnRunVADQuick = document.getElementById('btnRunVADQuick');
        const btnOpenVADTuning = document.getElementById('btnOpenVADTuning');
        const btnOpenPasteFromBanner = document.getElementById('btnOpenPasteFromBanner');
        const audioFileName = document.getElementById('audioFileName');
        const srtFileName = document.getElementById('srtFileName');
        const btnLoadSample = document.getElementById('btnLoadSample');
        const btnLoadSampleEmpty = document.getElementById('btnLoadSampleEmpty');
        const btnClearStorage = document.getElementById('btnClearStorage');

        if (btnTriggerAudioInput && audioInput) {
            btnTriggerAudioInput.addEventListener('click', () => audioInput.click());
        }
        if (btnEmptyUploadAudio && audioInput) {
            btnEmptyUploadAudio.addEventListener('click', () => audioInput.click());
        }

        if (btnTriggerSrtInput && srtInput) {
            btnTriggerSrtInput.addEventListener('click', () => srtInput.click());
        }

        if (btnTriggerQuickPaste) {
            btnTriggerQuickPaste.addEventListener('click', openQuickPasteModal);
        }
        if (btnEmptyQuickPaste) {
            btnEmptyQuickPaste.addEventListener('click', openQuickPasteModal);
        }
        if (btnOpenPasteFromBanner) {
            btnOpenPasteFromBanner.addEventListener('click', openQuickPasteModal);
        }

        if (btnTriggerVADSlicer) {
            btnTriggerVADSlicer.addEventListener('click', openVADTuningModal);
        }
        if (btnOpenVADTuning) {
            btnOpenVADTuning.addEventListener('click', openVADTuningModal);
        }
        if (btnRunVADQuick) {
            btnRunVADQuick.addEventListener('click', () => runVADAutoSlice());
        }

        if (audioInput) {
            audioInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                await loadAudioFromFile(file);
            });
        }

        if (srtInput) {
            srtInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const text = await file.text();
                if (srtFileName) {
                    srtFileName.textContent = file.name;
                    srtFileName.className = "text-[11px] text-accent-indigo font-bold truncate";
                }
                loadSubtitleData(text, true, file.name);
            });
        }

        if (btnClearStorage) {
            btnClearStorage.addEventListener('click', async () => {
                if (confirm("Bạn có muốn xoá dữ liệu đã lưu và làm mới bài học không?")) {
                    await Storage.clearAll();
                    window.location.reload();
                }
            });
        }

        const handleLoadSample = async () => {
            AudioEngine.initAudioContext();
            loadSubtitleData(DEMO_SRT_TEXT, true, "RevTest_Track 01_04.srt (Mẫu)");
            if (srtFileName) {
                srtFileName.textContent = "RevTest_Track 01_04.srt (Mẫu)";
                srtFileName.className = "text-[11px] text-accent-indigo font-bold truncate";
            }

            try {
                setAudioStatus('ĐANG TẢI BÀI MẪU...', 'bg-accent-amber animate-pulse');
                const res = await fetch('RevTest_Track 01_04.mp3');
                if (!res.ok) throw new Error("Fetch failed");
                const blob = await res.blob();
                const arrayBuffer = await blob.arrayBuffer();
                state.audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer.slice(0));

                if (Storage) {
                    Storage.saveAudio(arrayBuffer, 'RevTest_Track 01_04.mp3');
                }

                if (audioFileName) {
                    audioFileName.textContent = "RevTest_Track 01_04.mp3 (Mẫu)";
                    audioFileName.className = "text-[11px] text-accent-amber font-bold truncate";
                }
                setAudioStatus('ÂM THANH SẴN SÀNG', 'bg-accent-emerald');
                AudioEngine.playSynthesizedSound('tape-load');
                updatePlaybackDisplay();
                Shadowing.redrawWaveforms();
            } catch (err) {
                setAudioStatus('HÃY CHỌN FILE AUDIO', 'bg-accent-amber');
                if (audioFileName) {
                    audioFileName.textContent = "RevTest_Track 01_04.mp3 (Bấm chọn file)";
                    audioFileName.className = "text-[11px] text-accent-amber font-bold truncate";
                }
            }
        };

        if (btnLoadSample) btnLoadSample.addEventListener('click', handleLoadSample);
        if (btnLoadSampleEmpty) btnLoadSampleEmpty.addEventListener('click', handleLoadSample);

        // =================================================================
        // PHASE 2 (LYRE STUDIO): CURATED LESSONS & TTS GENERATOR CONTROLLERS
        // =================================================================
        const CuratedLessons = root.App.CuratedLessons;
        const TTSGenerator = root.App.TTSGenerator;

        const curatedLessonsModal = document.getElementById('curatedLessonsModal');
        const btnOpenCuratedLessons = document.getElementById('btnOpenCuratedLessons');
        const btnEmptyCuratedLessons = document.getElementById('btnEmptyCuratedLessons');
        const btnCloseCuratedLessons = document.getElementById('btnCloseCuratedLessons');
        const btnCloseCuratedLessonsBtn = document.getElementById('btnCloseCuratedLessonsBtn');
        const curatedLessonsGrid = document.getElementById('curatedLessonsGrid');

        const ttsGeneratorModal = document.getElementById('ttsGeneratorModal');
        const btnOpenTTSGenerator = document.getElementById('btnOpenTTSGenerator');
        const btnEmptyTTSGenerator = document.getElementById('btnEmptyTTSGenerator');
        const btnCloseTTSModal = document.getElementById('btnCloseTTSModal');
        const btnCloseTTSModalBtn = document.getElementById('btnCloseTTSModalBtn');
        const btnGenerateTTSLesson = document.getElementById('btnGenerateTTSLesson');
        const ttsTextInput = document.getElementById('ttsTextInput');
        const ttsLessonTitle = document.getElementById('ttsLessonTitle');
        const ttsWpmSelect = document.getElementById('ttsWpmSelect');
        const ttsVoiceSelect = document.getElementById('ttsVoiceSelect');
        const ttsCharWordCount = document.getElementById('ttsCharWordCount');

        openCuratedModal = () => {
            if (curatedLessonsModal) {
                renderCuratedLessons();
                curatedLessonsModal.classList.remove('opacity-0', 'pointer-events-none');
                AudioEngine.playSynthesizedSound('click');
            }
        };

        closeCuratedModal = () => {
            if (curatedLessonsModal) curatedLessonsModal.classList.add('opacity-0', 'pointer-events-none');
        };

        if (btnOpenCuratedLessons) btnOpenCuratedLessons.addEventListener('click', openCuratedModal);
        if (btnEmptyCuratedLessons) btnEmptyCuratedLessons.addEventListener('click', openCuratedModal);
        if (btnCloseCuratedLessons) btnCloseCuratedLessons.addEventListener('click', closeCuratedModal);
        if (btnCloseCuratedLessonsBtn) btnCloseCuratedLessonsBtn.addEventListener('click', closeCuratedModal);
        if (curatedLessonsModal) {
            curatedLessonsModal.addEventListener('click', (e) => {
                if (e.target === curatedLessonsModal) closeCuratedModal();
            });
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !curatedLessonsModal.classList.contains('pointer-events-none')) {
                    closeCuratedModal();
                }
            });
        }

        const openTTSModal = () => {
            if (ttsGeneratorModal) {
                ttsGeneratorModal.classList.remove('opacity-0', 'pointer-events-none');
                if (ttsTextInput) setTimeout(() => ttsTextInput.focus(), 80);
                AudioEngine.playSynthesizedSound('click');
            }
        };

        const closeTTSModal = () => {
            if (ttsGeneratorModal) ttsGeneratorModal.classList.add('opacity-0', 'pointer-events-none');
        };

        if (btnOpenTTSGenerator) btnOpenTTSGenerator.addEventListener('click', openTTSModal);
        if (btnEmptyTTSGenerator) btnEmptyTTSGenerator.addEventListener('click', openTTSModal);
        if (btnCloseTTSModal) btnCloseTTSModal.addEventListener('click', closeTTSModal);
        if (btnCloseTTSModalBtn) btnCloseTTSModalBtn.addEventListener('click', closeTTSModal);
        if (ttsGeneratorModal) {
            ttsGeneratorModal.addEventListener('click', (e) => {
                if (e.target === ttsGeneratorModal) closeTTSModal();
            });
        }

        // Real-time character and word count in TTS modal
        if (ttsTextInput && ttsCharWordCount) {
            ttsTextInput.addEventListener('input', () => {
                const val = ttsTextInput.value.trim();
                const words = val.length > 0 ? val.split(/\s+/).length : 0;
                ttsCharWordCount.textContent = `${words} từ · ${val.length} ký tự`;
            });
        }

        renderCuratedLessons = function() {
            if (!curatedLessonsGrid || !CuratedLessons) return;
            const lessons = CuratedLessons.getAllLessons();

            const levelBadges = {
                'A2': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                'B1': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                'B2': 'text-sky-400 bg-sky-500/10 border-sky-500/30',
                'C1': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
                'IELTS': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
                'Pronunciation': 'text-purple-400 bg-purple-500/10 border-purple-500/30'
            };

            const bounties = {
                'lesson-a2-hotel': '$50',
                'lesson-b1-interview': '$80',
                'lesson-b2-ai': '$120',
                'lesson-c1-oceans': '$160',
                'lesson-ielts-library': '$220',
                'lesson-phonics-flapt': '$300'
            };

            curatedLessonsGrid.innerHTML = lessons.map((lesson, idx) => {
                const badgeClass = levelBadges[lesson.level] || 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                const bounty = bounties[lesson.id] || '$100';

                return `
                    <div class="pixel-docket-card p-3 border-2 border-gray-700 hover:border-amber-400 bg-black/60 hover:bg-black/85 transition flex flex-col justify-between group cursor-pointer" data-load-lesson-id="${lesson.id}">
                        <div>
                            <div class="flex items-center justify-between text-[8px] font-mono mb-1.5">
                                <span class="text-amber-400 font-bold">CA TRỰC #${(idx + 1).toString().padStart(2, '0')}</span>
                                <span class="px-1.5 py-0.5 rounded text-[8px] font-bold border ${badgeClass}">
                                    ${lesson.level}
                                </span>
                            </div>
                            <h4 class="font-bold text-white text-[11px] group-hover:text-amber-300 font-mono tracking-tight leading-snug mb-1">
                                ${lesson.title}
                            </h4>
                            <p class="text-[9px] text-gray-400 font-mono leading-relaxed line-clamp-2">${lesson.description}</p>
                        </div>
                        <div class="pt-2 mt-2 border-t border-gray-700/60 flex items-center justify-between text-[9px] font-mono">
                            <span class="text-emerald-400 font-bold">${bounty} · ${lesson.sentences.length} câu</span>
                            <button type="button" data-load-lesson-id="${lesson.id}"
                                class="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/60 text-amber-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer">
                                <span>TIẾP NHẬN CA</span>
                                <span class="group-hover:translate-x-0.5 transition-transform">→</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();

            // Attach click listener on lesson buttons
            curatedLessonsGrid.querySelectorAll('[data-load-lesson-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = e.currentTarget.getAttribute('data-load-lesson-id');
                    loadCuratedLesson(id);
                });
            });
        }

        loadCuratedLesson = function(lessonId) {
            if (!CuratedLessons) return;
            const lesson = CuratedLessons.getLessonById(lessonId);
            if (!lesson) return;

            AudioEngine.initAudioContext();
            const totalDuration = lesson.sentences[lesson.sentences.length - 1].end + 0.5;

            // Generate synthetic speech waveform buffer
            let buffer = null;
            if (TTSGenerator && state.audioContext) {
                buffer = TTSGenerator.generateSyntheticAudioBuffer(state.audioContext, totalDuration, lesson.sentences);
            }

            state.audioBuffer = buffer;
            state.subs = lesson.sentences.slice();
            state.currentLessonTitle = lesson.title;
            state.isTTSLesson = true;
            state.ttsVoiceLang = lesson.accent.includes('British') ? 'en-GB' : 'en-US';
            state.currentIdx = 0;
            state.pausedAt = 0;
            state.completedSentences = new Set();
            state.mistakeSentences = new Map();

            // Update Header & Workspace
            if (audioFileName) {
                audioFileName.textContent = lesson.title;
                audioFileName.className = "text-[11px] text-accent-amber font-bold truncate";
            }
            if (srtFileName) {
                srtFileName.textContent = `${lesson.level} (${lesson.sentences.length} câu)`;
                srtFileName.className = "text-[11px] text-accent-amber font-bold truncate";
            }

            const titleScreen = document.getElementById('gameTitleScreen');
            if (titleScreen) titleScreen.classList.add('hidden');
            const emptyStateCard = document.getElementById('emptyStateCard');
            const vadPromptBanner = document.getElementById('vadPromptBanner');
            const workspaceArea = document.getElementById('workspaceArea');
            if (emptyStateCard) emptyStateCard.classList.add('hidden');
            if (vadPromptBanner) vadPromptBanner.classList.add('hidden');
            if (workspaceArea) workspaceArea.classList.remove('hidden');
            checkReadyState();

            closeCuratedModal();
            Dictation.loadCurrentSegment();
            renderDrawerList();
            updateSmartActionDock('idle');
            AudioEngine.playSynthesizedSound('stamp');
            if (root.App && root.App.PixelGameLoop && root.App.PixelGameLoop.dialogue) {
                root.App.PixelGameLoop.dialogue.say('Inspector Byte', `Ca trực: ${lesson.title}. Bấm Space để nghe lời khai.`, 'neutral');
            }
        }

        // Wire media ingestion triggers inside curatedLessonsModal
        const btnModalAudio = document.getElementById('btnModalTriggerAudio');
        const btnModalSrt = document.getElementById('btnModalTriggerSrt');
        const btnModalTTS = document.getElementById('btnModalTriggerTTS');

        if (btnModalAudio) {
            btnModalAudio.addEventListener('click', () => {
                closeCuratedModal();
                const titleScreen = document.getElementById('gameTitleScreen');
                if (titleScreen) titleScreen.classList.add('hidden');
                const audioInput = document.getElementById('audioInput');
                if (audioInput) audioInput.click();
            });
        }
        if (btnModalSrt) {
            btnModalSrt.addEventListener('click', () => {
                closeCuratedModal();
                const srtInput = document.getElementById('srtInput');
                if (srtInput) srtInput.click();
            });
        }
        if (btnModalTTS) {
            btnModalTTS.addEventListener('click', () => {
                closeCuratedModal();
                openTTSModal();
            });
        }

        // Generate custom lesson from pasted text via Web Speech TTS
        if (btnGenerateTTSLesson) {
            btnGenerateTTSLesson.addEventListener('click', () => {
                if (!TTSGenerator) return;

                const rawText = ttsTextInput ? ttsTextInput.value.trim() : '';
                if (!rawText) {
                    alert('Vui lòng dán ít nhất một đoạn văn bản tiếng Anh vào ô nhập liệu!');
                    return;
                }

                const title = ttsLessonTitle && ttsLessonTitle.value.trim()
                    ? ttsLessonTitle.value.trim()
                    : 'Bài Học Tự Tạo';
                const wpm = ttsWpmSelect ? parseInt(ttsWpmSelect.value, 10) : 140;
                const voiceLang = ttsVoiceSelect ? ttsVoiceSelect.value : 'en-US';

                const result = TTSGenerator.createLessonFromText(rawText, { title, wpm });
                if (result.error) {
                    alert(result.error);
                    return;
                }

                AudioEngine.initAudioContext();
                let buffer = null;
                if (state.audioContext && result.totalDuration > 0) {
                    buffer = TTSGenerator.generateSyntheticAudioBuffer(state.audioContext, result.totalDuration, result.subs);
                }

                state.audioBuffer = buffer;
                state.subs = result.subs;
                state.currentLessonTitle = result.title;
                state.isTTSLesson = true;
                state.ttsVoiceLang = voiceLang;
                state.currentIdx = 0;
                state.pausedAt = 0;
                state.completedSentences = new Set();
                state.mistakeSentences = new Map();

                if (audioFileName) {
                    audioFileName.textContent = result.title;
                    audioFileName.className = "text-[11px] text-accent-sage font-bold truncate";
                }
                if (srtFileName) {
                    srtFileName.textContent = `TTS (${result.subs.length} câu)`;
                    srtFileName.className = "text-[11px] text-accent-sage font-bold truncate";
                }

                const emptyStateCard = document.getElementById('emptyStateCard');
                const vadPromptBanner = document.getElementById('vadPromptBanner');
                if (emptyStateCard) emptyStateCard.classList.add('hidden');
                if (vadPromptBanner) vadPromptBanner.classList.add('hidden');
                checkReadyState();

                closeTTSModal();
                Dictation.loadCurrentSegment();
                renderDrawerList();
                updateSmartActionDock('idle');
                AudioEngine.playSynthesizedSound('success');
            });
        }

        // Main Transport Controls
        const btnPlay = document.getElementById('btnPlay');
        const btnReplay = document.getElementById('btnReplay');
        const btnRewind2s = document.getElementById('btnRewind2s');
        const btnForward2s = document.getElementById('btnForward2s');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const btnAutoLoop = document.getElementById('btnAutoLoop');
        const autoLoopText = document.getElementById('autoLoopText');

        if (btnPlay) btnPlay.addEventListener('click', () => AudioEngine.togglePlay());
        if (btnReplay) btnReplay.addEventListener('click', () => AudioEngine.replay());
        if (btnRewind2s) btnRewind2s.addEventListener('click', () => AudioEngine.rewind(2.0));
        if (btnForward2s) btnForward2s.addEventListener('click', () => AudioEngine.forward(2.0));

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (state.currentIdx - state.groupSize >= 0) {
                    state.currentIdx -= state.groupSize;
                } else {
                    state.currentIdx = 0;
                }
                onSentenceChanged();
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (state.currentIdx + state.groupSize < state.subs.length) {
                    state.currentIdx += state.groupSize;
                    onSentenceChanged();
                }
            });
        }

        if (btnAutoLoop) {
            btnAutoLoop.addEventListener('click', () => {
                state.autoLoop = !state.autoLoop;
                if (state.autoLoop) {
                    btnAutoLoop.className = "tactile-btn py-2.5 px-3 bg-accent-amber/20 hover:bg-amber-500/30 text-accent-amber rounded-lg border border-accent-amber/50 flex flex-col items-center justify-center";
                    if (autoLoopText) autoLoopText.textContent = "LẶP: BẬT";
                } else {
                    btnAutoLoop.className = "tactile-btn py-2.5 px-3 bg-studio-850 hover:bg-studio-800 text-gray-400 rounded-lg border border-studio-border flex flex-col items-center justify-center";
                    if (autoLoopText) autoLoopText.textContent = "LẶP: TẮT";
                }
            });
        }

        // Mobile Thumb Bar Buttons
        const btnMobilePlay = document.getElementById('btnMobilePlay');
        const btnMobileRewind2s = document.getElementById('btnMobileRewind2s');
        const btnMobileForward2s = document.getElementById('btnMobileForward2s');
        const btnMobilePrev = document.getElementById('btnMobilePrev');
        const btnMobileNext = document.getElementById('btnMobileNext');

        if (btnMobilePlay) btnMobilePlay.addEventListener('click', () => AudioEngine.togglePlay());
        if (btnMobileRewind2s) btnMobileRewind2s.addEventListener('click', () => AudioEngine.rewind(2.0));
        if (btnMobileForward2s) btnMobileForward2s.addEventListener('click', () => AudioEngine.forward(2.0));
        if (btnMobilePrev && btnPrev) btnMobilePrev.addEventListener('click', () => btnPrev.click());
        if (btnMobileNext && btnNext) btnMobileNext.addEventListener('click', () => btnNext.click());

        // Auto-Pause on Type Toggle
        const btnToggleAutoPause = document.getElementById('btnToggleAutoPause');
        const autoPauseLabel = document.getElementById('autoPauseLabel');
        const autoPauseIcon = document.getElementById('autoPauseIcon');
        const mobileAutoPauseDesc = document.getElementById('mobileAutoPauseDesc');

        function updateAutoPauseUI() {
            if (autoPauseLabel) autoPauseLabel.textContent = state.autoPauseOnType ? "Tự ngắt: Bật" : "Tự ngắt: Tắt";
            if (autoPauseIcon) {
                autoPauseIcon.className = state.autoPauseOnType ? "w-3.5 h-3.5 text-accent-amber" : "w-3.5 h-3.5 text-gray-400";
            }
            if (mobileAutoPauseDesc) mobileAutoPauseDesc.textContent = state.autoPauseOnType ? "Đang bật (Tự dừng khi bạn gõ)" : "Đang tắt";
        }

        if (btnToggleAutoPause) {
            btnToggleAutoPause.addEventListener('click', () => {
                state.autoPauseOnType = !state.autoPauseOnType;
                updateAutoPauseUI();
                AudioEngine.playSynthesizedSound('click');
            });
        }

        // Strictness Toggle
        const btnToggleStrictness = document.getElementById('btnToggleStrictness');
        const strictnessLabel = document.getElementById('strictnessLabel');
        const mobileStrictnessDesc = document.getElementById('mobileStrictnessDesc');

        function updateStrictnessUI() {
            const isStrict = state.gradingStrictness === 'strict';
            if (strictnessLabel) strictnessLabel.textContent = isStrict ? "Chuẩn IELTS" : "Linh hoạt";
            if (btnToggleStrictness) {
                btnToggleStrictness.className = isStrict
                    ? "tactile-btn text-xs text-accent-rose border-rose-500/30"
                    : "tactile-btn text-xs text-gray-300";
            }
            if (mobileStrictnessDesc) {
                mobileStrictnessDesc.textContent = isStrict
                    ? "Chuẩn IELTS (Bắt buộc hoa thường, dấu câu)"
                    : "Linh hoạt (Bỏ qua hoa thường, dấu câu)";
            }
        }

        if (btnToggleStrictness) {
            btnToggleStrictness.addEventListener('click', () => {
                state.gradingStrictness = state.gradingStrictness === 'strict' ? 'lenient' : 'strict';
                updateStrictnessUI();
                AudioEngine.playSynthesizedSound('click');
            });
        }

        // Unified Studio Mixer Drawer (Desktop & Mobile)
        const btnOpenStudioMixer = document.getElementById('btnOpenStudioMixer');
        const btnCloseStudioMixer = document.getElementById('btnCloseStudioMixer');
        const btnCloseStudioMixerBtn = document.getElementById('btnCloseStudioMixerBtn');
        const studioMixerDrawer = document.getElementById('studioMixerDrawer') || document.getElementById('mobileSettingsDrawer');
        const btnMobileSettings = document.getElementById('btnMobileSettings');
        const btnCloseMobileSettings = document.getElementById('btnCloseMobileSettings');
        const btnCloseMobileSettingsBtn = document.getElementById('btnCloseMobileSettingsBtn');
        const btnMobileToggleStrict = document.getElementById('btnMobileToggleStrict');
        const btnMobileToggleAutoPause = document.getElementById('btnMobileToggleAutoPause');
        const btnMobileOpenSrtEditor = document.getElementById('btnMobileOpenSrtEditor');
        const btnMobileOpenHotkeys = document.getElementById('btnMobileOpenHotkeys');
        const btnMobileClearStorage = document.getElementById('btnMobileClearStorage');

        const openStudioMixer = () => {
            if (studioMixerDrawer) studioMixerDrawer.classList.remove('opacity-0', 'pointer-events-none');
            AudioEngine.playSynthesizedSound('click');
        };

        const closeStudioMixer = () => {
            if (studioMixerDrawer) studioMixerDrawer.classList.add('opacity-0', 'pointer-events-none');
        };

        if (btnOpenStudioMixer) btnOpenStudioMixer.addEventListener('click', openStudioMixer);
        if (btnMobileSettings) btnMobileSettings.addEventListener('click', openStudioMixer);
        if (btnExpandRackDetails) btnExpandRackDetails.addEventListener('click', openStudioMixer);
        if (btnCloseStudioMixer) btnCloseStudioMixer.addEventListener('click', closeStudioMixer);
        if (btnCloseStudioMixerBtn) btnCloseStudioMixerBtn.addEventListener('click', closeStudioMixer);
        if (btnCloseMobileSettings) btnCloseMobileSettings.addEventListener('click', closeStudioMixer);
        if (btnCloseMobileSettingsBtn) btnCloseMobileSettingsBtn.addEventListener('click', closeStudioMixer);
        if (studioMixerDrawer) {
            studioMixerDrawer.addEventListener('click', (e) => {
                if (e.target === studioMixerDrawer) closeStudioMixer();
            });
        }

        if (btnMobileToggleStrict && btnToggleStrictness) {
            btnMobileToggleStrict.addEventListener('click', () => btnToggleStrictness.click());
        }
        if (btnMobileToggleAutoPause && btnToggleAutoPause) {
            btnMobileToggleAutoPause.addEventListener('click', () => btnToggleAutoPause.click());
        }

        const btnMobileOpenVocab = document.getElementById('btnMobileOpenVocab');
        if (btnMobileOpenVocab) {
            btnMobileOpenVocab.addEventListener('click', () => {
                closeStudioMixer();
                if (Dictionary && typeof Dictionary.openVocabDrawer === 'function') {
                    Dictionary.openVocabDrawer();
                }
            });
        }

        const btnMobileOpenAnalytics = document.getElementById('btnMobileOpenAnalytics');
        if (btnMobileOpenAnalytics) {
            btnMobileOpenAnalytics.addEventListener('click', () => {
                closeStudioMixer();
                const analyticsModal = document.getElementById('analyticsModal');
                if (analyticsModal) {
                    analyticsModal.classList.remove('opacity-0', 'pointer-events-none');
                    if (Analytics && typeof Analytics.renderDashboard === 'function') {
                        Analytics.renderDashboard();
                    }
                }
            });
        }

        if (btnMobileOpenSrtEditor) {
            btnMobileOpenSrtEditor.addEventListener('click', () => {
                closeStudioMixer();
                const srtModal = document.getElementById('srtEditorModal');
                if (srtModal) srtModal.classList.remove('opacity-0', 'pointer-events-none');
            });
        }

        if (btnMobileOpenHotkeys) {
            btnMobileOpenHotkeys.addEventListener('click', () => {
                closeStudioMixer();
                const hotModal = document.getElementById('hotkeysModal');
                if (hotModal) hotModal.classList.remove('opacity-0', 'pointer-events-none');
            });
        }

        if (btnMobileClearStorage && btnClearStorage) {
            btnMobileClearStorage.addEventListener('click', () => {
                closeStudioMixer();
                btnClearStorage.click();
            });
        }

        // Initialize Smart Action Dock
        initSmartActionDock();

        // Double-click word lookup on teleprompter and subtitle texts
        ['teleprompterText', 'currentSentenceText'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('dblclick', (e) => {
                    const sel = window.getSelection();
                    const rawWord = sel ? sel.toString().trim() : '';
                    const word = (Dictionary && typeof Dictionary.cleanWord === 'function')
                        ? Dictionary.cleanWord(rawWord)
                        : rawWord.replace(/^[^\w]+|[^\w]+$/g, '');
                    if (word && Dictionary && typeof Dictionary.showPopover === 'function') {
                        Dictionary.showPopover(word, {
                            clientX: e.clientX,
                            clientY: e.clientY
                        });
                    }
                });
            }
        });

        // Timeline Progress Bar Click / Seek
        const timelineTrack = document.getElementById('timelineTrack');
        if (timelineTrack) {
            timelineTrack.addEventListener('click', (e) => {
                const seg = AudioEngine.getCurrentSegment();
                if (!seg) return;
                const rect = timelineTrack.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                AudioEngine.seek(ratio * seg.duration);
            });
        }

        // DSP Controls
        const volumeBoost = document.getElementById('volumeBoost');
        const boostValueText = document.getElementById('boostValueText');
        const smartPadding = document.getElementById('smartPadding');
        const paddingValueText = document.getElementById('paddingValueText');
        const speedSelect = document.getElementById('speedSelect');
        const groupSelect = document.getElementById('groupSelect');

        if (volumeBoost) {
            volumeBoost.addEventListener('input', (e) => {
                state.volumeBoost = parseFloat(e.target.value);
                if (boostValueText) boostValueText.textContent = Math.round(state.volumeBoost * 100) + '%';
                if (state.gainNode && state.audioContext) {
                    state.gainNode.gain.setValueAtTime(state.volumeBoost, state.audioContext.currentTime);
                }
            });
        }

        if (smartPadding) {
            smartPadding.addEventListener('input', (e) => {
                state.smartPaddingMs = parseInt(e.target.value);
                if (paddingValueText) paddingValueText.textContent = `± ${state.smartPaddingMs} ms`;
                updatePlaybackDisplay();
                Shadowing.redrawWaveforms();
            });
        }

        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                state.playbackRate = parseFloat(e.target.value);
                if (state.sourceNode) {
                    state.sourceNode.playbackRate.value = state.playbackRate;
                }
            });
        }

        if (groupSelect) {
            groupSelect.addEventListener('change', (e) => {
                state.groupSize = parseInt(e.target.value);
                onSentenceChanged();
            });
        }

        const btnToggleSub = document.getElementById('btnToggleSub');
        if (btnToggleSub) {
            btnToggleSub.addEventListener('click', () => {
                Dictation.toggleSubReveal();
            });
        }

        // Phase 5: Studio Customization (Font Size & Sound Profiles)
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        const mobileFontSizeSelect = document.getElementById('mobileFontSizeSelect');
        const mobileFontSizeDesc = document.getElementById('mobileFontSizeDesc');

        function applyFontSize(sizePx) {
            const size = parseInt(sizePx, 10) || 24;
            state.fontSize = size;
            if (Dictation && typeof Dictation.setFontSize === 'function') {
                Dictation.setFontSize(size);
            }
            if (fontSizeSelect) fontSizeSelect.value = String(size);
            if (mobileFontSizeSelect) mobileFontSizeSelect.value = String(size);
            if (mobileFontSizeDesc) mobileFontSizeDesc.textContent = `${size}px`;
            try { localStorage.setItem('dictashadow_font_size', size); } catch (e) {}
        }

        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => applyFontSize(e.target.value));
        }
        if (mobileFontSizeSelect) {
            mobileFontSizeSelect.addEventListener('change', (e) => applyFontSize(e.target.value));
        }

        const soundProfileSelect = document.getElementById('soundProfileSelect');
        const mobileSoundProfileSelect = document.getElementById('mobileSoundProfileSelect');
        const mobileSoundProfileDesc = document.getElementById('mobileSoundProfileDesc');

        const profileLabels = {
            typewriter: 'Máy chữ cơ TP-7',
            cherry: 'Phím Cherry Blue',
            soft: 'Phím đệm Soft',
            mute: 'Tắt tiếng (Mute)'
        };

        function applySoundProfile(profile) {
            state.soundProfile = profile;
            if (soundProfileSelect) soundProfileSelect.value = profile;
            if (mobileSoundProfileSelect) mobileSoundProfileSelect.value = profile;
            if (mobileSoundProfileDesc) mobileSoundProfileDesc.textContent = profileLabels[profile] || profile;
            try { localStorage.setItem('dictashadow_sound_profile', profile); } catch (e) {}
            if (AudioEngine && AudioEngine.playSynthesizedSound) {
                AudioEngine.playSynthesizedSound('click');
            }
        }

        if (soundProfileSelect) {
            soundProfileSelect.addEventListener('change', (e) => applySoundProfile(e.target.value));
        }
        if (mobileSoundProfileSelect) {
            mobileSoundProfileSelect.addEventListener('change', (e) => applySoundProfile(e.target.value));
        }

        // Restore saved studio customizations
        try {
            const savedFont = localStorage.getItem('dictashadow_font_size');
            if (savedFont) applyFontSize(savedFont);
            const savedSound = localStorage.getItem('dictashadow_sound_profile');
            if (savedSound) applySoundProfile(savedSound);
        } catch (e) {}

        setupDrawerAndModals();
    }

    function onSentenceChanged() {
        if (Shadowing && Shadowing.cancelSequentialAB) {
            Shadowing.cancelSequentialAB();
        }
        state.pausedAt = 0;
        Dictation.loadCurrentSegment();
        updatePlaybackDisplay();
        Shadowing.redrawWaveforms();
        Shadowing.updateABButtonUI();

        if (Storage) {
            Storage.saveProgress(state.currentIdx, Array.from(state.completedSentences));
        }

        if (state.audioBuffer) AudioEngine.play(0);

        // Version 4.0: Retro Pixel Game Loop Hook
        if (root.App.PixelGameLoop && typeof root.App.PixelGameLoop.onSentenceChanged === 'function') {
            root.App.PixelGameLoop.onSentenceChanged(state.currentIdx);
        }
    }

    async function loadAudioFromFile(file) {
        AudioEngine.initAudioContext();
        const audioFileName = document.getElementById('audioFileName');
        if (audioFileName) {
            audioFileName.textContent = file.name;
            audioFileName.className = "text-[11px] text-accent-cyan font-bold truncate";
        }
        setAudioStatus('DECODING...', 'bg-accent-amber animate-pulse');

        try {
            const arrayBuffer = await file.arrayBuffer();
            state.audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer.slice(0));

            // Save to IndexedDB
            if (Storage) {
                Storage.saveAudio(arrayBuffer, file.name);
            }

            setAudioStatus('ÂM THANH SẴN SÀNG', 'bg-accent-emerald');
            AudioEngine.playSynthesizedSound('tape-load');
            updatePlaybackDisplay();
            Shadowing.redrawWaveforms();
            checkReadyState();
        } catch (err) {
            setAudioStatus('LỖI FILE AUDIO', 'bg-accent-rose');
            alert("Không thể đọc file âm thanh. Vui lòng chọn file MP3 hoặc WAV hợp lệ!");
        }
    }

    function loadSubtitleData(text, saveToDisk = true, fileName = 'subtitles.srt') {
        state.subs = SRTParser.parseSRT(text);
        state.currentIdx = 0;
        state.pausedAt = 0;
        state.completedSentences.clear();

        if (saveToDisk && Storage) {
            Storage.saveSRT(text, fileName);
            Storage.saveProgress(0, []);
        }

        Dictation.loadCurrentSegment();
        updatePlaybackDisplay();
        renderDrawerList();
        Shadowing.redrawWaveforms();
        checkReadyState();
    }

    function checkReadyState() {
        const titleScreen = document.getElementById('gameTitleScreen');
        const emptyStateCard = document.getElementById('emptyStateCard');
        const workspaceArea = document.getElementById('workspaceArea');
        const vadPromptBanner = document.getElementById('vadPromptBanner');
        const btnTriggerVADSlicer = document.getElementById('btnTriggerVADSlicer');

        // If Title Screen is actively visible, preserve it and keep workspace hidden
        if (titleScreen && !titleScreen.classList.contains('hidden')) {
            if (workspaceArea) workspaceArea.classList.add('hidden');
            if (emptyStateCard) emptyStateCard.classList.add('hidden');
            return;
        }

        if (state.subs.length > 0 && state.audioBuffer) {
            if (emptyStateCard) emptyStateCard.classList.add('hidden');
            if (vadPromptBanner) vadPromptBanner.classList.add('hidden');
            if (workspaceArea) workspaceArea.classList.remove('hidden');
            if (btnTriggerVADSlicer) btnTriggerVADSlicer.classList.remove('hidden');
        } else if (state.audioBuffer && state.subs.length === 0) {
            // Audio is ready, but user hasn't supplied SRT yet: Show VAD Banner!
            if (emptyStateCard) emptyStateCard.classList.add('hidden');
            if (vadPromptBanner) vadPromptBanner.classList.remove('hidden');
            if (workspaceArea) workspaceArea.classList.add('hidden');
            if (btnTriggerVADSlicer) btnTriggerVADSlicer.classList.remove('hidden');
        } else {
            if (emptyStateCard) emptyStateCard.classList.remove('hidden');
            if (vadPromptBanner) vadPromptBanner.classList.add('hidden');
            if (workspaceArea) workspaceArea.classList.add('hidden');
            if (btnTriggerVADSlicer) btnTriggerVADSlicer.classList.add('hidden');
        }
    }

    function setAudioStatus(text, ledClass) {
        const audioStatusText = document.getElementById('audioStatusText');
        const audioStatusLed = document.getElementById('audioStatusLed');
        if (audioStatusText) audioStatusText.textContent = text;
        if (audioStatusLed) audioStatusLed.className = `w-2.5 h-2.5 rounded-full ${ledClass} shadow-sm transition`;
    }

    function updatePlaybackDisplay() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg) return;

        const segmentTimeRange = document.getElementById('segmentTimeRange');
        const segmentDuration = document.getElementById('segmentDuration');
        const currentTimeDisplay = document.getElementById('currentTimeDisplay');
        const headerProgressBadge = document.getElementById('headerProgressBadge');
        const headerSentenceCounter = document.getElementById('headerSentenceCounter');

        if (segmentTimeRange) segmentTimeRange.textContent = `${SRTParser.formatTime(seg.rawStart)} - ${SRTParser.formatTime(seg.rawEnd)}`;
        if (segmentDuration) segmentDuration.textContent = `${seg.duration.toFixed(1)}s`;
        if (currentTimeDisplay) currentTimeDisplay.textContent = SRTParser.formatTime(seg.start + state.pausedAt);
        if (headerProgressBadge) headerProgressBadge.textContent = `(${state.completedSentences.size}/${state.subs.length})`;
        if (headerSentenceCounter) headerSentenceCounter.textContent = `CÂU ${seg.startIdx + 1} / ${state.subs.length}`;

        AudioEngine.updateTimeDisplay(seg.start + state.pausedAt, seg);
    }

    function setupDrawerAndModals() {
        const btnOpenDrawer = document.getElementById('btnOpenDrawer');
        const btnCloseDrawer = document.getElementById('btnCloseDrawer');
        const sentenceDrawer = document.getElementById('sentenceDrawer');
        const drawerPanel = document.getElementById('drawerPanel');

        const btnOpenHotkeysModal = document.getElementById('btnOpenHotkeysModal');
        const btnCloseHotkeysModal = document.getElementById('btnCloseHotkeysModal');
        const btnCloseHotkeysModalBtn = document.getElementById('btnCloseHotkeysModalBtn');
        const hotkeysModal = document.getElementById('hotkeysModal');

        if (btnOpenDrawer && sentenceDrawer && drawerPanel) {
            btnOpenDrawer.addEventListener('click', () => {
                renderDrawerList();
                sentenceDrawer.classList.remove('opacity-0', 'pointer-events-none');
                drawerPanel.classList.remove('translate-x-full');
            });

            const closeDrawer = () => {
                sentenceDrawer.classList.add('opacity-0', 'pointer-events-none');
                drawerPanel.classList.add('translate-x-full');
            };

            if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
            sentenceDrawer.addEventListener('click', (e) => {
                if (e.target === sentenceDrawer) closeDrawer();
            });

            const drawerSentenceList = document.getElementById('drawerSentenceList');
            if (drawerSentenceList) {
                drawerSentenceList.addEventListener('click', (e) => {
                    const item = e.target.closest('[data-sentence-idx]');
                    if (item) {
                        const idx = parseInt(item.getAttribute('data-sentence-idx'), 10);
                        if (!isNaN(idx)) root.App.jumpToSentence(idx);
                    }
                });

                // Virtualization Lazy Scroll: Khi cuộn gần tới đáy, tải thêm 50 câu kế tiếp
                drawerSentenceList.addEventListener('scroll', () => {
                    if (drawerSentenceList.scrollTop + drawerSentenceList.clientHeight >= drawerSentenceList.scrollHeight - 250) {
                        appendDrawerBatch();
                    }
                }, { passive: true });
            }

            // Quick search & Jump to current sentence for large files (>500 sentences)
            const drawerSearchInput = document.getElementById('drawerSearchInput');
            if (drawerSearchInput) {
                let searchDebounce = null;
                drawerSearchInput.addEventListener('input', (e) => {
                    clearTimeout(searchDebounce);
                    searchDebounce = setTimeout(() => {
                        drawerSearchQuery = e.target.value;
                        renderDrawerList(false);
                    }, 120);
                });
            }

            const btnScrollToCurrent = document.getElementById('btnScrollToCurrentSentence');
            if (btnScrollToCurrent) {
                btnScrollToCurrent.addEventListener('click', () => {
                    if (drawerSearchInput && drawerSearchQuery) {
                        drawerSearchInput.value = '';
                        drawerSearchQuery = '';
                        renderDrawerList(true);
                    } else {
                        scrollToActiveSentenceInDrawer();
                    }
                });
            }
        }

        if (btnOpenHotkeysModal && hotkeysModal) {
            btnOpenHotkeysModal.addEventListener('click', () => {
                hotkeysModal.classList.remove('opacity-0', 'pointer-events-none');
            });

            const closeModal = () => {
                hotkeysModal.classList.add('opacity-0', 'pointer-events-none');
            };

            if (btnCloseHotkeysModal) btnCloseHotkeysModal.addEventListener('click', closeModal);
            if (btnCloseHotkeysModalBtn) btnCloseHotkeysModalBtn.addEventListener('click', closeModal);
            hotkeysModal.addEventListener('click', (e) => {
                if (e.target === hotkeysModal) closeModal();
            });
        }
    }

    // =========================================================================
    // QUICK PASTE TRANSCRIPT LOGIC
    // =========================================================================
    function openQuickPasteModal() {
        const modal = document.getElementById('quickPasteModal');
        const textarea = document.getElementById('quickPasteTextarea');
        if (modal) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            if (textarea) {
                textarea.focus();
                updateQuickPasteStats();
            }
        }
    }

    function closeQuickPasteModal() {
        const modal = document.getElementById('quickPasteModal');
        if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
    }

    function updateQuickPasteStats() {
        const textarea = document.getElementById('quickPasteTextarea');
        const stats = document.getElementById('quickPasteStatsText');
        if (!textarea || !stats) return;

        const val = textarea.value.trim();
        if (!val) {
            stats.textContent = "Chưa nhập nội dung";
            stats.className = "text-gray-500";
            return;
        }

        const parsed = VADSlicer ? VADSlicer.parsePastedTranscript(val) : { isSRT: false, data: [] };
        if (parsed.isSRT) {
            stats.textContent = `Định dạng SRT chuẩn: ${parsed.data.length} câu`;
            stats.className = "text-accent-emerald font-bold";
        } else {
            stats.textContent = `Văn bản thuần: ${parsed.data.length} câu (Tự tách theo dấu câu)`;
            stats.className = "text-accent-indigo font-bold";
        }
    }

    function initQuickPaste() {
        const btnClose1 = document.getElementById('btnCloseQuickPasteModal');
        const btnClose2 = document.getElementById('btnCloseQuickPasteBtn');
        const btnApply = document.getElementById('btnApplyQuickPaste');
        const modal = document.getElementById('quickPasteModal');
        const textarea = document.getElementById('quickPasteTextarea');

        if (btnClose1) btnClose1.addEventListener('click', closeQuickPasteModal);
        if (btnClose2) btnClose2.addEventListener('click', closeQuickPasteModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeQuickPasteModal();
            });
        }

        if (textarea) {
            textarea.addEventListener('input', updateQuickPasteStats);
        }

        if (btnApply) {
            btnApply.addEventListener('click', () => {
                const text = textarea ? textarea.value.trim() : '';
                if (!text) {
                    alert("Vui lòng dán văn bản hoặc phụ đề trước khi nạp!");
                    return;
                }

                if (!VADSlicer) return;
                const parsed = VADSlicer.parsePastedTranscript(text);

                if (parsed.isSRT) {
                    loadSubtitleData(text, true, 'pasted_transcript.srt');
                    const srtFileName = document.getElementById('srtFileName');
                    if (srtFileName) {
                        srtFileName.textContent = `pasted_transcript.srt (${parsed.data.length} câu)`;
                        srtFileName.className = "text-[11px] text-accent-indigo font-bold truncate";
                    }
                    closeQuickPasteModal();
                    AudioEngine.playSynthesizedSound('success');
                } else {
                    const sentences = parsed.data;
                    if (!sentences.length) {
                        alert("Không nhận diện được câu nào từ đoạn văn bản đã dán!");
                        return;
                    }

                    if (state.audioBuffer) {
                        // We have audio! Slice and align!
                        const rawSegments = VADSlicer.sliceAudio(state.audioBuffer);
                        const aligned = VADSlicer.alignSentencesToSegments(rawSegments, sentences);
                        const srtText = aligned.map((seg, i) => {
                            return `${i + 1}\n${SRTParser.formatTime(seg.start).replace('.', ',')}0 --> ${SRTParser.formatTime(seg.end).replace('.', ',')}0\n${seg.text}\n`;
                        }).join('\n');

                        loadSubtitleData(srtText, true, 'aligned_transcript.srt');
                        const srtFileName = document.getElementById('srtFileName');
                        if (srtFileName) {
                            srtFileName.textContent = `aligned_transcript.srt (${aligned.length} câu)`;
                            srtFileName.className = "text-[11px] text-accent-indigo font-bold truncate";
                        }
                    } else {
                        // No audio loaded yet, generate estimated timestamps (3.5s per sentence)
                        let t = 0;
                        const srtText = sentences.map((sent, i) => {
                            const start = t;
                            const end = t + 3.5;
                            t += 4.0;
                            return `${i + 1}\n${SRTParser.formatTime(start).replace('.', ',')}0 --> ${SRTParser.formatTime(end).replace('.', ',')}0\n${sent}\n`;
                        }).join('\n');

                        loadSubtitleData(srtText, true, 'text_transcript.srt');
                        const srtFileName = document.getElementById('srtFileName');
                        if (srtFileName) {
                            srtFileName.textContent = `text_transcript.srt (${sentences.length} câu)`;
                            srtFileName.className = "text-[11px] text-accent-indigo font-bold truncate";
                        }
                    }

                    closeQuickPasteModal();
                    AudioEngine.playSynthesizedSound('success');
                }
            });
        }
    }

    // =========================================================================
    // VAD AUTO-SLICING LOGIC
    // =========================================================================
    function openVADTuningModal() {
        if (!state.audioBuffer) {
            alert("Vui lòng tải file âm thanh MP3/WAV trước khi mở bảng tách câu VAD!");
            return;
        }

        const modal = document.getElementById('vadTuningModal');
        if (modal) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            previewVADCount();
        }
    }

    function closeVADTuningModal() {
        const modal = document.getElementById('vadTuningModal');
        if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
    }

    function getVADOptionsFromUI() {
        const minSilenceSlider = document.getElementById('vadMinSilenceSlider');
        const thresholdSlider = document.getElementById('vadThresholdSlider');

        const minSilenceMs = minSilenceSlider ? parseFloat(minSilenceSlider.value) : 450;
        const threshold = thresholdSlider ? parseFloat(thresholdSlider.value) : 0.020;

        return {
            minSilenceSec: minSilenceMs / 1000,
            silenceThresholdRMS: threshold,
            minSpeechSec: 0.8,
            paddingSec: 0.15
        };
    }

    function previewVADCount() {
        if (!state.audioBuffer || !VADSlicer) return;
        const options = getVADOptionsFromUI();
        const segments = VADSlicer.sliceAudio(state.audioBuffer, options);
        const badge = document.getElementById('vadDetectionResultBadge');
        if (badge) {
            badge.textContent = `${segments.length} câu (Thời lượng: ${(state.audioBuffer.duration / 60).toFixed(1)} phút)`;
        }
    }

    async function runVADAutoSlice(customOptions = null) {
        if (!state.audioBuffer) {
            alert("Vui lòng nạp file âm thanh MP3/WAV trước khi tách câu!");
            return;
        }
        if (!VADSlicer) return;

        const options = customOptions || getVADOptionsFromUI();
        setAudioStatus('ĐANG TỰ ĐỘNG TÁCH CÂU...', 'bg-accent-amber animate-pulse');

        await new Promise(r => setTimeout(r, 50));

        const segments = VADSlicer.sliceAudio(state.audioBuffer, options);

        if (!segments || segments.length === 0) {
            alert("Không tìm thấy khoảng lặng rõ ràng. Hãy thử điều chỉnh thanh trượt độ nhạy!");
            setAudioStatus('ÂM THANH SẴN SÀNG', 'bg-accent-emerald');
            return;
        }

        const srtText = segments.map((seg, i) => {
            return `${i + 1}\n${SRTParser.formatTime(seg.start).replace('.', ',')}0 --> ${SRTParser.formatTime(seg.end).replace('.', ',')}0\n${seg.text}\n`;
        }).join('\n');

        const srtFileName = document.getElementById('srtFileName');
        if (srtFileName) {
            srtFileName.textContent = `Auto_VAD_${segments.length}_câu.srt`;
            srtFileName.className = "text-[11px] text-accent-amber font-bold truncate";
        }

        loadSubtitleData(srtText, true, `Auto_VAD_${segments.length}_câu.srt`);
        setAudioStatus(`ĐÃ TÁCH ${segments.length} CÂU`, 'bg-accent-emerald');
        AudioEngine.playSynthesizedSound('success');
    }

    function initVADSlicing() {
        const minSilenceSlider = document.getElementById('vadMinSilenceSlider');
        const vadMinSilenceVal = document.getElementById('vadMinSilenceVal');
        const thresholdSlider = document.getElementById('vadThresholdSlider');
        const vadThresholdVal = document.getElementById('vadThresholdVal');
        const btnClose = document.getElementById('btnCloseVADTuningModal');
        const btnCancel = document.getElementById('btnCancelVAD');
        const btnConfirm = document.getElementById('btnConfirmVAD');
        const btnPreview = document.getElementById('btnPreviewVAD');
        const modal = document.getElementById('vadTuningModal');

        if (minSilenceSlider && vadMinSilenceVal) {
            minSilenceSlider.addEventListener('input', (e) => {
                vadMinSilenceVal.textContent = `${e.target.value} ms`;
                previewVADCount();
            });
        }

        if (thresholdSlider && vadThresholdVal) {
            thresholdSlider.addEventListener('input', (e) => {
                vadThresholdVal.textContent = parseFloat(e.target.value).toFixed(3);
                previewVADCount();
            });
        }

        if (btnClose) btnClose.addEventListener('click', closeVADTuningModal);
        if (btnCancel) btnCancel.addEventListener('click', closeVADTuningModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeVADTuningModal();
            });
        }

        if (btnPreview) btnPreview.addEventListener('click', previewVADCount);

        if (btnConfirm) {
            btnConfirm.addEventListener('click', async () => {
                closeVADTuningModal();
                await runVADAutoSlice();
            });
        }
    }

    // =========================================================================
    // DRAG AND DROP ON WINDOW
    // =========================================================================
    function initDragAndDrop() {
        const overlay = document.getElementById('dragDropOverlay');
        let dragCounter = 0;

        window.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if (overlay) overlay.classList.remove('opacity-0', 'pointer-events-none');
        });

        window.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');
            }
        });

        window.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        window.addEventListener('drop', async (e) => {
            e.preventDefault();
            dragCounter = 0;
            if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');

            const files = e.dataTransfer.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const ext = file.name.split('.').pop().toLowerCase();

                if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) {
                    await loadAudioFromFile(file);
                } else if (['srt', 'vtt'].includes(ext)) {
                    const text = await file.text();
                    const srtFileName = document.getElementById('srtFileName');
                    if (srtFileName) {
                        srtFileName.textContent = file.name;
                        srtFileName.className = "text-[11px] text-accent-indigo font-bold truncate";
                    }
                    loadSubtitleData(text, true, file.name);
                } else if (['txt'].includes(ext)) {
                    const text = await file.text();
                    const quickPasteTextarea = document.getElementById('quickPasteTextarea');
                    if (quickPasteTextarea) quickPasteTextarea.value = text;
                    openQuickPasteModal();
                }
            }
        });
    }

    let drawerRenderedCount = 0;
    const DRAWER_BATCH_SIZE = 50;
    let drawerSearchQuery = '';
    let drawerFilteredIndices = null;

    function getFilteredSentenceIndices() {
        const isMistakesFilter = state.studyFilter === 'mistakes';
        if (!drawerSearchQuery && !isMistakesFilter) return null;

        const q = (drawerSearchQuery || '').toLowerCase().trim();
        const indices = [];
        for (let i = 0; i < state.subs.length; i++) {
            if (isMistakesFilter && (!state.mistakeSentences || !state.mistakeSentences.has(i))) {
                continue;
            }
            if (!q || state.subs[i].text.toLowerCase().includes(q) || (i + 1).toString() === q) {
                indices.push(i);
            }
        }
        return indices;
    }

    function buildSentenceCardHTML(s, idx) {
        const isCurrent = idx === state.currentIdx;
        const isDone = state.completedSentences.has(idx);
        const hasRec = !!state.userRecordings[idx];
        const mistakeData = state.mistakeSentences ? state.mistakeSentences.get(idx) : null;

        let cardClass = "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ";
        if (isCurrent) {
            cardClass += "is-active-karaoke bg-studio-800 text-white shadow-lg ";
        } else if (mistakeData) {
            cardClass += "bg-rose-500/10 border-rose-500/40 text-rose-200 hover:border-rose-500/70 ";
        } else if (isDone) {
            cardClass += "bg-emerald-500/5 border-emerald-500/30 text-emerald-300 ";
        } else {
            cardClass += "bg-studio-850 hover:bg-studio-800 border-studio-border text-gray-300 ";
        }

        const escapeHTML = (SRTParser && SRTParser.escapeHTML) ? SRTParser.escapeHTML : (str => String(str));
        const durationSec = (s.duration || (s.end - s.start)).toFixed(1);
        const hasTranslation = s.translation && typeof s.translation === 'string' && s.translation.trim().length > 0;

        return `
        <div class="${cardClass}" data-sentence-idx="${idx}">
            <div class="overflow-hidden pr-2 flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="font-bold font-mono text-accent-amber">#${idx + 1}</span>
                    <span class="text-[10px] text-gray-400 font-mono">${SRTParser.formatTime ? SRTParser.formatTime(s.start) : s.start} - ${SRTParser.formatTime ? SRTParser.formatTime(s.end) : s.end}</span>
                    <span class="text-[10px] text-gray-500 font-mono">(${durationSec}s)</span>
                    ${mistakeData ? `<span class="text-[10px] text-rose-300 font-bold font-mono px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/30">⚠️ Lỗi ${mistakeData.accuracy}%</span>` : ''}
                    ${isDone && !mistakeData ? '<span class="text-[10px] text-accent-sage font-bold flex items-center gap-0.5"><i data-lucide="check" class="w-3 h-3"></i> Xong</span>' : ''}
                    ${hasRec ? '<span class="text-[10px] text-accent-indigo font-bold flex items-center gap-0.5"><i data-lucide="mic" class="w-3 h-3"></i> Đã thu</span>' : ''}
                </div>
                <p class="karaoke-sentence-text text-xs font-sans text-gray-300 leading-snug line-clamp-2">${escapeHTML(s.text)}</p>
                ${hasTranslation ? `<p class="text-[11px] text-accent-amber/80 font-sans italic mt-1 line-clamp-2 leading-relaxed">${escapeHTML(s.translation)}</p>` : ''}
            </div>
            <div class="flex items-center pl-2">
                ${isCurrent && state.isPlaying ? `
                <div class="karaoke-eq-wave flex-shrink-0" title="Đang phát">
                    <span></span><span></span><span></span>
                </div>` : `
                <i data-lucide="${isCurrent ? 'play-circle' : 'chevron-right'}" class="w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-accent-amber' : 'text-gray-500'}"></i>`}
            </div>
        </div>`;
    }

    function appendDrawerBatch() {
        const drawerSentenceList = document.getElementById('drawerSentenceList');
        if (!drawerSentenceList) return;

        const indices = drawerFilteredIndices !== null
            ? drawerFilteredIndices
            : Array.from({ length: state.subs.length }, (_, i) => i);

        const total = indices.length;
        if (drawerRenderedCount >= total) return;

        const nextCount = Math.min(total, drawerRenderedCount + DRAWER_BATCH_SIZE);
        const slice = indices.slice(drawerRenderedCount, nextCount);

        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = slice.map(idx => buildSentenceCardHTML(state.subs[idx], idx)).join('');

        const frag = document.createDocumentFragment();
        while (tempContainer.firstChild) {
            frag.appendChild(tempContainer.firstChild);
        }
        drawerSentenceList.appendChild(frag);

        drawerRenderedCount = nextCount;
        if (window.lucide) lucide.createIcons();
    }

    function scrollToActiveSentenceInDrawer() {
        const list = document.getElementById('drawerSentenceList');
        if (!list) return;

        if (drawerFilteredIndices === null && state.currentIdx >= drawerRenderedCount) {
            const nextCount = Math.min(state.subs.length, state.currentIdx + 20);
            const slice = Array.from({ length: nextCount - drawerRenderedCount }, (_, i) => drawerRenderedCount + i);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = slice.map(idx => buildSentenceCardHTML(state.subs[idx], idx)).join('');
            while (tempDiv.firstChild) {
                list.appendChild(tempDiv.firstChild);
            }
            drawerRenderedCount = nextCount;
            if (window.lucide) lucide.createIcons();
        }

        const activeCard = list.querySelector(`[data-sentence-idx="${state.currentIdx}"]`);
        const sentenceDrawer = document.getElementById('sentenceDrawer');
        if (activeCard && sentenceDrawer && !sentenceDrawer.classList.contains('pointer-events-none')) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function renderDrawerList(autoScrollToActive = true) {
        const drawerSentenceList = document.getElementById('drawerSentenceList');
        const drawerCountBadge = document.getElementById('drawerCountBadge');
        if (!drawerSentenceList) return;

        if (!state.subs.length) {
            drawerSentenceList.innerHTML = `<div class="text-gray-500 italic text-center py-10 font-sans">Chưa nạp file phụ đề SRT...</div>`;
            if (drawerCountBadge) drawerCountBadge.textContent = "0 câu";
            return;
        }

        drawerFilteredIndices = getFilteredSentenceIndices();
        const total = drawerFilteredIndices !== null ? drawerFilteredIndices.length : state.subs.length;

        if (drawerCountBadge) {
            drawerCountBadge.textContent = drawerFilteredIndices !== null
                ? `${total}/${state.subs.length} câu`
                : `${state.subs.length} câu`;
        }

        if (total === 0) {
            drawerSentenceList.innerHTML = `<div class="text-gray-500 italic text-center py-10 font-sans">Không tìm thấy câu nào phù hợp...</div>`;
            return;
        }

        drawerSentenceList.innerHTML = '';
        drawerRenderedCount = 0;

        let initialBatch = DRAWER_BATCH_SIZE;
        if (drawerFilteredIndices === null && state.currentIdx >= DRAWER_BATCH_SIZE) {
            initialBatch = Math.min(state.subs.length, state.currentIdx + 15);
        }

        const indices = drawerFilteredIndices !== null
            ? drawerFilteredIndices
            : Array.from({ length: state.subs.length }, (_, i) => i);

        const count = Math.min(total, initialBatch);
        const slice = indices.slice(0, count);

        drawerSentenceList.innerHTML = slice.map(idx => buildSentenceCardHTML(state.subs[idx], idx)).join('');
        drawerRenderedCount = count;

        if (window.lucide) lucide.createIcons();

        if (autoScrollToActive) {
            setTimeout(scrollToActiveSentenceInDrawer, 60);
        }
    }

    let currentDockState = 'idle'; // 'idle' | 'playing' | 'typing' | 'graded' | 'shadowing-ready' | 'shadowing-recording' | 'shadowing-recorded'

    function updateSmartActionDock(stateName) {
        currentDockState = stateName || 'idle';
        const dock = document.getElementById('smartActionDock');
        if (!dock) return;

        const dockBtnPrimary = document.getElementById('dockBtnPrimary');
        const dockBtnPrimaryText = document.getElementById('dockBtnPrimaryText');
        const dockBtnPrimaryIcon = document.getElementById('dockBtnPrimaryIcon');
        const dockBtnPrimaryKbd = document.getElementById('dockBtnPrimaryKbd');
        const dockBtnLeft = document.getElementById('dockBtnLeft');
        const dockBtnLeftText = document.getElementById('dockBtnLeftText');
        const dockBtnLeftIcon = document.getElementById('dockBtnLeftIcon');
        const dockBtnRight = document.getElementById('dockBtnRight');
        const dockBtnRightText = document.getElementById('dockBtnRightText');
        const dockBtnRightIcon = document.getElementById('dockBtnRightIcon');

        if (!dockBtnPrimary) return;

        dockBtnPrimary.classList.remove('is-playing', 'is-typing', 'is-graded', 'is-recording');

        if (stateName === 'playing') {
            dockBtnPrimary.classList.add('is-playing');
            if (dockBtnPrimaryText) dockBtnPrimaryText.textContent = 'Tạm dừng';
            if (dockBtnPrimaryIcon) dockBtnPrimaryIcon.setAttribute('data-lucide', 'pause');
            if (dockBtnPrimaryKbd) dockBtnPrimaryKbd.textContent = 'Space';

            if (dockBtnLeftText) dockBtnLeftText.textContent = '-2s';
            if (dockBtnLeftIcon) dockBtnLeftIcon.setAttribute('data-lucide', 'rotate-ccw');
            if (dockBtnRightText) dockBtnRightText.textContent = '+2s';
            if (dockBtnRightIcon) dockBtnRightIcon.setAttribute('data-lucide', 'rotate-cw');
        } else if (stateName === 'typing') {
            dockBtnPrimary.classList.add('is-typing');
            if (dockBtnPrimaryText) dockBtnPrimaryText.textContent = 'Chấm điểm';
            if (dockBtnPrimaryIcon) dockBtnPrimaryIcon.setAttribute('data-lucide', 'zap');
            if (dockBtnPrimaryKbd) dockBtnPrimaryKbd.textContent = 'Enter';

            if (dockBtnLeftText) dockBtnLeftText.textContent = 'Gợi ý';
            if (dockBtnLeftIcon) dockBtnLeftIcon.setAttribute('data-lucide', 'lightbulb');
            if (dockBtnRightText) dockBtnRightText.textContent = 'Nghe lại';
            if (dockBtnRightIcon) dockBtnRightIcon.setAttribute('data-lucide', 'repeat-1');
        } else if (stateName === 'graded') {
            dockBtnPrimary.classList.add('is-graded');
            if (dockBtnPrimaryText) dockBtnPrimaryText.textContent = 'Tiếp tục';
            if (dockBtnPrimaryIcon) dockBtnPrimaryIcon.setAttribute('data-lucide', 'arrow-right');
            if (dockBtnPrimaryKbd) dockBtnPrimaryKbd.textContent = 'Enter';

            if (dockBtnLeftText) dockBtnLeftText.textContent = 'Nghe lại';
            if (dockBtnLeftIcon) dockBtnLeftIcon.setAttribute('data-lucide', 'repeat-1');
            if (dockBtnRightText) dockBtnRightText.textContent = 'Luyện nói';
            if (dockBtnRightIcon) dockBtnRightIcon.setAttribute('data-lucide', 'mic');
        } else if (stateName === 'shadowing-ready') {
            dockBtnPrimary.classList.add('is-typing');
            if (dockBtnPrimaryText) dockBtnPrimaryText.textContent = 'Thu âm';
            if (dockBtnPrimaryIcon) dockBtnPrimaryIcon.setAttribute('data-lucide', 'mic');
            if (dockBtnPrimaryKbd) dockBtnPrimaryKbd.textContent = 'Space';

            if (dockBtnLeftText) dockBtnLeftText.textContent = 'Nghe mẫu';
            if (dockBtnLeftIcon) dockBtnLeftIcon.setAttribute('data-lucide', 'volume-2');
            if (dockBtnRightText) dockBtnRightText.textContent = 'Bỏ qua';
            if (dockBtnRightIcon) dockBtnRightIcon.setAttribute('data-lucide', 'arrow-right');
        } else if (stateName === 'shadowing-recording') {
            dockBtnPrimary.classList.add('is-recording');
            if (dockBtnPrimaryText) dockBtnPrimaryText.textContent = 'Dừng thu';
            if (dockBtnPrimaryIcon) dockBtnPrimaryIcon.setAttribute('data-lucide', 'square');
            if (dockBtnPrimaryKbd) dockBtnPrimaryKbd.textContent = 'Space';

            if (dockBtnLeftText) dockBtnLeftText.textContent = '-2s';
            if (dockBtnLeftIcon) dockBtnLeftIcon.setAttribute('data-lucide', 'rotate-ccw');
            if (dockBtnRightText) dockBtnRightText.textContent = '+2s';
            if (dockBtnRightIcon) dockBtnRightIcon.setAttribute('data-lucide', 'rotate-cw');
        } else if (stateName === 'shadowing-recorded') {
            dockBtnPrimary.classList.add('is-graded');
            if (dockBtnPrimaryText) dockBtnPrimaryText.textContent = 'Tiếp tục câu sau';
            if (dockBtnPrimaryIcon) dockBtnPrimaryIcon.setAttribute('data-lucide', 'arrow-right');
            if (dockBtnPrimaryKbd) dockBtnPrimaryKbd.textContent = 'Enter';

            if (dockBtnLeftText) dockBtnLeftText.textContent = 'Nghe bạn';
            if (dockBtnLeftIcon) dockBtnLeftIcon.setAttribute('data-lucide', 'play');
            if (dockBtnRightText) dockBtnRightText.textContent = 'Thu lại';
            if (dockBtnRightIcon) dockBtnRightIcon.setAttribute('data-lucide', 'rotate-ccw');
        } else {
            // 'idle'
            if (dockBtnPrimaryText) dockBtnPrimaryText.textContent = 'Nghe câu';
            if (dockBtnPrimaryIcon) dockBtnPrimaryIcon.setAttribute('data-lucide', 'play');
            if (dockBtnPrimaryKbd) dockBtnPrimaryKbd.textContent = 'Space';

            if (dockBtnLeftText) dockBtnLeftText.textContent = '-2s';
            if (dockBtnLeftIcon) dockBtnLeftIcon.setAttribute('data-lucide', 'rotate-ccw');
            if (dockBtnRightText) dockBtnRightText.textContent = '+2s';
            if (dockBtnRightIcon) dockBtnRightIcon.setAttribute('data-lucide', 'rotate-cw');
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function activateDualMasteryTransition() {
        state.isDualMasteryActive = true;
        const tabShadowingBtn = document.getElementById('tabShadowing');
        if (tabShadowingBtn) tabShadowingBtn.click();
        updateSmartActionDock('shadowing-ready');
    }

    function continueDualMasteryNextSentence() {
        state.isDualMasteryActive = false;
        if (state.currentIdx + 1 < state.subs.length) {
            state.currentIdx++;
        }
        const tabDictationBtn = document.getElementById('tabDictation');
        if (tabDictationBtn) tabDictationBtn.click();
        if (Dictation && typeof Dictation.loadCurrentSegment === 'function') {
            Dictation.loadCurrentSegment();
        }
        if (state.audioBuffer && AudioEngine) {
            AudioEngine.play(0);
        }
        updateSmartActionDock('playing');
        renderDrawerList();
    }

    function initSmartActionDock() {
        const dockBtnPrimary = document.getElementById('dockBtnPrimary');
        const dockBtnLeft = document.getElementById('dockBtnLeft');
        const dockBtnRight = document.getElementById('dockBtnRight');
        const btnNext = document.getElementById('btnNext');

        if (dockBtnPrimary) {
            dockBtnPrimary.addEventListener('click', () => {
                if (currentDockState === 'typing') {
                    if (state.dictationMode === 'cloze' && Dictation && typeof Dictation.checkClozeDictation === 'function') {
                        Dictation.checkClozeDictation();
                    } else if (Dictation && typeof Dictation.checkStandardDictation === 'function') {
                        Dictation.checkStandardDictation();
                    }
                } else if (currentDockState === 'graded') {
                    if (btnNext) btnNext.click();
                } else if (currentDockState === 'shadowing-ready') {
                    if (Shadowing && typeof Shadowing.startRecording === 'function') {
                        Shadowing.startRecording();
                    }
                } else if (currentDockState === 'shadowing-recording') {
                    if (Shadowing && typeof Shadowing.stopRecording === 'function') {
                        Shadowing.stopRecording();
                    }
                } else if (currentDockState === 'shadowing-recorded') {
                    continueDualMasteryNextSentence();
                } else {
                    AudioEngine.togglePlay();
                }
            });
        }

        if (dockBtnLeft) {
            dockBtnLeft.addEventListener('click', () => {
                if (currentDockState === 'typing') {
                    if (state.dictationMode === 'cloze' && Dictation && typeof Dictation.provideClozeHint === 'function') {
                        Dictation.provideClozeHint();
                    } else if (Dictation && typeof Dictation.provideHint === 'function') {
                        Dictation.provideHint();
                    } else {
                        const btnHint = document.getElementById('btnHintWord');
                        if (btnHint) btnHint.click();
                    }
                } else if (currentDockState === 'graded' || currentDockState === 'shadowing-ready') {
                    AudioEngine.replay();
                } else if (currentDockState === 'shadowing-recorded') {
                    if (Shadowing && typeof Shadowing.playUserAudio === 'function') {
                        Shadowing.playUserAudio();
                    }
                } else {
                    AudioEngine.rewind(2.0);
                }
            });
        }

        if (dockBtnRight) {
            dockBtnRight.addEventListener('click', () => {
                if (currentDockState === 'typing') {
                    AudioEngine.replay();
                } else if (currentDockState === 'graded') {
                    activateDualMasteryTransition();
                } else if (currentDockState === 'shadowing-ready') {
                    continueDualMasteryNextSentence();
                } else if (currentDockState === 'shadowing-recorded') {
                    if (Shadowing && typeof Shadowing.startRecording === 'function') {
                        Shadowing.startRecording();
                    }
                } else {
                    AudioEngine.forward(2.0);
                }
            });
        }
    }

    root.App = root.App || {};
    root.App.renderDrawerList = renderDrawerList;
    root.App.renderCuratedLessons = (...args) => renderCuratedLessons && renderCuratedLessons(...args);
    root.App.loadCuratedLesson = (lessonId) => loadCuratedLesson && loadCuratedLesson(lessonId);
    root.App.openCuratedModal = () => openCuratedModal && openCuratedModal();
    root.App.closeCuratedModal = () => closeCuratedModal && closeCuratedModal();
    root.App.updateSmartActionDock = updateSmartActionDock;
    root.App.getDockState = () => currentDockState;
    root.App.activateDualMasteryTransition = activateDualMasteryTransition;
    root.App.continueDualMasteryNextSentence = continueDualMasteryNextSentence;
    root.App.jumpToSentence = function (idx) {
        state.currentIdx = idx;
        onSentenceChanged();

        const sentenceDrawer = document.getElementById('sentenceDrawer');
        const drawerPanel = document.getElementById('drawerPanel');
        if (sentenceDrawer && drawerPanel) {
            sentenceDrawer.classList.add('opacity-0', 'pointer-events-none');
            drawerPanel.classList.add('translate-x-full');
        }
    };

    // Boot Retro Pixel Game Loop (Lyre Studio v4.0)
    if (root.App.PixelGameLoop && typeof root.App.PixelGameLoop.init === 'function') {
        root.App.PixelGameLoop.init();
    }

})(window);
