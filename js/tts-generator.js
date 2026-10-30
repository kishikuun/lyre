/**
 * Lyre Studio - Text-to-Speech Engine & Lesson Generator (js/tts-generator.js)
 * Transforms any pasted English article or paragraph into an interactive
 * dictation lesson with automatic sentence segmentation, timestamps,
 * synthetic audio waveform generation, and browser Web Speech synthesis.
 */
(function (root) {
    'use strict';

    // Common abbreviations that shouldn't split sentences
    const ABBREVIATIONS = [
        'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr',
        'e.g', 'i.e', 'etc', 'vs', 'ph.d', 'm.d', 'b.a', 'm.a',
        'u.s', 'u.k', 'e.u', 'u.n', 'st', 'ave', 'blvd',
        'a.m', 'p.m', 'gen', 'rep', 'sen', 'dept', 'est'
    ];

    /**
     * Protect abbreviations and numbers with decimals from false sentence splits
     */
    function protectAbbreviations(text) {
        if (!text) return '';
        let processed = text;

        // 1. Protect numbers with decimals (e.g. 3.14, $19.99, 1.5x)
        processed = processed.replace(/(\d+)\.(\d+)/g, '$1__DECIMAL__$2');

        // 2. Protect multi-dot abbreviations like U.S.A., Ph.D., e.g., i.e.
        processed = processed.replace(/\b([A-Za-z])\.([A-Za-z])\./g, '$1__DOT__$2__DOT__');
        processed = processed.replace(/\b([A-Za-z])\.([A-Za-z])\.([A-Za-z])\./g, '$1__DOT__$2__DOT__$3__DOT__');

        // 3. Protect standard word abbreviations (case-insensitive)
        ABBREVIATIONS.forEach(abbr => {
            const regex = new RegExp(`\\b(${abbr})\\.`, 'gi');
            processed = processed.replace(regex, '$1__ABBR_DOT__');
        });

        return processed;
    }

    /**
     * Restore protected tokens back to proper punctuation
     */
    function restoreAbbreviations(text) {
        if (!text) return '';
        return text
            .replace(/__DECIMAL__/g, '.')
            .replace(/__DOT__/g, '.')
            .replace(/__ABBR_DOT__/g, '.');
    }

    /**
     * Split continuous raw English text into clean sentences
     */
    function splitIntoSentences(rawText) {
        if (!rawText || typeof rawText !== 'string') return [];

        const cleaned = rawText
            .replace(/\r\n/g, '\n')
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleaned) return [];

        const protectedText = protectAbbreviations(cleaned);

        // Split on period, exclamation, question mark followed by quote or space
        const sentenceRegex = /([.!?]+["'\)\]]?\s+)/g;
        const rawTokens = protectedText.split(sentenceRegex);

        const sentences = [];
        let buffer = '';

        for (let i = 0; i < rawTokens.length; i++) {
            const token = rawTokens[i];
            if (!token) continue;

            if (sentenceRegex.test(token)) {
                buffer += token;
                const restored = restoreAbbreviations(buffer).trim();
                if (restored.length > 0) {
                    sentences.push(restored);
                }
                buffer = '';
            } else {
                buffer += token;
            }
        }

        if (buffer.trim().length > 0) {
            const restored = restoreAbbreviations(buffer).trim();
            if (restored.length > 0) {
                sentences.push(restored);
            }
        }

        return sentences;
    }

    /**
     * Estimate realistic duration for each sentence and generate contiguous timestamps
     * @param {Array<string>} sentences
     * @param {number} wpm Words per minute (default 140)
     */
    function estimateSentenceDurations(sentences, wpm = 140) {
        if (!Array.isArray(sentences)) return [];

        const safeWPM = Math.max(90, Math.min(220, wpm || 140));
        const wordsPerSecond = safeWPM / 60;
        const gapBetweenSentences = 0.45; // 450ms natural breathing space

        let currentTime = 0.0;
        const subs = [];

        sentences.forEach((text, idx) => {
            const cleanText = text.trim();
            if (!cleanText) return;

            const words = cleanText.split(/\s+/).filter(w => w.length > 0);
            const wordCount = words.length;

            // Character length nuance (longer words add phonetic articulation time)
            const charCount = cleanText.length;
            const avgWordLength = wordCount > 0 ? charCount / wordCount : 5;
            const lengthModifier = 1.0 + (avgWordLength - 5.0) * 0.04;

            // Punctuation pauses (commas add 200ms, colons/semicolons add 250ms)
            const commaCount = (cleanText.match(/[,;:]/g) || []).length;
            const pauseSeconds = commaCount * 0.22;

            // Base duration with minimum 1.5s
            const rawDuration = (wordCount / wordsPerSecond) * lengthModifier + pauseSeconds;
            const duration = Math.max(1.6, Math.round(rawDuration * 10) / 10);

            const start = Math.round(currentTime * 100) / 100;
            const end = Math.round((currentTime + duration) * 100) / 100;

            subs.push({
                id: idx + 1,
                start: start,
                end: end,
                duration: Math.round((end - start) * 10) / 10,
                text: cleanText
            });

            currentTime = end + gapBetweenSentences;
        });

        return subs;
    }

    /**
     * Generate synthetic speech audio buffer for visual waveforms and seeking
     * Creates realistic vocal formants and syllable envelopes so Mini-Waveform
     * renders realistic speech peaks instead of blank or flat noise.
     */
    function generateSyntheticAudioBuffer(audioCtx, totalDuration, subs) {
        if (!audioCtx || !totalDuration || totalDuration <= 0) return null;

        const sampleRate = audioCtx.sampleRate || 44100;
        const totalSamples = Math.ceil(totalDuration * sampleRate);
        const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
        const channelData = buffer.getChannelData(0);

        if (!Array.isArray(subs) || subs.length === 0) return buffer;

        // Populate waveform peaks matching sentence boundaries and syllable rhythm
        subs.forEach(seg => {
            const startSample = Math.floor(seg.start * sampleRate);
            const endSample = Math.min(totalSamples, Math.floor(seg.end * sampleRate));
            const durationSamples = endSample - startSample;

            if (durationSamples <= 0) return;

            // Syllable rate: ~4.5 syllables per second
            const syllableFreq = 4.5;
            const f0 = 140; // Fundamental vocal cord frequency (Hz)
            const f1 = 550; // Vowel formant resonance (Hz)

            for (let i = 0; i < durationSamples; i++) {
                const sampleIdx = startSample + i;
                if (sampleIdx >= totalSamples) break;

                const t = i / sampleRate;

                // Envelope: Smooth fade-in and fade-out at sentence boundaries (60ms)
                let edgeFade = 1.0;
                const fadeDuration = 0.06;
                if (t < fadeDuration) {
                    edgeFade = t / fadeDuration;
                } else if (t > seg.duration - fadeDuration) {
                    edgeFade = Math.max(0, (seg.duration - t) / fadeDuration);
                }

                // Syllabic modulation (loudness pulse per syllable)
                const syllablePulse = Math.sin(2 * Math.PI * syllableFreq * t);
                const syllableEnvelope = Math.max(0, syllablePulse);

                // Acoustic carrier: vocal pitch + formant harmonic
                const carrier = 0.6 * Math.sin(2 * Math.PI * f0 * t) +
                                0.4 * Math.sin(2 * Math.PI * f1 * t);

                // Modulate with realistic speech dynamics
                channelData[sampleIdx] = carrier * (0.2 + 0.8 * syllableEnvelope) * edgeFade * 0.45;
            }
        });

        return buffer;
    }

    /**
     * Select the best available natural English voice from browser Web Speech Synthesis
     */
    function getBestEnglishVoice(preferredLang = 'en-US') {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        // 1. Natural / Online high quality English voices (Edge / Chrome / Apple)
        const naturalVoice = voices.find(v =>
            v.lang.toLowerCase().startsWith('en') &&
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Guy'))
        );
        if (naturalVoice) return naturalVoice;

        // 2. Preferred language match (e.g. en-US or en-GB)
        const langMatch = voices.find(v => v.lang.toLowerCase() === preferredLang.toLowerCase());
        if (langMatch) return langMatch;

        // 3. Any English voice
        const anyEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
        if (anyEnglish) return anyEnglish;

        return voices[0] || null;
    }

    let activeUtterance = null;

    /**
     * Speak a sentence aloud using Web Speech Synthesis
     */
    function speakSentence(text, options = {}) {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        if (!text || !text.trim()) return;

        const utterance = new SpeechSynthesisUtterance(text.trim());
        const voice = options.voice || getBestEnglishVoice(options.lang || 'en-US');
        if (voice) utterance.voice = voice;

        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;

        if (options.onstart) utterance.onstart = options.onstart;
        if (options.onend) utterance.onend = options.onend;
        if (options.onerror) utterance.onerror = options.onerror;

        activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    /**
     * Stop any active Web Speech playback
     */
    function cancelSpeech() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        activeUtterance = null;
    }

    /**
     * Complete pipeline: parse text, estimate timestamps, and return ready-to-learn lesson object
     */
    function createLessonFromText(rawText, options = {}) {
        const sentences = splitIntoSentences(rawText);
        if (sentences.length === 0) {
            return {
                title: options.title || 'Untitled Lesson',
                subs: [],
                totalDuration: 0,
                error: 'Không tìm thấy câu tiếng Anh hợp lệ nào trong văn bản vừa dán.'
            };
        }

        const wpm = options.wpm || 140;
        const subs = estimateSentenceDurations(sentences, wpm);
        const lastSub = subs[subs.length - 1];
        const totalDuration = lastSub ? lastSub.end : 0;

        return {
            title: options.title || `Custom Lesson (${sentences.length} câu)`,
            subs: subs,
            totalDuration: totalDuration,
            error: null
        };
    }

    root.App = root.App || {};
    root.App.TTSGenerator = {
        protectAbbreviations,
        restoreAbbreviations,
        splitIntoSentences,
        estimateSentenceDurations,
        generateSyntheticAudioBuffer,
        getBestEnglishVoice,
        speakSentence,
        cancelSpeech,
        createLessonFromText
    };

})(typeof window !== 'undefined' ? window : this);

