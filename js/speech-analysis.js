/**
 * DictaShadow Studio - Speech & Prosody Analysis Engine (js/speech-analysis.js)
 * High-End Scientific Features:
 * 1. Pitch Contour Extraction ($F_0$ Fundamental Frequency via Autocorrelation)
 * 2. Prosody & Rhythm Markup: Content Word Stress, Linking Sounds (‿), Breath Pauses (/ and //), Intonation Arrows (↗, ↘)
 * 3. Pitch Contour Shape Correlation & Intonation Similarity Score (%)
 * 4. In-Browser Speech Recognition Pronunciation Diagnostics (Web Speech API)
 * 5. Syllable & Speaking Rate (Syllables/sec & WPM) Calculation
 */
(function (root) {
    'use strict';

    // List of unstressed function words in English (including common contractions)
    const FUNCTION_WORDS = new Set([
        'a', 'an', 'the', 'in', 'on', 'at', 'for', 'of', 'to', 'with', 'by', 'from', 'as',
        'into', 'about', 'through', 'after', 'over', 'between', 'out', 'against', 'during',
        'without', 'before', 'under', 'around', 'among', 'and', 'but', 'or', 'nor', 'so',
        'yet', 'if', 'that', 'although', 'because', 'since', 'unless', 'while', 'where',
        'when', 'he', 'she', 'it', 'they', 'we', 'you', 'i', 'him', 'her', 'them', 'us',
        'me', 'his', 'its', 'their', 'our', 'your', 'my', 'this', 'that', 'these', 'those',
        'who', 'whom', 'whose', 'which', 'what', 'is', 'am', 'are', 'was', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will',
        'would', 'shall', 'should', 'may', 'might', 'must',
        "it's", "you'll", "there's", "i've", "they're", "we've", "haven't", "doesn't",
        "don't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't", "isn't", "aren't",
        "wasn't", "weren't", "hasn't", "hadn't", "i'm", "you're", "we're", "he's", "she's",
        "that's", "what's", "where's", "who's", "i'd", "you'd", "he'd", "she'd", "we'd",
        "they'd", "i'll", "he'll", "she'll", "we'll", "they'll"
    ]);

    const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

    /**
     * Pitch Autocorrelation Algorithm
     * Extracts pitch in Hz (75Hz - 450Hz range of human voice)
     */
    function autoCorrelatePitch(buffer, sampleRate) {
        const SIZE = buffer.length;
        let sumOfSquares = 0;
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            sumOfSquares += val * val;
        }
        const rms = Math.sqrt(sumOfSquares / SIZE);
        if (rms < 0.015) return -1; // Silence or background noise

        // Truncate non-relevant tails
        let r1 = 0, r2 = SIZE - 1;
        const thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        const trimmed = buffer.subarray(r1, r2);
        const len = trimmed.length;
        const c = new Float32Array(len);

        for (let i = 0; i < len; i++) {
            for (let j = 0; j < len - i; j++) {
                c[i] = c[i] + trimmed[j] * trimmed[j + i];
            }
        }

        let d = 0;
        while (d < len - 1 && c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < len; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        const T0 = maxpos;
        if (T0 > 0 && T0 < len) {
            const freq = sampleRate / T0;
            if (freq >= 75 && freq <= 450) {
                return freq;
            }
        }
        return -1;
    }

    /**
     * 3-Point Gaussian-Weighted Moving Average Smoothing Filter for Pitch Contours
     * Eliminates erratic pitch spikes caused by microphone jitter or whisper harmonics
     */
    function smoothPitchContour(rawPitches) {
        if (!rawPitches || rawPitches.length === 0) return new Float32Array(0);
        const len = rawPitches.length;
        const smoothed = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            if (rawPitches[i] <= 0) {
                smoothed[i] = 0;
                continue;
            }
            let sum = rawPitches[i] * 2;
            let weight = 2;
            if (i > 0 && rawPitches[i - 1] > 0) {
                sum += rawPitches[i - 1];
                weight += 1;
            }
            if (i < len - 1 && rawPitches[i + 1] > 0) {
                sum += rawPitches[i + 1];
                weight += 1;
            }
            smoothed[i] = Math.round((sum / weight) * 10) / 10;
        }
        return smoothed;
    }

    /**
     * Extract Pitch Contour Series across an AudioBuffer segment with Pitch Gate & Smoothing
     */
    function extractPitchContour(audioBuffer, startSec, durationSec, numPoints = 80, options = {}) {
        if (!audioBuffer) return new Float32Array(numPoints);

        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0);
        const startSample = Math.floor(startSec * sampleRate);
        const totalSamples = Math.floor(durationSec * sampleRate);

        const pitches = new Float32Array(numPoints);
        const windowSize = 1024;
        const step = Math.floor((totalSamples - windowSize) / numPoints);
        const pitchGateRMS = options.pitchGateRMS !== undefined ? options.pitchGateRMS : 0.015;

        for (let i = 0; i < numPoints; i++) {
            const offset = startSample + (i * Math.max(1, step));
            if (offset + windowSize <= channelData.length) {
                const slice = channelData.subarray(offset, offset + windowSize);

                // Pitch Gate: Energy check to avoid tracking ambient noise or breath
                let sumSq = 0;
                for (let k = 0; k < slice.length; k++) sumSq += slice[k] * slice[k];
                const rms = Math.sqrt(sumSq / slice.length);

                if (rms < pitchGateRMS) {
                    pitches[i] = 0;
                } else {
                    const pitch = autoCorrelatePitch(slice, sampleRate);
                    pitches[i] = pitch > 0 ? pitch : 0;
                }
            }
        }

        // Apply contour smoothing filter
        return smoothPitchContour(pitches);
    }

    /**
     * Pitch Contour Similarity Score (%):
     * Normalizes pitch differences to compare relative melody contour shapes
     * (invariant to male/female vocal register differences).
     */
    function calculatePitchSimilarity(pitchA, pitchB) {
        if (!pitchA || !pitchB || pitchA.length === 0 || pitchB.length === 0) return 0;

        const len = Math.min(pitchA.length, pitchB.length);
        const voicedPairs = [];

        for (let i = 0; i < len; i++) {
            if (pitchA[i] > 0 && pitchB[i] > 0) {
                voicedPairs.push([pitchA[i], pitchB[i]]);
            }
        }

        // If less than 20% voiced overlap, lower score
        if (voicedPairs.length < len * 0.15) {
            return 58; // Baseline for attempt
        }

        // Calculate means
        let sumA = 0, sumB = 0;
        for (const [a, b] of voicedPairs) {
            sumA += a;
            sumB += b;
        }
        const meanA = sumA / voicedPairs.length;
        const meanB = sumB / voicedPairs.length;

        // Calculate Pearson correlation on voiced segments
        let num = 0, denA = 0, denB = 0;
        for (const [a, b] of voicedPairs) {
            const diffA = a - meanA;
            const diffB = b - meanB;
            num += diffA * diffB;
            denA += diffA * diffA;
            denB += diffB * diffB;
        }

        if (denA === 0 || denB === 0) return 65; // One speaker was completely monotone

        const r = num / (Math.sqrt(denA) * Math.sqrt(denB));
        // Map r (-1 to 1) to percentage (40% to 98%)
        const normalized = Math.max(0, (r + 1) / 2);
        const score = Math.round(50 + normalized * 48);
        return Math.min(99, Math.max(45, score));
    }

    /**
     * Approximate English syllable count
     */
    function countSyllables(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!word) return 0;
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? Math.max(1, matches.length) : 1;
    }

    /**
     * Generate Prosody Markup (Stress, Linking ‿, Breath Pauses //, Intonation Arrows ↗ ↘)
     */
    function generateProsodyTokens(sentenceText) {
        if (!sentenceText) return [];
        const words = sentenceText.trim().split(/\s+/).filter(w => w.length > 0);
        const totalWords = words.length;

        // Determine general sentence intonation
        const isQuestion = sentenceText.trim().endsWith('?');
        const firstWord = (words[0] || '').toLowerCase().replace(/[^a-z]/g, '');
        const isWhQuestion = isQuestion && /^(what|where|when|why|who|whom|whose|which|how)/.test(firstWord);
        const isRisingQuestion = isQuestion && !isWhQuestion;

        return words.map((rawWord, idx) => {
            const normWord = rawWord.replace(/[\u2018\u2019\u201B\u2032]/g, "'");
            const clean = normWord.toLowerCase().replace(/[^a-z']/g, '');
            const isPunctuationPause = /[,;:]/.test(rawWord);
            const isSentenceEnd = /[.!?]/.test(rawWord);
            const syllables = countSyllables(clean);

            // Stressed if not in function words and length > 2
            const isStressed = !FUNCTION_WORDS.has(clean) && clean.length > 2;

            // Check linking to next word: consonant ends + next word starts with vowel
            let linkToNext = false;
            if (idx < totalWords - 1 && !isPunctuationPause && !isSentenceEnd) {
                const nextClean = words[idx + 1].replace(/[\u2018\u2019\u201B\u2032]/g, "'").toLowerCase().replace(/[^a-z']/g, '');
                const lastChar = clean[clean.length - 1];
                const nextFirstChar = nextClean[0];
                if (lastChar && nextFirstChar && !VOWELS.has(lastChar) && VOWELS.has(nextFirstChar)) {
                    linkToNext = true;
                }
            }

            // Intonation direction hint
            let intonationArrow = '';
            if (isSentenceEnd) {
                intonationArrow = isRisingQuestion ? '↗' : '↘';
            } else if (isPunctuationPause) {
                intonationArrow = '↗'; // Non-final continuation rise
            }

            return {
                rawWord,
                clean,
                syllables,
                isStressed,
                isPunctuationPause,
                isSentenceEnd,
                linkToNext,
                intonationArrow
            };
        });
    }

    /**
     * Web Speech API Real-time Pronunciation Diagnostics
     */
    let recognitionInstance = null;
    let isRecognizing = false;

    function startSpeechDiagnostics(targetSentence, onResultCallback) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (onResultCallback) {
                onResultCallback({
                    supported: false,
                    message: "Trình duyệt không hỗ trợ Web Speech API recognition."
                });
            }
            return null;
        }

        if (isRecognizing && recognitionInstance) {
            try { recognitionInstance.abort(); } catch (e) { }
        }

        recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'en-US';
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.maxAlternatives = 1;

        let finalTranscript = '';

        recognitionInstance.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentSpoken = (finalTranscript + ' ' + interimTranscript).trim();
            const diagnostics = evaluateSpokenPronunciation(currentSpoken, targetSentence);
            if (onResultCallback) {
                onResultCallback({
                    supported: true,
                    spokenText: currentSpoken,
                    diagnostics
                });
            }
        };

        recognitionInstance.onerror = (e) => {
            console.log("Speech recognition note:", e.error);
        };

        recognitionInstance.onend = () => {
            isRecognizing = false;
        };

        try {
            recognitionInstance.start();
            isRecognizing = true;
        } catch (e) { }

        return recognitionInstance;
    }

    function stopSpeechDiagnostics() {
        if (recognitionInstance && isRecognizing) {
            try { recognitionInstance.stop(); } catch (e) { }
            isRecognizing = false;
        }
    }

    function evaluateSpokenPronunciation(spokenText, targetSentence) {
        const spokenWords = spokenText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);
        const targetWords = targetSentence.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);

        let matchCount = 0;
        const wordStatus = targetWords.map(tw => {
            const found = spokenWords.includes(tw);
            if (found) matchCount++;
            return {
                word: tw,
                recognized: found
            };
        });

        const score = Math.round((matchCount / Math.max(1, targetWords.length)) * 100);

        return {
            score: Math.min(100, score),
            wordStatus,
            spokenWordsCount: spokenWords.length,
            targetWordsCount: targetWords.length
        };
    }

    root.App = root.App || {};
    root.App.SpeechAnalysis = {
        autoCorrelatePitch,
        extractPitchContour,
        smoothPitchContour,
        calculatePitchSimilarity,
        countSyllables,
        generateProsodyTokens,
        startSpeechDiagnostics,
        stopSpeechDiagnostics,
        evaluateSpokenPronunciation
    };

})(typeof window !== 'undefined' ? window : this);
