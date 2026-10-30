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
        dictationMode: 'standard', // 'standard' | 'stream' | 'cloze'
        standardInputText: '',
        lastDiffResult: null,
        gradingStrictness: 'lenient', // 'lenient' | 'strict'
        autoPauseOnType: false,       // Auto-pause audio while typing
        hintStage: 0,                 // Progressive hint level (0 to 4)

        // Cloze Dictation Mode State (Phase 3 - Lyre Studio)
        clozeBlanks: [],              // Array of { blankIdx, wordIdx, cleanWord, originalWord, leadingPunct, trailingPunct, hintLevel, isRevealed, isCorrect, userInput }

        // Masked Stream State
        streamTargetWords: [],
        streamCurrentWordIdx: 0,
        streamWordStatus: [],
        correctCharCount: 0,
        totalCharCount: 0,
        sessionStartTime: null,

        // Progress Tracking & Mistake Bank (Phase 4)
        completedSentences: new Set(),
        mistakeSentences: new Map(), // Map of { sentenceIdx: { accuracy, text, userText, diagnosed, timestamp } }
        studyFilter: 'all',          // 'all' | 'mistakes'
        studyStreak: 1,              // Consecutive days streak
        sessionSeconds: 0,           // Active study seconds in current session
        phoneticErrors: { ed: 0, s: 0, articles: 0, prepositions: 0, contractions: 0 },

        // Phase 4: Dual Mastery Loop & Smart Mistake Drill Queue
        isDualMasteryActive: false,
        isDrillActive: false,
        drillQueue: [],
        drillIndex: 0,

        // Phase 2: Shadowing Lab State
        isRecording: false,
        mediaRecorder: null,
        micStream: null,
        userRecordings: {}, // Map of { [idx]: { blob, buffer, duration } }
        activeABTrack: 'native', // 'native' | 'user'
        userSourceNode: null,
        isUserPlaying: false,

        // Phase 5: Mini-Waveform A-B Micro-Loop, Multi-Take & Studio Customization
        microLoopA: null,
        microLoopB: null,
        soundProfile: 'typewriter', // 'typewriter' | 'cherry' | 'soft' | 'mute'
        fontSize: 24,
        userTakes: {},              // Map of { [idx]: [ take1, take2, take3 ] }
        activeTakeNum: 1,

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
