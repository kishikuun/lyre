# AGENTS.md — Lyre Studio Architecture, Operational Rules & Project Inventory
> CRITICAL DIRECTIVE: Internalize this specification before modifying this repository. Adherence preserves 100% static client-side integrity, dual-skin architecture, and strict file constraints.

---

## 1. Project Identity & Architectural Mandates
- Name: Lyre Studio ("Lyre") — Version 5.0 Retro Pixel Game & Acoustic Forensics Studio.
- Core Mission: High-performance, offline-first web studio for English Dictation and Shadowing practice.
- Runtime Environment: 100% Pure Static Client-Side (HTML5, Vanilla ES6+ JavaScript, CSS3, Web Audio API, Canvas 2D, IndexedDB).
- Serverless Guarantee: Zero server runtime dependencies, zero database engines, zero remote APIs required. Deployable on GitHub Pages or static host.
- Dual Visual Metaphor (Seamless runtime toggle via data-skin="classic" | "pixel-dark" | "pixel-paper"):
  1. Swiss Editorial Studio: High-contrast typography, Studer tape deck controls, tactile switches, dark graphite #08090C, amber #D97706, sage #10B981.
  2. Retro Pixel Workbench (Papers, Please 1984): Grestin border checkpoint booth, procedural traveler, Manila entry permit, spring stamps, MOA citation printer, Deltarune dialogue box, and MGS Codec 140.85.
- Layout Rule: Strict Zero Page Scrolling across desktop and mobile. Viewport maintains window.scrollY === 0 and document.documentElement.scrollHeight <= window.innerHeight.
- Sound Synthesis: 100% procedural Web Audio API synthesis for UI clicks, typewriter blips, rubber stamps, paper tear, buzzer alarms, and chiptune music. Zero external audio file assets for SFX.
- Verification Contract: npm test executes test-10-checks.js across 31 automated test dimensions. Pass rate must remain 100% (31/31) at all times.
- Line Limit: Every source file in this repository must strictly remain under 2,000 lines. Logic must be decomposed into modular single-responsibility units.

---

## 2. Directory Structure & File Inventory

### Root Configuration & Core Entry Points
- index.html (1,937 lines): Single-Page Application host markup containing Title Screen, 2-tier 100vh workbench, entry permit, cassette deck, satchel drawer, MGS Codec slot, and all modals.
- manifest.json (24 lines): Progressive Web App manifest defining standalone display, icons, and theme color (#090c13).
- sw.js (86 lines): Service worker pre-caching 32 local assets and external CDNs for complete offline execution.
- package.json (20 lines): Project metadata and automated npm test definition.
- server.js (62 lines): Zero-dependency Node.js HTTP server with path traversal protection used for local testing and CDP audits.
- test-10-checks.js (1,516 lines): Comprehensive 31-dimension automated test suite verifying audio algorithms, subtitle parsers, PWA manifest, and HTTP security.
- .gitignore (22 lines): Excludes local scratch workspaces, user recordings, OS artifacts, and development notes.

### Design Systems (css/)
- css/studio.css (770 lines): Classic Swiss Editorial Studio design system, tactile buttons, tape deck VU meters, floating action dock, and drawer transitions.
- css/pixel-game.css (1,710 lines): Retro pixel design system, 9-slice pure CSS box-shadow borders, CRT scanlines, Papers Please desk, citation slip animations, RPG stats, and punch-cards.

### Core Audio & Studio Engines (js/)
- js/state.js (102 lines): Central immutable-pattern state container (window.App.state) tracking playback, subtitles, modes, and scoring.
- js/app.js (1,664 lines): Application lifecycle orchestrator, event hub, modal routing, tab switching, and game loop synchronization.
- js/audio-engine.js (682 lines): Web Audio API audio graph, AudioBuffer management, speed adjustment (0.75x-1.25x), volume boost, and peak extraction.
- js/dictation.js (1,271 lines): Dictation engine supporting Standard, Word-by-Word Stream, and Cloze punch-card modes with mechanical keyboard audio synthesis.
- js/diff-checker.js (149 lines): Longest Common Subsequence (LCS) word-level diff analyzer with Unicode quote normalization and strict XSS escaping.
- js/speech-analysis.js (334 lines): Prosody analyzer extracting content/function words, syllable stress, linking sounds, and intonation pitch arrows.
- js/shadowing.js (937 lines): Dual-track shadowing recorder, pitch autocorrelation, rhythm scoring, multi-take history, and Take That hooks.
- js/storage.js (314 lines): IndexedDB persistence layer storing audio blobs, custom SRT scripts, vocabulary words, and user analytics.
- js/hotkeys.js (337 lines): Global ergonomic hotkey router prioritizing transcription touch-typing (Tab rewind 2s, Shift+Tab forward 2s, Shift+Space play/pause, Alt+H hints, Ctrl+Enter evaluate).
- js/gestures.js (90 lines): Mobile touch gesture engine detecting directional swipes and stationary double-taps without false triggers.
- js/srt-parser.js (95 lines): SRT and WebVTT subtitle parser with Unicode quote normalization and HTML tag stripping.
- js/srt-editor.js (192 lines): Visual subtitle boundary editor with +-0.1s boundary nudging and standardized .srt file export.
- js/vad-slicer.js (205 lines): Voice Activity Detection (VAD) audio slicer detecting sentence segments via RMS threshold and silence duration.
- js/curated-lessons.js (418 lines): 6 built-in CEFR-graded study lessons (A2 to C1) with embedded synthesized speech and dual-language text.
- js/tts-generator.js (254 lines): Web Speech API text-to-speech lesson builder with automatic punctuation-based timing and WPM calculation.
- js/dictionary.js (977 lines): Built-in dictionary lookup, 3D Spaced Repetition (SM-2) flashcards, and Anki TSV exporter.
- js/analytics.js (828 lines): Phonetic error pattern classifier, acoustic mistake bank, daily sentence goal ring, and streak tracking.
- js/vinyl-jog.js (77 lines): Analog tape-deck jog wheel visualizer providing tactile scrub physics and audio feedback.

### Retro Pixel Game Subsystems (js/)
- js/pixel-sfx.js (394 lines): Procedural chiptune sound generator producing 8 canonical game sounds and ambient procedural lo-fi background music.
- js/pixel-dialogue.js (366 lines): Deltarune typewriter dialogue engine with 4 animated avatar emotions, color tags, and interactive choice menus.
- js/pixel-desk.js (278 lines): Papers Please forensic desk with mechanical spring stamps, paperclips, rulebook tabs, and automated citation printer.
- js/pixel-booth.js (539 lines): Grestin border checkpoint viewport, mechanical iron shutter, and procedural 32x32 SVG traveler generator with audio-synced mouth flaps.
- js/pixel-hud.js (199 lines): Deltarune Combat HUD & Shift Economy: TP Tension Points gauge, Overclock 2x payouts, Combo Streak counter, and $Credits shift wallet.
- js/pixel-stats.js (277 lines): Deltarune RPG party stats sheet displaying HP, GUTS hearts, dynamic attributes (ATK/DEF/MAGIC), and equipment slots.
- js/pixel-gazette.js (210 lines): 1984 Atari Paperboy celebration newspaper modal with 720 degree spin zoom animation and high score publishing.
- js/pixel-gameloop.js (1,722 lines): Master game loop coordinator binding audio events, grading outcomes, MGS Codec oscilloscope, pull-out satchel drawer, and skin switching.

---

## 3. Ergonomic Keyboard Shortcuts & Mobile Touch Sizing

### Transcription Touch-Typing Hotkeys (Active while typing inside textareas)
- Tab: Rewind audio exactly 2.0 seconds (AudioEngine.rewind(2.0)). Single pinky tap, zero hand contortion, does not insert tab characters.
- Shift + Tab: Fast-forward audio 2.0 seconds (AudioEngine.forward(2.0)).
- Shift + Space / Ctrl + Space: Instant Play/Pause toggle without moving the text cursor or inserting whitespace.
- Alt + H / Ctrl + H: Reveal next progressive hint letter in the active sentence or cloze blank.
- Ctrl + Enter: Evaluate transcript against ground truth via LCS diff checker and trigger mechanical stamp.
- Alt + Up / Alt + R / F4: Instant replay of current sentence from start (AudioEngine.replay()).
- Alt + [ / Alt + ]: Navigate immediately to previous or next subtitle sentence.
- Escape: Toggle play/pause on desk when no modal is open; dismiss any open overlay modal or satchel when active.

### Mobile Touch Targets (WCAG 2.1 AA Compliance)
- Floating Smart Action Dock (#smartActionDock): Bottom docked with env(safe-area-inset-bottom) clearance.
- Interactive Buttons: Minimum touch targets of 44x44px (Play button 52x44px) preventing touch misses.
- Inputs & Textareas: Base font size 16px to prevent mobile Safari/Chrome auto-zooming.

---

## 4. Subsystem Interconnections & Data Flow
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

## 5. Coding Standard & Safety Invariants
1. Strict Line Limit: Every single file must stay strictly under 2,000 lines. Break modules before hitting 1,900 lines.
2. 100% Offline Static Architecture: Never introduce server-side endpoints, remote database drivers, or remote runtime dependencies.
3. Headless Environment Safety: Guard DOM operations in shared modules using typeof document !== 'undefined'.
4. Web Audio Hygiene: Always ramp OscillatorNodes and AudioBuffers to zero gain before disconnecting to prevent pops and memory leaks.
5. Zero Scroll Mandate: All views must preserve window.scrollY === 0 and document.documentElement.scrollHeight <= window.innerHeight.
6. Mandatory Test Gate: Run npm test after every change. All 31 automated test checks must pass with zero failures.
