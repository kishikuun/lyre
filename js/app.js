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

    let deferredInstallPrompt = null;

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

        // File Pickers
        const audioInput = document.getElementById('audioInput');
        const srtInput = document.getElementById('srtInput');
        const btnTriggerAudioInput = document.getElementById('btnTriggerAudioInput');
        const btnTriggerSrtInput = document.getElementById('btnTriggerSrtInput');
        const audioFileName = document.getElementById('audioFileName');
        const srtFileName = document.getElementById('srtFileName');
        const btnLoadSample = document.getElementById('btnLoadSample');
        const btnLoadSampleEmpty = document.getElementById('btnLoadSampleEmpty');
        const btnClearStorage = document.getElementById('btnClearStorage');

        if (btnTriggerAudioInput && audioInput) {
            btnTriggerAudioInput.addEventListener('click', () => audioInput.click());
        }

        if (btnTriggerSrtInput && srtInput) {
            btnTriggerSrtInput.addEventListener('click', () => srtInput.click());
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
        const emptyStateCard = document.getElementById('emptyStateCard');
        const workspaceArea = document.getElementById('workspaceArea');

        if (state.subs.length > 0) {
            if (emptyStateCard) emptyStateCard.classList.add('hidden');
            if (workspaceArea) workspaceArea.classList.remove('hidden');
        } else {
            if (emptyStateCard) emptyStateCard.classList.remove('hidden');
            if (workspaceArea) workspaceArea.classList.add('hidden');
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

    let drawerRenderedCount = 0;
    const DRAWER_BATCH_SIZE = 50;
    let drawerSearchQuery = '';
    let drawerFilteredIndices = null;

    function getFilteredSentenceIndices() {
        if (!drawerSearchQuery) return null;
        const q = drawerSearchQuery.toLowerCase().trim();
        const indices = [];
        for (let i = 0; i < state.subs.length; i++) {
            if (state.subs[i].text.toLowerCase().includes(q) || (i + 1).toString() === q) {
                indices.push(i);
            }
        }
        return indices;
    }

    function buildSentenceCardHTML(s, idx) {
        const isCurrent = idx === state.currentIdx;
        const isDone = state.completedSentences.has(idx);
        const hasRec = !!state.userRecordings[idx];

        let cardClass = "p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ";
        if (isCurrent) {
            cardClass += "bg-studio-800 border-accent-cyan text-white shadow-md shadow-cyan-500/10";
        } else if (isDone) {
            cardClass += "bg-emerald-500/5 border-emerald-500/30 text-emerald-300";
        } else {
            cardClass += "bg-studio-850 hover:bg-studio-800 border-studio-border text-gray-300";
        }

        const escapeHTML = SRTParser.escapeHTML || (str => String(str));
        return `
        <div class="${cardClass}" data-sentence-idx="${idx}">
            <div class="overflow-hidden pr-2">
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-accent-cyan">#${idx + 1}</span>
                    <span class="text-[10px] text-gray-400 font-mono">${SRTParser.formatTime(s.start)} - ${SRTParser.formatTime(s.end)}</span>
                    ${isDone ? '<span class="text-[10px] text-accent-emerald font-bold flex items-center gap-0.5"><i data-lucide="check" class="w-3 h-3"></i> Xong</span>' : ''}
                    ${hasRec ? '<span class="text-[10px] text-accent-indigo font-bold flex items-center gap-0.5"><i data-lucide="mic" class="w-3 h-3"></i> Đã thu</span>' : ''}
                </div>
                <p class="text-[11px] truncate font-sans text-gray-400">${escapeHTML(s.text)}</p>
            </div>
            <i data-lucide="${isCurrent ? 'play-circle' : 'chevron-right'}" class="w-4 h-4 flex-shrink-0 text-gray-400"></i>
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
        if (activeCard) {
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

    root.App = root.App || {};
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

})(window);
