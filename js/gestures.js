/**
 * DictaShadow Studio - Mobile Touch & Gesture Engine (js/gestures.js)
 * Implements swipe left/right for sentence navigation and double-tap to seek on mobile
 */
(function (root) {
    'use strict';

    const state = root.App.state;
    const AudioEngine = root.App.AudioEngine;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;

    function initGestures() {
        const workspaceArea = document.getElementById('workspaceArea');
        if (!workspaceArea) return;

        workspaceArea.addEventListener('touchstart', handleTouchStart, { passive: true });
        workspaceArea.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    function handleTouchStart(e) {
        if (shouldIgnoreTouch(e.target)) return;

        const touch = e.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
    }

    function handleTouchEnd(e) {
        if (shouldIgnoreTouch(e.target)) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const duration = Date.now() - touchStartTime;
        const isStationaryTap = Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15;

        // 1. Double-Tap chỉ kích hoạt khi chạm tại chỗ (không phải vuốt)
        if (isStationaryTap && duration < 250) {
            const now = Date.now();
            if (now - lastTapTime < 280) {
                handleDoubleTap(touch.clientX);
                lastTapTime = 0;
                return;
            }
            lastTapTime = now;
            return;
        }

        // 2. Nhận diện Vuốt ngang chuyển câu
        if (duration < 450 && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX < 0) {
                // Swipe Left -> Next sentence
                const btnNext = document.getElementById('btnNext');
                if (btnNext) btnNext.click();
            } else {
                // Swipe Right -> Previous sentence
                const btnPrev = document.getElementById('btnPrev');
                if (btnPrev) btnPrev.click();
            }
        }
    }

    function handleDoubleTap(clientX) {
        const screenWidth = window.innerWidth;
        if (clientX < screenWidth / 2) {
            // Double tap on left half: Rewind 2s
            AudioEngine.rewind(2.0);
            showMobileSeekFeedback('-2s');
        } else {
            // Double tap on right half: Forward 2s
            AudioEngine.forward(2.0);
            showMobileSeekFeedback('+2s');
        }
    }

    function showMobileSeekFeedback(text) {
        const feedback = document.createElement('div');
        feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-studio-950/90 text-accent-amber font-mono font-bold text-lg px-4 py-2 rounded-xl border border-amber-500/50 shadow-2xl z-50 pointer-events-none transition-opacity duration-300';
        feedback.textContent = text;
        document.body.appendChild(feedback);
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => document.body.removeChild(feedback), 300);
        }, 400);
    }

    function shouldIgnoreTouch(target) {
        if (!target) return false;
        const tagName = target.tagName;
        if (['INPUT', 'TEXTAREA', 'BUTTON', 'CANVAS', 'SELECT'].includes(tagName)) return true;
        if (target.closest('#vinylContainer') || target.closest('.timeline-track')) return true;
        return false;
    }

    root.App = root.App || {};
    root.App.Gestures = {
        initGestures
    };

})(window);

