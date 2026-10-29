/**
 * DictaShadow Studio - Subtitle Parser & Time Utilities (js/srt-parser.js)
 */
(function (root) {
    'use strict';

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m]));
    }

    function normalizeTypography(str) {
        if (!str) return '';
        return String(str)
            .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
            .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
            .replace(/[\u2013\u2014]/g, '-');
    }

    function timeToSeconds(t) {
        if (!t) return 0;
        const cleaned = t.trim().split(/\s+/)[0].replace(',', '.');
        const parts = cleaned.split(':');
        if (parts.length === 2) {
            const m = parseFloat(parts[0]) || 0;
            const s = parseFloat(parts[1]) || 0;
            return m * 60 + s;
        }
        if (parts.length >= 3) {
            const h = parseFloat(parts[0]) || 0;
            const m = parseFloat(parts[1]) || 0;
            const s = parseFloat(parts[2]) || 0;
            return h * 3600 + m * 60 + s;
        }
        return 0;
    }

    function formatTime(sec) {
        if (isNaN(sec) || sec < 0) return "00:00.00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 100);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }

    function cleanWord(w) {
        if (!w) return '';
        return normalizeTypography(w)
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»\u2026]/g, '')
            .trim()
            .toLowerCase();
    }

    function extractTrailingPunctuation(w) {
        if (!w) return '';
        const match = w.match(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»\u2018\u2019\u201B\u201C\u201D\u2013\u2014\u2026]+$/);
        return match ? match[0] : '';
    }

    function parseSRT(data) {
        if (!data || typeof data !== 'string') return [];
        const normalized = data.replace(/^\uFEFF/, '').replace(/\r/g, '').replace(/^WEBVTT[^\n]*\n+/i, '').trim();
        const blocks = normalized.split(/\n\s*\n/);
        const items = [];

        for (const block of blocks) {
            const lines = block.split('\n');
            if (lines.length >= 2) {
                const timeLine = lines.find(l => l.includes('-->'));
                if (timeLine) {
                    const timeIdx = lines.indexOf(timeLine);
                    const times = timeLine.split('-->');
                    const start = timeToSeconds(times[0]);
                    const end = timeToSeconds(times[1]);
                    const rawText = lines.slice(timeIdx + 1).join(' ')
                        .replace(/<[^>]*>/g, '')
                        .replace(/\{[^}]*\}/g, '')
                        .trim();

                    if (rawText && !isNaN(start) && !isNaN(end) && end > start) {
                        items.push({ start, end, text: rawText });
                    }
                }
            }
        }
        return items;
    }

    root.App = root.App || {};
    root.App.SRTParser = {
        parseSRT,
        timeToSeconds,
        formatTime,
        cleanWord,
        extractTrailingPunctuation,
        escapeHTML,
        normalizeTypography
    };

})(window);

