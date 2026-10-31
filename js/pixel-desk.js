/**
 * ============================================================================
 * LYRE STUDIO — PAPERS, PLEASE INSPECTION DESK & RULEBOOK CONTROLLER
 * Version 4.0 (Acoustic Forensic Workbench)
 * 
 * Directly modeled after Lucas Pope's Papers, Please & Return of the Obra Dinn:
 * 1. Entry Permit / Access Visa with authentic Ministry of Admission header & paperclip.
 * 2. Heavy mechanical rubber stamps (APPROVED & DENIED) with procedural desk thud & screen shake.
 * 3. The infamous Citation Slip Printer: ejects ticker tape slip when discrepancies are found.
 * 4. Investigation Spiral Ledger with 4 tabs: [RULES], [VOCAB], [MISTAKES], [CONFIG].
 * 5. Permanent Ink Lock-in: transforms pencil drafts to indelible ink when verified.
 * 6. Responsive mobile drawer integration with smooth 60fps sliding drawer.
 * ============================================================================
 */

(function (root) {
    'use strict';

    function escapeHTML(str) {
        if (!str) return '';
        if (root.App && root.App.SRTParser && typeof root.App.SRTParser.escapeHTML === 'function') {
            return root.App.SRTParser.escapeHTML(str);
        }
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    class PixelDesk {
        constructor(options = {}) {
            this.deskContainer = options.deskContainer || null;
            this.permitCard = options.permitCard || null;
            this.stampTarget = options.stampTarget || null;
            this.rulebookContainer = options.rulebookContainer || null;
            this.citationContainer = options.citationContainer || null;

            this.currentTab = 'rules';
            this.stampCount = 0;
            this.citations = [];
            this.activeStamp = null;

            if (this.deskContainer) {
                this.bindEvents();
            }
        }

        bindEvents() {
            // Placeholder for interactive event delegation
        }

        /**
         * Kích hoạt hiệu ứng rung màn hình bàn làm việc (Screen Shake)
         */
        triggerScreenShake(container = null) {
            const target = container || this.deskContainer || document.body;
            if (!target) return;

            // Kiểm tra prefers-reduced-motion và cài đặt lyre_screen_shake
            if (typeof window !== 'undefined') {
                if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                try {
                    if (localStorage.getItem('lyre_screen_shake') === 'false') return;
                } catch (e) {}
            }

            target.classList.remove('screen-shake-anim');
            void target.offsetWidth; // Force Reflow
            target.classList.add('screen-shake-anim');

            setTimeout(() => {
                target.classList.remove('screen-shake-anim');
            }, 250);
        }

        /**
         * Dập dấu APPROVED (Ngọc bích)
         */
        stampApproved(details = 'ACOUSTIC CLEARANCE ★ 100%') {
            this.stampCount++;
            this.activeStamp = 'approved';

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                sfx.playStampThud();
            }
            this.triggerScreenShake();

            if (this.stampTarget) {
                const randomRot = -(4 + Math.random() * 3).toFixed(1); // -4deg đến -7deg
                const safeDetails = escapeHTML(details);
                this.stampTarget.innerHTML = `
                    <div class="stamp-seal stamp-approved stamp-slam-animation" style="transform: rotate(${randomRot}deg)">
                        <span class="stamp-title">APPROVED</span>
                        <span class="stamp-sub">${safeDetails}</span>
                    </div>
                `;
            }

            return { status: 'approved', count: this.stampCount };
        }

        /**
         * Dập dấu DENIED (Đỏ son) kèm còi báo động và in giấy phạt (Citation)
         */
        stampDenied(reason = 'CONTRABAND DETECTED ★ CITATION') {
            this.stampCount++;
            this.activeStamp = 'denied';

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                sfx.playDeniedBuzzer();
            }
            this.triggerScreenShake();

            if (this.stampTarget) {
                const randomRot = (3 + Math.random() * 3).toFixed(1); // +3deg đến +6deg
                const safeReason = escapeHTML(reason);
                this.stampTarget.innerHTML = `
                    <div class="stamp-seal stamp-denied stamp-slam-animation" style="transform: rotate(${randomRot}deg)">
                        <span class="stamp-title">DENIED</span>
                        <span class="stamp-sub">${safeReason}</span>
                    </div>
                `;
            }

            // In giấy phạt Citation Slip
            this.issueCitation(reason);

            return { status: 'denied', count: this.stampCount, reason };
        }

        /**
         * In phiếu phạt Citation Slip từ máy in cơ học
         */
        issueCitation(reason) {
            const citationId = this.citations.length + 1;
            const citation = {
                id: citationId,
                reason: reason,
                timestamp: new Date().toLocaleTimeString()
            };
            this.citations.push(citation);

            if (this.citationContainer) {
                const safeReason = escapeHTML(reason);
                if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
                    const slip = document.createElement('div');
                    slip.className = 'pixel-citation-slip animate-citation-print';
                    slip.innerHTML = `
                        <div class="citation-header">
                            <span>MINISTRY OF ADMISSION</span>
                            <span>M.O.A. PROTOCOL #83</span>
                        </div>
                        <div class="citation-body">
                            <b>CITATION #${citationId.toString().padStart(2, '0')}:</b>
                            <p>${safeReason}</p>
                        </div>
                        <div class="citation-footer flex items-center justify-between">
                            <span>PENALTY: RECORDED IN DOSSIER</span>
                            <button type="button" class="btn-tear-citation text-[8px] px-1.5 py-0.5 bg-gray-200 hover:bg-red-600 hover:text-white border border-gray-400 font-bold uppercase cursor-pointer" title="Xé phiếu phạt khỏi bàn">✕ XÉ</button>
                        </div>
                    `;
                    slip.querySelector('.btn-tear-citation')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        slip.classList.add('citation-torn-away');
                        const sfx = (root.App && root.App.PixelSFX) || null;
                        if (sfx) sfx.playTypewriterBlip();
                        setTimeout(() => slip.remove(), 250);
                    });
                    if (typeof this.citationContainer.prepend === 'function') {
                        this.citationContainer.prepend(slip);
                    }
                } else if (typeof this.citationContainer.prepend === 'function') {
                    this.citationContainer.prepend({
                        innerHTML: `<p>${safeReason}</p>`
                    });
                }
            }
        }

        /**
         * Chuyển tab Sổ tay điều tra gáy xoắn (Rules, Vocab, Mistakes, Config)
         */
        switchRulebookTab(tabName) {
            this.currentTab = tabName;
            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                sfx.playTypewriterBlip();
            }

            if (this.rulebookContainer) {
                const tabs = this.rulebookContainer.querySelectorAll('.pixel-tab-btn');
                tabs.forEach(tab => {
                    const t = tab.getAttribute('data-tab');
                    if (t === tabName) {
                        tab.classList.add('is-active');
                    } else {
                        tab.classList.remove('is-active');
                    }
                });

                const panes = this.rulebookContainer.querySelectorAll('.rulebook-pane');
                panes.forEach(pane => {
                    const p = pane.getAttribute('data-pane');
                    if (p === tabName) {
                        pane.classList.remove('hidden');
                    } else {
                        pane.classList.add('hidden');
                    }
                });
            }

            return this.currentTab;
        }

        /**
         * Khóa mực vĩnh viễn (Return of the Obra Dinn Ink Lock)
         */
        lockInWord(elementId) {
            const el = document.getElementById(elementId);
            if (!el) return;

            const sfx = (root.App && root.App.PixelSFX) || null;
            if (sfx) {
                sfx.playInkLockSound();
            }

            el.classList.add('is-ink-locked');
            el.innerHTML += ` <span class="px-font-arcade text-[8px] text-green-400">✓ ĐÃ KHÓA</span>`;
        }

        /**
         * Gắn cơ chế lò xo nén dập cơ học vào nút con dấu (Spring-Loaded Stamp)
         * Khi bấm giữ: Lò xo nén xuống (scale 0.94, translateY 4px)
         * Khi thả tay: Con dấu bật nảy cực nhanh và dập lún xuống mặt bàn kèm chấn động
         */
        bindSpringStamp(buttonEl, type = 'approved', reason = '') {
            if (!buttonEl) return;
            if (buttonEl._isSpringBound) return;
            buttonEl._isSpringBound = true;

            let isPressed = false;
            const pressDown = (e) => {
                isPressed = true;
                buttonEl.classList.add('stamp-spring-tension');
                const sfx = (root.App && root.App.PixelSFX) || null;
                if (sfx) {
                    sfx.playTypewriterBlip();
                }
            };

            const releaseSlam = (e) => {
                if (!isPressed) return;
                isPressed = false;
                buttonEl.classList.remove('stamp-spring-tension');
                if (type === 'approved') {
                    this.stampApproved();
                } else {
                    this.stampDenied(reason || 'DISCREPANCY DETECTED');
                }
            };

            buttonEl.addEventListener('mousedown', pressDown);
            window.addEventListener('mouseup', releaseSlam);
            buttonEl.addEventListener('touchstart', pressDown, { passive: true });
            window.addEventListener('touchend', releaseSlam, { passive: true });
        }

        /**
         * Kích hoạt dập lò xo tự động (thường dùng khi kích hoạt qua phím tắt)
         */
        triggerSpringSlam(type = 'approved', reason = '') {
            if (type === 'approved') {
                return this.stampApproved();
            } else {
                return this.stampDenied(reason || 'PHONETIC PENALTY');
            }
        }

        /**
         * Xóa sạch các con dấu hiện tại
         */
        clearStamps() {
            if (this.stampTarget) {
                this.stampTarget.innerHTML = `
                    <span class="text-xs italic text-gray-500">Chưa đóng dấu phê duyệt.</span>
                `;
            }
            this.activeStamp = null;
        }

        /**
         * Dọn sạch toàn bộ phiếu phạt trên khay máy in M.O.A.
         */
        clearCitations() {
            this.citations = [];
            if (this.citationContainer) {
                this.citationContainer.innerHTML = `
                    <span class="text-[10px] font-mono text-slate-300 italic block">Chưa có vi phạm nào.</span>
                `;
            }
        }
    }

    // UMD Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PixelDesk;
    }
    root.App = root.App || {};
    root.App.PixelDesk = PixelDesk;

})(typeof window !== 'undefined' ? window : global);
