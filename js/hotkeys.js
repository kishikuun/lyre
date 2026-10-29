/**
 * DictaShadow Studio - Ergonomic Transcription Hotkeys Manager (js/hotkeys.js)
 * Designed for 0 hand contortion and touch typing flow.
 */
(function (root) {
    'use strict';

    const state = root.App.state;

    function initHotkeys() {
        window.addEventListener('keydown', (e) => {
            const AudioEngine = root.App.AudioEngine;
            const Dictation = root.App.Dictation;
            const Shadowing = root.App.Shadowing;

            // 1. ESC: SIÊU TIỆN DỤNG - 1 chạm phím Esc để Dừng / Phát tiếp (Không cần giữ Ctrl!)
            if (e.key === 'Escape') {
                const srtEditorModal = document.getElementById('srtEditorModal');
                const hotkeysModal = document.getElementById('hotkeysModal');
                const sentenceDrawer = document.getElementById('sentenceDrawer');
                if (srtEditorModal && !srtEditorModal.classList.contains('pointer-events-none')) {
                    srtEditorModal.classList.add('opacity-0', 'pointer-events-none');
                    return;
                }
                if (hotkeysModal && !hotkeysModal.classList.contains('pointer-events-none')) {
                    hotkeysModal.classList.add('opacity-0', 'pointer-events-none');
                    return;
                }
                if (sentenceDrawer && !sentenceDrawer.classList.contains('pointer-events-none')) {
                    sentenceDrawer.classList.add('opacity-0', 'pointer-events-none');
                    return;
                }

                e.preventDefault();
                AudioEngine.togglePlay();
                return;
            }

            // Cho phép phím Tab hoạt động bình thường khi Modal đang mở (Accessibility A11y)
            const isModalActive = document.querySelector('#srtEditorModal:not(.pointer-events-none), #hotkeysModal:not(.pointer-events-none), #sentenceDrawer:not(.pointer-events-none)');

            // 2. TAB: SIÊU TỐC ĐỘ - 1 chạm phím Tab bằng ngón út để TUA LÙI 2S (Nghe lại từ vừa qua)
            if (e.key === 'Tab' && !e.shiftKey) {
                if (isModalActive) return;
                e.preventDefault();
                AudioEngine.rewind(2.0);
                return;
            }

            // 3. SHIFT + TAB: TUA TIẾN 2S
            if (e.key === 'Tab' && e.shiftKey) {
                if (isModalActive) return;
                e.preventDefault();
                AudioEngine.forward(2.0);
                return;
            }

            // 4. F1 - F5: Dãy phím chức năng 1 nút bấm trực tiếp
            if (e.key === 'F1') {
                e.preventDefault();
                AudioEngine.togglePlay();
                return;
            }

            if (e.key === 'F2') {
                e.preventDefault();
                AudioEngine.rewind(2.0);
                return;
            }

            if (e.key === 'F3') {
                e.preventDefault();
                AudioEngine.forward(2.0);
                return;
            }

            if (e.key === 'F4') {
                e.preventDefault();
                AudioEngine.replay();
                return;
            }

            if (e.key === 'F5') {
                e.preventDefault();
                Dictation.toggleSubReveal();
                return;
            }

            // 5. CTRL + ENTER: Chấm điểm bài gõ chính tả
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                Dictation.checkStandardDictation();
                return;
            }

            // 6. PHÍM TẮT TRONG SHADOWING LAB (Khi không gõ trong ô văn bản)
            const isTypingInInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
            if (!isTypingInInput && state.activeTab === 'shadowing') {
                if (e.key.toLowerCase() === 'r') {
                    e.preventDefault();
                    Shadowing.toggleRecording();
                    return;
                }
                if (e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    AudioEngine.toggleABTrack();
                    Shadowing.updateABButtonUI();
                    return;
                }
                if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    AudioEngine.playStereoContrast(0);
                    return;
                }
                if (e.key.toLowerCase() === 'p') {
                    e.preventDefault();
                    const btnTogglePitch = document.getElementById('btnTogglePitch');
                    if (btnTogglePitch) btnTogglePitch.click();
                    return;
                }
                if (e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    Shadowing.toggleBlindMode();
                    return;
                }
                if (['1', '2', '3', '4'].includes(e.key)) {
                    e.preventDefault();
                    Shadowing.setShadowingStep(parseInt(e.key));
                    return;
                }
                if (e.key === '[') {
                    e.preventDefault();
                    const btnPrev = document.getElementById('btnPrev');
                    if (btnPrev) btnPrev.click();
                    return;
                }
                if (e.key === ']') {
                    e.preventDefault();
                    const btnNext = document.getElementById('btnNext');
                    if (btnNext) btnNext.click();
                    return;
                }
                if (e.code === 'Space') {
                    e.preventDefault();
                    AudioEngine.togglePlay();
                    return;
                }
            }

            // Fallback phụ: Ctrl + Space vẫn hoạt động nếu ai quen tay
            if ((e.ctrlKey || e.altKey) && e.code === 'Space') {
                e.preventDefault();
                AudioEngine.togglePlay();
            }
        });
    }

    root.App = root.App || {};
    root.App.Hotkeys = {
        initHotkeys
    };

})(window);
