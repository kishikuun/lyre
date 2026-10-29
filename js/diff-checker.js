/**
 * DictaShadow Studio - Smart Diff & Scoring Engine (js/diff-checker.js)
 */
(function (root) {
    'use strict';

    const cleanWord = (w) => root.App.SRTParser.cleanWord(w);

    function escapeHTML(str) {
        if (root.App && root.App.SRTParser && root.App.SRTParser.escapeHTML) {
            return root.App.SRTParser.escapeHTML(str);
        }
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    }

    /**
     * Compare user typed text against official subtitle sentence
     * Uses Longest Common Subsequence (LCS) for accurate word-level alignment
     */
    function computeDiff(userText, officialText) {
        const userWords = (userText || '').trim().split(/\s+/).filter(w => w.length > 0);
        const officialWords = (officialText || '').trim().split(/\s+/).filter(w => w.length > 0);

        const m = userWords.length;
        const n = officialWords.length;

        // DP table for LCS
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (cleanWord(userWords[i - 1]) === cleanWord(officialWords[j - 1])) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // Backtrack to find aligned operations
        let i = m, j = n;
        const diffTokens = [];
        let matchCount = 0;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && cleanWord(userWords[i - 1]) === cleanWord(officialWords[j - 1])) {
                diffTokens.unshift({
                    type: 'match',
                    userWord: userWords[i - 1],
                    officialWord: officialWords[j - 1]
                });
                matchCount++;
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                // Missing word in user's text
                diffTokens.unshift({
                    type: 'missing',
                    officialWord: officialWords[j - 1]
                });
                j--;
            } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
                // Extra word typed by user or misspelled
                diffTokens.unshift({
                    type: 'extra',
                    userWord: userWords[i - 1]
                });
                i--;
            }
        }

        // Second pass: pair adjacent 'extra' and 'missing' into 'error' (misspelled)
        const refinedTokens = [];
        for (let k = 0; k < diffTokens.length; k++) {
            const cur = diffTokens[k];
            const next = diffTokens[k + 1];

            if (cur && next && cur.type === 'extra' && next.type === 'missing') {
                refinedTokens.push({
                    type: 'error',
                    userWord: cur.userWord,
                    officialWord: next.officialWord
                });
                k++; // Skip next
            } else if (cur && next && cur.type === 'missing' && next.type === 'extra') {
                refinedTokens.push({
                    type: 'error',
                    userWord: next.userWord,
                    officialWord: cur.officialWord
                });
                k++;
            } else {
                refinedTokens.push(cur);
            }
        }

        const totalExpected = Math.max(1, officialWords.length);
        const accuracy = Math.round((matchCount / totalExpected) * 100);

        return {
            tokens: refinedTokens,
            matchCount,
            totalExpected,
            accuracy,
            isPerfect: matchCount === totalExpected && userWords.length === officialWords.length
        };
    }

    /**
     * Render the diff result into beautiful HTML badges
     */
    function renderDiffHTML(diffResult) {
        if (!diffResult || !diffResult.tokens) return '';

        return diffResult.tokens.map(token => {
            if (token.type === 'match') {
                return `<span class="diff-word-match inline-flex items-center gap-1">${escapeHTML(token.officialWord)}</span>`;
            } else if (token.type === 'error') {
                return `<span class="diff-word-error inline-flex flex-col items-center">
                    <span>${escapeHTML(token.userWord)}</span>
                    <span class="text-[11px] font-mono text-amber-400 font-semibold no-underline mt-0.5 tracking-tight">↓ ${escapeHTML(token.officialWord)}</span>
                </span>`;
            } else if (token.type === 'missing') {
                return `<span class="diff-word-missing" title="Từ bị bỏ sót">${escapeHTML(token.officialWord)}</span>`;
            } else if (token.type === 'extra') {
                return `<span class="diff-word-extra" title="Từ gõ thừa">${escapeHTML(token.userWord)}</span>`;
            }
            return '';
        }).join(' ');
    }

    root.App = root.App || {};
    root.App.DiffChecker = {
        computeDiff,
        renderDiffHTML,
        escapeHTML
    };

})(window);

