/**
 * DictaShadow Studio - Voice Activity Detection & Audio-Only Slicer (js/vad-slicer.js)
 * 100% Client-Side Pure Native Audio Segmentation
 * Automatically slices speech pauses (>400ms) into sentence segments when no SRT exists.
 */
(function (root) {
    'use strict';

    /**
     * Slice an AudioBuffer into sentence segments based on energy RMS silence detection
     * @param {AudioBuffer} audioBuffer - Web Audio API decoded buffer
     * @param {Object} options - Tuning parameters
     * @returns {Array<Object>} List of segments { id, start, end, duration, text }
     */
    function sliceAudio(audioBuffer, options = {}) {
        if (!audioBuffer) return [];

        const sampleRate = audioBuffer.sampleRate;
        const totalDuration = audioBuffer.duration;
        const channelData = audioBuffer.getChannelData(0);
        const totalSamples = channelData.length;

        // Tunable parameters with optimal defaults
        const minSilenceSec = options.minSilenceSec !== undefined ? options.minSilenceSec : 0.45;
        const silenceThresholdRMS = options.silenceThresholdRMS !== undefined ? options.silenceThresholdRMS : 0.02;
        const minSpeechSec = options.minSpeechSec !== undefined ? options.minSpeechSec : 0.8;
        const paddingSec = options.paddingSec !== undefined ? options.paddingSec : 0.15;

        // 30ms window size
        const windowSec = 0.03;
        const windowSamples = Math.max(64, Math.floor(sampleRate * windowSec));
        const numWindows = Math.floor(totalSamples / windowSamples);

        if (numWindows === 0) return [];

        // 1. Calculate RMS energy for each 30ms window
        const isSpeechWindow = new Uint8Array(numWindows);
        for (let w = 0; w < numWindows; w++) {
            const startIdx = w * windowSamples;
            let sumSq = 0;
            for (let i = 0; i < windowSamples; i++) {
                const sample = channelData[startIdx + i];
                sumSq += sample * sample;
            }
            const rms = Math.sqrt(sumSq / windowSamples);
            isSpeechWindow[w] = (rms >= silenceThresholdRMS) ? 1 : 0;
        }

        // 2. Identify raw continuous speech blocks
        const minSilenceWindows = Math.ceil(minSilenceSec / windowSec);
        const rawSegments = [];
        let inSpeech = false;
        let speechStartWin = 0;
        let silenceCount = 0;

        for (let w = 0; w < numWindows; w++) {
            if (isSpeechWindow[w] === 1) {
                if (!inSpeech) {
                    inSpeech = true;
                    speechStartWin = w;
                }
                silenceCount = 0;
            } else {
                if (inSpeech) {
                    silenceCount++;
                    // If silence continues longer than minSilenceWindows, close segment
                    if (silenceCount >= minSilenceWindows) {
                        const speechEndWin = w - silenceCount;
                        if (speechEndWin > speechStartWin) {
                            rawSegments.push({
                                start: speechStartWin * windowSec,
                                end: (speechEndWin + 1) * windowSec
                            });
                        }
                        inSpeech = false;
                        silenceCount = 0;
                    }
                }
            }
        }

        // Close final segment if audio ended during speech
        if (inSpeech) {
            rawSegments.push({
                start: speechStartWin * windowSec,
                end: numWindows * windowSec
            });
        }

        // If no segments detected (e.g. whisper or threshold too high), fallback to entire track
        if (rawSegments.length === 0) {
            return [{
                id: 1,
                start: 0,
                end: totalDuration,
                duration: totalDuration,
                text: "Câu #1 (Nghe và gõ lời thoại...)"
            }];
        }

        // 3. Filter short bursts (< minSpeechSec) and apply boundary padding
        const finalSegments = [];
        let segId = 1;

        for (let i = 0; i < rawSegments.length; i++) {
            const raw = rawSegments[i];
            const dur = raw.end - raw.start;

            if (dur >= minSpeechSec) {
                const paddedStart = Math.max(0, raw.start - paddingSec);
                const paddedEnd = Math.min(totalDuration, raw.end + paddingSec);

                finalSegments.push({
                    id: segId++,
                    start: Number(paddedStart.toFixed(2)),
                    end: Number(paddedEnd.toFixed(2)),
                    duration: Number((paddedEnd - paddedStart).toFixed(2)),
                    text: `Câu #${segId - 1} (Nghe và gõ lại lời thoại...)`
                });
            } else if (finalSegments.length > 0) {
                // If short burst is very close to previous segment (< 0.5s), merge into previous
                const prev = finalSegments[finalSegments.length - 1];
                if (raw.start - prev.end < 0.5) {
                    prev.end = Math.min(totalDuration, Number((raw.end + paddingSec).toFixed(2)));
                    prev.duration = Number((prev.end - prev.start).toFixed(2));
                }
            }
        }

        // If filtering removed all, fallback to raw
        if (finalSegments.length === 0) {
            return [{
                id: 1,
                start: 0,
                end: totalDuration,
                duration: totalDuration,
                text: "Câu #1 (Nghe và gõ lời thoại...)"
            }];
        }

        return finalSegments;
    }

    /**
     * Parse raw pasted text from clipboard:
     * Detects if text is SubRip SRT or plain sentences
     * @param {string} rawText
     * @returns {Object} { isSRT: boolean, data: Array<Object> | Array<string> }
     */
    function parsePastedTranscript(rawText) {
        if (!rawText || !rawText.trim()) {
            return { isSRT: false, data: [] };
        }

        const trimmed = rawText.trim();

        // Check if text has SRT timestamp arrow "-->"
        if (trimmed.includes('-->')) {
            const SRTParser = root.App.SRTParser;
            if (SRTParser && typeof SRTParser.parseSRT === 'function') {
                const subs = SRTParser.parseSRT(trimmed);
                if (subs.length > 0) {
                    return { isSRT: true, data: subs };
                }
            }
        }

        // Plain text: split into individual sentences using delimiters (. ? ! \n)
        const rawLines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const sentences = [];

        rawLines.forEach(line => {
            // Split line by sentence-ending punctuation while preserving dialogue dashes or numbers
            const matches = line.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g);
            if (matches) {
                matches.forEach(m => {
                    const clean = m.trim();
                    if (clean.length > 0) {
                        sentences.push(clean);
                    }
                });
            } else if (line.length > 0) {
                sentences.push(line);
            }
        });

        return { isSRT: false, data: sentences };
    }

    /**
     * Map plain text sentences onto timestamped segments
     * @param {Array<Object>} segments - Array of segments { id, start, end, ... }
     * @param {Array<string>} sentences - Array of plain text sentence strings
     * @returns {Array<Object>} Updated segments with actual text
     */
    function alignSentencesToSegments(segments, sentences) {
        if (!segments || !segments.length) return [];
        if (!sentences || !sentences.length) return segments;

        const aligned = [];
        const count = Math.max(segments.length, sentences.length);

        for (let i = 0; i < count; i++) {
            if (i < segments.length) {
                const seg = { ...segments[i] };
                if (i < sentences.length) {
                    seg.text = sentences[i];
                }
                aligned.push(seg);
            } else {
                // If more sentences than segments, append with estimated timestamp at the end
                const last = aligned[aligned.length - 1];
                aligned.push({
                    id: i + 1,
                    start: last ? last.end : 0,
                    end: last ? last.end + 3.0 : 3.0,
                    duration: 3.0,
                    text: sentences[i]
                });
            }
        }

        return aligned;
    }

    root.App = root.App || {};
    root.App.VADSlicer = {
        sliceAudio,
        parsePastedTranscript,
        alignSentencesToSegments
    };

})(typeof window !== 'undefined' ? window : this);
