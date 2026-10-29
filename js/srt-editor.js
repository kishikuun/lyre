/**
 * DictaShadow Studio - Visual In-App SRT Editor & Time Shifter (js/srt-editor.js)
 * Allows fine-tuning timestamps, editing text typos, splitting sentences, and exporting .srt files
 */
(function (root) {
    'use strict';

    const state = root.App.state;
    const SRTParser = root.App.SRTParser;
    const AudioEngine = root.App.AudioEngine;

    function initSRTEditor() {
        const btnOpenSrtEditor = document.getElementById('btnOpenSrtEditor');
        const srtEditorModal = document.getElementById('srtEditorModal');
        const btnCloseSrtEditor = document.getElementById('btnCloseSrtEditor');
        const btnSaveSrtEdit = document.getElementById('btnSaveSrtEdit');
        const btnExportSrt = document.getElementById('btnExportSrt');

        // Nudge Buttons
        const btnNudgeStartMinus100 = document.getElementById('btnNudgeStartMinus100');
        const btnNudgeStartPlus100 = document.getElementById('btnNudgeStartPlus100');
        const btnNudgeEndMinus100 = document.getElementById('btnNudgeEndMinus100');
        const btnNudgeEndPlus100 = document.getElementById('btnNudgeEndPlus100');
        const btnSetStartToCurrent = document.getElementById('btnSetStartToCurrent');
        const btnSetEndToCurrent = document.getElementById('btnSetEndToCurrent');

        if (btnOpenSrtEditor && srtEditorModal) {
            btnOpenSrtEditor.addEventListener('click', openEditorModal);
        }

        if (btnCloseSrtEditor && srtEditorModal) {
            btnCloseSrtEditor.addEventListener('click', () => {
                srtEditorModal.classList.add('opacity-0', 'pointer-events-none');
            });
        }

        if (btnNudgeStartMinus100) btnNudgeStartMinus100.addEventListener('click', () => nudgeStartTime(-0.1));
        if (btnNudgeStartPlus100) btnNudgeStartPlus100.addEventListener('click', () => nudgeStartTime(+0.1));
        if (btnNudgeEndMinus100) btnNudgeEndMinus100.addEventListener('click', () => nudgeEndTime(-0.1));
        if (btnNudgeEndPlus100) btnNudgeEndPlus100.addEventListener('click', () => nudgeEndTime(+0.1));

        if (btnSetStartToCurrent) btnSetStartToCurrent.addEventListener('click', setStartToCurrentPos);
        if (btnSetEndToCurrent) btnSetEndToCurrent.addEventListener('click', setEndToCurrentPos);

        if (btnSaveSrtEdit) {
            btnSaveSrtEdit.addEventListener('click', saveCurrentEdit);
        }

        if (btnExportSrt) {
            btnExportSrt.addEventListener('click', exportSRTFile);
        }
    }

    function openEditorModal() {
        const srtEditorModal = document.getElementById('srtEditorModal');
        if (!srtEditorModal) return;

        populateEditorFields();
        srtEditorModal.classList.remove('opacity-0', 'pointer-events-none');
    }

    function populateEditorFields() {
        if (!state.subs.length || state.currentIdx >= state.subs.length) return;
        const sub = state.subs[state.currentIdx];

        const editSentenceIndex = document.getElementById('editSentenceIndex');
        const editStartTimeInput = document.getElementById('editStartTimeInput');
        const editEndTimeInput = document.getElementById('editEndTimeInput');
        const editSentenceTextarea = document.getElementById('editSentenceTextarea');

        if (editSentenceIndex) editSentenceIndex.textContent = `CÂU #${state.currentIdx + 1} / ${state.subs.length}`;
        if (editStartTimeInput) editStartTimeInput.value = formatSecondsToSRTTime(sub.start);
        if (editEndTimeInput) editEndTimeInput.value = formatSecondsToSRTTime(sub.end);
        if (editSentenceTextarea) editSentenceTextarea.value = sub.text;
    }

    function nudgeStartTime(deltaSec) {
        if (!state.subs.length) return;
        const sub = state.subs[state.currentIdx];
        const newStart = Math.max(0, sub.start + deltaSec);
        if (newStart < sub.end) {
            sub.start = newStart;
            populateEditorFields();
            onSubtitleModified();
        }
    }

    function nudgeEndTime(deltaSec) {
        if (!state.subs.length) return;
        const sub = state.subs[state.currentIdx];
        const newEnd = sub.end + deltaSec;
        if (newEnd > sub.start) {
            sub.end = newEnd;
            populateEditorFields();
            onSubtitleModified();
        }
    }

    function setStartToCurrentPos() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg || !state.subs.length) return;
        const currentAbsoluteTime = seg.start + state.pausedAt;
        const sub = state.subs[state.currentIdx];
        if (currentAbsoluteTime < sub.end) {
            sub.start = currentAbsoluteTime;
            populateEditorFields();
            onSubtitleModified();
        }
    }

    function setEndToCurrentPos() {
        const seg = AudioEngine.getCurrentSegment();
        if (!seg || !state.subs.length) return;
        const currentAbsoluteTime = seg.start + state.pausedAt;
        const sub = state.subs[state.currentIdx];
        if (currentAbsoluteTime > sub.start) {
            sub.end = currentAbsoluteTime;
            populateEditorFields();
            onSubtitleModified();
        }
    }

    function saveCurrentEdit() {
        if (!state.subs.length) return;
        const sub = state.subs[state.currentIdx];
        const editSentenceTextarea = document.getElementById('editSentenceTextarea');
        const editStartTimeInput = document.getElementById('editStartTimeInput');
        const editEndTimeInput = document.getElementById('editEndTimeInput');
        const srtEditorModal = document.getElementById('srtEditorModal');

        // 1. Cập nhật nội dung lời thoại
        if (editSentenceTextarea) {
            sub.text = editSentenceTextarea.value.trim();
        }

        // 2. Cập nhật mốc thời gian nếu người dùng sửa trực tiếp
        if (editStartTimeInput && editEndTimeInput) {
            const newStart = root.App.SRTParser.timeToSeconds(editStartTimeInput.value);
            const newEnd = root.App.SRTParser.timeToSeconds(editEndTimeInput.value);
            if (!isNaN(newStart) && !isNaN(newEnd) && newEnd > newStart) {
                sub.start = newStart;
                sub.end = newEnd;
            }
        }

        onSubtitleModified();

        if (srtEditorModal) {
            srtEditorModal.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    function onSubtitleModified() {
        root.App.Dictation.loadCurrentSegment();
        root.App.Shadowing.redrawWaveforms();

        // Update Storage
        if (root.App.Storage) {
            const srtText = serializeSubtitlesToSRT(state.subs);
            root.App.Storage.saveSRT(srtText, 'edited_subtitles.srt');
        }
    }

    /**
     * Convert seconds to SRT standard format 00:00:00,000
     */
    function formatSecondsToSRTTime(sec) {
        if (isNaN(sec) || sec < 0) return "00:00:00,000";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    /**
     * Serialize subtitles back to standard SRT string
     */
    function serializeSubtitlesToSRT(subs) {
        return subs.map((sub, idx) => {
            const num = idx + 1;
            const startStr = formatSecondsToSRTTime(sub.start);
            const endStr = formatSecondsToSRTTime(sub.end);
            return `${num}\n${startStr} --> ${endStr}\n${sub.text}\n`;
        }).join('\n');
    }

    /**
     * Export / Download fine-tuned SRT file
     */
    function exportSRTFile() {
        if (!state.subs.length) {
            alert("Chưa có phụ đề để xuất file!");
            return;
        }

        const srtContent = serializeSubtitlesToSRT(state.subs);
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `DictaShadow_Refined_${Date.now()}.srt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 150);
    }

    root.App = root.App || {};
    root.App.SRTEditor = {
        initSRTEditor,
        openEditorModal,
        nudgeStartTime,
        nudgeEndTime,
        serializeSubtitlesToSRT,
        exportSRTFile,
        formatSecondsToSRTTime
    };

})(window);

