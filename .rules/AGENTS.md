# AGENTS.md — Lyre Studio Architecture, Operational Rules & File Breakdown
> **CRITICAL DIRECTIVE FOR ALL AI AGENTS**: You MUST read and internalize this file before inspecting, editing, or executing any changes in this repository. Strict adherence ensures 100% static client-side integrity, prevents code regressions, preserves dual-skin architecture, and maintains file size constraints.

---

## 1. Project Identity & Architectural Mandates
- **Application**: Lyre Studio ("Lyre") — Version 4.0 Final Retro Pixel Game & Acoustic Forensics Studio.
- **Core Mission**: High-performance, offline-first web studio for English Dictation and Shadowing.
- **Runtime Environment**: 100% Pure Static Client-Side (HTML5, Vanilla ES6+ JavaScript, CSS3, Web Audio API, Canvas 2D, IndexedDB). Zero server-side runtime, zero build pipeline requirement, zero external cloud dependencies. Fully deployable on GitHub Pages.
- **Dual Visual Metaphor (Seamless Toggle via `data-skin="classic"` | `"pixel-dark"` | `"pixel-paper"`)**:
  1. *Swiss Editorial Studio (Classic)*: High-contrast typography, Nagra/Studer tape deck controls, tactile toggles, dark graphite `#08090C`, titanium `#101319`, amber `#D97706`, sage `#10B981`.
  2. *Retro Pixel Workbench (Version 4.0)*: Papers Please inspection desk with mechanical spring stamps and citation printer, Return of the Obra Dinn permanent ink lock, Deltarune typewriter dialogue box with soul heart cursor, 8-bit RPG character stats sheet, 1984 Atari Paperboy celebration gazette, and MGS Codec 140.85 phosphor oscilloscope.
- **Strict Size Constraint**: Every single code file in this repository must stay strictly under 2,000 lines. Modularity must be strictly maintained.
- **Sound Architecture**: 100% procedural Web Audio API synthesis for all sound effects and ambient chiptune background music. Zero external audio file dependencies for UI/SFX.
- **Automated Verification**: `npm test` runs `node test-10-checks.js` with 31 automated tests covering all critical subsystems. Every change must maintain a 100% pass rate (31/31).

---

## 2. Directory Structure & File Inventory

### Root Configuration & Core Entry Points
- `index.html` (~2,090 lines): Single-page application markup hosting both Swiss Studio and Retro Pixel workbenches, Smart Action Dock, all modals, and audio canvas slots.
- `sandbox-pixel.html` (693 lines): Standalone testing harness for isolated retro game UI components, avatar emotions, spring stamps, and dialogue trees.
- `manifest.json` (24 lines): Progressive Web App (PWA) configuration for standalone mobile and desktop installation.
- `sw.js` (93 lines): Service Worker caching all local assets and runtime CDNs for 100% offline execution.
- `package.json` (20 lines): Package definition configuring `npm test` command and project metadata.
- `server.js` (98 lines): Lightweight zero-dependency Node.js HTTP server with path traversal protection used for local E2E automated test runs.
- `test-10-checks.js` (1,604 lines): Comprehensive 31-dimension automated test suite verifying parsers, audio algorithms, PWA manifest, game loop, and HTTP security.
- `.gitignore` (22 lines): Ignores user audio recordings, media files, OS artifacts, and local scratch workspaces (`tasks/`).

### Stylesheets (`css/`)
- `css/studio.css` (880 lines): Classic Swiss Editorial Studio design system, tactile buttons, tape deck VU meters, floating action dock, and drawer transitions.
- `css/pixel-game.css` (915 lines): Retro pixel design system, 9-slice pure CSS box-shadow borders, CRT scanlines, Papers Please desk, citation slip animations, RPG stats, and punch-cards.

### Core Audio & Studio Engines (`js/`)
- `js/state.js` (107 lines): Central immutable-pattern state container (`window.App.state`) tracking playback, subtitles, modes, and scoring.
- `js/app.js` (1,840 lines): Application lifecycle orchestrator, event hub, modal routing, tab switching, and game loop synchronization.
- `js/audio-engine.js` (480 lines): Web Audio API audio graph, AudioBuffer management, speed adjustment (0.75x-1.25x), volume boost, and peak extraction.
- `js/dictation.js` (1,466 lines): Dictation engine supporting Standard, Word-by-Word Stream, and Cloze punch-card modes with mechanical keyboard audio synthesis.
- `js/diff-checker.js` (280 lines): Longest Common Subsequence (LCS) word-level diff analyzer with Unicode quote normalization and strict XSS escaping.
- `js/speech-analysis.js` (480 lines): Prosody analyzer extracting content/function words, syllable stress, linking sounds, and intonation pitch arrows.
- `js/shadowing.js` (1,087 lines): Dual-track shadowing recorder, pitch autocorrelation, rhythm scoring, multi-take history, and Take That hooks.
- `js/storage.js` (420 lines): IndexedDB persistence layer storing audio blobs, custom SRT scripts, vocabulary words, and user analytics.
- `js/hotkeys.js` (380 lines): Global hotkey router prioritizing typing areas and single-key ergonomic navigation (`Space`, `Enter`, `Tab`, `T`, `R`, `Esc`).
- `js/gestures.js` (240 lines): Mobile touch gesture engine detecting directional swipes and stationary double-taps without false triggers.
- `js/srt-parser.js` (210 lines): SRT and WebVTT subtitle parser with Unicode quote normalization and HTML tag stripping.
- `js/srt-editor.js` (360 lines): Visual subtitle boundary editor with ±0.1s boundary nudging and standardized .srt file export.
- `js/vad-slicer.js` (280 lines): Voice Activity Detection (VAD) audio slicer detecting sentence segments via RMS threshold and silence duration.
- `js/curated-lessons.js` (280 lines): 6 built-in CEFR-graded study lessons (A2 to C1) with embedded synthesized speech and dual-language text.
- `js/tts-generator.js` (290 lines): Web Speech API text-to-speech lesson builder with automatic punctuation-based timing and WPM calculation.
- `js/dictionary.js` (580 lines): Built-in dictionary lookup, 3D Spaced Repetition (SM-2) flashcards, and Anki TSV exporter.
- `js/analytics.js` (952 lines): Phonetic error pattern classifier, acoustic mistake bank, daily sentence goal ring, and streak tracking.
- `js/vinyl-jog.js` (220 lines): Analog tape-deck jog wheel visualizer providing tactile scrub physics and audio feedback.

### Retro Pixel Game Subsystems (`js/`)
- `js/pixel-sfx.js` (466 lines): Procedural chiptune sound generator producing 8 canonical game sounds and ambient procedural lo-fi background music.
- `js/pixel-dialogue.js` (411 lines): Deltarune typewriter dialogue engine with 4 animated avatar emotions, color tags, and interactive choice menus.
- `js/pixel-desk.js` (268 lines): Papers Please forensic desk with mechanical spring stamps, paperclips, rulebook tabs, and automated citation printer.
- `js/pixel-stats.js` (300 lines): Deltarune RPG party stats sheet displaying HP, GUTS hearts, dynamic attributes (ATK/DEF/MAGIC), and equipment slots.
- `js/pixel-gazette.js` (235 lines): 1984 Atari Paperboy celebration newspaper modal with 720° spin zoom animation and high score publishing.
- `js/pixel-gameloop.js` (930 lines): Master game loop coordinator binding audio events, grading outcomes, MGS Codec oscilloscope, and skin switching.

---

## 3. Subsystem Interconnections & Event Flow
```
User Audio / Text Input
    │
    ├── Dictation Track ──> js/dictation.js ──> js/diff-checker.js
    │                            │
    │                            └──> Grade (>=80% or <80%)
    │                                      │
    │                                      ├──> APPROVED / DENIED Stamp (js/pixel-desk.js)
    │                                      ├──> Citation Printer (js/pixel-desk.js)
    │                                      └──> RPG Stats EXP / HP (js/pixel-stats.js)
    │
    ├── Shadowing Track ──> js/shadowing.js ──> Pitch & Rhythm Scoring
    │                            │
    │                            ├── High Score ──> [TAKE THAT!] Starburst (js/pixel-gameloop.js)
    │                            ├── Low Score  ──> Courtroom OBJECTION! Gavel (js/pixel-sfx.js)
    │                            └── Oscilloscope ──> MGS Codec 140.85 (js/pixel-gameloop.js)
    │
    └── Completion ──> Daily Goal Achieved (js/analytics.js) ──> Atari Gazette (js/pixel-gazette.js)
```

---

## 4. Coding Standard & Safety Invariants
1. **Never exceed 2,000 lines per file**: Split logic into dedicated modules before hitting 1,900 lines.
2. **Preserve 100% Offline Static Architecture**: Do not introduce server runtimes, database drivers, or remote API dependencies.
3. **Headless Environment Safety**: When writing DOM operations in shared or testable modules, always guard against missing DOM APIs using `typeof document !== 'undefined' && typeof document.createElement === 'function'`.
4. **Zero-Latency Audio Hygiene**: OscillatorNodes and AudioBuffers must always be ramped to zero gain and disconnected after playback to prevent audio popping and memory leaks.
5. **Mobile Touch Ergonomics**: All interactive buttons and inputs must maintain a minimum touch target of 48px with 16px base font size to prevent mobile browser zooming.
6. **Mandatory Test Validation**: Run `npm test` after any modification. All 31 tests must pass with zero failures before submitting changes.
