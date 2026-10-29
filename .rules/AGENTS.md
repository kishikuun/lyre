# AGENTS.md — DictaShadow Studio TP-7 Architecture & Rules

This document is the primary reference for AI agents working on DictaShadow Studio TP-7. Read this file before inspecting or modifying project code.

## 1. Project Overview & Architecture Principles
- **Core Mission**: A 100% pure client-side web studio for English Dictation and Shadowing.
- **Runtime Model**: Static client-side only (HTML5, Vanilla JS, CSS3, Web Audio API, Canvas 2D). No backend runtime, database, or server dependencies.
- **Aesthetic Metaphor**: "Swiss Editorial Acoustic Studio" (Nagra/Studer tape deck, optical typewriter, mechanical switches, amber/sage palette, Oxford prosody typography).
- **Line Count Rule**: Every code file in this repository must stay strictly under 2,000 lines. Keep modules isolated and cleanly structured.
- **Sound FX**: Zero-latency procedural Web Audio synthesis in `js/audio-engine.js` (no external MP3/WAV assets required for UI SFX).

## 2. Central State Reference (`window.App.state` in `js/state.js`)
- `activeTab`: `'dictation'` | `'shadowing'`
- `audioBuffer`: Decoded Web Audio AudioBuffer of the main audio file.
- `subs`: Array of subtitle objects `{ id, start, end, duration, text }`.
- `currentIdx`: Integer index of active subtitle segment in `subs`.
- `isPlaying`: Boolean playback status of native audio.
- `pausedAt`: Float offset in seconds within current segment.
- `dictationMode`: `'standard'` (full sentence) | `'stream'` (word-by-word flow).
- `standardInputText`: String typed by user in Standard Dictation textarea.
- `streamTargetWords`: Array of target words for masked flow mode.
- `userRecordings`: Map `{ [idx]: { blob, buffer, duration } }` of recorded student speech.
- `activeABTrack`: `'native'` | `'user'` | `'stereo'` (for binaural L/R).
- `soundFXEnabled`: Boolean toggle for mechanical keyboard audio feedback.

## 3. Comprehensive File Breakdown & Line Ranges

### `index.html` (786 lines)
- **Role**: Single-page application shell and DOM structure.
- **L1–63**: HTML head, Google Fonts (Newsreader, Plus Jakarta Sans, JetBrains Mono), Tailwind config, manifest.
- **L64–158**: Magnetic Tape Header (motorized reels, status LED, mode rocker, file upload triggers).
- **L159–174**: Ergonomic Shortcuts Ribbon (ESC, TAB, Shift+TAB, F4, Ctrl+Enter, F5).
- **L175–194**: Empty state card with demo track trigger (`#btnLoadSampleEmpty`).
- **L195–325**: Tab 1 Dictation Stage (Standard textarea, thermal scanline, quality stamp S/A/B/C, Flow input).
- **L326–595**: Tab 2 Shadowing Lab (mode buttons, 4-step workflow, prosody teleprompter, twin waveforms, ruler, Leica shutter button, AI diagnostics).
- **L596–716**: Collapsible Audio Rack Tray (transport buttons, seekbar, gain booster, smoothing padding, speed).
- **L717–738**: Sentence Navigator Drawer modal (`#sentenceDrawer`).
- **L739–804**: Ergonomic Hotkeys modal (`#hotkeysModal`).
- **L805–868**: Visual SRT Editor modal (`#srtEditorModal`, time nudging, text edit).
- **L869–886**: Script tags loading all modules into `window.App`.

### `css/studio.css` (522 lines)
- **Role**: Bespoke design system tokens, animations, and tactile UI depth.
- **L1–68**: Theme variables (Obsidian `#08090C`, Titanium `#101319`, Amber `#D97706`, Sage `#10B981`) & scrollbars.
- **L69–148**: Tactile mechanical switches (`.tactile-btn`, `.tactile-rocker`, `.rocker-pill`).
- **L149–195**: Motorized tape reels and rotation animation (`.tape-reel-wheel`, `@keyframes tape-spin`).
- **L196–261**: Optical typewriter styling, Laser Caret pulse (`.laser-caret`), fluid typing words.
- **L262–325**: Thermal scanline sweep (`@keyframes thermal-sweep`), embossed stamp (`.embossed-stamp`, `.stamp-grade-s/a/b/c`).
- **L326–370**: Waveform boxes, amber/sage playheads, harmonic resonance glow (`.harmonic-resonance-active`).
- **L371–422**: Leica shutter record button (`.shutter-record-btn`, `.is-recording`).
- **L423–460**: Collapsible Audio Rack Tray and diff checker tags (`.diff-word-match/error/missing/extra`).
- **L461–483**: Teleprompter styles and blind mode frosted blur (`.blind-blur`).
- **L484–522**: Zen Focus mode dimming (`body.zen-focus-active`) and Optical Flow active box (`.flow-active-word`).

### `js/state.js` (73 lines)
- **Role**: Central reactive state definition and listener subscription manager.
- **L9–68**: State store object definition.
- **L70–86**: `App.setState(key, value)` and `App.onStateChange(key, callback)` reactive dispatcher.

### `js/srt-parser.js` (65 lines)
- **Role**: Robust SubRip `.srt` subtitle parser.
- **L11–45**: `parseSRT(data)` parses timestamps (`HH:MM:SS,mmm` & `HH:MM:SS.mmm`), strips HTML tags.
- **L47–64**: `parseTime`, `cleanWord`, and `extractTrailingPunctuation` normalization utilities.

### `js/diff-checker.js` (116 lines)
- **Role**: Word-level diff calculation and grading.
- **L13–100**: `computeDiff(userText, officialText)` using Longest Common Subsequence (LCS) dynamic programming.
- **L105–124**: `renderDiffHTML(diffResult)` renders match, error, missing, and extra badges.

### `js/audio-engine.js` (651 lines)
- **Role**: Web Audio API digital signal processing, playback transport, and procedural sound synthesis.
- **L26–112**: AudioContext initialization, master gain, compressor, and peak extractor.
- **L114–191**: Native playback engine (`play`) with 80ms micro-envelope and ±300ms smoothing padding.
- **L195–239**: User recording playback engine (`playUserRecording`).
- **L243–257**: Track A/B toggle logic (`toggleABTrack`).
- **L261–468**: Transport utilities (`pause`, `togglePlay`, `replay`, `rewind`, `forward`, `seek`, `startTicker`).
- **L470–625**: `playSynthesizedSound(type)` generating procedural audio for click, tape-load, tape-rewind, stamp, tick, typewriter-space, carriage-return, shutter, and resonance chord.
- **L626–694**: `playStereoContrast` providing Binaural Stereo playback (Left ear = Native -0.85, Right ear = User +0.85).

### `js/dictation.js` (409 lines)
- **Role**: Optical Typewriter, Standard Manuscript, and Masked Flow dictation controller.
- **L12–86**: DOM event listeners, SFX button handler, Zen Focus focus/blur listeners, keypress click generator.
- **L88–123**: `loadCurrentSegment` resets input and refreshes segment UI.
- **L125–176**: `checkStandardDictation` computes LCS diff, triggers thermal scanline reflow, stamps grade (S/A/B/C), and plays feedback audio.
- **L200–295**: Optical Masked Flow mode (`initStreamModeForCurrentSegment`, `renderMaskedStream`) tracking laser caret and masking untyped words with dashes.
- **L297–342**: `handleStreamInput` processing Spacebar word confirmation and auto-advancing to next sentence on completion.
- **L358–387**: `updateSubDisplay` and `toggleSubReveal` controlling subtitle reference display.

### `js/shadowing.js` (817 lines)
- **Role**: Scientific Shadowing Lab controller, recorder, and dual-waveform renderer.
- **L47–139**: Component initialization, event listeners, canvas click-to-seek listeners.
- **L144–183**: Shadowing mode switcher (`normal`, `echo`, `simultaneous`, `blind`).
- **L188–213**: Blind mode handler toggling `.blind-blur` on teleprompter.
- **L234–275**: 4 Guided Steps workflow (`setShadowingStep`).
- **L278–346**: Echo Loop countdown manager (`startEchoCountdown`).
- **L352–468**: MediaRecorder microphone capture and Web Audio buffer decoding (`startRecording`, `stopRecording`).
- **L539–615**: Native waveform Canvas renderer with Optical Amber bars and $F_0$ pitch curve overlay.
- **L618–687**: User waveform Canvas renderer with Sage Emerald bars and user $F_0$ pitch curve overlay.
- **L725–787**: Oxford prosody teleprompter renderer highlighting stressed content words, linking sounds (`‿`), and intonation arrows (`↗`, `↘`).
- **L789–807**: Real-time Karaoke word highlighter (`highlightKaraokeWords`).
- **L809–846**: A/B track status button updater (`updateABButtonUI`).
- **L848–868**: Sequential A -> B playback (`playSequentialAB`).
- **L870–886**: Recorded WebM audio exporter (`downloadCurrentRecording`).
- **L887–943**: Match score evaluation (`evaluateMatchScore`) calculating cadence sync and melodic pitch similarity.

### `js/speech-analysis.js` (290 lines)
- **Role**: Phonetic analysis, pitch contour extraction, and melody correlation.
- **L14–92**: `generateProsodyTokens` analyzing English parts of speech for stress, linking, and terminal intonation.
- **L94–172**: `extractPitchContour` using time-domain Autocorrelation to detect fundamental frequency ($F_0$).
- **L174–235**: `calculatePitchSimilarity` computing normalized melodic correlation between native and user contours.
- **L237–288**: Web Speech API speech diagnostics fallback (`startSpeechDiagnostics`).

### `js/hotkeys.js` (137 lines)
- **Role**: Ergonomic 1-touch keyboard shortcuts router.
- **L17–32**: `ESC` toggles play/pause or dismisses open modals.
- **L35–46**: `TAB` rewinds 2s; `Shift+TAB` forwards 2s.
- **L49–77**: `F1`–`F5` function keys for playback, replay, and subtitle reveal.
- **L80–84**: `Ctrl+Enter` checks dictation diff.
- **L87–138**: Shadowing hotkeys (`R` record, `S` stereo L/R, `A` A/B flip, `P` pitch toggle, `B` blind mode, `1`–`4` steps, `[`/`]` sentence skip).

### `js/storage.js` (168 lines)
- **Role**: Client-side storage via IndexedDB and localStorage.
- **L11–66**: IndexedDB database initialization (`audioFiles` and `userRecordings` stores).
- **L68–110**: Audio file and student recording persistence methods.
- **L112–165**: User preferences and study progress serialization.

### `js/srt-editor.js` (180 lines)
- **Role**: In-app subtitle timing adjustment and SRT export.
- **L54–122**: Timestamp nudging (±100ms) and capture of current playback position.
- **L123–149**: Subtitle text editing and persistence.
- **L166–180**: Serialization of modified subtitles to `.srt` format and file download.

### `js/gestures.js` (86 lines)
- **Role**: Touch gestures for mobile devices.
- **L24–62**: Horizontal swipe detection (<450ms, >60px) to navigate sentences.
- **L64–86**: Double-tap on left/right screen half to rewind/forward 2s.

### `js/vinyl-jog.js` (77 lines)
- **Role**: Rotary jog dial rotation tracker for backward-compatible audio scrubbing.

### `js/app.js` (525 lines)
- **Role**: Application entry point and UI orchestrator.
- **L20–180**: Global initialization, DOM query wiring, sample track loader, and audio status indicators.
- **L181–250**: Sentence navigator drawer renderer (`renderDrawerList`).
- **L251–380**: Audio Rack collapsible tray controls and playback display updater.
- **L381–525**: PWA installation prompt handler and cached state restoration.

### Support & Infrastructure Files
- `package.json` (19 lines): NPM metadata with `npm start` and `npm test` scripts.
- `server.js` (29 lines): Zero-dependency Node.js static HTTP server for local serving on port 8080.
- `sw.js` (62 lines): PWA Service Worker caching all 16 core app assets for 100% offline study.
- `manifest.json` (18 lines): Web App Manifest for standalone desktop/mobile installation.
- `test-10-checks.js` (238 lines): Automated 10-point test runner validating parsing, diffing, DSP, pitch extraction, rhythm scoring, gestures, PWA cache, and HTTP status.
- `README.md` (105 lines): User documentation and setup guide.

## 4. Key Rules for Future Modifications
1. **Never exceed 2,000 lines** per file. If a module grows, decompose it cleanly.
2. **Never break the 100% static client-side requirement**. All audio DSP and speech diagnostics must execute in-browser.
3. **Always run verification**: Execute `node --check` and `npm test` before committing any change.
4. **Preserve Swiss Editorial aesthetic**: Avoid bright generic cyan/purple AI glows. Use obsidian, titanium, optical amber, and sage emerald tokens.

