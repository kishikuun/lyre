/**
 * DictaShadow Studio - IndexedDB Offline Storage Manager (js/storage.js)
 * Stores Audio files, Subtitles, Session Progress, and Shadowing Voice Recordings offline
 */
(function (root) {
    'use strict';

    const DB_NAME = 'DictaShadowStudioDB';
    const DB_VERSION = 1;
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

    // Clear all offline study data
    async function clearAll() {
        const db = await openDB();
        const stores = ['media', 'subtitles', 'progress', 'recordings'];
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
        saveUserRecording,
        getAllUserRecordings,
        clearAll
    };

})(window);

