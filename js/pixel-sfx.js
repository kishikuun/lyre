/**
 * ============================================================================
 * LYRE STUDIO — PROCEDURAL CHIPTUNE & TACTILE SFX ENGINE
 * Version 4.0 (Acoustic Forensic Workbench)
 * 
 * 100% Pure Web Audio API procedural synthesis.
 * Zero external MP3/WAV file downloads, zero network latency, 100% offline.
 * 
 * Authentic sound models:
 * 1. Papers, Please: Heavy rubber stamp thud & citation alarm buzzer
 * 2. Deltarune: 8-bit square wave dialogue typewriter blip
 * 3. Ace Attorney: Resonant courtroom gavel knock & dramatic breakthrough chord
 * 4. Metal Gear Solid: Codec 140.85 radio transceiver squelch
 * 5. Paperboy: Coin-op arcade chime fanfare (C5 -> E5 -> G5 -> C6)
 * 6. Return of the Obra Dinn: Forensic ledger ink scratch & lock-in
 * ============================================================================
 */

(function (root) {
    'use strict';

    let audioCtx = null;
    let masterGain = null;
    let isMuted = false;
    let typewriterEnabled = true;
    let volumeLevel = 0.8;

    /**
     * Khởi tạo hoặc lấy Web Audio Context hiện hành
     */
    function getContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (audioCtx && !masterGain) {
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(volumeLevel, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
        }
        return audioCtx;
    }

    /**
     * Tạo một GainNode kết nối trực tiếp vào masterGain
     */
    function createSubGain(ctx, initialGain = 1) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(isMuted ? 0 : initialGain * volumeLevel, ctx.currentTime);
        gain.connect(masterGain || ctx.destination);
        return gain;
    }

    const PixelSFX = {
        /**
         * Gán audio context từ AudioEngine bên ngoài nếu có
         */
        init: function (ctx) {
            if (ctx) audioCtx = ctx;
            getContext();
            return this;
        },

        isAvailable: function () {
            return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
        },

        setVolume: function (vol) {
            volumeLevel = Math.max(0, Math.min(1, vol));
            if (masterGain && audioCtx) {
                masterGain.gain.setValueAtTime(isMuted ? 0 : volumeLevel, audioCtx.currentTime);
            }
        },

        getVolume: function () {
            return volumeLevel;
        },

        setMuted: function (muted) {
            isMuted = !!muted;
            if (masterGain && audioCtx) {
                masterGain.gain.setValueAtTime(isMuted ? 0 : volumeLevel, audioCtx.currentTime);
            }
        },

        isMuted: function () {
            return isMuted;
        },

        setTypewriterBlipsEnabled: function (enabled) {
            typewriterEnabled = !!enabled;
        },

        isTypewriterBlipsEnabled: function () {
            return typewriterEnabled;
        },

        // ====================================================================
        // 1. PAPERS, PLEASE: TIẾNG ĐẬP BÀN CON DẤU UY LỰC (RUBBER STAMP THUD)
        // ====================================================================
        playStampThud: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            // Tầng A: Sub-bass Sine drop (90Hz -> 32Hz) tạo độ nặng cơ học đập xuống bàn
            const subOsc = ctx.createOscillator();
            const subGain = createSubGain(ctx, 0.75);
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(95, now);
            subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

            subGain.gain.setValueAtTime(0.75 * volumeLevel, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            subOsc.connect(subGain);
            subOsc.start(now);
            subOsc.stop(now + 0.15);

            // Tầng B: Xung White Noise lọc dải thấp (Lowpass 800Hz -> 100Hz) tạo tiếng vỗ cao su lên giấy
            const bufSize = Math.floor(ctx.sampleRate * 0.08);
            const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const output = noiseBuf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = noiseBuf;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(850, now);
            filter.frequency.exponentialRampToValueAtTime(120, now + 0.08);

            const noiseGain = createSubGain(ctx, 0.45);
            noiseGain.gain.setValueAtTime(0.45 * volumeLevel, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            noiseSrc.connect(filter);
            filter.connect(noiseGain);
            noiseSrc.start(now);
        },

        // ====================================================================
        // 2. PAPERS, PLEASE: CÒI BÁO ĐỘNG TỪ CHỐI NHẬP CẢNH (CITATION BUZZER)
        // ====================================================================
        playDeniedBuzzer: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = createSubGain(ctx, 0.5);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.setValueAtTime(140, now + 0.07);

            gain.gain.setValueAtTime(0.5 * volumeLevel, now);
            gain.gain.setValueAtTime(0.5 * volumeLevel, now + 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.2);
        },

        // ====================================================================
        // 3. DELTARUNE: TIẾNG BÍP GÕ CHỮ RETRO (TYPEWRITER BLIP)
        // ====================================================================
        playTypewriterBlip: function () {
            if (!typewriterEnabled || isMuted) return;
            const ctx = getContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Biến thiên tần số ngẫu nhiên nhẹ (465Hz - 495Hz) cho âm thanh tự nhiên như game thật
            const baseFreq = 480 + (Math.random() * 30 - 15);

            const osc = ctx.createOscillator();
            const gain = createSubGain(ctx, 0.05);

            osc.type = 'square';
            osc.frequency.setValueAtTime(baseFreq, now);

            gain.gain.setValueAtTime(0.05 * volumeLevel, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);

            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.028);
        },

        // ====================================================================
        // 4. ACE ATTORNEY: TIẾNG GÕ BÚA QUAN TÒA / ĐẬP BÀN (GAVEL KNOCK)
        // ====================================================================
        playGavelKnock: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            // Hai tiếng gõ kép liên tiếp 40ms đặc trưng của búa gỗ
            [175, 255].forEach((freq, idx) => {
                const knockTime = now + idx * 0.045;
                const osc = ctx.createOscillator();
                const gain = createSubGain(ctx, 0.6);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, knockTime);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.7, knockTime + 0.1);

                gain.gain.setValueAtTime(0.6 * volumeLevel, knockTime);
                gain.gain.exponentialRampToValueAtTime(0.001, knockTime + 0.11);

                osc.connect(gain);
                osc.start(knockTime);
                osc.stop(knockTime + 0.12);
            });
        },

        // ====================================================================
        // 5. ACE ATTORNEY: LỆNH HÔ KỊCH TÍNH (HOLD IT! & OBJECTION HIT)
        // ====================================================================
        playHoldItSound: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            // Hợp âm kịch tính 3 nốt (F4, A4, C5)
            const freqs = [349.23, 440.00, 523.25];
            freqs.forEach((f) => {
                const osc = ctx.createOscillator();
                const gain = createSubGain(ctx, 0.25);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, now);

                gain.gain.setValueAtTime(0.25 * volumeLevel, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.24);
            });
        },

        // ====================================================================
        // 6. METAL GEAR SOLID: RADIO CODEC SQUELCH (TUA BĂNG / BẮT SÓNG)
        // ====================================================================
        playCodecSquelch: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            // White noise burst qua bandpass filter 1.8kHz
            const bufSize = Math.floor(ctx.sampleRate * 0.07);
            const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const output = noiseBuf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = noiseBuf;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.Q.setValueAtTime(2.5, now);

            const gain = createSubGain(ctx, 0.35);
            gain.gain.setValueAtTime(0.35 * volumeLevel, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

            noiseSrc.connect(filter);
            filter.connect(gain);
            noiseSrc.start(now);
        },

        // ====================================================================
        // 7. PAPERBOY: FANFARE CHIẾN THẮNG ARCADE (COIN-OP CHIME)
        // ====================================================================
        playCoinOpChime: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            // Rải nốt thăng hoa: C5 (523Hz), E5 (659Hz), G5 (783Hz), C6 (1046Hz)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            const noteDuration = 0.055;

            notes.forEach((freq, idx) => {
                const noteTime = now + idx * noteDuration;
                const osc = ctx.createOscillator();
                const gain = createSubGain(ctx, 0.25);

                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.25 * volumeLevel, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + (idx === notes.length - 1 ? 0.25 : 0.05));

                osc.connect(gain);
                osc.start(noteTime);
                osc.stop(noteTime + (idx === notes.length - 1 ? 0.26 : 0.06));
            });
        },

        // ====================================================================
        // 8. RETURN OF THE OBRA DINN: KHÓA MỰC VĨNH VIỄN (PERMANENT INK LOCK)
        // ====================================================================
        playInkLockSound: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            // Tiếng quẹt ngòi bút sắt sắc sảo (Highpass 3kHz)
            const bufSize = Math.floor(ctx.sampleRate * 0.09);
            const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const output = noiseBuf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = noiseBuf;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(3200, now);

            const gain = createSubGain(ctx, 0.2);
            gain.gain.setValueAtTime(0.2 * volumeLevel, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            noiseSrc.connect(filter);
            filter.connect(gain);
            noiseSrc.start(now);
        },

        // ====================================================================
        // 9. ACE ATTORNEY: LỆNH HÔ PHẢN BIỆN [TAKE THAT!]
        // ====================================================================
        playTakeThatSound: function () {
            const ctx = getContext();
            if (!ctx || isMuted) return;
            const now = ctx.currentTime;

            // Sóng tam giác vút cao thần tốc: 440Hz -> 1050Hz (50ms)
            const osc = ctx.createOscillator();
            const gain = createSubGain(ctx, 0.35);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(1050, now + 0.05);

            gain.gain.setValueAtTime(0.35 * volumeLevel, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.09);

            // Theo sau ngay bởi tiếng gõ búa tòa án đanh thép
            setTimeout(() => {
                this.playGavelKnock();
            }, 60);
        },

        // ====================================================================
        // 10. LO-FI RETRO CHIPTUNE AMBIENT BGM (PROCEDURAL WEB AUDIO SYNTHESIS)
        // ====================================================================
        _bgmState: {
            timer: null,
            step: 0,
            isPlaying: false,
            gainNode: null
        },

        startLofiChiptuneBGM: function () {
            const ctx = getContext();
            if (!ctx || this._bgmState.isPlaying) return;

            // Chuỗi hợp âm nhẹ nhàng: Am -> F -> C -> G (220Hz, 174Hz, 261Hz, 196Hz)
            const progression = [
                [220.00, 261.63, 329.63, 440.00], // Am
                [174.61, 220.00, 261.63, 349.23], // F
                [261.63, 329.63, 392.00, 523.25], // C
                [196.00, 246.94, 293.66, 392.00]  // G
            ];

            if (this._bgmState.isPlaying) {
                this.stopLofiChiptuneBGM();
            }

            this._bgmState.isPlaying = true;
            this._bgmState.step = 0;

            const bgmGain = ctx.createGain();
            bgmGain.gain.setValueAtTime(0.04 * volumeLevel, ctx.currentTime);
            bgmGain.connect(ctx.destination);
            this._bgmState.gainNode = bgmGain;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(580, ctx.currentTime);
            filter.connect(bgmGain);

            this._bgmState.timer = setInterval(() => {
                if (!this._bgmState.isPlaying || isMuted) return;
                const now = ctx.currentTime;
                const chordIdx = Math.floor(this._bgmState.step / 4) % progression.length;
                const noteIdx = this._bgmState.step % 4;
                const freq = progression[chordIdx][noteIdx];

                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                noteGain.gain.setValueAtTime(0.08, now);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

                osc.connect(noteGain);
                noteGain.connect(filter);

                osc.start(now);
                osc.stop(now + 0.24);

                this._bgmState.step = (this._bgmState.step + 1) % 16;
            }, 260); // 115 BPM lofi chill tempo
        },

        stopLofiChiptuneBGM: function () {
            if (this._bgmState.timer) {
                clearInterval(this._bgmState.timer);
                this._bgmState.timer = null;
            }
            if (this._bgmState.gainNode) {
                try { this._bgmState.gainNode.disconnect(); } catch (e) {}
                this._bgmState.gainNode = null;
            }
            this._bgmState.isPlaying = false;
        },

        isBGMPlaying: function () {
            return this._bgmState.isPlaying;
        },

        toggleBGM: function () {
            if (this.isBGMPlaying()) {
                this.stopLofiChiptuneBGM();
                return false;
            } else {
                this.startLofiChiptuneBGM();
                return true;
            }
        }
    };

    // UMD Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PixelSFX;
    }
    root.App = root.App || {};
    root.App.PixelSFX = PixelSFX;

})(typeof window !== 'undefined' ? window : global);
