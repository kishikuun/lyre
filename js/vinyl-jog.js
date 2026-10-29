/**
 * DictaShadow Studio - Interactive Vinyl Jog-Wheel (js/vinyl-jog.js)
 */
(function (root) {
    'use strict';

    const state = root.App.state;

    function getPointerAngle(e, rect) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    }

    function initVinyl() {
        const vinylContainer = document.getElementById('vinylContainer');
        const vinylDisk = document.getElementById('vinylDisk');
        const jogHudBadge = document.getElementById('jogHudBadge');
        const jogHudText = document.getElementById('jogHudText');

        if (!vinylContainer || !vinylDisk) return;

        vinylContainer.addEventListener('pointerdown', (e) => {
            const seg = root.App.AudioEngine.getCurrentSegment();
            if (!seg) return;

            state.isJogging = true;
            try { vinylContainer.setPointerCapture(e.pointerId); } catch (err) { }

            const rect = vinylContainer.getBoundingClientRect();
            state.lastJogAngle = getPointerAngle(e, rect);
            state.jogScrubDelta = 0;

            // Pause temporarily while user scrubs with finger/mouse
            if (state.isPlaying) {
                root.App.AudioEngine.pause();
            }

            if (jogHudBadge && jogHudText) {
                jogHudBadge.classList.remove('opacity-0');
                jogHudText.textContent = `JOG: 0.00s`;
            }
        });

        vinylContainer.addEventListener('pointermove', (e) => {
            if (!state.isJogging) return;

            const rect = vinylContainer.getBoundingClientRect();
            const currentAngle = getPointerAngle(e, rect);
            let angleDiff = currentAngle - state.lastJogAngle;

            // Normalize cross 180 / -180 boundary
            if (angleDiff > 180) angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;

            state.vinylRotation += angleDiff;
            state.lastJogAngle = currentAngle;

            vinylDisk.style.setProperty('--disk-rot', `${state.vinylRotation}deg`);
            vinylDisk.style.transform = `rotate(${state.vinylRotation}deg)`;

            // 360 degrees = 4.0 seconds of audio scrubbing
            const scrubSeconds = (angleDiff / 360) * 4.0;
            state.jogScrubDelta += scrubSeconds;

            if (jogHudText) {
                const sign = state.jogScrubDelta >= 0 ? '+' : '';
                jogHudText.textContent = `JOG: ${sign}${state.jogScrubDelta.toFixed(2)}s`;
            }
        });

        const handlePointerEnd = (e) => {
            if (!state.isJogging) return;
            state.isJogging = false;
            try { vinylContainer.releasePointerCapture(e.pointerId); } catch (err) { }

            if (jogHudBadge) {
                setTimeout(() => jogHudBadge.classList.add('opacity-0'), 800);
            }

            const seg = root.App.AudioEngine.getCurrentSegment();
            if (seg && state.audioBuffer) {
                const targetOffset = Math.max(0, Math.min(seg.duration - 0.1, state.pausedAt + state.jogScrubDelta));
                root.App.AudioEngine.play(targetOffset);
            }
        };

        vinylContainer.addEventListener('pointerup', handlePointerEnd);
        vinylContainer.addEventListener('pointercancel', handlePointerEnd);
    }

    root.App = root.App || {};
    root.App.VinylJog = {
        initVinyl
    };

})(window);

