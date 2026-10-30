/**
 * DictaShadow Studio - One-Touch Dictionary & Vocabulary Notebook Manager (js/dictionary.js)
 * Features:
 * 1. Clean Word Sanitizer (strips punctuation, preserves contractions/hyphens).
 * 2. Multi-tier API Fetcher (Free Dictionary API + IndexedDB Offline Caching).
 * 3. Dual-mode Pronunciation (Native audio MP3 + Offline Web Speech Synthesis fallback).
 * 4. Responsive Dictionary Popover (Smart PC positioning + Mobile Bottom Sheet).
 * 5. Vocabulary Notebook Drawer with search filter, audio replay & delete.
 * 6. Anki TSV Exporter with UTF-8 BOM, IPA phonetics, HTML formatting & context highlighting.
 */
(function (root) {
    'use strict';

    let currentPopoverWord = null;
    let currentPopoverEntry = null;
    let currentPopoverContext = '';

    /**
     * Clean and normalize raw word from selection or diff badge
     */
    function cleanWord(rawText) {
        if (!rawText || typeof rawText !== 'string') return '';
        return rawText
            .trim()
            .replace(/[’‘]/g, "'") // Normalize typographic apostrophes
            .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '') // Strip edge punctuation
            .toLowerCase();
    }

    /**
     * Escape RegExp special characters
     */
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

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
     * Parse Free Dictionary API JSON response
     */
    function parseDictionaryResponse(json, word) {
        if (!Array.isArray(json) || json.length === 0) {
            return {
                word: word,
                displayWord: word,
                notFound: true,
                phonetic: '',
                audioUrl: '',
                meanings: []
            };
        }

        const entry = json[0];
        let phoneticText = entry.phonetic || '';
        let audioUrl = '';

        // Search in phonetics array for text and audio
        if (Array.isArray(entry.phonetics)) {
            for (const p of entry.phonetics) {
                if (!phoneticText && p.text) {
                    phoneticText = p.text;
                }
                if (!audioUrl && p.audio && p.audio.trim().length > 0) {
                    audioUrl = p.audio.trim();
                }
            }
        }

        const meanings = [];
        let primaryDef = '';
        let primaryPos = '';

        if (Array.isArray(entry.meanings)) {
            entry.meanings.forEach(m => {
                const pos = m.partOfSpeech || '';
                const defs = [];
                if (Array.isArray(m.definitions)) {
                    m.definitions.slice(0, 3).forEach(d => {
                        if (d.definition) {
                            defs.push({
                                definition: d.definition,
                                example: d.example || '',
                                synonyms: Array.isArray(d.synonyms) ? d.synonyms.slice(0, 4) : []
                            });
                            if (!primaryDef) {
                                primaryDef = d.definition;
                                primaryPos = pos;
                            }
                        }
                    });
                }
                if (defs.length > 0) {
                    meanings.push({
                        partOfSpeech: pos,
                        definitions: defs
                    });
                }
            });
        }

        return {
            word: word.toLowerCase(),
            displayWord: entry.word || word,
            phonetic: phoneticText,
            audioUrl: audioUrl,
            meanings: meanings,
            shortDef: primaryDef,
            primaryPos: primaryPos,
            notFound: false,
            source: 'api'
        };
    }

    /**
     * Look up word in local cache or Free Dictionary API
     */
    async function lookup(rawWord) {
        const word = cleanWord(rawWord);
        if (!word) return null;

        // 1. Check IndexedDB cache first
        if (root.App && root.App.Storage && typeof root.App.Storage.getDictCache === 'function') {
            try {
                const cached = await root.App.Storage.getDictCache(word);
                if (cached) {
                    return cached;
                }
            } catch (e) {
                console.warn("[Dictionary] Cache lookup error:", e);
            }
        }

        // 2. Fetch from online Free Dictionary API
        const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

        try {
            // 4.5s timeout abort controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);

            const res = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const json = await res.json();
                const parsed = parseDictionaryResponse(json, word);

                // Cache in IndexedDB
                if (root.App && root.App.Storage && typeof root.App.Storage.saveDictCache === 'function') {
                    root.App.Storage.saveDictCache(word, parsed).catch(() => {});
                }

                return parsed;
            } else if (res.status === 404) {
                const notFoundResult = {
                    word: word,
                    displayWord: rawWord.trim(),
                    notFound: true,
                    isOffline: !navigator.onLine,
                    phonetic: '',
                    audioUrl: '',
                    meanings: []
                };
                return notFoundResult;
            }
        } catch (err) {
            console.warn("[Dictionary] Online fetch failed, fallback to offline card:", err);
            return {
                word: word,
                displayWord: rawWord.trim(),
                notFound: false,
                isOffline: true,
                error: err.name === 'AbortError' ? 'Hết thời gian kết nối' : 'Ngoại tuyến',
                phonetic: '',
                audioUrl: '',
                meanings: []
            };
        }

        return {
            word: word,
            displayWord: rawWord.trim(),
            notFound: true,
            isOffline: !navigator.onLine,
            phonetic: '',
            audioUrl: '',
            meanings: []
        };
    }

    /**
     * Pronounce word using audio URL or Web Speech Synthesis
     */
    function speakWord(word, audioUrl) {
        if (!word) return;

        if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('http')) {
            const audio = new Audio(audioUrl);
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Fallback to native Web Speech Synthesis
                    speakNativeTTS(word);
                });
                return;
            }
        }

        speakNativeTTS(word);
    }

    /**
     * Fallback to native browser Speech Synthesis (100% offline)
     */
    function speakNativeTTS(word) {
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel(); // Stop any pending utterance
                const utter = new SpeechSynthesisUtterance(word);
                utter.lang = 'en-US';
                utter.rate = 0.9;
                window.speechSynthesis.speak(utter);
            } catch (e) {
                console.warn("[Dictionary] TTS error:", e);
            }
        }
    }

    /**
     * Show dictionary popover near target element or mouse coords
     */
    async function showPopover(rawWord, options = {}) {
        const word = cleanWord(rawWord);
        if (!word) return;

        currentPopoverWord = word;
        currentPopoverContext = options.contextSentence || '';

        // If no explicit context passed, try to grab current sentence from AudioEngine
        if (!currentPopoverContext && root.App && root.App.AudioEngine) {
            const seg = root.App.AudioEngine.getCurrentSegment();
            if (seg && seg.text) {
                currentPopoverContext = seg.text;
            }
        }

        const popover = document.getElementById('dictPopover');
        const popoverBackdrop = document.getElementById('dictPopoverBackdrop');
        const popoverContent = document.getElementById('dictPopoverContent');
        if (!popover || !popoverContent) return;

        // Position popover
        const isMobile = window.innerWidth < 768;
        popover.classList.remove('hidden');
        if (popoverBackdrop) popoverBackdrop.classList.remove('hidden');

        if (isMobile) {
            popover.className = 'fixed inset-x-0 bottom-0 z-50 p-4 transition-transform duration-300';
            popoverContent.className = 'w-full max-w-lg mx-auto bg-stone-900/95 border border-amber-500/30 rounded-t-2xl shadow-2xl p-4 max-h-[85vh] overflow-y-auto backdrop-blur-xl';
            popoverContent.style.left = '';
            popoverContent.style.top = '';
        } else {
            popover.className = 'fixed inset-0 z-50 pointer-events-none';
            popoverContent.className = 'pointer-events-auto absolute w-96 bg-stone-900/95 border border-amber-500/30 rounded-xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto backdrop-blur-xl transition-all duration-200';

            // Calculate anchor coordinates
            let targetX = window.innerWidth / 2 - 192;
            let targetY = window.innerHeight / 2 - 150;

            if (options.targetEl) {
                const rect = options.targetEl.getBoundingClientRect();
                targetX = rect.left;
                targetY = rect.bottom + 8;
            } else if (options.clientX !== undefined && options.clientY !== undefined) {
                targetX = options.clientX;
                targetY = options.clientY + 12;
            }

            // Screen boundary clamping
            const popoverWidth = 384;
            const popoverHeight = 320;
            if (targetX + popoverWidth > window.innerWidth - 16) {
                targetX = window.innerWidth - popoverWidth - 16;
            }
            if (targetX < 16) targetX = 16;

            if (targetY + popoverHeight > window.innerHeight - 16) {
                targetY = Math.max(16, targetY - popoverHeight - 24);
            }

            popoverContent.style.left = `${targetX}px`;
            popoverContent.style.top = `${targetY}px`;
        }

        // Render Loading State
        popoverContent.innerHTML = `
            <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span class="font-mono text-xs uppercase tracking-wider text-amber-400">TRA CỨU TỪ ĐIỂN</span>
                </div>
                <button id="btnCloseDictPopover" class="p-1 text-gray-400 hover:text-white rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="py-6 flex flex-col items-center justify-center gap-3 text-gray-400">
                <div class="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="font-mono text-xs">Đang tìm dữ liệu cho "${escapeHTML(rawWord)}"...</p>
            </div>
        `;

        document.getElementById('btnCloseDictPopover')?.addEventListener('click', hidePopover);

        // Fetch dictionary data
        const entry = await lookup(word);
        currentPopoverEntry = entry;

        // Check if word is already saved in Vocabulary
        let isAlreadySaved = false;
        if (root.App && root.App.Storage && typeof root.App.Storage.getVocabWord === 'function') {
            const existing = await root.App.Storage.getVocabWord(word);
            if (existing) isAlreadySaved = true;
        }

        // Render Result State
        renderPopoverContent(popoverContent, entry, rawWord, isAlreadySaved);
    }

    /**
     * Render Popover HTML content
     */
    function renderPopoverContent(container, entry, rawWord, isAlreadySaved) {
        if (!entry) return;

        const displayWord = entry.displayWord || rawWord;
        const phonetic = entry.phonetic || '';
        const audioUrl = entry.audioUrl || '';

        let meaningsHTML = '';
        if (Array.isArray(entry.meanings) && entry.meanings.length > 0) {
            meaningsHTML = entry.meanings.map(m => `
                <div class="mb-2.5">
                    <div class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase mb-1">
                        ${escapeHTML(m.partOfSpeech)}
                    </div>
                    <ul class="space-y-1 pl-1">
                        ${m.definitions.map(d => `
                            <li class="text-xs text-gray-200 leading-relaxed">
                                • ${escapeHTML(d.definition)}
                                ${d.example ? `<p class="text-[11px] text-gray-400 italic mt-0.5 pl-2 border-l border-white/10">"${escapeHTML(d.example)}"</p>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');
        } else if (entry.notFound) {
            meaningsHTML = `
                <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200">
                    <p class="font-semibold mb-1">Không tìm thấy định nghĩa tự động</p>
                    <p class="text-[11px] text-gray-400 leading-relaxed">Từ này có thể là tên riêng, tiếng lóng hoặc từ viết tắt. Bạn vẫn có thể nghe phát âm offline và lưu vào sổ từ vựng.</p>
                </div>
            `;
        } else if (entry.isOffline) {
            meaningsHTML = `
                <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                    <p class="font-semibold mb-1">Chế độ ngoại tuyến (Offline)</p>
                    <p class="text-[11px] text-gray-400 leading-relaxed">Không có kết nối mạng để tải định nghĩa chi tiết. Phát âm TTS và lưu sổ từ vẫn hoạt động bình thường.</p>
                </div>
            `;
        }

        // Context Sentence Preview
        let contextHTML = '';
        if (currentPopoverContext) {
            const cleanDisplay = cleanWord(displayWord) || displayWord;
            const highlightedContext = escapeHTML(currentPopoverContext).replace(
                new RegExp(`\\b(${escapeRegex(cleanDisplay)})\\b`, 'gi'),
                '<span class="text-amber-400 font-bold bg-amber-500/20 px-1 rounded">$1</span>'
            );
            contextHTML = `
                <div class="mt-3 pt-2.5 border-t border-white/10">
                    <span class="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">NGỮ CẢNH BÀI HỌC</span>
                    <p class="text-[11px] text-gray-300 italic bg-black/40 p-2 rounded border-l-2 border-amber-500/60 leading-relaxed">
                        "${highlightedContext}"
                    </p>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span class="font-mono text-xs uppercase tracking-wider text-emerald-400">TỪ ĐIỂN 1 CHẠM</span>
                </div>
                <button id="btnCloseDictPopover" class="p-1 text-gray-400 hover:text-white rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Header: Word + IPA + Audio Play Button -->
            <div class="flex items-center justify-between gap-2 mb-3">
                <div>
                    <h3 class="text-lg font-bold text-white tracking-tight">${escapeHTML(displayWord)}</h3>
                    ${phonetic ? `<span class="text-xs font-mono text-amber-400 font-medium">${escapeHTML(phonetic)}</span>` : '<span class="text-[11px] text-gray-500 italic">Phiên âm qua Web Speech</span>'}
                </div>
                <button id="btnPlayWordAudio" class="p-2.5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/40 transition active:scale-95" title="Nghe phát âm">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
            </div>

            <!-- Definitions List -->
            <div class="space-y-2 text-xs">
                ${meaningsHTML}
            </div>

            <!-- Sentence Context -->
            ${contextHTML}

            <!-- Footer Action Button -->
            <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button id="btnSaveToVocab" class="flex-1 tactile-btn flex items-center justify-center gap-1.5 py-2 text-xs font-semibold ${isAlreadySaved ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500 hover:text-black'}">
                    <span>${isAlreadySaved ? '✓ ĐÃ LƯU TRONG SỔ TỪ' : '⭐ LƯU VÀO SỔ TỪ'}</span>
                </button>
            </div>
        `;

        // Wire event listeners
        document.getElementById('btnCloseDictPopover')?.addEventListener('click', hidePopover);

        document.getElementById('btnPlayWordAudio')?.addEventListener('click', () => {
            speakWord(displayWord, audioUrl);
        });

        document.getElementById('btnSaveToVocab')?.addEventListener('click', async () => {
            const saveBtn = document.getElementById('btnSaveToVocab');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span>Đang lưu...</span>`;
            }

            const vocabItem = {
                word: displayWord,
                phonetic: phonetic,
                pos: entry.primaryPos || (entry.meanings && entry.meanings[0] ? entry.meanings[0].partOfSpeech : ''),
                definition: entry.shortDef || (entry.meanings && entry.meanings[0] && entry.meanings[0].definitions[0] ? entry.meanings[0].definitions[0].definition : 'Saved via DictaShadow'),
                example: (entry.meanings && entry.meanings[0] && entry.meanings[0].definitions[0] ? entry.meanings[0].definitions[0].example : ''),
                contextSentence: currentPopoverContext,
                audioUrl: audioUrl,
                addedAt: Date.now()
            };

            if (root.App && root.App.Storage && typeof root.App.Storage.saveVocabWord === 'function') {
                await root.App.Storage.saveVocabWord(vocabItem);
                updateVocabBadge();

                if (saveBtn) {
                    saveBtn.className = 'flex-1 tactile-btn flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-emerald-600/30 text-emerald-300 border-emerald-500/50';
                    saveBtn.innerHTML = `<span>✓ ĐÃ LƯU VÀO SỔ TỪ!</span>`;
                }
            }
        });
    }

    /**
     * Hide dictionary popover
     */
    function hidePopover() {
        const popover = document.getElementById('dictPopover');
        const popoverBackdrop = document.getElementById('dictPopoverBackdrop');
        if (popover) popover.classList.add('hidden');
        if (popoverBackdrop) popoverBackdrop.classList.add('hidden');
        currentPopoverWord = null;
        currentPopoverEntry = null;
    }

    /**
     * Update Vocabulary Badge Count in header
     */
    async function updateVocabBadge() {
        const badge = document.getElementById('vocabBadgeCount');
        if (!badge) return;

        if (root.App && root.App.Storage && typeof root.App.Storage.getAllVocab === 'function') {
            try {
                const list = await root.App.Storage.getAllVocab();
                badge.textContent = String(list.length);
                if (list.length > 0) {
                    badge.classList.remove('hidden');
                }
            } catch (e) {
                console.warn("[Dictionary] Failed to count vocab:", e);
            }
        }
    }

    /**
     * Open Vocabulary Notebook Drawer
     */
    async function openVocabDrawer() {
        const drawer = document.getElementById('vocabDrawer');
        if (!drawer) return;

        drawer.classList.remove('hidden');
        renderVocabDrawerList();
    }

    /**
     * Close Vocabulary Notebook Drawer
     */
    function closeVocabDrawer() {
        const drawer = document.getElementById('vocabDrawer');
        if (drawer) drawer.classList.add('hidden');
    }

    /**
     * Render saved vocabulary list in drawer
     */
    async function renderVocabDrawerList(filterQuery = '') {
        const container = document.getElementById('vocabListContainer');
        const countBadge = document.getElementById('vocabDrawerCountBadge');
        if (!container) return;

        if (!root.App || !root.App.Storage || typeof root.App.Storage.getAllVocab !== 'function') {
            container.innerHTML = `<p class="p-4 text-center text-gray-500 text-xs">Chưa nạp module lưu trữ.</p>`;
            return;
        }

        const allWords = await root.App.Storage.getAllVocab();
        const query = filterQuery.trim().toLowerCase();

        const filtered = query
            ? allWords.filter(item => item.word.includes(query) || (item.definition && item.definition.toLowerCase().includes(query)))
            : allWords;

        if (countBadge) {
            countBadge.textContent = `${filtered.length}/${allWords.length} TỪ`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="py-12 px-4 text-center text-gray-400 space-y-3 font-mono text-xs">
                    <p class="text-sm text-gray-300">📖 Sổ từ vựng đang trống</p>
                    <p class="text-[11px] text-gray-500 max-w-xs mx-auto">
                        Nhấp vào bất kỳ từ nào trên kết quả chấm điểm hoặc nhấp đúp từ trên lời thoại để tra cứu và lưu từ mới!
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(item => {
            const displayWord = item.displayWord || item.word;
            const phonetic = item.phonetic ? `<span class="text-amber-400 text-xs font-mono">${escapeHTML(item.phonetic)}</span>` : '';
            const posBadge = item.pos ? `<span class="text-[10px] uppercase font-semibold px-1 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">${escapeHTML(item.pos)}</span>` : '';
            const dateStr = item.addedAt ? new Date(item.addedAt).toLocaleDateString('vi-VN') : '';

            return `
                <div class="p-3 bg-stone-900/60 border border-white/10 rounded-lg hover:border-amber-500/40 transition group">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-bold text-sm text-white">${escapeHTML(displayWord)}</span>
                            ${phonetic}
                            ${posBadge}
                        </div>
                        <div class="flex items-center gap-1">
                            <button class="btn-vocab-speak p-1 text-gray-400 hover:text-amber-400 rounded transition" data-word="${escapeHTML(displayWord)}" data-audio="${escapeHTML(item.audioUrl || '')}" title="Phát âm">
                                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                            </button>
                            <button class="btn-vocab-delete p-1 text-gray-500 hover:text-rose-400 rounded transition" data-word="${escapeHTML(item.word)}" title="Xóa từ khỏi sổ">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                    <p class="text-xs text-gray-300 leading-relaxed">${escapeHTML(item.definition || '')}</p>
                    ${item.contextSentence ? `
                        <div class="mt-2 text-[11px] text-gray-400 italic bg-black/40 p-2 rounded border-l border-amber-500/40">
                            "${escapeHTML(item.contextSentence)}"
                        </div>
                    ` : ''}
                    <div class="mt-1.5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                        <span>DictaShadow Studio</span>
                        <span>${dateStr}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Wire click handlers for speak & delete
        container.querySelectorAll('.btn-vocab-speak').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = btn.getAttribute('data-word');
                const audio = btn.getAttribute('data-audio');
                speakWord(word, audio);
            });
        });

        container.querySelectorAll('.btn-vocab-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const word = btn.getAttribute('data-word');
                if (confirm(`Xóa từ "${word}" khỏi Sổ tay từ vựng?`)) {
                    await root.App.Storage.deleteVocabWord(word);
                    updateVocabBadge();
                    renderVocabDrawerList(document.getElementById('vocabSearchInput')?.value || '');
                }
            });
        });
    }

    /**
     * Export saved vocabulary list to Anki TSV format
     * Format: Front \t Back \t Context \t Tags
     */
    async function exportToAnkiTSV() {
        if (!root.App || !root.App.Storage || typeof root.App.Storage.getAllVocab !== 'function') {
            alert('Không thể truy xuất dữ liệu lưu trữ.');
            return;
        }

        const vocabList = await root.App.Storage.getAllVocab();
        if (!vocabList || vocabList.length === 0) {
            alert('Sổ từ vựng đang trống! Hãy tra và lưu một vài từ trước khi xuất Anki.');
            return;
        }

        const rows = vocabList.map(item => {
            const front = (item.displayWord || item.word || '').replace(/\t/g, ' ').trim();
            const phoneticPart = item.phonetic ? `<b>${escapeHTML(item.phonetic)}</b> ` : '';
            const posPart = item.pos ? `<i>(${escapeHTML(item.pos)})</i><br>` : '<br>';
            const defPart = escapeHTML(item.definition || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
            const back = `${phoneticPart}${posPart}${defPart}`.trim();

            let context = '';
            if (item.contextSentence) {
                const escapedSentence = escapeHTML(item.contextSentence);
                const re = new RegExp(`\\b(${escapeRegex(front)})\\b`, 'gi');
                context = escapedSentence.replace(re, '<b>$1</b>').replace(/\t/g, ' ').replace(/\n/g, '<br>');
            }

            const tags = (item.tags || ['DictaShadow', 'EnglishVocabulary']).join(' ');

            return `${front}\t${back}\t${context}\t${tags}`;
        });

        // Prepend UTF-8 BOM (\uFEFF) to guarantee correct encoding in Windows/Anki
        const tsvContent = '\uFEFF' + rows.join('\r\n');

        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateTag = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `dictashadow-anki-vocab-${dateTag}.tsv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // =========================================================================
    // PHASE 5: INTERACTIVE 3D FLASHCARD & SUPERMEMO SM-2 SPACED REPETITION
    // =========================================================================

    let flashcardQueue = [];
    let flashcardIndex = 0;
    let isCardFlipped = false;
    let flashcardStats = { reviewed: 0, good: 0, hard: 0, again: 0 };

    /**
     * Pure SuperMemo SM-2 Spaced Repetition Algorithm
     * @param {Object} card Current card state { repetitions, interval, easeFactor }
     * @param {number} quality Grade 0 to 5 (1 = Again/Quên, 3 = Hard/Khó, 5 = Good/Thuộc)
     * @returns {{ repetitions: number, interval: number, easeFactor: number, nextReviewDate: number }}
     */
    function calculateSM2(card, quality) {
        const q = Math.max(0, Math.min(5, Math.round(Number(quality) || 0)));
        let repetitions = card && typeof card.repetitions === 'number' ? card.repetitions : 0;
        let interval = card && typeof card.interval === 'number' ? card.interval : 0;
        let easeFactor = card && typeof card.easeFactor === 'number' ? card.easeFactor : 2.5;

        if (q >= 3) {
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions += 1;
        } else {
            // Failed / Again: reset repetitions and restart with 1-day interval
            repetitions = 0;
            interval = 1;
        }

        // Standard SM-2 Ease Factor formula:
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (easeFactor < 1.30) {
            easeFactor = 1.30;
        }
        easeFactor = Math.round(easeFactor * 100) / 100;

        const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);

        return {
            repetitions,
            interval,
            easeFactor,
            nextReviewDate
        };
    }

    /**
     * Open Flashcard Review Modal
     */
    async function openFlashcardModal() {
        if (!root.App.Storage || typeof root.App.Storage.getAllVocab !== 'function') return;

        const allWords = await root.App.Storage.getAllVocab();
        if (!allWords || allWords.length === 0) {
            alert('Sổ tay từ vựng đang trống!\nHãy tra cứu và lưu từ vựng mới bằng cách nhấp đúp vào từ trong bài chép.');
            return;
        }

        // Close Vocab Drawer if open
        closeVocabDrawer();

        // Prioritize due cards (nextReviewDate <= Date.now()) then unseen cards (repetitions === 0)
        const now = Date.now();
        flashcardQueue = [...allWords].sort((a, b) => {
            const dueA = (a.nextReviewDate || 0) <= now ? 0 : 1;
            const dueB = (b.nextReviewDate || 0) <= now ? 0 : 1;
            if (dueA !== dueB) return dueA - dueB;
            return (a.nextReviewDate || 0) - (b.nextReviewDate || 0);
        });

        flashcardIndex = 0;
        isCardFlipped = false;
        flashcardStats = { reviewed: 0, good: 0, hard: 0, again: 0 };

        const modal = document.getElementById('flashcardModal');
        if (modal) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
        }

        const completeView = document.getElementById('flashcardCompleteContainer');
        const cardScene = document.getElementById('flashcardCard');
        if (completeView) completeView.classList.add('hidden');
        if (cardScene) cardScene.classList.remove('hidden');

        renderCurrentFlashcard();

        if (root.App.AudioEngine && typeof root.App.AudioEngine.playSynthesizedSound === 'function') {
            root.App.AudioEngine.playSynthesizedSound('click');
        }
    }

    /**
     * Close Flashcard Modal
     */
    function closeFlashcardModal() {
        const modal = document.getElementById('flashcardModal');
        if (modal) {
            modal.classList.add('opacity-0', 'pointer-events-none');
        }
        updateVocabBadge();
        renderVocabDrawerList();
    }

    /**
     * Render the active flashcard on screen
     */
    function renderCurrentFlashcard() {
        if (!flashcardQueue || flashcardIndex >= flashcardQueue.length) {
            showFlashcardCompletion();
            return;
        }

        const card = flashcardQueue[flashcardIndex];
        isCardFlipped = false;

        const inner = document.getElementById('flashcardInner');
        if (inner) inner.classList.remove('is-flipped');

        // Progress counter and bar
        const badge = document.getElementById('flashcardCounterBadge');
        if (badge) {
            badge.textContent = `Thẻ ${flashcardIndex + 1} / ${flashcardQueue.length}`;
        }
        const bar = document.getElementById('flashcardProgressBar');
        if (bar) {
            const percent = ((flashcardIndex) / flashcardQueue.length) * 100;
            bar.style.width = `${percent}%`;
        }

        // FRONT FACE
        const frontContext = document.getElementById('flashcardFrontContext');
        if (frontContext) {
            if (card.contextSentence && card.contextSentence.trim().length > 0) {
                // Mask the target word in the sentence
                const re = new RegExp(`\\b(${escapeRegex(card.word)})\\b`, 'gi');
                const masked = card.contextSentence.replace(re, '<span class="text-amber-400 font-bold border-b-2 border-amber-400/60 px-1.5">[ ... ]</span>');
                frontContext.innerHTML = `“${masked}”`;
            } else {
                frontContext.innerHTML = `<span class="text-amber-400 font-bold">[ ${card.pos ? card.pos.toUpperCase() : 'WORD'} ]</span><br><span class="text-xs text-titanium-400 mt-2 block">Hãy nhớ lại định nghĩa và phát âm của từ vựng này</span>`;
            }
        }

        const hintBadge = document.getElementById('flashcardFrontHint');
        if (hintBadge) {
            hintBadge.classList.add('hidden');
            hintBadge.textContent = '';
        }

        // BACK FACE
        const wordEl = document.getElementById('flashcardWord');
        if (wordEl) wordEl.textContent = card.displayWord || card.word;

        const posBadge = document.getElementById('flashcardPosBadge');
        if (posBadge) posBadge.textContent = (card.pos || 'VOCAB').toUpperCase();

        const phoneticEl = document.getElementById('flashcardPhonetic');
        if (phoneticEl) phoneticEl.textContent = card.phonetic || '';

        const defEl = document.getElementById('flashcardDefinition');
        if (defEl) defEl.textContent = card.definition || 'Chưa có giải nghĩa chi tiết.';

        const backContext = document.getElementById('flashcardBackContext');
        if (backContext) {
            if (card.contextSentence && card.contextSentence.trim().length > 0) {
                const re = new RegExp(`\\b(${escapeRegex(card.word)})\\b`, 'gi');
                const bolded = card.contextSentence.replace(re, '<b class="text-amber-400 font-bold underline">$1</b>');
                backContext.innerHTML = `“${bolded}”`;
                backContext.classList.remove('hidden');
            } else {
                backContext.classList.add('hidden');
            }
        }

        // Preview intervals for buttons
        const hardInterval = calculateSM2(card, 3).interval;
        const goodInterval = calculateSM2(card, 5).interval;

        const hardLabel = document.getElementById('flashcardHardInterval');
        if (hardLabel) hardLabel.textContent = `${hardInterval} ngày`;

        const goodLabel = document.getElementById('flashcardGoodInterval');
        if (goodLabel) goodLabel.textContent = `${goodInterval} ngày`;
    }

    /**
     * Flip card between front and back
     */
    function flipFlashcard() {
        isCardFlipped = !isCardFlipped;
        const inner = document.getElementById('flashcardInner');
        if (inner) inner.classList.toggle('is-flipped', isCardFlipped);

        if (root.App.AudioEngine && typeof root.App.AudioEngine.playSynthesizedSound === 'function') {
            root.App.AudioEngine.playSynthesizedSound('click');
        }
    }

    /**
     * Show front hint (First and last letter + length)
     */
    function showFlashcardHint() {
        if (!flashcardQueue || flashcardIndex >= flashcardQueue.length) return;
        const card = flashcardQueue[flashcardIndex];
        const w = card.word || '';
        const hintBadge = document.getElementById('flashcardFrontHint');
        if (hintBadge && w.length > 0) {
            hintBadge.textContent = `💡 Gợi ý: ${w[0].toUpperCase()}···${w[w.length - 1]} (${w.length} chữ cái)`;
            hintBadge.classList.remove('hidden');
        }
        if (root.App.AudioEngine && typeof root.App.AudioEngine.playSynthesizedSound === 'function') {
            root.App.AudioEngine.playSynthesizedSound('click');
        }
    }

    /**
     * Rate flashcard with SM-2 quality (1 = Again, 3 = Hard, 5 = Good)
     */
    async function rateFlashcard(quality) {
        if (!flashcardQueue || flashcardIndex >= flashcardQueue.length) return;
        const card = flashcardQueue[flashcardIndex];

        const sm2 = calculateSM2(card, quality);
        card.repetitions = sm2.repetitions;
        card.interval = sm2.interval;
        card.easeFactor = sm2.easeFactor;
        card.nextReviewDate = sm2.nextReviewDate;
        card.lastReviewedAt = Date.now();

        // Update stats
        flashcardStats.reviewed++;
        if (quality <= 2) flashcardStats.again++;
        else if (quality <= 4) flashcardStats.hard++;
        else flashcardStats.good++;

        // Save to IndexedDB
        if (root.App.Storage && typeof root.App.Storage.saveVocabWord === 'function') {
            await root.App.Storage.saveVocabWord(card);
        }

        // SFX feedback
        if (root.App.AudioEngine && typeof root.App.AudioEngine.playSynthesizedSound === 'function') {
            if (quality >= 5) root.App.AudioEngine.playSynthesizedSound('success');
            else root.App.AudioEngine.playSynthesizedSound('stamp');
        }

        flashcardIndex++;
        renderCurrentFlashcard();
    }

    /**
     * Display celebration & summary screen when session finishes
     */
    function showFlashcardCompletion() {
        const cardScene = document.getElementById('flashcardCard');
        const completeView = document.getElementById('flashcardCompleteContainer');
        if (cardScene) cardScene.classList.add('hidden');
        if (completeView) completeView.classList.remove('hidden');

        const badge = document.getElementById('flashcardCounterBadge');
        if (badge) badge.textContent = `HOÀN THÀNH 100%`;

        const bar = document.getElementById('flashcardProgressBar');
        if (bar) bar.style.width = '100%';

        const summaryEl = document.getElementById('flashcardSummaryStats');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="p-3 rounded-xl bg-studio-950 border border-white/5 flex flex-col items-center">
                    <span class="text-2xl font-bold font-mono text-white">${flashcardStats.reviewed}</span>
                    <span class="text-[10px] text-titanium-400 font-mono mt-1">Đã ôn tập</span>
                </div>
                <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center">
                    <span class="text-2xl font-bold font-mono text-emerald-400">${flashcardStats.good}</span>
                    <span class="text-[10px] text-emerald-400 font-mono mt-1">Đã thuộc</span>
                </div>
                <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center">
                    <span class="text-2xl font-bold font-mono text-amber-400">${flashcardStats.hard}</span>
                    <span class="text-[10px] text-amber-400 font-mono mt-1">Cần củng cố</span>
                </div>
            `;
        }

        if (root.App.AudioEngine && typeof root.App.AudioEngine.playSynthesizedSound === 'function') {
            root.App.AudioEngine.playSynthesizedSound('success');
        }
    }

    /**
     * Initialize dictionary module bindings
     */
    function init() {
        updateVocabBadge();

        // Close popover on backdrop click or outside click
        document.getElementById('dictPopoverBackdrop')?.addEventListener('click', hidePopover);

        // Header trigger for Vocab Drawer
        document.getElementById('btnOpenVocabDrawer')?.addEventListener('click', openVocabDrawer);
        document.getElementById('btnCloseVocabDrawer')?.addEventListener('click', closeVocabDrawer);
        document.getElementById('vocabDrawerBackdrop')?.addEventListener('click', closeVocabDrawer);

        // Search input in Vocab Drawer
        document.getElementById('vocabSearchInput')?.addEventListener('input', (e) => {
            renderVocabDrawerList(e.target.value);
        });

        // Export Anki TSV button
        document.getElementById('btnExportAnkiTSV')?.addEventListener('click', exportToAnkiTSV);

        // Clear all vocab button
        document.getElementById('btnClearAllVocab')?.addEventListener('click', async () => {
            if (confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ từ vựng trong sổ tay?')) {
                await root.App.Storage.clearVocab();
                updateVocabBadge();
                renderVocabDrawerList();
            }
        });

        // Open Flashcard Modal
        document.getElementById('btnOpenFlashcards')?.addEventListener('click', openFlashcardModal);
        document.getElementById('btnCloseFlashcardModal')?.addEventListener('click', closeFlashcardModal);
        document.getElementById('btnFinishFlashcardSession')?.addEventListener('click', closeFlashcardModal);

        // Flashcard scene click to flip
        document.getElementById('flashcardCard')?.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            flipFlashcard();
        });

        // Flip button inside front face
        document.getElementById('btnFlashcardHint')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showFlashcardHint();
        });

        // Pronunciation speech buttons inside front and back faces
        document.getElementById('btnFlashcardSpeakFront')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (flashcardQueue[flashcardIndex]) {
                speakWord(flashcardQueue[flashcardIndex].word, flashcardQueue[flashcardIndex].audioUrl);
            }
        });

        document.getElementById('btnFlashcardSpeakBack')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (flashcardQueue[flashcardIndex]) {
                speakWord(flashcardQueue[flashcardIndex].word, flashcardQueue[flashcardIndex].audioUrl);
            }
        });

        // SM-2 Rating buttons
        document.getElementById('btnFlashcardAgain')?.addEventListener('click', (e) => {
            e.stopPropagation();
            rateFlashcard(1);
        });
        document.getElementById('btnFlashcardHard')?.addEventListener('click', (e) => {
            e.stopPropagation();
            rateFlashcard(3);
        });
        document.getElementById('btnFlashcardGood')?.addEventListener('click', (e) => {
            e.stopPropagation();
            rateFlashcard(5);
        });

        // Global Esc & keyboard shortcuts for dictionary / flashcards
        window.addEventListener('keydown', (e) => {
            const flashcardModal = document.getElementById('flashcardModal');
            if (flashcardModal && !flashcardModal.classList.contains('pointer-events-none') && !flashcardModal.classList.contains('opacity-0')) {
                if (e.key === 'Escape') {
                    closeFlashcardModal();
                    e.stopImmediatePropagation();
                    return;
                }
                if (e.key === ' ' || e.code === 'Space') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    flipFlashcard();
                    return;
                }
                if (isCardFlipped) {
                    if (e.key === '1') {
                        e.preventDefault();
                        rateFlashcard(1);
                    } else if (e.key === '2') {
                        e.preventDefault();
                        rateFlashcard(3);
                    } else if (e.key === '3') {
                        e.preventDefault();
                        rateFlashcard(5);
                    }
                }
                return;
            }

            if (e.key === 'Escape') {
                const popover = document.getElementById('dictPopover');
                if (popover && !popover.classList.contains('hidden')) {
                    hidePopover();
                    e.stopImmediatePropagation();
                    return;
                }
                const drawer = document.getElementById('vocabDrawer');
                if (drawer && !drawer.classList.contains('hidden')) {
                    closeVocabDrawer();
                    e.stopImmediatePropagation();
                    return;
                }
            }
        });
    }

    root.App = root.App || {};
    root.App.Dictionary = {
        cleanWord,
        parseDictionaryResponse,
        lookup,
        speakWord,
        showPopover,
        hidePopover,
        updateVocabBadge,
        openVocabDrawer,
        closeVocabDrawer,
        renderVocabDrawerList,
        exportToAnkiTSV,
        calculateSM2,
        openFlashcardModal,
        closeFlashcardModal,
        renderCurrentFlashcard,
        flipFlashcard,
        showFlashcardHint,
        rateFlashcard,
        init
    };

})(typeof window !== 'undefined' ? window : this);

