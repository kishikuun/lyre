/**
 * DictaShadow Studio - Phase 2 Advanced: Scientific Shadowing Lab (js/shadowing.js)
 * High-End Scientific Features:
 * 1. 4 Practical Training Modes: Normal, Echo Loop (Listen & Repeat), Simultaneous, Blind Shadowing
 * 2. Phonetic & Prosody Teleprompter: Content Word Stress, Linking Sounds (‿), Breath Pauses (//), Pitch Direction (↗, ↘)
 * 3. Dynamic Karaoke Pacing Flow (Word-level real-time highlight & scaling)
 * 4. Hi-DPI Dual-Waveform with Neon Pitch Contour ($F_0$ Fundamental Frequency Overlay)
 * 5. Pitch Similarity Score (%) & Intonation Feedback (Relative melody comparison)
 * 6. Binaural Stereo Contrast (Left Ear = Native, Right Ear = User)
 * 7. In-Browser Speech Recognition Diagnostics (Web Speech API)
 * 8. Sequential A ➔ B Review & WebM Audio Export
 */
(function (root) {
    'use strict';

    const state = root.App.state;
    const AudioEngine = root.App.AudioEngine;
    const SRTParser = root.App.SRTParser;
    const SpeechAnalysis = root.App.SpeechAnalysis;

    let micAnalyser = null;
    let micStream = null;
    let micAnimFrame = null;
    let recordingTimer = null;
    let recordStartTime = 0;
    let autoStopTimeout = null;

    // Advanced Shadowing Settings
    let currentMode = 'normal'; // 'normal' | 'echo' | 'simultaneous' | 'blind'
    let currentStep = 1; // 1 | 2 | 3 | 4
    let showPitchContour = true;
    let showProsodyMarkup = true;
    let isBlindModeActive = false;

    // Echo Loop Parameters
    let echoLoopCount = 1; // 1 | 2 | 3 | Infinity
    let currentEchoIteration = 0;
    let echoPauseRatio = 1.0; // 1.0x of segment duration
    let echoAutoRecord = true;
    let echoCountdownTimer = null;
    let isEchoWaiting = false;

    // Pitch Data Caches
    let cachedNativePitch = null;
    let cachedUserPitch = null;
    let cachedNativeIdx = -1;
    let isSequentialABPending = false;
    let sequentialTimer = null;

    function initShadowing() {
        // Mode buttons
        setupModeButtons();

        // 4-Stage Workflow buttons
        setupStepWorkflow();

        // Action buttons
        const btnToggleRecord = document.getElementById('btnToggleRecord');
        const btnPlayUserVoice = document.getElementById('btnPlayUserVoice');
        const btnInstantAB = document.getElementById('btnInstantAB');
        const btnSequentialAB = document.getElementById('btnSequentialAB');
        const btnStereoContrast = document.getElementById('btnStereoContrast');
        const btnDownloadRec = document.getElementById('btnDownloadRec');
        const btnTogglePitch = document.getElementById('btnTogglePitch');
        const btnToggleProsody = document.getElementById('btnToggleProsody');
        const btnToggleBlind = document.getElementById('btnToggleBlind');

        // Echo settings
        const echoLoopsSelect = document.getElementById('echoLoopsSelect');
        const echoPauseSelect = document.getElementById('echoPauseSelect');

        if (btnToggleRecord) btnToggleRecord.addEventListener('click', toggleRecording);
        if (btnPlayUserVoice) btnPlayUserVoice.addEventListener('click', () => AudioEngine.playUserRecording(0));
        if (btnInstantAB) btnInstantAB.addEventListener('click', () => {
            AudioEngine.toggleABTrack();
            updateABButtonUI();
        });
        if (btnSequentialAB) btnSequentialAB.addEventListener('click', playSequentialAB);
        if (btnStereoContrast) btnStereoContrast.addEventListener('click', () => AudioEngine.playStereoContrast(0));
        if (btnDownloadRec) btnDownloadRec.addEventListener('click', downloadCurrentRecording);

        if (btnTogglePitch) {
            btnTogglePitch.addEventListener('click', () => {
                showPitchContour = !showPitchContour;
                updatePitchButtonUI();
                redrawWaveforms();
            });
        }

        if (btnToggleProsody) {
            btnToggleProsody.addEventListener('click', () => {
                showProsodyMarkup = !showProsodyMarkup;
                updateProsodyButtonUI();
                renderProsodyTeleprompter();
            });
        }

        if (btnToggleBlind) {
            btnToggleBlind.addEventListener('click', () => {
                toggleBlindMode();
            });
        }

        const blindOverlay = document.getElementById('blindOverlay');
        if (blindOverlay) {
            blindOverlay.addEventListener('click', () => {
                toggleBlindMode();
            });
        }

        if (echoLoopsSelect) {
            echoLoopsSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                echoLoopCount = (val === 'inf') ? Infinity : parseInt(val);
            });
        }

        if (echoPauseSelect) {
            echoPauseSelect.addEventListener('change', (e) => {
                echoPauseRatio = parseFloat(e.target.value);
            });
        }

        // Native Waveform Canvas Click to Seek
        const nativeWaveformCanvas = document.getElementById('nativeWaveformCanvas');
        if (nativeWaveformCanvas) {
            nativeWaveformCanvas.addEventListener('click', (e) => {
                const seg = AudioEngine.getCurrentSegment();
                if (!seg) return;
                const rect = nativeWaveformCanvas.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                AudioEngine.seek(ratio * seg.duration);
            });
        }

        // User Waveform Canvas Click to Seek
        const userWaveformCanvas = document.getElementById('userWaveformCanvas');
        if (userWaveformCanvas) {
            userWaveformCanvas.addEventListener('click', (e) => {
                const rec = state.userRecordings[state.currentIdx];
                if (!rec || !rec.buffer) return;
                const rect = userWaveformCanvas.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                AudioEngine.playUserRecording(ratio * rec.duration);
            });
        }

        window.addEventListener('resize', redrawWaveforms);
    }

    /**
     * Setup Shadowing Modes (Normal, Echo Loop, Simultaneous, Blind)
     */
    function setupModeButtons() {
        const modeBtns = document.querySelectorAll('.shadowing-mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode') || 'normal';
                setShadowingMode(mode);
            });
        });
    }

    function setShadowingMode(mode) {
        currentMode = mode;
        const modeBtns = document.querySelectorAll('.shadowing-mode-btn');
        modeBtns.forEach(btn => {
            const m = btn.getAttribute('data-mode');
            if (m === mode) {
                btn.className = "shadowing-mode-btn px-3 py-1.5 rounded-lg bg-accent-amber text-studio-950 font-bold text-xs shadow-md shadow-amber-500/20 transition";
            } else {
                btn.className = "shadowing-mode-btn px-3 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 text-gray-400 font-medium text-xs border border-studio-border transition";
            }
        });
        AudioEngine.playSynthesizedSound('click');

        // Toggle Echo Settings Panel visibility
        const echoControlsBar = document.getElementById('echoControlsBar');
        if (echoControlsBar) {
            if (mode === 'echo') {
                echoControlsBar.classList.remove('hidden');
            } else {
                echoControlsBar.classList.add('hidden');
                cancelEchoWaiting();
            }
        }

        // Toggle Blind Mode visual state
        if (mode === 'blind') {
            setBlindMode(true);
        } else {
            setBlindMode(false);
        }
    }

    /**
     * Blind Mode: Blur prompt text to train ear-to-vocal motor reflex
     */
    function toggleBlindMode() {
        setBlindMode(!isBlindModeActive);
    }

    function setBlindMode(active) {
        isBlindModeActive = active;
        const teleprompter = document.getElementById('shadowingTeleprompter');
        const blindOverlay = document.getElementById('blindOverlay');
        const btnToggleBlind = document.getElementById('btnToggleBlind');

        if (teleprompter) {
            if (active) {
                teleprompter.classList.add('filter', 'blur-md', 'select-none', 'opacity-30');
                if (blindOverlay) blindOverlay.classList.remove('hidden');
            } else {
                teleprompter.classList.remove('filter', 'blur-md', 'select-none', 'opacity-30');
                if (blindOverlay) blindOverlay.classList.add('hidden');
            }
        }

        if (btnToggleBlind) {
            btnToggleBlind.className = active
                ? "tactile-btn px-2.5 py-1.5 rounded bg-accent-amber/20 text-accent-amber border border-accent-amber/40 text-xs font-bold flex items-center gap-1.5"
                : "tactile-btn px-2.5 py-1.5 rounded bg-studio-850 hover:bg-studio-800 text-gray-400 border border-studio-border text-xs flex items-center gap-1.5";
        }
    }

    function updatePitchButtonUI() {
        const btn = document.getElementById('btnTogglePitch');
        if (!btn) return;
        btn.className = showPitchContour
            ? "tactile-btn px-2.5 py-1.5 rounded bg-amber-500/15 text-accent-amber border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5"
            : "tactile-btn px-2.5 py-1.5 rounded bg-studio-850 text-gray-400 border border-studio-border text-xs font-mono flex items-center gap-1.5";
    }

    function updateProsodyButtonUI() {
        const btn = document.getElementById('btnToggleProsody');
        if (!btn) return;
        btn.className = showProsodyMarkup
            ? "tactile-btn px-2.5 py-1.5 rounded bg-amber-500/15 text-accent-amber border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5"
            : "tactile-btn px-2.5 py-1.5 rounded bg-studio-850 text-gray-400 border border-studio-border text-xs font-mono flex items-center gap-1.5";
    }

    /**
     * 4-Stage Shadowing Guided Steps
     */
    function setupStepWorkflow() {
        const stepBtns = document.querySelectorAll('.shadowing-step-btn');
        stepBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const step = parseInt(btn.getAttribute('data-step') || '1');
                setShadowingStep(step);
            });
        });
    }

    function setShadowingStep(step) {
        currentStep = step;
        const stepBtns = document.querySelectorAll('.shadowing-step-btn');
        stepBtns.forEach(btn => {
            const s = parseInt(btn.getAttribute('data-step') || '1');
            if (s === step) {
                btn.className = "shadowing-step-btn px-2.5 py-1 rounded bg-accent-amber text-studio-950 font-mono font-bold text-xs border border-amber-500/40 shadow-sm transition";
            } else {
                btn.className = "shadowing-step-btn px-2.5 py-1 rounded bg-studio-850 hover:bg-studio-800 text-gray-400 font-mono text-xs border border-studio-border transition";
            }
        });
        AudioEngine.playSynthesizedSound('click');

        const stepInstruction = document.getElementById('stepInstruction');
        if (stepInstruction) {
            if (step === 1) {
                stepInstruction.innerHTML = `🎧 <b>Bước 1: Bắt nhịp</b> — Nghe người bản xứ nói, chú ý từ in đậm (trọng âm), nối âm (‿) và ngữ điệu (↗ ↘).`;
                state.playbackRate = 0.85;
            } else if (step === 2) {
                stepInstruction.innerHTML = `👄 <b>Bước 2: Nhẩm khẩu hình</b> — Bật phát, nhẩm môi theo nhưng không phát ra tiếng để cơ miệng quen tốc độ.`;
                state.playbackRate = 1.0;
            } else if (step === 3) {
                stepInstruction.innerHTML = `🎙️ <b>Bước 3: Nói đuổi</b> — Bấm <b>Thu âm (R)</b>, nói đuổi theo với độ trễ 0.2s - 0.4s để bắt nhịp chuẩn.`;
                state.playbackRate = 1.0;
            } else if (step === 4) {
                stepInstruction.innerHTML = `🔬 <b>Bước 4: So sánh giọng</b> — Nghe lại giọng bạn, bật <b>Đường cao độ (P)</b> hoặc <b>Kênh đôi Trái/Phải (S)</b> để đối chiếu.`;
            }
            const speedSelect = document.getElementById('speedSelect');
            if (speedSelect) speedSelect.value = state.playbackRate.toString();
        }
    }

    /**
     * Echo Loop & Sequential A->B Manager (Hook from AudioEngine when segment finishes)
     */
    function onSegmentEnded(seg) {
        if (isSequentialABPending) {
            cancelSequentialAB();
            const targetIdx = state.currentIdx;
            sequentialTimer = setTimeout(() => {
                if (state.currentIdx === targetIdx && state.userRecordings[targetIdx]) {
                    AudioEngine.playUserRecording(0);
                    state.activeABTrack = 'user';
                    updateABButtonUI();
                }
            }, 300);
            return true;
        }

        if (currentMode !== 'echo') return false;

        // An Echo Loop iteration just completed playback
        currentEchoIteration++;
        if (echoLoopCount !== Infinity && currentEchoIteration > echoLoopCount) {
            currentEchoIteration = 0;
            return false;
        }

        startEchoCountdown(seg);
        return true; // Inform AudioEngine that Echo mode handled this
    }

    function startEchoCountdown(seg) {
        isEchoWaiting = true;
        const echoWaitBar = document.getElementById('echoWaitBar');
        const echoStatusText = document.getElementById('echoStatusText');
        const echoContainer = document.getElementById('echoProgressContainer');

        if (echoContainer) echoContainer.classList.remove('hidden');

        const pauseDurationSec = Math.max(1.5, seg.duration * echoPauseRatio);
        const startTime = Date.now();
        const endTime = startTime + (pauseDurationSec * 1000);

        // Auto-record user speech during echo pause if enabled
        if (echoAutoRecord && !state.isRecording) {
            startRecording(false); // Don't auto-play native audio
        }

        clearInterval(echoCountdownTimer);
        echoCountdownTimer = setInterval(() => {
            const now = Date.now();
            const remainingSec = Math.max(0, (endTime - now) / 1000);
            const progressRatio = Math.max(0, Math.min(1, (now - startTime) / (pauseDurationSec * 1000)));

            if (echoWaitBar) echoWaitBar.style.width = `${(1 - progressRatio) * 100}%`;
            if (echoStatusText) {
                echoStatusText.innerHTML = `🗣️ <b>Đến lượt bạn nói:</b> Còn <b>${remainingSec.toFixed(1)}s</b> (Lần ${currentEchoIteration}/${echoLoopCount === Infinity ? '∞' : echoLoopCount})`;
            }

            if (now >= endTime) {
                clearInterval(echoCountdownTimer);
                isEchoWaiting = false;

                if (state.isRecording) {
                    stopRecording();
                }

                if (echoContainer) echoContainer.classList.add('hidden');

                // Next iteration
                setTimeout(() => {
                    if (currentMode === 'echo') {
                        AudioEngine.play(0);
                    }
                }, 400);
            }
        }, 50);
    }

    function cancelEchoWaiting() {
        clearInterval(echoCountdownTimer);
        isEchoWaiting = false;
        const echoContainer = document.getElementById('echoProgressContainer');
        if (echoContainer) echoContainer.classList.add('hidden');
    }

    /**
     * Start / Stop Recording with Web Speech Diagnostics
     */
    async function toggleRecording() {
        AudioEngine.initAudioContext();
        AudioEngine.playSynthesizedSound('shutter');
        if (state.isRecording) {
            stopRecording();
        } else {
            await startRecording(true);
        }
    }

    async function startRecording(autoPlayNative = true) {
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Set up mic volume meter with 85Hz highpass voice pre-conditioning filter
            const audioCtx = state.audioContext;
            const micSource = audioCtx.createMediaStreamSource(micStream);
            const highpassFilter = audioCtx.createBiquadFilter();
            highpassFilter.type = 'highpass';
            highpassFilter.frequency.setValueAtTime(85, audioCtx.currentTime);
            micAnalyser = audioCtx.createAnalyser();
            micAnalyser.fftSize = 64;
            micSource.connect(highpassFilter);
            highpassFilter.connect(micAnalyser);
            startMicLevelMeter();

            // Browser mimeType compatibility
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
                else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
                else mimeType = '';
            }

            const options = mimeType ? { mimeType } : {};
            const chunks = [];
            state.mediaRecorder = new MediaRecorder(micStream, options);

            state.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            state.mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                try {
                    const audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer);
                    const newTake = {
                        id: Date.now(),
                        blob,
                        buffer: audioBuffer,
                        duration: audioBuffer.duration,
                        rhythmScore: null,
                        pitchScore: null,
                        timestamp: new Date()
                    };

                    // Phase 5: Multi-Take Management (Hold up to 3 takes per sentence)
                    if (!Array.isArray(state.userTakes[state.currentIdx])) {
                        state.userTakes[state.currentIdx] = [];
                    }
                    const takes = state.userTakes[state.currentIdx];
                    if (takes.length >= 3) {
                        takes.shift(); // FIFO rotation
                    }
                    takes.push(newTake);
                    state.activeTakeNum = takes.length;
                    state.userRecordings[state.currentIdx] = newTake;

                    // Invalidate user pitch cache
                    cachedUserPitch = null;

                    drawUserWaveform();
                    updateABButtonUI();
                    evaluateMatchScore();
                    renderTakeChips();

                    // Save recording to IndexedDB
                    if (root.App.Storage) {
                        root.App.Storage.saveUserRecording(state.currentIdx, blob);
                    }
                } catch (err) {
                    console.error("Lỗi giải mã bản thu:", err);
                }

                if (micStream) {
                    micStream.getTracks().forEach(t => t.stop());
                }
                cancelAnimationFrame(micAnimFrame);
                resetMicMeter();
            };

            state.mediaRecorder.start();
            state.isRecording = true;
            recordStartTime = Date.now();

            // Start in-browser speech recognition diagnostics
            const seg = AudioEngine.getCurrentSegment();
            if (seg && SpeechAnalysis) {
                SpeechAnalysis.startSpeechDiagnostics(seg.text, handleSpeechDiagnosticsResult);
            }

            // Auto-play native audio while user shadows if in Simultaneous mode or Step 3
            if (autoPlayNative && !state.isPlaying && state.audioBuffer && currentMode !== 'echo') {
                AudioEngine.play(0);
            }

            updateRecordUI(true);

            // Timer display
            clearInterval(recordingTimer);
            recordingTimer = setInterval(() => {
                const elapsedSec = (Date.now() - recordStartTime) / 1000;
                const timerEl = document.getElementById('recordTimer');
                if (timerEl) timerEl.textContent = elapsedSec.toFixed(1) + 's';
            }, 100);

            // Auto-stop when native audio segment ends + 600ms grace period (in non-echo mode)
            if (seg && autoPlayNative && currentMode !== 'echo') {
                const durationMs = (seg.duration / state.playbackRate) * 1000 + 600;
                clearTimeout(autoStopTimeout);
                autoStopTimeout = setTimeout(() => {
                    if (state.isRecording) {
                        stopRecording();
                    }
                }, durationMs);
            }

        } catch (err) {
            alert("Không thể bật Micro: " + err.message + ". Vui lòng cấp quyền micro cho trình duyệt!");
        }
    }

    function stopRecording() {
        clearTimeout(autoStopTimeout);
        if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
            state.mediaRecorder.stop();
        }
        if (SpeechAnalysis) {
            SpeechAnalysis.stopSpeechDiagnostics();
        }
        state.isRecording = false;
        clearInterval(recordingTimer);
        updateRecordUI(false);
    }

    function handleSpeechDiagnosticsResult(data) {
        const speechScoreBadge = document.getElementById('speechScoreBadge');
        const speechWordsDisplay = document.getElementById('speechWordsDisplay');
        if (!data || !data.supported) return;

        if (data.diagnostics && speechScoreBadge && speechWordsDisplay) {
            const diag = data.diagnostics;
            speechScoreBadge.textContent = `${diag.score}%`;
            speechScoreBadge.className = diag.score >= 80 ? "text-accent-emerald font-bold" : "text-accent-amber font-bold";

            const escapeHTML = SRTParser.escapeHTML || (s => String(s));
            speechWordsDisplay.innerHTML = diag.wordStatus.map(ws => {
                const safeWord = escapeHTML(ws.word);
                if (ws.recognized) {
                    return `<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-accent-emerald font-bold border border-emerald-500/30 text-xs">${safeWord}</span>`;
                } else {
                    return `<span class="px-2 py-0.5 rounded bg-rose-500/15 text-accent-rose font-bold line-through border border-rose-500/30 text-xs" title="Chưa nhận diện rõ âm">${safeWord}</span>`;
                }
            }).join(' ');
        }
    }

    function updateRecordUI(recording) {
        const btnToggleRecord = document.getElementById('btnToggleRecord');
        if (btnToggleRecord) {
            if (recording) {
                btnToggleRecord.classList.add('is-recording');
            } else {
                btnToggleRecord.classList.remove('is-recording');
            }
        }
    }

    function startMicLevelMeter() {
        const micData = new Uint8Array(micAnalyser.frequencyBinCount);
        const micMeterBar = document.getElementById('micMeterBar');

        function update() {
            if (state.isRecording && micAnalyser) {
                micAnalyser.getByteFrequencyData(micData);
                let sum = 0;
                for (let i = 0; i < micData.length; i++) sum += micData[i];
                const avg = sum / micData.length;
                const level = Math.min(100, Math.round((avg / 128) * 100));
                if (micMeterBar) micMeterBar.style.width = `${level}%`;
                micAnimFrame = requestAnimationFrame(update);
            }
        }
        update();
    }

    function resetMicMeter() {
        const micMeterBar = document.getElementById('micMeterBar');
        if (micMeterBar) micMeterBar.style.width = '0%';
        const timerEl = document.getElementById('recordTimer');
        if (timerEl) timerEl.textContent = '0.0s';
    }

    // ==========================================================================
    // DUAL-WAVEFORM & PITCH CONTOUR CANVAS RENDERING
    // ==========================================================================
    function redrawWaveforms() {
        // Multi-Take synchronization
        const takes = state.userTakes[state.currentIdx];
        if (takes && takes.length > 0) {
            if (!state.activeTakeNum || state.activeTakeNum > takes.length) {
                state.activeTakeNum = takes.length;
            }
            state.userRecordings[state.currentIdx] = takes[state.activeTakeNum - 1];
        }

        drawNativeWaveform();
        drawUserWaveform();
        renderProsodyTeleprompter();
        renderTakeChips();
    }

    function selectTake(takeNum) {
        const takes = state.userTakes[state.currentIdx];
        if (!takes || !takes[takeNum - 1]) return;
        state.activeTakeNum = takeNum;
        state.userRecordings[state.currentIdx] = takes[takeNum - 1];
        cachedUserPitch = null;
        drawUserWaveform();
        updateABButtonUI();
        evaluateMatchScore();
        renderTakeChips();
        if (AudioEngine && AudioEngine.playSynthesizedSound) {
            AudioEngine.playSynthesizedSound('click');
        }
    }

    function renderTakeChips() {
        const container = document.getElementById('shadowingTakeChipsContainer');
        if (!container) return;

        const takes = state.userTakes[state.currentIdx];
        if (!takes || takes.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = takes.map((take, idx) => {
            const num = idx + 1;
            const isActive = (num === state.activeTakeNum);
            const scoreStr = take.rhythmScore ? ` ${take.rhythmScore}%` : '';
            const activeClass = isActive
                ? "bg-accent-sage text-studio-950 font-bold border-accent-sage shadow-sm shadow-emerald-500/20"
                : "bg-studio-850 hover:bg-studio-800 text-gray-400 hover:text-white border-studio-border";
            return `<button type="button" data-take-num="${num}" class="take-chip-btn px-2 py-0.5 rounded text-[10px] font-mono border transition ${activeClass}">T${num}${scoreStr}</button>`;
        }).join('');

        container.querySelectorAll('.take-chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const num = parseInt(btn.getAttribute('data-take-num'), 10);
                selectTake(num);
            });
        });
    }

    function renderWaveformCanvas(canvasId, buffer, startSec, durationSec, colorStops, pitchColor, getPitchFn, emptyMessage) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (!buffer || !durationSec) {
            clearCanvas(canvas, emptyMessage);
            return;
        }

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width || 300;
        const height = rect.height || 75;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const numBars = Math.max(10, Math.floor(width / 4));
        const peaks = AudioEngine.extractWaveformPeaks(buffer, startSec, durationSec, numBars);

        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, colorStops[0]);
        gradient.addColorStop(0.5, colorStops[1]);
        gradient.addColorStop(1, colorStops[2]);

        const barWidth = 2.5;
        const gap = (width - (numBars * barWidth)) / numBars;

        for (let i = 0; i < numBars; i++) {
            const barHeight = Math.max(3, peaks[i] * (height * 0.85));
            const x = i * (barWidth + gap);
            const y = (height - barHeight) / 2;

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 1.5);
            ctx.fill();
        }

        if (showPitchContour && SpeechAnalysis && getPitchFn) {
            const pitchData = getPitchFn();
            if (pitchData) {
                drawPitchContourCurve(ctx, pitchData, width, height, pitchColor);
            }
        }
    }

    function drawNativeWaveform() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg || !state.audioBuffer) {
            const canvas = document.getElementById('nativeWaveformCanvas');
            if (canvas) clearCanvas(canvas, "Chưa nạp file Audio MP3...");
            return;
        }

        if (cachedNativeIdx !== state.currentIdx) {
            cachedNativePitch = null;
            cachedNativeIdx = state.currentIdx;
        }

        renderWaveformCanvas(
            'nativeWaveformCanvas',
            state.audioBuffer,
            seg.start,
            seg.duration,
            ['#F59E0B', '#D97706', '#92400E'],
            '#FBBF24',
            () => {
                if (!cachedNativePitch) {
                    cachedNativePitch = SpeechAnalysis.extractPitchContour(state.audioBuffer, seg.start, seg.duration, 70);
                }
                return cachedNativePitch;
            },
            "Chưa nạp file Audio MP3..."
        );

        // Update Center Timecode Ruler Markers
        updateAcousticRuler(seg.duration);
    }

    function updateAcousticRuler(duration) {
        if (!duration) return;
        const r25 = document.getElementById('rulerMark25');
        const r50 = document.getElementById('rulerMark50');
        const r75 = document.getElementById('rulerMark75');
        const r100 = document.getElementById('rulerMark100');
        if (r25) r25.textContent = (duration * 0.25).toFixed(1) + 's';
        if (r50) r50.textContent = (duration * 0.5).toFixed(1) + 's';
        if (r75) r75.textContent = (duration * 0.75).toFixed(1) + 's';
        if (r100) r100.textContent = duration.toFixed(1) + 's';
    }

    function drawUserWaveform() {
        const recordingData = state.userRecordings[state.currentIdx];
        renderWaveformCanvas(
            'userWaveformCanvas',
            recordingData ? recordingData.buffer : null,
            0,
            recordingData ? recordingData.duration : 0,
            ['#10B981', '#059669', '#34D399'],
            '#10B981',
            () => {
                if (!cachedUserPitch && recordingData && recordingData.buffer) {
                    cachedUserPitch = SpeechAnalysis.extractPitchContour(recordingData.buffer, 0, recordingData.duration, 70);
                }
                return cachedUserPitch;
            },
            "Chưa có bản thu của bạn. Bấm Thu âm (R) để bắt đầu!"
        );
    }

    function drawPitchContourCurve(ctx, pitches, width, height, strokeColor) {
        const count = pitches.length;
        if (!count) return;

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();

        let started = false;
        const minPitch = 80;
        const maxPitch = 380;

        for (let i = 0; i < count; i++) {
            const f = pitches[i];
            const x = (i / (count - 1)) * width;

            if (f > 0) {
                const norm = Math.max(0, Math.min(1, (f - minPitch) / (maxPitch - minPitch)));
                const y = height - (norm * (height * 0.75) + 10);
                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            } else {
                started = false; // Unvoiced gap
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    function clearCanvas(canvas, placeholderText) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width || 300;
        const height = rect.height || 75;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#475569';
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(placeholderText, width / 2, height / 2);
    }

    function updateWaveformPlayhead(currentPosInSeg, totalDuration) {
        const playheadA = document.getElementById('waveformPlayheadA');
        const playheadB = document.getElementById('waveformPlayheadB');
        if (!totalDuration) return;

        const percent = Math.min(100, Math.max(0, (currentPosInSeg / totalDuration) * 100));

        if (playheadA) playheadA.style.left = `${percent}%`;
        if (playheadB) playheadB.style.left = `${percent}%`;

        // Update Karaoke Teleprompter Word Progress
        highlightKaraokeWords(percent);
    }

    // ==========================================================================
    // PROSODY TELEPROMPTER & KARAOKE FLOW
    // ==========================================================================
    function renderProsodyTeleprompter() {
        const container = document.getElementById('shadowingTeleprompter');
        const seg = AudioEngine.getCurrentSegment();
        if (!container || !seg || !SpeechAnalysis) return;

        const tokens = SpeechAnalysis.generateProsodyTokens(seg.text);
        const escapeHTML = SRTParser.escapeHTML || (s => String(s));

        container.innerHTML = tokens.map((token, idx) => {
            let wordClasses = "teleprompter-word inline-block px-1.5 py-0.5 rounded transition-all duration-150 ";

            if (showProsodyMarkup && token.isStressed) {
                // Content Word - Stressed (Swiss Editorial Amber Gold)
                wordClasses += "font-bold text-white text-base sm:text-xl border-b-2 border-amber-500/80 bg-studio-800/60 shadow-sm";
            } else {
                // Function Word - Unstressed
                wordClasses += "font-normal text-gray-300 text-sm sm:text-base";
            }

            let html = `<span class="${wordClasses}" data-token-idx="${idx}">${escapeHTML(token.rawWord)}</span>`;

            if (showProsodyMarkup) {
                if (token.linkToNext) {
                    html += `<span class="text-accent-amber font-mono font-bold text-xs mx-0.5" title="Nối âm (Connected speech)">‿</span>`;
                }

                if (token.intonationArrow) {
                    const arrowColor = token.intonationArrow === '↗' ? 'text-accent-amber' : 'text-accent-sage';
                    html += `<span class="${arrowColor} font-bold text-xs mx-0.5" title="Ngữ điệu">${token.intonationArrow}</span>`;
                }

                if (token.isPunctuationPause) {
                    html += `<span class="text-amber-500/60 font-mono font-bold text-xs mx-1" title="Ngắt hơi ngắn">/</span>`;
                } else if (token.isSentenceEnd) {
                    html += `<span class="text-accent-rose font-mono font-bold text-xs mx-1" title="Dừng hết câu">//</span>`;
                }
            }

            return html;
        }).join(' ');

        // Update raw prompt text element for compatibility
        const promptEl = document.getElementById('shadowingPromptText');
        if (promptEl) promptEl.textContent = seg.text;
    }

    function highlightKaraokeWords(percent) {
        const words = document.querySelectorAll('.teleprompter-word');
        const total = words.length;
        if (!total) return;

        const activeIdx = Math.floor((percent / 100) * total);

        words.forEach((w, i) => {
            if (i === activeIdx) {
                w.classList.add('bg-accent-amber', 'text-studio-950', 'scale-105', 'shadow-md', 'shadow-amber-500/20', 'font-bold');
                w.classList.remove('text-white', 'text-gray-300');
            } else if (i < activeIdx) {
                w.classList.remove('bg-accent-amber', 'text-studio-950', 'scale-105');
                w.classList.add('text-amber-400');
            } else {
                w.classList.remove('bg-accent-amber', 'text-studio-950', 'scale-105', 'text-amber-400');
            }
        });
    }

    function updateABButtonUI() {
        const btnInstantAB = document.getElementById('btnInstantAB');
        const abStatusText = document.getElementById('abStatusText');
        const btnPlayUserVoice = document.getElementById('btnPlayUserVoice');
        const btnSequentialAB = document.getElementById('btnSequentialAB');
        const btnStereoContrast = document.getElementById('btnStereoContrast');
        const btnDownloadRec = document.getElementById('btnDownloadRec');
        const recordingData = state.userRecordings[state.currentIdx];

        if (!btnInstantAB) return;

        if (!recordingData) {
            btnInstantAB.disabled = true;
            btnInstantAB.className = "tactile-btn px-4 py-2.5 rounded-xl bg-studio-850 text-gray-500 border border-studio-border text-xs flex items-center gap-2 opacity-50 cursor-not-allowed";
            if (abStatusText) abStatusText.textContent = "Chưa có bản thu";

            if (btnPlayUserVoice) btnPlayUserVoice.classList.add('opacity-50', 'pointer-events-none');
            if (btnSequentialAB) btnSequentialAB.classList.add('opacity-50', 'pointer-events-none');
            if (btnStereoContrast) btnStereoContrast.classList.add('opacity-50', 'pointer-events-none');
            if (btnDownloadRec) btnDownloadRec.classList.add('opacity-50', 'pointer-events-none');
        } else {
            btnInstantAB.disabled = false;
            if (btnPlayUserVoice) btnPlayUserVoice.classList.remove('opacity-50', 'pointer-events-none');
            if (btnSequentialAB) btnSequentialAB.classList.remove('opacity-50', 'pointer-events-none');
            if (btnStereoContrast) btnStereoContrast.classList.remove('opacity-50', 'pointer-events-none');
            if (btnDownloadRec) btnDownloadRec.classList.remove('opacity-50', 'pointer-events-none');

            if (state.activeABTrack === 'native') {
                btnInstantAB.className = "tactile-btn px-4 py-2.5 rounded-xl bg-studio-800 text-accent-amber border border-amber-500/50 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/10";
                if (abStatusText) abStatusText.textContent = "MẪU BẢN XỨ";
            } else if (state.activeABTrack === 'user') {
                btnInstantAB.className = "tactile-btn px-4 py-2.5 rounded-xl bg-emerald-500/20 text-accent-sage border border-emerald-500/60 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20";
                if (abStatusText) abStatusText.textContent = "GIỌNG CỦA BẠN";
            } else {
                btnInstantAB.className = "tactile-btn px-4 py-2.5 rounded-xl bg-studio-800 text-gray-200 border border-studio-border text-xs font-bold flex items-center gap-2";
                if (abStatusText) abStatusText.textContent = "KÊNH ĐÔI L/R";
            }
        }
    }

    function cancelSequentialAB() {
        isSequentialABPending = false;
        if (sequentialTimer) {
            clearTimeout(sequentialTimer);
            sequentialTimer = null;
        }
    }

    function playSequentialAB() {
        cancelSequentialAB();
        const seg = AudioEngine.getCurrentSegment();
        const rec = state.userRecordings[state.currentIdx];
        if (!seg || !rec) {
            alert("Vui lòng tải audio và thu âm giọng bạn trước!");
            return;
        }

        AudioEngine.play(0);
        isSequentialABPending = true;
        state.activeABTrack = 'native';
        updateABButtonUI();

        const waitMs = (seg.duration / state.playbackRate) * 1000 + 350;
        sequentialTimer = setTimeout(() => {
            if (isSequentialABPending && (state.isPlaying || state.activeABTrack === 'native')) {
                isSequentialABPending = false;
                AudioEngine.playUserRecording(0);
                state.activeABTrack = 'user';
                updateABButtonUI();
            }
        }, waitMs);
    }

    function downloadCurrentRecording() {
        const rec = state.userRecordings[state.currentIdx];
        if (!rec || !rec.blob) return;

        const isMp4 = rec.blob.type && (rec.blob.type.includes('mp4') || rec.blob.type.includes('m4a'));
        const ext = isMp4 ? 'm4a' : 'webm';

        const url = URL.createObjectURL(rec.blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `DictaShadow_Sentence_${state.currentIdx + 1}.${ext}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    function evaluateMatchScore() {
        const seg = AudioEngine.getCurrentSegment();
        const rec = state.userRecordings[state.currentIdx];
        const rhythmScoreBadge = document.getElementById('rhythmScoreBadge');
        const pitchScoreBadge = document.getElementById('pitchScoreBadge');
        const tempoFeedbackText = document.getElementById('tempoFeedbackText');

        if (!seg || !rec) return;

        const durDiff = (rec.duration - seg.duration).toFixed(1);
        const durRatio = Math.min(seg.duration, rec.duration) / Math.max(seg.duration, rec.duration);
        const rhythmScore = Math.min(99, Math.max(60, Math.round(durRatio * 100)));
        rec.rhythmScore = rhythmScore;

        if (rhythmScoreBadge) {
            rhythmScoreBadge.textContent = `${rhythmScore}%`;
            rhythmScoreBadge.className = rhythmScore >= 85 ? "text-accent-emerald font-bold" : "text-accent-amber font-bold";
        }

        let speedText = "Tốc độ chuẩn (1.0x)";
        if (rec.duration > seg.duration + 0.6) {
            speedText = `Hơi chậm (+${durDiff}s)`;
        } else if (rec.duration < seg.duration - 0.6) {
            speedText = `Hơi nhanh (${durDiff}s)`;
        }

        if (tempoFeedbackText) {
            tempoFeedbackText.textContent = speedText;
        }

        // Calculate Pitch Similarity Score ($F_0$ Melodic Contour Match)
        if (SpeechAnalysis && state.audioBuffer && rec.buffer) {
            if (!cachedNativePitch) {
                cachedNativePitch = SpeechAnalysis.extractPitchContour(state.audioBuffer, seg.start, seg.duration, 70);
            }
            if (!cachedUserPitch) {
                cachedUserPitch = SpeechAnalysis.extractPitchContour(rec.buffer, 0, rec.duration, 70);
            }

            const pitchSimilarity = SpeechAnalysis.calculatePitchSimilarity(cachedNativePitch, cachedUserPitch);
            rec.pitchScore = pitchSimilarity;

            if (pitchScoreBadge) {
                pitchScoreBadge.textContent = `${pitchSimilarity}%`;
                pitchScoreBadge.className = pitchSimilarity >= 75 ? "text-accent-sage font-bold" : "text-accent-amber font-bold";
            }

            // Refresh take chip badges with updated scores
            renderTakeChips();

            // Harmonic Resonance Glow when Rhythm & Pitch Lock together
            const userWaveformBox = document.getElementById('userWaveformBox');
            if (userWaveformBox) {
                if (pitchSimilarity >= 75 && rhythmScore >= 80) {
                    userWaveformBox.classList.add('harmonic-resonance-active');
                    AudioEngine.playSynthesizedSound('resonance');
                } else {
                    userWaveformBox.classList.remove('harmonic-resonance-active');
                }
            }

            // Version 4.0: Retro Pixel Game Loop Shadowing Hook
            if (root.App && root.App.PixelGameLoop && typeof root.App.PixelGameLoop.onShadowingEvaluated === 'function') {
                root.App.PixelGameLoop.onShadowingEvaluated({
                    rhythmScore,
                    pitchScore: rec.pitchScore || rhythmScore,
                    takeNum: state.activeTakeNum || 1
                });
            }
        }
    }

    root.App = root.App || {};
    root.App.Shadowing = {
        initShadowing,
        toggleRecording,
        redrawWaveforms,
        renderWaveformCanvas,
        drawNativeWaveform,
        drawUserWaveform,
        updateWaveformPlayhead,
        updateABButtonUI,
        renderProsodyTeleprompter,
        onSegmentEnded,
        cancelSequentialAB,
        setShadowingMode,
        setShadowingStep,
        toggleBlindMode,
        selectTake,
        renderTakeChips
    };

})(typeof window !== 'undefined' ? window : this);
