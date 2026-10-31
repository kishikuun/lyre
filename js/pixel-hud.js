/**
 * Lyre Studio - Deltarune-style Combat HUD (js/pixel-hud.js)
 * TP Tension Bar, Combo counter, $ Credits wallet, floating popups and the 4-button RPG command bar.
 * Pure reward logic lives in PixelHUD.registerResult() so it can be unit-tested headlessly.
 */
(function (root) {
    'use strict';

    const STORAGE_KEY = 'lyre_pixel_hud_v1';
    const PASS_THRESHOLD = 80;
    const MAX_POPUPS = 6;
    const MODES = ['standard', 'cloze', 'stream'];
    const MODE_LABELS = { standard: 'CHÉP', cloze: 'ĐIỀN KHUYẾT', stream: 'STREAM' };

    class PixelHUD {
        /**
         * @param {Object} options
         * @param {Object} options.actions  { mode, act, item, stamp } command callbacks (facades over existing features)
         */
        constructor(options = {}) {
            this.actions = options.actions || {};
            this.tp = 0;
            this.combo = 0;
            this.bestCombo = 0;
            this.credits = 0;
            this.cleared = new Set();
            this.dom = {};
            this._load();
        }

        // ------------------------------------------------------------------
        // Persistence (credits + best combo survive reloads; TP/combo are per-session)
        // ------------------------------------------------------------------
        _load() {
            try {
                const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
                if (!raw) return;
                const data = JSON.parse(raw);
                this.credits = Math.max(0, Number(data.credits) || 0);
                this.bestCombo = Math.max(0, Number(data.bestCombo) || 0);
            } catch (e) { /* corrupted storage: start fresh */ }
        }

        _save() {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ credits: this.credits, bestCombo: this.bestCombo }));
                }
            } catch (e) { /* private mode / quota: ignore */ }
        }

        // ------------------------------------------------------------------
        // Pure game rules
        // ------------------------------------------------------------------
        /**
         * Apply one graded attempt. `key` identifies the sentence: a pass on an already
         * cleared key never pays out twice (anti-farming), though a fail still breaks the combo.
         */
        registerResult({ accuracy, key } = {}) {
            const acc = Math.max(0, Math.min(100, Number(accuracy) || 0));
            const res = { pass: acc >= PASS_THRESHOLD, tpDelta: 0, credits: 0, combo: this.combo, overclock: false, repeat: false, tpMax: false };

            if (res.pass) {
                if (key !== undefined && this.cleared.has(key)) {
                    res.repeat = true;
                    return res;
                }
                if (key !== undefined) this.cleared.add(key);

                this.combo += 1;
                this.bestCombo = Math.max(this.bestCombo, this.combo);
                res.combo = this.combo;

                let payout = 5 + Math.round(acc / 10) + Math.min(this.combo, 10) * 2;
                if (this.tp >= 100) {
                    payout *= 2;
                    res.overclock = true;
                    res.tpDelta = 40 - this.tp;
                    this.tp = 40;
                } else {
                    const gain = 8 + Math.min(this.combo, 5) * 2 + (acc >= 95 ? 6 : 0);
                    const before = this.tp;
                    this.tp = Math.min(100, this.tp + gain);
                    res.tpDelta = this.tp - before;
                    res.tpMax = this.tp >= 100;
                }
                this.credits += payout;
                res.credits = payout;
            } else {
                const before = this.tp;
                this.tp = Math.max(0, this.tp - 10);
                res.tpDelta = this.tp - before;
                this.combo = 0;
                res.combo = 0;
                const fine = Math.min(this.credits, 2);
                this.credits -= fine;
                res.credits = -fine;
            }
            this._save();
            return res;
        }

        awardBonus(amount) {
            const value = Math.max(0, Math.floor(Number(amount) || 0));
            this.credits += value;
            this._save();
            return value;
        }

        resetSession() {
            this.tp = 0;
            this.combo = 0;
            this.cleared.clear();
        }

        // ------------------------------------------------------------------
        // Rendering
        // ------------------------------------------------------------------
        init(mount) {
            if (!mount || typeof document === 'undefined') return;
            this.dom.mount = mount;
            mount.innerHTML = `
                <div class="pixel-hud relative select-none mb-3" id="pixelHud">
                    <div class="hud-stats flex items-stretch gap-2 sm:gap-3">
                        <div class="hud-tp flex-1 min-w-0" id="hudTpBox" role="progressbar" aria-label="Tension Points" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                            <div class="hud-label">TP <span id="hudTpText">0%</span></div>
                            <div class="hud-tp-track"><div class="hud-tp-fill" id="hudTpFill"></div><div class="hud-tp-cells"></div></div>
                        </div>
                        <div class="hud-chip" id="hudComboBox" title="Chuỗi câu đạt chuẩn liên tiếp"><span class="hud-label">COMBO</span><b id="hudCombo">x0</b></div>
                        <div class="hud-chip hud-credits" title="Ví tiền ca trực"><span class="hud-label">CREDITS</span><b id="hudCredits" aria-live="polite">$0</b></div>
                    </div>
                    <div class="hud-commands grid grid-cols-4 gap-1.5 mt-2" role="group" aria-label="Lệnh chiến đấu">
                        <button type="button" class="hud-cmd" data-cmd="mode" title="Đổi chế độ: Chép → Điền khuyết → Stream"><span class="hud-cmd-icon">⚔️</span><span class="hud-cmd-name">MODE</span><span class="hud-cmd-sub" id="hudModeLabel">CHÉP</span></button>
                        <button type="button" class="hud-cmd" data-cmd="act" title="Gợi ý từ tiếp theo (Tab)"><span class="hud-cmd-icon">🔍</span><span class="hud-cmd-name">ACT</span><span class="hud-cmd-sub">GỢI Ý</span></button>
                        <button type="button" class="hud-cmd" data-cmd="item" title="Mở sổ từ vựng"><span class="hud-cmd-icon">🎒</span><span class="hud-cmd-name">ITEM</span><span class="hud-cmd-sub">TỪ VỰNG</span></button>
                        <button type="button" class="hud-cmd" data-cmd="stamp" title="Nộp bài & chấm điểm (Ctrl+Enter)"><span class="hud-cmd-icon">🏳️</span><span class="hud-cmd-name">STAMP</span><span class="hud-cmd-sub">CHẤM</span></button>
                    </div>
                    <div class="hud-popup-layer" id="hudPopupLayer" aria-hidden="true"></div>
                </div>`;

            this.dom.tpBox = mount.querySelector('#hudTpBox');
            this.dom.tpFill = mount.querySelector('#hudTpFill');
            this.dom.tpText = mount.querySelector('#hudTpText');
            this.dom.combo = mount.querySelector('#hudCombo');
            this.dom.comboBox = mount.querySelector('#hudComboBox');
            this.dom.credits = mount.querySelector('#hudCredits');
            this.dom.modeLabel = mount.querySelector('#hudModeLabel');
            this.dom.popups = mount.querySelector('#hudPopupLayer');

            mount.querySelectorAll('.hud-cmd').forEach((btn) => {
                btn.addEventListener('click', () => this.runCommand(btn.getAttribute('data-cmd')));
            });
            this.update();
        }

        runCommand(cmd) {
            const fn = this.actions[cmd];
            if (typeof fn === 'function') fn();
        }

        setModeLabel(mode) {
            if (this.dom.modeLabel) this.dom.modeLabel.textContent = MODE_LABELS[mode] || MODE_LABELS.standard;
        }

        update() {
            if (!this.dom.tpFill) return;
            this.dom.tpFill.style.width = `${this.tp}%`;
            this.dom.tpText.textContent = this.tp >= 100 ? 'MAX' : `${this.tp}%`;
            this.dom.tpBox.setAttribute('aria-valuenow', String(this.tp));
            this.dom.tpBox.classList.toggle('is-max', this.tp >= 100);
            this.dom.combo.textContent = `x${this.combo}`;
            this.dom.comboBox.classList.toggle('is-hot', this.combo >= 3);
            this.dom.credits.textContent = `$${this.credits}`;
        }

        /** Render the result of registerResult(): refresh the bars and float the popups. */
        applyResult(res) {
            this.update();
            if (!res) return;
            if (res.repeat) {
                this.popup('ĐÃ NỘP RỒI', 'gray');
                return;
            }
            if (res.pass) {
                if (res.credits > 0) this.popup(`+$${res.credits}`, 'green');
                if (res.overclock) this.popup('TP OVERCLOCK x2!', 'orange');
                else if (res.tpMax) this.popup('TP MAX!', 'orange');
                else if (res.tpDelta > 0) this.popup(`+${res.tpDelta}% TP`, 'orange');
                if (res.combo >= 2) this.popup(`COMBO x${res.combo}`, 'yellow');
            } else {
                this.popup(res.credits < 0 ? `-${Math.abs(res.credits)} PHẠT` : 'COMBO BREAK', 'red');
            }
        }

        popup(text, kind = 'yellow') {
            const layer = this.dom.popups;
            if (!layer || typeof document === 'undefined') return;
            while (layer.children && layer.children.length >= MAX_POPUPS) layer.removeChild(layer.firstChild);
            const el = document.createElement('span');
            el.className = `hud-popup hud-popup-${kind}`;
            el.textContent = text;
            el.style.left = `${12 + Math.round(Math.random() * 60)}%`;
            layer.appendChild(el);
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
        }

        static nextMode(current) {
            const idx = MODES.indexOf(current);
            return MODES[(idx + 1) % MODES.length];
        }
    }

    PixelHUD.MODES = MODES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PixelHUD;
    }
    root.App = root.App || {};
    root.App.PixelHUD = PixelHUD;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
