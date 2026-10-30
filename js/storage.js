/**
 * DictaShadow Studio - IndexedDB Offline Storage Manager (js/storage.js)
 * Stores Audio files, Subtitles, Session Progress, and Shadowing Voice Recordings offline
 */
(function (root) {
    'use strict';

    const DB_NAME = 'DictaShadowStudioDB';
    const DB_VERSION = 2;
    let dbInstance = null;

    function openDB() {
        if (dbInstance) return Promise.resolve(dbInstance);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('media')) {
                    db.createObjectStore('media', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('subtitles')) {
                    db.createObjectStore('subtitles', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('recordings')) {
                    db.createObjectStore('recordings', { keyPath: 'sentenceIdx' });
                }
                if (!db.objectStoreNames.contains('vocabulary')) {
                    db.createObjectStore('vocabulary', { keyPath: 'word' });
                }
                if (!db.objectStoreNames.contains('dict_cache')) {
                    db.createObjectStore('dict_cache', { keyPath: 'word' });
                }
            };

            request.onsuccess = (e) => {
                dbInstance = e.target.result;
                resolve(dbInstance);
            };

            request.onerror = (e) => {
                console.error("IndexedDB open error:", e.target.error);
                reject(e.target.error);
            };
        });
    }

    // Media Audio Operations
    async function saveAudio(arrayBuffer, fileName) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('media', 'readwrite');
            const store = tx.objectStore('media');
            const item = {
                key: 'current_audio',
                buffer: arrayBuffer,
                fileName: fileName,
                updatedAt: Date.now()
            };
            const req = store.put(item);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async function getAudio() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('media', 'readonly');
            const store = tx.objectStore('media');
            const req = store.get('current_audio');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    // Subtitles Operations
    async function saveSRT(srtText, fileName) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('subtitles', 'readwrite');
            const store = tx.objectStore('subtitles');
            const item = {
                key: 'current_srt',
                text: srtText,
                fileName: fileName,
                updatedAt: Date.now()
            };
            const req = store.put(item);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async function getSRT() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('subtitles', 'readonly');
            const store = tx.objectStore('subtitles');
            const req = store.get('current_srt');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    // Progress Tracking Operations
    async function saveProgress(currentIdx, completedArray) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('progress', 'readwrite');
            const store = tx.objectStore('progress');
            const item = {
                key: 'session_progress',
                currentIdx: currentIdx,
                completed: completedArray,
                updatedAt: Date.now()
            };
            const req = store.put(item);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async function getProgress() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('progress', 'readonly');
            const store = tx.objectStore('progress');
            const req = store.get('session_progress');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    // Phase 4: Study Analytics & Streak Persistence
    async function saveAnalytics(stats) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('progress', 'readwrite');
            const store = tx.objectStore('progress');
            const item = {
                key: 'study_analytics',
                streak: stats.streak || 1,
                lastDate: stats.lastDate || new Date().toISOString().slice(0, 10),
                totalSeconds: stats.totalSeconds || 0,
                phoneticErrors: stats.phoneticErrors || {},
                updatedAt: Date.now()
            };
            const req = store.put(item);
            req.onsuccess = () => resolve(item);
            req.onerror = () => reject(req.error);
        });
    }

    async function getAnalytics() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('progress', 'readonly');
            const store = tx.objectStore('progress');
            const req = store.get('study_analytics');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    // Shadowing User Voice Recordings
    async function saveUserRecording(sentenceIdx, blob) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('recordings', 'readwrite');
            const store = tx.objectStore('recordings');
            const item = {
                sentenceIdx: sentenceIdx,
                blob: blob,
                updatedAt: Date.now()
            };
            const req = store.put(item);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async function getAllUserRecordings() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('recordings', 'readonly');
            const store = tx.objectStore('recordings');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    // Vocabulary Notebook Operations
    async function saveVocabWord(item) {
        if (!item || !item.word) return false;
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('vocabulary', 'readwrite');
            const store = tx.objectStore('vocabulary');
            const record = {
                word: item.word.trim().toLowerCase(),
                displayWord: item.word.trim(),
                phonetic: item.phonetic || '',
                pos: item.pos || '',
                definition: item.definition || '',
                example: item.example || '',
                contextSentence: item.contextSentence || '',
                audioUrl: item.audioUrl || '',
                addedAt: item.addedAt || Date.now(),
                tags: item.tags || ['DictaShadow'],
                repetitions: typeof item.repetitions === 'number' ? item.repetitions : 0,
                interval: typeof item.interval === 'number' ? item.interval : 0,
                easeFactor: typeof item.easeFactor === 'number' ? item.easeFactor : 2.5,
                nextReviewDate: typeof item.nextReviewDate === 'number' ? item.nextReviewDate : 0,
                lastReviewedAt: typeof item.lastReviewedAt === 'number' ? item.lastReviewedAt : 0
            };
            const req = store.put(record);
            req.onsuccess = () => resolve(record);
            req.onerror = () => reject(req.error);
        });
    }

    async function getVocabWord(word) {
        if (!word) return null;
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('vocabulary', 'readonly');
            const store = tx.objectStore('vocabulary');
            const req = store.get(word.trim().toLowerCase());
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    async function getAllVocab() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('vocabulary', 'readonly');
            const store = tx.objectStore('vocabulary');
            const req = store.getAll();
            req.onsuccess = () => {
                const list = req.result || [];
                list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
                resolve(list);
            };
            req.onerror = () => reject(req.error);
        });
    }

    async function deleteVocabWord(word) {
        if (!word) return false;
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('vocabulary', 'readwrite');
            const store = tx.objectStore('vocabulary');
            const req = store.delete(word.trim().toLowerCase());
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async function clearVocab() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('vocabulary', 'readwrite');
            const store = tx.objectStore('vocabulary');
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    // Dictionary Offline API Cache
    async function saveDictCache(word, data) {
        if (!word || !data) return false;
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('dict_cache', 'readwrite');
            const store = tx.objectStore('dict_cache');
            const req = store.put({
                word: word.trim().toLowerCase(),
                data: data,
                cachedAt: Date.now()
            });
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async function getDictCache(word) {
        if (!word) return null;
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('dict_cache', 'readonly');
            const store = tx.objectStore('dict_cache');
            const req = store.get(word.trim().toLowerCase());
            req.onsuccess = () => resolve(req.result ? req.result.data : null);
            req.onerror = () => reject(req.error);
        });
    }

    // Clear all offline study data
    async function clearAll() {
        const db = await openDB();
        const stores = ['media', 'subtitles', 'progress', 'recordings', 'dict_cache'];
        const tx = db.transaction(stores, 'readwrite');
        stores.forEach(s => tx.objectStore(s).clear());
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve(true);
        });
    }

    root.App = root.App || {};
    root.App.Storage = {
        saveAudio,
        getAudio,
        saveSRT,
        getSRT,
        saveProgress,
        getProgress,
        saveAnalytics,
        getAnalytics,
        saveUserRecording,
        getAllUserRecordings,
        saveVocabWord,
        getVocabWord,
        getAllVocab,
        deleteVocabWord,
        clearVocab,
        saveDictCache,
        getDictCache,
        clearAll
    };

})(window);

