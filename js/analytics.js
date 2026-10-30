/**
 * DictaShadow Studio - Mistake Bank & Phonetic Analytics Engine (js/analytics.js)
 * Features:
 * 1. Phonetic Weak-Spot Analyzer (-ed, -s/es, articles, weak prepositions, contractions).
 * 2. Dynamic Mistake Bank Registry (auto-tracks <80% sentences, auto-clears on mastery).
 * 3. 1-Touch Mistake Review Filter in Sentence Navigator Drawer.
 * 4. Study Streak Calculator & Active Session Timer.
 * 5. Comprehensive Analytics Dashboard Modal & Study Report Exporter (HTML & Markdown).
 */
(function (root) {
    'use strict';

    let timerInterval = null;
    let lastActiveTimestamp = Date.now();

    /**
     * Escape HTML helper
     */
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Format seconds into human readable duration
     */
    function formatDuration(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins === 0) return `${secs} giây`;
        return `${mins} phút ${secs}s`;
    }

    /**
     * Phonetic Weak-Spot Diagnostics Algorithm
     * Analyzes diff tokens to categorize auditory perception weaknesses
     */
    function analyzePhoneticErrors(diffResult, sentenceText) {
        const counts = {
            ed: 0,
            s: 0,
            articles: 0,
            prepositions: 0,
            contractions: 0
        };
        const diagnoses = [];

        if (!diffResult || !Array.isArray(diffResult.tokens)) {
            return { ...counts, totalErrors: 0, diagnosedTokens: [] };
        }

        const ARTICLES = new Set(['a', 'an', 'the']);
        const PREPOSITIONS = new Set(['in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'from', 'about', 'into', 'upon']);

        diffResult.tokens.forEach(token => {
            if (token.type === 'match') return;

            const official = (token.officialWord || '').toLowerCase().replace(/[^a-z']/g, '');
            const user = (token.userWord || '').toLowerCase().replace(/[^a-z']/g, '');

            // 1. Past Tense -ed Omission or Mishearing
            if (official.endsWith('ed') && official.length > 2) {
                const base = official.slice(0, -2);
                const baseSingle = official.slice(0, -1);
                if (user === base || user === baseSingle || token.type === 'missing') {
                    counts.ed++;
                    diagnoses.push({
                        type: 'ed',
                        label: 'Đuôi -ed quá khứ',
                        word: token.officialWord,
                        advice: 'Hãy chú ý âm bật vô thanh /t/, /d/ hoặc /ɪd/ khi nghe động từ quá khứ.'
                    });
                    return;
                }
            }

            // 2. Plural / 3rd Person Singular -s / -es
            if (official.endsWith('s') && official.length > 2) {
                const baseS = official.slice(0, -1);
                const baseEs = official.endsWith('es') ? official.slice(0, -2) : '';
                if (user === baseS || (baseEs && user === baseEs) || token.type === 'missing') {
                    counts.s++;
                    diagnoses.push({
                        type: 's',
                        label: 'Đuôi -s / -es',
                        word: token.officialWord,
                        advice: 'Chú ý phụ âm gió /s/ hoặc /z/ ở đuôi danh từ số nhiều và động từ ngôi thứ 3.'
                    });
                    return;
                }
            }

            // 3. Unstressed Grammatical Articles (a, an, the)
            if (ARTICLES.has(official) || ARTICLES.has(user)) {
                counts.articles++;
                diagnoses.push({
                    type: 'articles',
                    label: 'Mạo từ lướt nhanh',
                    word: token.officialWord || token.userWord,
                    advice: 'Người bản xứ thường phát âm mạo từ ở dạng yếu (weak form /ə/, /ðə/) rất nhanh.'
                });
                return;
            }

            // 4. Weak Prepositions (in, on, at, of, to, for, with...)
            if (PREPOSITIONS.has(official)) {
                counts.prepositions++;
                diagnoses.push({
                    type: 'prepositions',
                    label: 'Giới từ nuốt âm',
                    word: token.officialWord,
                    advice: 'Giới từ thường là function word không có trọng âm, hay bị nối âm vào từ phía trước.'
                });
                return;
            }

            // 5. Contractions / Informal Reductions
            if (official.includes("'") || user.includes("'")) {
                counts.contractions++;
                diagnoses.push({
                    type: 'contractions',
                    label: 'Dạng viết tắt / Trợ động từ',
                    word: token.officialWord || token.userWord,
                    advice: 'Chú ý các âm nuốt trong dạng viết tắt như it\'s, don\'t, they\'re, would\'ve.'
                });
                return;
            }
        });

        const totalErrors = counts.ed + counts.s + counts.articles + counts.prepositions + counts.contractions;

        return {
            ...counts,
            totalErrors,
            diagnosedTokens: diagnoses
        };
    }

    /**
     * Record a dictation check result into Mistake Bank and Analytics
     */
    function recordSentenceResult(sentenceIdx, diffResult, sentenceText) {
        const state = root.App.state;
        if (!state) return;

        if (!state.mistakeSentences) state.mistakeSentences = new Map();
        if (!state.phoneticErrors) state.phoneticErrors = { ed: 0, s: 0, articles: 0, prepositions: 0, contractions: 0 };

        const diag = analyzePhoneticErrors(diffResult, sentenceText);

        if (diffResult.accuracy < 80) {
            // Add or update in Mistake Bank
            state.mistakeSentences.set(sentenceIdx, {
                idx: sentenceIdx,
                accuracy: diffResult.accuracy,
                text: sentenceText,
                userText: state.standardInputText,
                diag: diag,
                timestamp: Date.now()
            });

            // Accumulate cumulative errors
            state.phoneticErrors.ed += diag.ed;
            state.phoneticErrors.s += diag.s;
            state.phoneticErrors.articles += diag.articles;
            state.phoneticErrors.prepositions += diag.prepositions;
            state.phoneticErrors.contractions += diag.contractions;
        } else {
            // If previously mistaken, remove it upon mastery!
            if (state.mistakeSentences.has(sentenceIdx)) {
                state.mistakeSentences.delete(sentenceIdx);
            }
        }

        updateMistakeBadges();
        updateStudyStreak();
        updateDailyGoalRing();
    }

    /**
     * Update UI Badges for Mistake Counters
     */
    function updateMistakeBadges() {
        if (typeof document === 'undefined') return;
        const state = root.App.state;
        if (!state) return;

        const mistakeCount = state.mistakeSentences ? state.mistakeSentences.size : 0;
        const totalCount = state.subs ? state.subs.length : 0;

        // Header Mistake Badge
        const headerBadge = document.getElementById('headerMistakeCountBadge');
        if (headerBadge) {
            headerBadge.textContent = `${mistakeCount} lỗi`;
            if (mistakeCount > 0) {
                headerBadge.classList.remove('hidden');
            } else {
                headerBadge.classList.add('hidden');
            }
        }

        // Drawer Filter Count Pills
        const filterAllCount = document.getElementById('filterAllCount');
        const filterMistakesCount = document.getElementById('filterMistakesCount');

        if (filterAllCount) filterAllCount.textContent = String(totalCount);
        if (filterMistakesCount) filterMistakesCount.textContent = `(${mistakeCount})`;

        const btnStartDrillFromDrawer = document.getElementById('btnStartDrillFromDrawer');
        if (btnStartDrillFromDrawer) {
            if (mistakeCount > 0) {
                btnStartDrillFromDrawer.classList.remove('hidden');
            } else {
                btnStartDrillFromDrawer.classList.add('hidden');
            }
        }
    }

    /**
     * Start Focused Smart Mistake Drill Session (Phase 4)
     */
    function startMistakeDrillSession() {
        const state = root.App.state;
        if (!state) return;

        const mistakeCount = state.mistakeSentences ? state.mistakeSentences.size : 0;
        if (mistakeCount === 0) {
            alert("🎉 Túi lỗi sai đang trống! Toàn bộ các câu bạn đã chép đều đạt trên 80% độ chính xác.");
            return;
        }

        state.isDrillActive = true;
        state.drillQueue = Array.from(state.mistakeSentences.keys());
        state.drillIndex = 0;

        // Close any active modal / drawers if in browser
        if (typeof document !== 'undefined') {
            closeAnalyticsModal();
            const sentenceDrawer = document.getElementById('sentenceDrawer');
            if (sentenceDrawer) sentenceDrawer.classList.add('opacity-0', 'pointer-events-none');

            // Switch to dictation tab if currently in shadowing
            const tabDictationBtn = document.getElementById('tabDictation');
            if (tabDictationBtn && typeof tabDictationBtn.click === 'function' && state.activeTab !== 'dictation') {
                tabDictationBtn.click();
            }

            // Show and update Drill Banner
            updateDrillBanner();
        }

        // Jump to first mistake sentence
        if (root.App.jumpToSentence) {
            root.App.jumpToSentence(state.drillQueue[0]);
        }

        if (root.App.AudioEngine) {
            root.App.AudioEngine.playSynthesizedSound('stamp');
        }
    }

    /**
     * Update Drill Session Floating Banner
     */
    function updateDrillBanner() {
        if (typeof document === 'undefined') return;
        const state = root.App.state;
        const banner = document.getElementById('drillSessionBanner');
        if (!banner) return;

        if (!state || !state.isDrillActive || !state.drillQueue || state.drillQueue.length === 0) {
            banner.classList.add('hidden');
            return;
        }

        banner.classList.remove('hidden');

        const badge = document.getElementById('drillProgressBadge');
        if (badge) {
            badge.textContent = `Câu ${state.drillIndex + 1}/${state.drillQueue.length} (Gốc #${state.drillQueue[state.drillIndex] + 1})`;
        }

        const adviceText = document.getElementById('drillAdviceText');
        if (adviceText) {
            const currentSentenceIdx = state.drillQueue[state.drillIndex];
            const mistakeData = state.mistakeSentences ? state.mistakeSentences.get(currentSentenceIdx) : null;
            if (mistakeData && mistakeData.diag && Array.isArray(mistakeData.diag.diagnosedTokens) && mistakeData.diag.diagnosedTokens.length > 0) {
                const firstDiag = mistakeData.diag.diagnosedTokens[0];
                adviceText.textContent = `Mẹo [${firstDiag.label}]: ${firstDiag.advice}`;
            } else {
                adviceText.textContent = 'Đạt >= 80% để gỡ câu này khỏi túi lỗi sai.';
            }
        }
    }

    /**
     * Handle grading event inside Drill Session
     */
    function handleDrillSentenceGraded(accuracy) {
        const state = root.App.state;
        if (!state || !state.isDrillActive || !state.drillQueue) return;

        const currentSentenceIdx = state.drillQueue[state.drillIndex];

        if (accuracy >= 80) {
            // Remove mastered sentence from mistakeSentences!
            if (state.mistakeSentences) {
                state.mistakeSentences.delete(currentSentenceIdx);
            }
            updateMistakeBadges();

            // Advance drill index
            state.drillIndex++;

            if (state.drillIndex < state.drillQueue.length) {
                const nextIdx = state.drillQueue[state.drillIndex];
                const adviceText = document.getElementById('drillAdviceText');
                if (adviceText) {
                    adviceText.textContent = `🎉 Đã làm chủ câu #${currentSentenceIdx + 1}! Đang chuyển sang câu tiếp theo...`;
                }

                setTimeout(() => {
                    if (state.isDrillActive) {
                        if (root.App.jumpToSentence) {
                            root.App.jumpToSentence(nextIdx);
                        }
                        updateDrillBanner();
                    }
                }, 900);
            } else {
                // All drill sentences cleared!
                setTimeout(() => {
                    if (root.App.AudioEngine) {
                        root.App.AudioEngine.playSynthesizedSound('stamp');
                    }
                    alert("🎉 XUẤT SẮC! Bạn đã vượt qua toàn bộ các câu trong Túi Lỗi Sai!");
                    exitMistakeDrillSession();
                }, 400);
            }
        } else {
            const adviceText = document.getElementById('drillAdviceText');
            if (adviceText) {
                adviceText.textContent = `Chưa đạt 80% (hiện tại: ${accuracy}%). Hãy bấm Nghe Lại hoặc xem gợi ý để thử lại!`;
            }
        }
    }

    /**
     * Exit Drill Session & Restore Normal State
     */
    function exitMistakeDrillSession() {
        const state = root.App.state;
        if (!state) return;

        state.isDrillActive = false;
        state.drillQueue = [];
        state.drillIndex = 0;

        const banner = document.getElementById('drillSessionBanner');
        if (banner) banner.classList.add('hidden');

        updateMistakeBadges();
        if (root.App.renderDrawerList) root.App.renderDrawerList();
    }

    /**
     * Update Study Streak calculation
     */
    async function updateStudyStreak() {
        const state = root.App.state;
        if (!state) return;

        const today = new Date().toISOString().slice(0, 10);
        let stored = null;

        if (root.App.Storage && typeof root.App.Storage.getAnalytics === 'function') {
            try {
                stored = await root.App.Storage.getAnalytics();
            } catch (e) {
                console.warn("[Analytics] Failed to fetch stored analytics:", e);
            }
        }

        let currentStreak = stored && stored.streak ? stored.streak : 1;
        const lastDate = stored && stored.lastDate ? stored.lastDate : '';

        if (lastDate && lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (lastDate === yesterday) {
                currentStreak += 1;
            } else {
                currentStreak = 1;
            }
        }

        state.studyStreak = currentStreak;

        // Persist to IndexedDB
        if (root.App.Storage && typeof root.App.Storage.saveAnalytics === 'function') {
            await root.App.Storage.saveAnalytics({
                streak: currentStreak,
                lastDate: today,
                totalSeconds: (stored ? stored.totalSeconds || 0 : 0) + (state.sessionSeconds || 0),
                phoneticErrors: state.phoneticErrors
            }).catch(() => {});
        }
    }

    /**
     * Start the active study session timer
     */
    function initSessionTimer() {
        // Track user activity
        ['mousedown', 'keydown', 'touchstart'].forEach(evt => {
            window.addEventListener(evt, () => {
                lastActiveTimestamp = Date.now();
            }, { passive: true });
        });

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            const state = root.App.state;
            if (!state) return;

            // Pause timer if tab hidden or idle > 3 mins
            const isTabVisible = document.visibilityState === 'visible';
            const isRecentlyActive = (Date.now() - lastActiveTimestamp) < 180000;

            if (isTabVisible && isRecentlyActive) {
                state.sessionSeconds = (state.sessionSeconds || 0) + 1;
            }
        }, 1000);
    }

    /**
     * Toggle Sentence Drawer filter: 'all' vs 'mistakes'
     */
    function setDrawerFilter(filter) {
        const state = root.App.state;
        if (!state) return;

        state.studyFilter = filter;

        const btnAll = document.getElementById('btnFilterAllSentences');
        const btnMistakes = document.getElementById('btnFilterMistakesOnly');

        if (filter === 'mistakes') {
            if (btnAll) btnAll.className = "flex-1 py-1 px-2 rounded font-mono text-[11px] font-semibold text-gray-400 hover:text-white transition";
            if (btnMistakes) btnMistakes.className = "flex-1 py-1 px-2 rounded font-mono text-[11px] font-semibold text-white bg-rose-500/30 border border-rose-500/50 shadow transition flex items-center justify-center gap-1";
        } else {
            if (btnAll) btnAll.className = "flex-1 py-1 px-2 rounded font-mono text-[11px] font-semibold text-white bg-studio-800 transition";
            if (btnMistakes) btnMistakes.className = "flex-1 py-1 px-2 rounded font-mono text-[11px] font-semibold text-gray-400 hover:text-amber-300 transition flex items-center justify-center gap-1";
        }

        // Re-render drawer list
        if (root.App.renderDrawerList) {
            root.App.renderDrawerList(false);
        }
    }

    /**
     * Open Analytics & Mistake Bank Dashboard Modal
     */
    function openAnalyticsModal() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('analyticsModal');
        const content = document.getElementById('analyticsModalContent');
        if (!modal || !content) return;

        modal.classList.remove('opacity-0', 'pointer-events-none');
        renderAnalyticsDashboard(content);
    }

    /**
     * Close Analytics Dashboard Modal
     */
    function closeAnalyticsModal() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('analyticsModal');
        if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
    }

    /**
     * Render Analytics Dashboard Content
     */
    function renderAnalyticsDashboard(container) {
        const state = root.App.state;
        if (!state) return;

        const streak = state.studyStreak || 1;
        const durationText = formatDuration(state.sessionSeconds || 0);
        const mistakeCount = state.mistakeSentences ? state.mistakeSentences.size : 0;
        const completedCount = state.completedSentences ? state.completedSentences.size : 0;
        const totalCount = state.subs ? state.subs.length : 0;

        // Cumulative Phonetic Stats
        const pErrors = state.phoneticErrors || { ed: 0, s: 0, articles: 0, prepositions: 0, contractions: 0 };
        const totalPErrors = (pErrors.ed || 0) + (pErrors.s || 0) + (pErrors.articles || 0) + (pErrors.prepositions || 0) + (pErrors.contractions || 0);

        function calcPercent(val) {
            if (totalPErrors === 0) return 0;
            return Math.min(100, Math.round((val / totalPErrors) * 100));
        }

        // Mistake Bank Items List
        let mistakesListHTML = '';
        if (mistakeCount === 0) {
            mistakesListHTML = `
                <div class="py-8 text-center text-gray-400 space-y-2 font-mono text-xs">
                    <p class="text-emerald-400 font-bold text-sm">🎉 Bạn chưa có câu nào bị lỗi!</p>
                    <p class="text-[11px] text-gray-500">Toàn bộ các câu bạn đã chép đều đạt trên 80% độ chính xác.</p>
                </div>
            `;
        } else {
            const items = Array.from(state.mistakeSentences.values());
            mistakesListHTML = items.map(m => `
                <div class="p-3 bg-studio-950 border border-white/10 rounded-lg hover:border-amber-500/40 transition">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <div class="flex items-center gap-2">
                            <span class="font-bold font-mono text-accent-cyan">#${m.idx + 1}</span>
                            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">Độ chính xác: ${m.accuracy}%</span>
                        </div>
                        <button class="btn-jump-mistake tactile-btn px-2.5 py-1 text-[11px] font-bold text-amber-300 border-amber-500/30 hover:bg-amber-500 hover:text-black transition" data-idx="${m.idx}">
                            Luyện Lại Câu Này
                        </button>
                    </div>
                    <p class="text-xs text-gray-200 mt-1 italic">"${escapeHTML(m.text)}"</p>
                    ${m.userText ? `<p class="text-[11px] text-gray-400 mt-1 pl-2 border-l border-rose-500/40">Bạn đã gõ: <span class="text-gray-300 font-mono">${escapeHTML(m.userText)}</span></p>` : ''}
                </div>
            `).join('');
        }

        container.innerHTML = `
            <!-- Top Stat Chips (4-Grid) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div class="p-3 bg-studio-950 border border-studio-border rounded-xl">
                    <div class="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono uppercase mb-1">
                        <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        Chuỗi Học
                    </div>
                    <div class="text-xl font-bold font-mono text-amber-400">${streak} <span class="text-xs text-gray-400 font-sans font-normal">Ngày</span></div>
                </div>

                <div class="p-3 bg-studio-950 border border-studio-border rounded-xl">
                    <div class="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono uppercase mb-1">
                        <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Thời Gian
                    </div>
                    <div class="text-xl font-bold font-mono text-white">${durationText}</div>
                </div>

                <div class="p-3 bg-studio-950 border border-studio-border rounded-xl">
                    <div class="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono uppercase mb-1">
                        <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Đã Hoàn Thành
                    </div>
                    <div class="text-xl font-bold font-mono text-emerald-400">${completedCount}/${totalCount} <span class="text-xs text-gray-400 font-sans font-normal">câu</span></div>
                </div>

                <div class="p-3 bg-studio-950 border border-studio-border rounded-xl">
                    <div class="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono uppercase mb-1">
                        <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Túi Lỗi Sai
                    </div>
                    <div class="text-xl font-bold font-mono text-rose-400">${mistakeCount} <span class="text-xs text-gray-400 font-sans font-normal">câu cần ôn</span></div>
                </div>
            </div>

            <!-- Phonetic Weak-Spots Diagnostic Card -->
            <div class="p-4 bg-studio-950 border border-studio-border rounded-xl space-y-3">
                <div class="flex items-center justify-between border-b border-white/10 pb-2">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-accent-indigo"></span>
                        <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono">CHẨN ĐOÁN ĐIỂM YẾU ÂM VỊ THÍNH GIÁC</h4>
                    </div>
                    <span class="text-[11px] font-mono text-gray-400">${totalPErrors} lỗi phát hiện</span>
                </div>

                <div class="space-y-2.5 text-xs">
                    <!-- -ed ending -->
                    <div>
                        <div class="flex justify-between text-[11px] font-mono mb-1">
                            <span class="text-gray-300">1. Đuôi -ed quá khứ (/t/, /d/, /ɪd/)</span>
                            <span class="text-accent-amber font-bold">${pErrors.ed || 0} (${calcPercent(pErrors.ed)}%)</span>
                        </div>
                        <div class="w-full bg-studio-900 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-amber-400 h-1.5 rounded-full transition-all duration-500" style="width: ${calcPercent(pErrors.ed)}%"></div>
                        </div>
                    </div>

                    <!-- -s/-es ending -->
                    <div>
                        <div class="flex justify-between text-[11px] font-mono mb-1">
                            <span class="text-gray-300">2. Đuôi -s / -es số nhiều & ngôi thứ 3 (/s/, /z/, /ɪz/)</span>
                            <span class="text-cyan-400 font-bold">${pErrors.s || 0} (${calcPercent(pErrors.s)}%)</span>
                        </div>
                        <div class="w-full bg-studio-900 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-cyan-400 h-1.5 rounded-full transition-all duration-500" style="width: ${calcPercent(pErrors.s)}%"></div>
                        </div>
                    </div>

                    <!-- Articles -->
                    <div>
                        <div class="flex justify-between text-[11px] font-mono mb-1">
                            <span class="text-gray-300">3. Mạo từ lướt nhanh (a, an, the)</span>
                            <span class="text-emerald-400 font-bold">${pErrors.articles || 0} (${calcPercent(pErrors.articles)}%)</span>
                        </div>
                        <div class="w-full bg-studio-900 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" style="width: ${calcPercent(pErrors.articles)}%"></div>
                        </div>
                    </div>

                    <!-- Prepositions -->
                    <div>
                        <div class="flex justify-between text-[11px] font-mono mb-1">
                            <span class="text-gray-300">4. Giới từ yếu (in, on, at, of, to, for, with...)</span>
                            <span class="text-purple-400 font-bold">${pErrors.prepositions || 0} (${calcPercent(pErrors.prepositions)}%)</span>
                        </div>
                        <div class="w-full bg-studio-900 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-purple-400 h-1.5 rounded-full transition-all duration-500" style="width: ${calcPercent(pErrors.prepositions)}%"></div>
                        </div>
                    </div>

                    <!-- Contractions -->
                    <div>
                        <div class="flex justify-between text-[11px] font-mono mb-1">
                            <span class="text-gray-300">5. Dạng viết tắt / Nuốt âm (it's, don't, they're...)</span>
                            <span class="text-rose-400 font-bold">${pErrors.contractions || 0} (${calcPercent(pErrors.contractions)}%)</span>
                        </div>
                        <div class="w-full bg-studio-900 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-rose-400 h-1.5 rounded-full transition-all duration-500" style="width: ${calcPercent(pErrors.contractions)}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mistake Bank Review List -->
            <div class="p-4 bg-studio-950 border border-studio-border rounded-xl space-y-3">
                <div class="flex items-center justify-between border-b border-white/10 pb-2 flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                        <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono">DANH SÁCH CÂU CẦN ÔN TẬP</h4>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[11px] font-mono text-rose-400 font-bold">${mistakeCount} câu</span>
                        ${mistakeCount > 0 ? `
                        <button id="btnStartDrillFromAnalytics" class="tactile-btn px-2.5 py-1 text-[11px] font-bold text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/25 flex items-center gap-1.5 transition">
                            <i data-lucide="zap" class="w-3.5 h-3.5 text-accent-amber"></i>
                            <span>Bắt Đầu Ôn Tập</span>
                        </button>` : ''}
                    </div>
                </div>

                <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                    ${mistakesListHTML}
                </div>
            </div>
        `;

        // Wire drill button in modal
        const btnDrill = container.querySelector('#btnStartDrillFromAnalytics');
        if (btnDrill) {
            btnDrill.addEventListener('click', startMistakeDrillSession);
        }

        // Wire jump buttons in mistake list
        container.querySelectorAll('.btn-jump-mistake').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-idx'), 10);
                if (!isNaN(idx) && root.App && root.App.jumpToSentence) {
                    closeAnalyticsModal();
                    root.App.jumpToSentence(idx);
                }
            });
        });
    }

    /**
     * Export Study Report to HTML or Markdown
     */
    async function exportStudyReport(format = 'html') {
        const state = root.App.state;
        if (!state) return;

        const streak = state.studyStreak || 1;
        const durationText = formatDuration(state.sessionSeconds || 0);
        const mistakeItems = state.mistakeSentences ? Array.from(state.mistakeSentences.values()) : [];
        const completedCount = state.completedSentences ? state.completedSentences.size : 0;
        const totalCount = state.subs ? state.subs.length : 0;
        const dateTag = new Date().toISOString().slice(0, 10);

        // Fetch vocabulary for inclusion
        let vocabList = [];
        if (root.App.Storage && typeof root.App.Storage.getAllVocab === 'function') {
            try {
                vocabList = await root.App.Storage.getAllVocab();
            } catch (e) {}
        }

        if (format === 'markdown') {
            const md = `# BÁO CÁO KẾT QUẢ BUỔI HỌC - DICTASHADOW STUDIO
**Ngày học**: ${dateTag} | **Chuỗi học (Streak)**: ${streak} Ngày | **Thời gian**: ${durationText}
**Tiến độ bài**: ${completedCount}/${totalCount} câu | **Số câu cần ôn**: ${mistakeItems.length}

---

## 1. Chẩn Đoán Điểm Yếu Âm Vị
- Đuôi -ed quá khứ: ${state.phoneticErrors?.ed || 0} lỗi
- Đuôi -s / -es số nhiều & ngôi thứ 3: ${state.phoneticErrors?.s || 0} lỗi
- Mạo từ lướt nhanh (a/an/the): ${state.phoneticErrors?.articles || 0} lỗi
- Giới từ yếu (in/on/at/of/to...): ${state.phoneticErrors?.prepositions || 0} lỗi
- Dạng viết tắt / Nuốt âm (it's, don't...): ${state.phoneticErrors?.contractions || 0} lỗi

---

## 2. Danh Sách Câu Trong Túi Lỗi Sai
${mistakeItems.length === 0 ? '_Không có câu nào bị lỗi! Đạt chuẩn 100%._' : mistakeItems.map(m => `
### Câu #${m.idx + 1} (${m.accuracy}%)
- **Lời thoại chuẩn**: "${m.text}"
- **Bạn đã gõ**: "${m.userText || '(chưa gõ)'}"
`).join('\n')}

---

## 3. Từ Vựng Đã Lưu Trong Buổi Học
${vocabList.length === 0 ? '_Chưa có từ vựng nào được lưu._' : vocabList.map(v => `- **${v.displayWord || v.word}** ${v.phonetic ? `*(${v.phonetic})*` : ''}: ${v.definition}`).join('\n')}
`;

            downloadBlob(md, `dictashadow-study-report-${dateTag}.md`, 'text/markdown;charset=utf-8');
            return;
        }

        // HTML Report (Editorial Print-Ready)
        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Báo Cáo Học Tập - DictaShadow Studio (${dateTag})</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0c0a09; color: #f5f5f4; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; background: #1c1917; border: 1px solid #44403c; border-radius: 16px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        h1 { color: #f59e0b; margin-top: 0; font-size: 24px; border-bottom: 1px solid #292524; padding-bottom: 16px; font-family: monospace; letter-spacing: -0.5px; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
        .stat-box { background: #0c0a09; border: 1px solid #292524; border-radius: 10px; padding: 14px; text-align: center; }
        .stat-val { font-size: 22px; font-weight: bold; color: #f59e0b; font-family: monospace; }
        .stat-lbl { font-size: 11px; color: #a8a29e; text-transform: uppercase; margin-top: 4px; }
        .card { background: #0c0a09; border: 1px solid #292524; border-radius: 10px; padding: 16px; margin: 16px 0; }
        .card-title { font-weight: bold; font-size: 13px; color: #e7e5e4; margin-bottom: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.5px; }
        .mistake-item { border-left: 3px solid #f43f5e; background: #1c1917; padding: 12px; border-radius: 6px; margin-bottom: 10px; font-size: 13px; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace; }
        .tag-bad { background: rgba(244,63,94,0.2); color: #fda4af; }
        .vocab-item { padding: 8px 0; border-bottom: 1px solid #292524; font-size: 13px; }
        @media print { body { background: white; color: black; padding: 0; } .container { border: none; box-shadow: none; padding: 0; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>DICTASHADOW STUDIO · BÁO CÁO BUỔI HỌC</h1>
        <div class="stat-grid">
            <div class="stat-box"><div class="stat-val">${streak} NGÀY</div><div class="stat-lbl">Chuỗi Streak</div></div>
            <div class="stat-box"><div class="stat-val">${durationText}</div><div class="stat-lbl">Thời Gian Học</div></div>
            <div class="stat-box"><div class="stat-val">${completedCount}/${totalCount}</div><div class="stat-lbl">Đã Hoàn Thành</div></div>
            <div class="stat-box"><div class="stat-val">${mistakeItems.length} CÂU</div><div class="stat-lbl">Cần Ôn Tập</div></div>
        </div>

        <div class="card">
            <div class="card-title">🔍 Chẩn Đoán Điểm Yếu Âm Vị Thính Giác</div>
            <ul style="font-size: 13px; color: #d6d3d1; padding-left: 20px;">
                <li>Đuôi -ed quá khứ (/t/, /d/, /ɪd/): <b>${state.phoneticErrors?.ed || 0}</b> lỗi</li>
                <li>Đuôi -s / -es số nhiều & ngôi thứ 3: <b>${state.phoneticErrors?.s || 0}</b> lỗi</li>
                <li>Mạo từ lướt nhanh (a, an, the): <b>${state.phoneticErrors?.articles || 0}</b> lỗi</li>
                <li>Giới từ yếu (in, on, at, of, to...): <b>${state.phoneticErrors?.prepositions || 0}</b> lỗi</li>
                <li>Dạng viết tắt / Trợ động từ: <b>${state.phoneticErrors?.contractions || 0}</b> lỗi</li>
            </ul>
        </div>

        <div class="card">
            <div class="card-title">⚠️ Danh Sách Câu Trong Túi Lỗi Sai (${mistakeItems.length})</div>
            ${mistakeItems.length === 0 ? '<p style="color: #10b981; font-size: 13px;">Chúc mừng! Không có câu nào bị lỗi.</p>' : mistakeItems.map(m => `
                <div class="mistake-item">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <b>Câu #${m.idx + 1}</b>
                        <span class="tag tag-bad">${m.accuracy}% chính xác</span>
                    </div>
                    <div style="color: #f5f5f4; font-style: italic;">"${escapeHTML(m.text)}"</div>
                    ${m.userText ? `<div style="color: #a8a29e; font-size: 12px; margin-top: 4px;">Bạn đã gõ: <span style="font-family: monospace;">${escapeHTML(m.userText)}</span></div>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="card">
            <div class="card-title">📖 Sổ Từ Vựng Lưu Trong Buổi Học (${vocabList.length})</div>
            ${vocabList.length === 0 ? '<p style="color: #78716c; font-size: 13px;">Chưa lưu từ vựng nào.</p>' : vocabList.map(v => `
                <div class="vocab-item">
                    <b>${escapeHTML(v.displayWord || v.word)}</b> <span style="color: #f59e0b; font-family: monospace;">${escapeHTML(v.phonetic || '')}</span>: ${escapeHTML(v.definition || '')}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

        downloadBlob(html, `dictashadow-study-report-${dateTag}.html`, 'text/html;charset=utf-8');
    }

    /**
     * Helper to download blob
     */
    function downloadBlob(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Update Daily Goal Progress Ring and Streak (Phase 5)
     */
    function updateDailyGoalRing() {
        if (typeof document === 'undefined') return;
        const state = root.App.state;
        if (!state) return;

        const target = state.dailyGoalTarget || 15;
        const completedCount = state.completedSentences ? state.completedSentences.size : 0;
        const percent = Math.min(100, Math.round((completedCount / target) * 100));

        const circle = document.getElementById('dailyGoalCircle');
        if (circle) {
            circle.style.strokeDashoffset = String(100 - percent);
            if (percent >= 100) {
                circle.classList.remove('text-amber-500');
                circle.classList.add('text-emerald-400');
            } else {
                circle.classList.remove('text-emerald-400');
                circle.classList.add('text-amber-500');
            }
        }

        const countText = document.getElementById('dailyGoalText');
        if (countText) {
            countText.textContent = `${completedCount}/${target}`;
        }

        const streakBadge = document.getElementById('dailyStreakBadge');
        if (streakBadge) {
            streakBadge.textContent = String(state.studyStreak || 1);
        }

        // Celebration chime when reaching target for the first time
        if (completedCount >= target && !state.dailyGoalAchievedToday) {
            state.dailyGoalAchievedToday = true;
            if (root.App.AudioEngine && typeof root.App.AudioEngine.playSynthesizedSound === 'function') {
                root.App.AudioEngine.playSynthesizedSound('success');
            }
            if (root.App.PixelGameLoop && typeof root.App.PixelGameLoop.onDailyGoalAchieved === 'function') {
                root.App.PixelGameLoop.onDailyGoalAchieved(target, state.studyStreak || 1);
            }
        }
    }

    /**
     * Set Daily Sentence Target (default 15)
     */
    function setDailyTarget(num) {
        const state = root.App.state;
        if (!state) return;
        const target = Math.max(1, Math.min(100, parseInt(num, 10) || 15));
        state.dailyGoalTarget = target;
        try { localStorage.setItem('lyre_daily_goal_target', String(target)); } catch (e) {}
        updateDailyGoalRing();
    }

    /**
     * Initialize analytics module bindings
     */
    function init() {
        initSessionTimer();
        updateStudyStreak();
        updateMistakeBadges();
        updateDailyGoalRing();

        // Clicking the Daily Goal widget opens Analytics Modal
        document.getElementById('dailyGoalWidget')?.addEventListener('click', openAnalyticsModal);

        // Trigger buttons for Analytics Dashboard
        document.getElementById('btnOpenAnalytics')?.addEventListener('click', openAnalyticsModal);
        document.getElementById('btnMobileOpenAnalytics')?.addEventListener('click', () => {
            const mobileSettingsDrawer = document.getElementById('mobileSettingsDrawer');
            if (mobileSettingsDrawer) mobileSettingsDrawer.classList.add('opacity-0', 'pointer-events-none');
            openAnalyticsModal();
        });

        document.getElementById('btnCloseAnalyticsModal')?.addEventListener('click', closeAnalyticsModal);
        document.getElementById('btnCloseAnalyticsModalBtn')?.addEventListener('click', closeAnalyticsModal);

        // Export Report Buttons
        document.getElementById('btnExportReportHTML')?.addEventListener('click', () => exportStudyReport('html'));
        document.getElementById('btnExportReportMD')?.addEventListener('click', () => exportStudyReport('markdown'));

        // Sentence Drawer Filter Rocker Buttons
        document.getElementById('btnFilterAllSentences')?.addEventListener('click', () => setDrawerFilter('all'));
        document.getElementById('btnFilterMistakesOnly')?.addEventListener('click', () => setDrawerFilter('mistakes'));

        // Smart Mistake Drill Trigger & Exit Buttons (Phase 4)
        document.getElementById('btnStartDrillFromDrawer')?.addEventListener('click', startMistakeDrillSession);
        document.getElementById('btnExitDrillSession')?.addEventListener('click', exitMistakeDrillSession);

        // Modal backdrop click to close
        const modal = document.getElementById('analyticsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeAnalyticsModal();
            });
        }
    }

    root.App = root.App || {};
    root.App.Analytics = {
        formatDuration,
        analyzePhoneticErrors,
        recordSentenceResult,
        updateMistakeBadges,
        updateStudyStreak,
        setDrawerFilter,
        openAnalyticsModal,
        closeAnalyticsModal,
        startMistakeDrill: startMistakeDrillSession,
        startMistakeDrillSession,
        updateDrillBanner,
        handleDrillSentenceGraded,
        exitMistakeDrill: exitMistakeDrillSession,
        exitMistakeDrillSession,
        updateDailyGoalRing,
        setDailyTarget,
        exportStudyReport,
        init
    };

})(typeof window !== 'undefined' ? window : this);
