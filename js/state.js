/**
 * DictaShadow Studio - Central Application State (js/state.js)
 */
(function (root) {
    'use strict';

    const listeners = {};

    const rawState = {
        // Active Workspace Tab: 'dictation' | 'shadowing'
        activeTab: 'dictation',

        // Audio Engine
        audioBuffer: null,
        audioContext: null,
        gainNode: null,
        compressorNode: null,
        analyserNode: null,
        sourceNode: null,
        fadeGainNode: null,

        // Playback Position & Timing
        isPlaying: false,
        pausedAt: 0,          // Offset inside current segment in seconds
        startedAt: 0,         // AudioContext currentTime when playback started
        autoLoop: false,
        playbackRate: 1.0,
        volumeBoost: 1.0,
        smartPaddingMs: 300,
        groupSize: 1,

        // Subtitles & Data
        subs: [],
        currentIdx: 0,
        isSubRevealed: false,
        soundFXEnabled: true,

        // Dictation Engine State
        dictationMode: 'standard', // 'standard' | 'stream'
        standardInputText: '',
        lastDiffResult: null,

        // Masked Stream State
        streamTargetWords: [],
        streamCurrentWordIdx: 0,
        streamWordStatus: [],
        correctCharCount: 0,
        totalCharCount: 0,
        sessionStartTime: null,

        // Progress Tracking
        completedSentences: new Set(),

        // Phase 2: Shadowing Lab State
        isRecording: false,
        mediaRecorder: null,
        micStream: null,
        userRecordings: {}, // Map of { [idx]: { blob, buffer, duration } }
        activeABTrack: 'native', // 'native' | 'user'
        userSourceNode: null,
        isUserPlaying: false,

        // Vinyl Rotary Jog State
        isJogging: false,
        vinylRotation: 0,
        lastJogAngle: 0,
        jogScrubDelta: 0
    };

    const state = typeof Proxy !== 'undefined' ? new Proxy(rawState, {
        set(target, prop, value) {
            const prev = target[prop];
            target[prop] = value;
            if (prev !== value && listeners[prop]) {
                listeners[prop].forEach(fn => fn(value, prev));
            }
            return true;
        }
    }) : rawState;

    function set(key, value) {
        state[key] = value;
    }

    function on(key, callback) {
        if (!listeners[key]) listeners[key] = [];
        listeners[key].push(callback);
    }

    root.App = root.App || {};
    root.App.state = state;
    root.App.setState = set;
    root.App.onStateChange = on;

})(typeof window !== 'undefined' ? window : this);
