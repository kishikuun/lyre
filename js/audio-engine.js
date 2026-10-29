/**
 * DictaShadow Studio - Web Audio DSP & Transport Engine (js/audio-engine.js)
 */
(function (root) {
    'use strict';

    const state = root.App.state;
    let playbackTimeout = null;
    let tickerInterval = null;
    let cachedClickNoiseBuffer = null;

    function initAudioContext() {
        if (!state.audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            state.audioContext = new AudioContextClass();

            // 1. Gain Node (Booster 100% - 400%)
            state.gainNode = state.audioContext.createGain();
            state.gainNode.gain.setValueAtTime(state.volumeBoost, state.audioContext.currentTime);

            // 2. Dynamics Compressor (Chống vỡ tiếng, bảo vệ màng loa)
            state.compressorNode = state.audioContext.createDynamicsCompressor();
            state.compressorNode.threshold.setValueAtTime(-14, state.audioContext.currentTime);
            state.compressorNode.knee.setValueAtTime(30, state.audioContext.currentTime);
            state.compressorNode.ratio.setValueAtTime(12, state.audioContext.currentTime);
            state.compressorNode.attack.setValueAtTime(0.003, state.audioContext.currentTime);
            state.compressorNode.release.setValueAtTime(0.25, state.audioContext.currentTime);

            // 3. Analyser Node (Stereo VU meter)
            state.analyserNode = state.audioContext.createAnalyser();
            state.analyserNode.fftSize = 64;

            // Connect DSP Graph: Gain -> Compressor -> Analyser -> Destination
            state.gainNode.connect(state.compressorNode);
            state.compressorNode.connect(state.analyserNode);
            state.analyserNode.connect(state.audioContext.destination);

            startVULoop();
        }

        if (state.audioContext.state === 'suspended') {
            state.audioContext.resume();
        }
    }

    function startVULoop() {
        const data = new Uint8Array(state.analyserNode.frequencyBinCount);
        const vuContainer = document.getElementById('vuMeterBars');
        if (!vuContainer) return;
        const bars = vuContainer.querySelectorAll('div');

        function loop() {
            if (state.isPlaying && state.analyserNode) {
                state.analyserNode.getByteFrequencyData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i];
                const avg = sum / data.length;
                const level = Math.min(1, avg / 110);
                const count = Math.round(level * bars.length);

                bars.forEach((bar, idx) => {
                    if (idx < count) {
                        if (idx >= 6) bar.className = 'w-1 h-3 rounded-xs bg-accent-rose shadow-sm shadow-rose-500/50';
                        else if (idx >= 4) bar.className = 'w-1 h-3 rounded-xs bg-accent-amber shadow-sm shadow-amber-500/50';
                        else bar.className = 'w-1 h-3 rounded-xs bg-accent-emerald shadow-sm shadow-emerald-500/50';
                    } else {
                        bar.className = 'w-1 h-3 rounded-xs bg-studio-800';
                    }
                });
            } else {
                bars.forEach(bar => bar.className = 'w-1 h-3 rounded-xs bg-studio-800');
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    function getCurrentSegment() {
        if (!state.subs.length) return null;
        const startIdx = state.currentIdx;
        const endIdx = Math.min(state.currentIdx + state.groupSize - 1, state.subs.length - 1);

        const rawStart = state.subs[startIdx].start;
        const rawEnd = state.subs[endIdx].end;
        const text = state.subs.slice(startIdx, endIdx + 1).map(s => s.text).join(' ');

        // Apply Smart Subtitle Smoothing
        const paddingSec = state.smartPaddingMs / 1000;
        const paddedStart = Math.max(0, rawStart - paddingSec);
        const maxEnd = state.audioBuffer ? state.audioBuffer.duration : rawEnd + paddingSec;
        const paddedEnd = Math.min(maxEnd, rawEnd + paddingSec);
        const duration = Math.max(0.2, paddedEnd - paddedStart);

        return {
            start: paddedStart,
            end: paddedEnd,
            rawStart,
            rawEnd,
            duration,
            text,
            startIdx,
            endIdx
        };
    }

    /**
     * Extract audio peak samples for waveform visualization
     */
    function extractWaveformPeaks(buffer, startSec, durationSec, numPeaks = 100) {
        if (!buffer) return new Float32Array(numPeaks);

        const sampleRate = buffer.sampleRate;
        const startSample = Math.floor(startSec * sampleRate);
        const totalSamples = Math.floor(durationSec * sampleRate);
        const channelData = buffer.getChannelData(0);

        const peaks = new Float32Array(numPeaks);
        const blockSize = Math.floor(totalSamples / numPeaks);

        for (let i = 0; i < numPeaks; i++) {
            const blockStart = startSample + (i * blockSize);
            let max = 0;
            for (let j = 0; j < blockSize; j++) {
                const idx = blockStart + j;
                if (idx < channelData.length) {
                    const val = Math.abs(channelData[idx]);
                    if (val > max) max = val;
                }
            }
            peaks[i] = Math.min(1.0, max);
        }

        return peaks;
    }

    /**
     * Play native speaker audio from current segment
     */
    function play(targetOffset = null) {
        if (!state.audioBuffer) {
            alert("Vui lòng nạp file âm thanh MP3 trước!");
            return;
        }

        initAudioContext();
        const seg = getCurrentSegment();
        if (!seg) return;

        stopSourceOnly();
        stopUserAudioOnly();

        let offset = (targetOffset !== null) ? targetOffset : state.pausedAt;
        if (offset >= seg.duration - 0.05) offset = 0;
        offset = Math.max(0, Math.min(seg.duration - 0.05, offset));
        state.pausedAt = offset;

        const remainingSec = (seg.duration - offset) / state.playbackRate;

        state.sourceNode = state.audioContext.createBufferSource();
        state.sourceNode.buffer = state.audioBuffer;
        state.sourceNode.playbackRate.value = state.playbackRate;

        // Micro-envelope: 80ms Fade In & Fade Out
        const fadeGain = state.audioContext.createGain();
        state.fadeGainNode = fadeGain;
        const now = state.audioContext.currentTime;
        const fadeDur = Math.min(0.08, remainingSec / 3);

        fadeGain.gain.setValueAtTime(0.0001, now);
        fadeGain.gain.linearRampToValueAtTime(1.0, now + fadeDur);
        fadeGain.gain.setValueAtTime(1.0, now + Math.max(fadeDur, remainingSec - fadeDur));
        fadeGain.gain.linearRampToValueAtTime(0.0001, now + remainingSec);

        state.sourceNode.connect(fadeGain);
        fadeGain.connect(state.gainNode);

        const actualStart = seg.start + offset;
        state.sourceNode.start(0, actualStart, seg.duration - offset);
        state.startedAt = state.audioContext.currentTime;
        state.isPlaying = true;
        state.activeABTrack = 'native';

        // Tận dụng onended phần cứng Web Audio để bắt đúng lúc kết thúc (không bị trôi nhịp khi đổi speed hoặc ẩn tab)
        const currentSource = state.sourceNode;
        currentSource.onended = () => {
            if (state.sourceNode === currentSource && state.isPlaying && state.activeABTrack === 'native') {
                handleSegmentEnd();
            }
        };

        updatePlayUI(true);

        clearTimeout(playbackTimeout);
        playbackTimeout = setTimeout(() => {
            if (state.sourceNode === currentSource && state.isPlaying && state.activeABTrack === 'native') {
                handleSegmentEnd();
            }
        }, (remainingSec + 0.3) * 1000);

        startTicker(seg);
    }

    /**
     * Play User's recorded voice (Track B in Shadowing Lab)
     */
    function playUserRecording(targetOffset = null) {
        const recordingData = state.userRecordings[state.currentIdx];
        if (!recordingData || !recordingData.buffer) {
            alert("Bạn chưa thu âm cho câu này! Hãy bấm nút Thu Âm (R) để ghi âm giọng của bạn.");
            return;
        }

        initAudioContext();
        stopSourceOnly();
        stopUserAudioOnly();

        const buffer = recordingData.buffer;
        let offset = (targetOffset !== null) ? targetOffset : state.pausedAt;
        if (offset >= buffer.duration - 0.05) offset = 0;
        offset = Math.max(0, Math.min(buffer.duration - 0.05, offset));
        state.pausedAt = offset;

        const remaining = (buffer.duration - offset) / state.playbackRate;

        state.userSourceNode = state.audioContext.createBufferSource();
        state.userSourceNode.buffer = buffer;
        state.userSourceNode.playbackRate.value = state.playbackRate;
        state.userSourceNode.connect(state.gainNode);

        state.userSourceNode.start(0, offset, buffer.duration - offset);
        state.startedAt = state.audioContext.currentTime;
        state.isPlaying = true;
        state.isUserPlaying = true;
        state.activeABTrack = 'user';

        const currentUserSource = state.userSourceNode;
        currentUserSource.onended = () => {
            if (state.userSourceNode === currentUserSource && state.isPlaying && state.activeABTrack === 'user') {
                stopUserAudioOnly();
                state.isPlaying = false;
                state.isUserPlaying = false;
                state.pausedAt = 0;
                updatePlayUI(false);
            }
        };

        updatePlayUI(true);

        clearTimeout(playbackTimeout);
        playbackTimeout = setTimeout(() => {
            if (state.userSourceNode === currentUserSource && state.isPlaying && state.activeABTrack === 'user') {
                stopUserAudioOnly();
                state.isPlaying = false;
                state.isUserPlaying = false;
                state.pausedAt = 0;
                updatePlayUI(false);
            }
        }, (remaining + 0.3) * 1000);

        const seg = getCurrentSegment();
        if (seg) startTicker(seg);
    }

    /**
     * Instant A/B Track Switch
     */
    function toggleABTrack() {
        const curOffset = getCurrentOffset();
        if (state.activeABTrack === 'native') {
            state.activeABTrack = 'user';
            if (state.isPlaying) {
                playUserRecording(curOffset);
            }
        } else {
            state.activeABTrack = 'native';
            if (state.isPlaying) {
                play(curOffset);
            }
        }
        if (root.App.Shadowing) root.App.Shadowing.updateABButtonUI();
    }

    function getCurrentOffset() {
        const seg = getCurrentSegment();
        if (!seg) return 0;
        let cur = state.pausedAt;
        if (state.isPlaying && state.audioContext) {
            const elapsed = (state.audioContext.currentTime - state.startedAt) * state.playbackRate;
            cur += elapsed;
        }
        return Math.min(seg.duration, cur);
    }

    function pause() {
        if (root.App.Shadowing && root.App.Shadowing.cancelSequentialAB) {
            root.App.Shadowing.cancelSequentialAB();
        }
        if (!state.isPlaying) return;
        const seg = getCurrentSegment();
        if (seg && state.audioContext) {
            const elapsed = (state.audioContext.currentTime - state.startedAt) * state.playbackRate;
            state.pausedAt = Math.min(seg.duration, state.pausedAt + elapsed);
        }

        stopSourceOnly();
        stopUserAudioOnly();
        state.isPlaying = false;
        state.isUserPlaying = false;
        clearTimeout(playbackTimeout);
        clearInterval(tickerInterval);

        updatePlayUI(false);
    }

    function togglePlay() {
        if (state.isPlaying) {
            pause();
        } else {
            if (state.activeABTrack === 'user' && state.userRecordings[state.currentIdx]) {
                playUserRecording();
            } else {
                play();
            }
        }
    }

    function replay() {
        state.pausedAt = 0;
        if (state.activeABTrack === 'user' && state.userRecordings[state.currentIdx]) {
            playUserRecording(0);
        } else {
            play(0);
        }
    }

    function rewind(seconds = 2.0) {
        const seg = getCurrentSegment();
        if (!seg) return;

        playSynthesizedSound('tape-rewind');
        const curPos = getCurrentOffset();
        const newPos = Math.max(0, curPos - seconds);
        state.pausedAt = newPos;

        if (state.isPlaying) {
            if (state.activeABTrack === 'user') playUserRecording(newPos);
            else play(newPos);
        } else {
            updateTimeDisplay(seg.start + newPos, seg);
        }
    }

    function forward(seconds = 2.0) {
        const seg = getCurrentSegment();
        if (!seg) return;

        const curPos = getCurrentOffset();
        const newPos = Math.min(seg.duration - 0.1, curPos + seconds);
        state.pausedAt = newPos;

        if (state.isPlaying) {
            if (state.activeABTrack === 'user') playUserRecording(newPos);
            else play(newPos);
        } else {
            updateTimeDisplay(seg.start + newPos, seg);
        }
    }

    function seek(offsetInSegment) {
        const seg = getCurrentSegment();
        if (!seg) return;

        const safeOffset = Math.max(0, Math.min(seg.duration - 0.05, offsetInSegment));
        state.pausedAt = safeOffset;

        if (state.isPlaying) {
            if (state.activeABTrack === 'user') playUserRecording(safeOffset);
            else play(safeOffset);
        } else {
            updateTimeDisplay(seg.start + safeOffset, seg);
        }
    }

    function stopSourceOnly() {
        if (state.sourceNode) {
            const node = state.sourceNode;
            state.sourceNode = null;
            node.onended = null;
            try { node.stop(); } catch (e) { }
            node.disconnect();
        }
    }

    function stopUserAudioOnly() {
        if (state.userSourceNode) {
            const node = state.userSourceNode;
            state.userSourceNode = null;
            node.onended = null;
            try { node.stop(); } catch (e) { }
            node.disconnect();
        }
    }

    function handleSegmentEnd() {
        stopSourceOnly();
        stopUserAudioOnly();
        state.isPlaying = false;
        state.isUserPlaying = false;
        clearInterval(tickerInterval);
        state.pausedAt = 0;
        updatePlayUI(false);

        const seg = getCurrentSegment();
        if (seg) updateTimeDisplay(seg.end, seg);

        if (root.App.Shadowing && root.App.Shadowing.onSegmentEnded) {
            const handled = root.App.Shadowing.onSegmentEnded(seg);
            if (handled) return;
        }

        if (state.autoLoop) {
            setTimeout(() => {
                if (state.autoLoop && !state.isPlaying) {
                    if (state.activeABTrack === 'user') playUserRecording(0);
                    else play(0);
                }
            }, 350);
        }
    }

    function startTicker(seg) {
        clearInterval(tickerInterval);
        tickerInterval = setInterval(() => {
            if (state.isPlaying && state.audioContext) {
                const elapsed = (state.audioContext.currentTime - state.startedAt) * state.playbackRate;
                const currentPosInSeg = Math.min(seg.duration, state.pausedAt + elapsed);
                const absoluteTime = seg.start + currentPosInSeg;
                updateTimeDisplay(absoluteTime, seg);

                // Update Waveform Playhead in Shadowing Lab
                if (root.App.Shadowing) {
                    root.App.Shadowing.updateWaveformPlayhead(currentPosInSeg, seg.duration);
                }
            }
        }, 35);
    }

    function updateTimeDisplay(absTime, seg) {
        const curEl = document.getElementById('currentTimeDisplay');
        if (curEl) curEl.textContent = root.App.SRTParser.formatTime(absTime);

        const timelineProgress = document.getElementById('timelineProgress');
        const timelineThumb = document.getElementById('timelineThumb');
        if (timelineProgress && timelineThumb && seg) {
            const currentOffset = Math.max(0, absTime - seg.start);
            const percent = Math.min(100, Math.max(0, (currentOffset / seg.duration) * 100));
            timelineProgress.style.width = `${percent}%`;
            timelineThumb.style.left = `${percent}%`;
        }
    }

    function updatePlayUI(playing) {
        const btnPlay = document.getElementById('btnPlay');
        const playIcon = document.getElementById('playIcon');
        const reelL = document.getElementById('tapeReelWheelLeft');
        const reelR = document.getElementById('tapeReelWheelRight');

        if (reelL && reelR) {
            if (playing) {
                reelL.classList.remove('tape-paused');
                reelL.classList.add('tape-spinning');
                reelR.classList.remove('tape-paused');
                reelR.classList.add('tape-spinning');
            } else {
                reelL.classList.add('tape-paused');
                reelR.classList.add('tape-paused');
            }
        }

        if (btnPlay && playIcon) {
            if (playing) {
                btnPlay.className = "tactile-btn px-4 bg-accent-amber text-studio-950 font-bold is-active";
                playIcon.setAttribute('data-lucide', 'pause');
            } else {
                btnPlay.className = "tactile-btn px-4 bg-accent-amber text-studio-950 font-bold";
                playIcon.setAttribute('data-lucide', 'play');
            }
            if (window.lucide) lucide.createIcons();
        }

        const vinylDisk = document.getElementById('vinylDisk');
        if (vinylDisk) {
            if (playing) {
                vinylDisk.classList.remove('vinyl-paused');
                vinylDisk.classList.add('vinyl-spinning');
            } else {
                vinylDisk.classList.add('vinyl-paused');
            }
        }
    }

    function playOneShotTone(type, freqStart, freqEnd, gainStart, dur, delay = 0, filterFreq = 0) {
        const ctx = state.audioContext;
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, t);
        if (freqEnd && freqEnd !== freqStart) {
            osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur * 0.85);
        }
        gain.gain.setValueAtTime(gainStart, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        if (filterFreq > 0) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(filterFreq, t);
            osc.connect(filter);
            filter.connect(gain);
            osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
        } else {
            osc.connect(gain);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        }
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.005);
    }

    function playSynthesizedSound(type) {
        if (!state.soundFXEnabled) return;
        try {
            initAudioContext();
            const now = state.audioContext.currentTime;

            if (type === 'click' || type === 'switch') {
                // 1. Transient click
                playOneShotTone('triangle', 950, 100, 0.2, 0.025);

                // 2. Chassis thock (reusing pre-cached noise buffer to avoid GC allocations)
                if (!cachedClickNoiseBuffer) {
                    const bufLen = Math.floor(state.audioContext.sampleRate * 0.03);
                    cachedClickNoiseBuffer = state.audioContext.createBuffer(1, bufLen, state.audioContext.sampleRate);
                    const out = cachedClickNoiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufLen; i++) out[i] = (Math.random() * 2 - 1) * 0.3;
                }
                const noiseSrc = state.audioContext.createBufferSource();
                noiseSrc.buffer = cachedClickNoiseBuffer;
                const filter = state.audioContext.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1200, now);
                filter.Q.setValueAtTime(2.5, now);
                const noiseGain = state.audioContext.createGain();
                noiseGain.gain.setValueAtTime(0.18, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                noiseSrc.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(state.audioContext.destination);
                noiseSrc.onended = () => { noiseSrc.disconnect(); filter.disconnect(); noiseGain.disconnect(); };
                noiseSrc.start(now);
                noiseSrc.stop(now + 0.035);

                if (navigator.vibrate) navigator.vibrate(10);
            } else if (type === 'tape-load') {
                // Cassette Deck Latch: Click-Clack dual mechanical latch
                [0, 0.08].forEach((delay, idx) => {
                    playOneShotTone('triangle', idx === 0 ? 600 : 850, 80, 0.25, 0.035, delay);
                });
                if (navigator.vibrate) navigator.vibrate([15, 40, 20]);
            } else if (type === 'tape-rewind') {
                // High-speed tape motor spin whirr
                const osc = state.audioContext.createOscillator();
                const gain = state.audioContext.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.18);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                const filter = state.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2000, now);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(state.audioContext.destination);
                osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'stamp') {
                // Mechanical Quality Stamp: Sub-bass thud + paper slap
                playOneShotTone('sine', 140, 35, 0.4, 0.15);
                if (navigator.vibrate) navigator.vibrate([25]);
            } else if (type === 'tick') {
                // Subtle mechanical typewriter tap
                playOneShotTone('sine', 1100, 300, 0.07, 0.02);
            } else if (type === 'typewriter-space') {
                // Mechanical Spacebar Bar Strike: Deeper wooden/metal thud
                playOneShotTone('triangle', 320, 70, 0.16, 0.04);
            } else if (type === 'carriage-return') {
                // Vintage typewriter carriage bell chime
                playOneShotTone('sine', 2093, 2093, 0.18, 0.32);
            } else if (type === 'shutter') {
                // Mechanical Leica / studio shutter click-snap
                playOneShotTone('triangle', 1400, 120, 0.28, 0.03);
                if (navigator.vibrate) navigator.vibrate([15, 20]);
            } else if (type === 'resonance') {
                // Harmonic overtone resonance chord (A4, C#5, E5, A5)
                [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                    playOneShotTone('sine', freq, freq, 0.1, 0.55, idx * 0.04);
                });
            } else if (type === 'wrong') {
                playOneShotTone('sawtooth', 180, 90, 0.12, 0.09);
            } else if (type === 'success') {
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                    playOneShotTone('triangle', f, f, 0.1, 0.28, i * 0.06);
                });
            }
        } catch (e) { }
    }

    /**
     * Stereo Contrast / Binaural Shadowing Playback:
     * Native speaker in Left Ear (pan = -0.85), User recording in Right Ear (pan = +0.85)
     */
    let nativePanNode = null;
    let userPanNode = null;

    function playStereoContrast(targetOffset = null) {
        const seg = getCurrentSegment();
        const rec = state.userRecordings[state.currentIdx];
        if (!seg || !state.audioBuffer || !rec || !rec.buffer) {
            alert("Vui lòng nạp audio và thu âm giọng của bạn trước để nghe chế độ Kênh Đôi L/R!");
            return;
        }

        initAudioContext();
        stopSourceOnly();
        stopUserAudioOnly();

        let offset = (targetOffset !== null) ? targetOffset : state.pausedAt;
        if (offset >= seg.duration - 0.05) offset = 0;
        state.pausedAt = offset;

        // Native Source -> Stereo Panner Left (-0.85) -> Gain
        state.sourceNode = state.audioContext.createBufferSource();
        state.sourceNode.buffer = state.audioBuffer;
        state.sourceNode.playbackRate.value = state.playbackRate;

        if (state.audioContext.createStereoPanner) {
            nativePanNode = state.audioContext.createStereoPanner();
            nativePanNode.pan.setValueAtTime(-0.85, state.audioContext.currentTime);
            state.sourceNode.connect(nativePanNode);
            nativePanNode.connect(state.gainNode);
        } else {
            state.sourceNode.connect(state.gainNode);
        }

        // User Source -> Stereo Panner Right (+0.85) -> Gain
        state.userSourceNode = state.audioContext.createBufferSource();
        state.userSourceNode.buffer = rec.buffer;
        state.userSourceNode.playbackRate.value = state.playbackRate;

        if (state.audioContext.createStereoPanner) {
            userPanNode = state.audioContext.createStereoPanner();
            userPanNode.pan.setValueAtTime(0.85, state.audioContext.currentTime);
            state.userSourceNode.connect(userPanNode);
            userPanNode.connect(state.gainNode);
        } else {
            state.userSourceNode.connect(state.gainNode);
        }

        state.sourceNode.start(0, seg.start + offset, seg.duration - offset);
        state.userSourceNode.start(0, offset, rec.buffer.duration - offset);

        state.startedAt = state.audioContext.currentTime;
        state.isPlaying = true;
        state.activeABTrack = 'stereo';

        updatePlayUI(true);

        const maxDuration = Math.max(seg.duration - offset, rec.buffer.duration - offset);
        clearTimeout(playbackTimeout);
        playbackTimeout = setTimeout(() => {
            handleSegmentEnd();
        }, (maxDuration / state.playbackRate) * 1000);

        startTicker(seg);
    }

    root.App = root.App || {};
    root.App.AudioEngine = {
        initAudioContext,
        getCurrentSegment,
        extractWaveformPeaks,
        play,
        playUserRecording,
        playStereoContrast,
        toggleABTrack,
        pause,
        togglePlay,
        replay,
        rewind,
        forward,
        seek,
        playSynthesizedSound,
        updateTimeDisplay
    };

})(window);
