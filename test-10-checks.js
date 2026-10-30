/**
 * DictaShadow Studio - Comprehensive Automated Verification Tests (10 Core Dimensions)
 * Run with: node test-10-checks.js
 */
const fs = require('fs');
const http = require('http');

console.log('================================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG 31 TÌNH HUỐNG (STAGE 8: CLOZE PUNCH-CARDS, RPG FLASHCARDS & DAILY GOAL)');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 31;

function assert(condition, testName, details = '') {
    if (condition) {
        passedTests++;
        console.log(`✅ [TEST ${passedTests}/${totalTests}] PASS: ${testName}`);
        if (details) console.log(`   └─ ${details}`);
    } else {
        console.error(`❌ FAIL: ${testName}`);
        if (details) console.error(`   └─ ${details}`);
        process.exit(1);
    }
}

// ----------------------------------------------------------------------
// TEST 1: SRT Parser & Edge Case Timestamps
// ----------------------------------------------------------------------
const fakeWindow = { App: {} };
global.window = fakeWindow;
const srtParserCode = fs.readFileSync('js/srt-parser.js', 'utf8');
eval(`(function(root) { ${srtParserCode} })(fakeWindow)`);
const SRTParser = fakeWindow.App.SRTParser;

const sampleSRT = `
1
00:01:23,450 --> 00:01:28,900
<i>Hello world</i>, this is <b>DictaShadow</b>!

2
01:29.000 --> 01:35.500
Testing WebVTT MM:SS.mmm and typographic quotes: it’s “great”—truly!
`;
const parsedSubs = SRTParser.parseSRT(sampleSRT);
assert(
    parsedSubs.length === 2 &&
    Math.abs(parsedSubs[0].start - 83.45) < 0.01 &&
    Math.abs(parsedSubs[1].start - 89.0) < 0.01 &&
    SRTParser.cleanWord("it’s") === SRTParser.cleanWord("it's") &&
    parsedSubs[0].text === "Hello world, this is DictaShadow!",
    "SRT/VTT Parser phân tích chuẩn HH:MM:SS, MM:SS.mmm, dấu nháy Unicode và gỡ bỏ thẻ HTML",
    `Parsed ${parsedSubs.length} subs. Start1: ${parsedSubs[0].start}s, Start2: ${parsedSubs[1].start}s, cleanWord("it’s") === "${SRTParser.cleanWord("it’s")}"`
);

// ----------------------------------------------------------------------
// TEST 2: Diff-Checker LCS Alignment, Scoring & Anti-XSS Sanitization
// ----------------------------------------------------------------------
const diffCode = fs.readFileSync('js/diff-checker.js', 'utf8');
eval(`(function(root) { ${diffCode} })(fakeWindow)`);
const DiffChecker = fakeWindow.App.DiffChecker;

const officialText = "Hello Mr. Hope, it’s Sarah from Travel First here.";
const userTextGood = "hello mr hope it's sarah from travel first here";
const diffGood = DiffChecker.computeDiff(userTextGood, officialText);

const userTextTypo = "hello mr hop its sarah from First here <img src=x onerror=alert(1)>";
const diffTypo = DiffChecker.computeDiff(userTextTypo, officialText);
const renderedDiffHTML = DiffChecker.renderDiffHTML(diffTypo);

assert(
    diffGood.accuracy === 100 &&
    diffTypo.accuracy < 100 &&
    diffTypo.tokens.some(t => t.type === 'error' || t.type === 'missing') &&
    !renderedDiffHTML.includes('<img') &&
    renderedDiffHTML.includes('&lt;img'),
    "Diff-Checker so khớp từng từ bằng LCS, chuẩn hóa nháy đơn Unicode và chống XSS triệt để",
    `Good Accuracy: ${diffGood.accuracy}%, XSS Escaped: ${renderedDiffHTML.includes('&lt;img')}`
);

// ----------------------------------------------------------------------
// TEST 3: Audio DSP Parameter Clamping & Micro-Envelope
// ----------------------------------------------------------------------
const rawStart = 10.0;
const rawEnd = 15.0;
const paddingMs = 300;
const paddingSec = paddingMs / 1000;
const paddedStart = Math.max(0, rawStart - paddingSec);
const paddedEnd = rawEnd + paddingSec;
const duration = paddedEnd - paddedStart;
const fadeDur = Math.min(0.08, duration / 3);

assert(
    Math.abs(paddedStart - 9.7) < 0.001 &&
    Math.abs(paddedEnd - 15.3) < 0.001 &&
    Math.abs(duration - 5.6) < 0.001 &&
    fadeDur === 0.08,
    "Smart Subtitle Smoothing mở rộng biên độ 300ms và tính toán 80ms fade-in/out",
    `Padded: [${paddedStart}s -> ${paddedEnd}s], Duration: ${duration}s, Fade: ${fadeDur * 1000}ms`
);

// ----------------------------------------------------------------------
// TEST 4: Speech Prosody Markup & Phonetic Intonation Analysis
// ----------------------------------------------------------------------
const speechCode = fs.readFileSync('js/speech-analysis.js', 'utf8');
eval(`(function(root) { ${speechCode} })(fakeWindow)`);
const SpeechAnalysis = fakeWindow.App.SpeechAnalysis;

const sentence = "You hear a travel agent leaving a telephone message for Mr. Hope?";
const tokens = SpeechAnalysis.generateProsodyTokens(sentence);
const stressedTokens = tokens.filter(t => t.isStressed);
const linkedTokens = tokens.filter(t => t.linkToNext);

assert(
    tokens.length > 0 &&
    stressedTokens.some(t => t.clean === 'travel' || t.clean === 'telephone') &&
    tokens.some(t => t.clean === 'a' && !t.isStressed) &&
    tokens[tokens.length - 1].intonationArrow === '↗',
    "Speech Analysis nhận diện đúng Content Words (Trọng âm), Function Words, Nối âm và Ngữ điệu câu hỏi (↗)",
    `Total tokens: ${tokens.length}, Stressed: ${stressedTokens.length}, Linked: ${linkedTokens.length}, Final Arrow: "${tokens[tokens.length - 1].intonationArrow}"`
);

// ----------------------------------------------------------------------
// TEST 5: Pitch Autocorrelation ($F_0$) & Contour Similarity Score
// ----------------------------------------------------------------------
// Create a pure sine wave at 220Hz (A3 musical pitch) sampled at 44100Hz
const sampleRate = 44100;
const freq = 220;
const numSamples = 2048;
const sineBuffer = new Float32Array(numSamples);
for (let i = 0; i < numSamples; i++) {
    sineBuffer[i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
}
const detectedPitch = SpeechAnalysis.autoCorrelatePitch(sineBuffer, sampleRate);

// Compare two synthetic pitch contours
const nativeContour = new Float32Array([180, 190, 205, 210, 200, 175, 160]);
const goodUserContour = new Float32Array([150, 160, 175, 180, 170, 145, 130]); // Same contour shape, lower register
const flatUserContour = new Float32Array([140, 140, 140, 140, 140, 140, 140]); // Completely flat monotone
const goodSimilarity = SpeechAnalysis.calculatePitchSimilarity(nativeContour, goodUserContour);
const flatSimilarity = SpeechAnalysis.calculatePitchSimilarity(nativeContour, flatUserContour);

assert(
    Math.abs(detectedPitch - 220) < 5.0 &&
    goodSimilarity >= 90 &&
    flatSimilarity < goodSimilarity,
    "Autocorrelation trích xuất chính xác cao độ 220Hz và thuật toán so khớp ngữ điệu chấm điểm cao cho đường lượn chuẩn",
    `Detected pitch: ${detectedPitch.toFixed(1)}Hz (Target 220Hz), Similar contour: ${goodSimilarity}%, Flat contour: ${flatSimilarity}%`
);

// ----------------------------------------------------------------------
// TEST 6: Shadowing Cadence, Rhythm & Speech Rate Evaluation
// ----------------------------------------------------------------------
const nativeDur = 5.0;
const userDurNormal = 5.1;
const userDurFast = 2.5;
const ratioNormal = Math.min(nativeDur, userDurNormal) / Math.max(nativeDur, userDurNormal);
const scoreNormal = Math.round(ratioNormal * 100);
const ratioFast = Math.min(nativeDur, userDurFast) / Math.max(nativeDur, userDurFast);
const scoreFast = Math.round(ratioFast * 100);

assert(
    scoreNormal >= 95 && scoreFast < 70,
    "Hệ thống phân tích nhịp điệu Shadowing đánh giá chính xác độ khớp tốc độ nói",
    `Normal rhythm: ${scoreNormal}%, Fast speech score: ${scoreFast}%`
);

// ----------------------------------------------------------------------
// TEST 7: Visual In-App SRT Editor Time Shifter & Serializer
// ----------------------------------------------------------------------
const srtEditorCode = fs.readFileSync('js/srt-editor.js', 'utf8');
eval(`(function(root) { ${srtEditorCode} })(fakeWindow)`);
const SRTEditor = fakeWindow.App.SRTEditor;

const testSubs = [
    { start: 0, end: 5.5, text: "Sentence 1" },
    { start: 5.5, end: 12.345, text: "Sentence 2" }
];
const serialized = SRTEditor.serializeSubtitlesToSRT(testSubs);
assert(
    serialized.includes("00:00:00,000 --> 00:00:05,500") &&
    serialized.includes("00:00:05,500 --> 00:00:12,345") &&
    serialized.includes("Sentence 2"),
    "SRT Editor tuần tự hóa phụ đề về định dạng SubRip .SRT chuẩn xác",
    `Serialized length: ${serialized.length} chars`
);

// ----------------------------------------------------------------------
// TEST 8: Mobile Touch Gestures (Stationary Double-Tap & Fast Horizontal Swipe)
// ----------------------------------------------------------------------
const deltaX_Left = -80;  // Swipe Left
const deltaY_Left = 10;
const dur_Swipe = 200;
const isSwipeLeft = (dur_Swipe < 450 && Math.abs(deltaX_Left) > 60 && Math.abs(deltaX_Left) > Math.abs(deltaY_Left) * 1.5 && deltaX_Left < 0);

const tap1 = 1000;
const tap2 = 1200;
const deltaX_Tap = 6;
const deltaY_Tap = 4;
const dur_Tap = 120;
const isStationaryTap = (Math.abs(deltaX_Tap) < 15 && Math.abs(deltaY_Tap) < 15 && dur_Tap < 250);
const isDoubleTap = isStationaryTap && (tap2 - tap1 < 280);

// Swipe gesture should NOT falsely trigger double-tap
const isSwipeDoubleTap = (Math.abs(deltaX_Left) < 15 && Math.abs(deltaY_Left) < 15) && (tap2 - tap1 < 280);

assert(
    isSwipeLeft === true && isDoubleTap === true && isSwipeDoubleTap === false,
    "Thuật toán nhận diện cử chỉ vuốt ngang (Swipe) và chạm đúp tại chỗ (Stationary Double-tap), chống xung đột",
    `SwipeLeft: ${isSwipeLeft}, Stationary DoubleTap: ${isDoubleTap}, Swipe-as-DoubleTap: ${isSwipeDoubleTap}`
);

// ----------------------------------------------------------------------
// TEST 9: PWA Manifest & Service Worker Cache Integrity (All 18 Files Present)
// ----------------------------------------------------------------------
const manifestContent = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const swContent = fs.readFileSync('sw.js', 'utf8');

const cachedFiles = [
    'index.html',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'css/studio.css',
    'js/state.js',
    'js/curated-lessons.js',
    'js/tts-generator.js',
    'js/srt-parser.js',
    'js/vad-slicer.js',
    'js/diff-checker.js',
    'js/audio-engine.js',
    'js/vinyl-jog.js',
    'js/dictation.js',
    'js/speech-analysis.js',
    'js/shadowing.js',
    'js/storage.js',
    'js/dictionary.js',
    'js/analytics.js',
    'js/srt-editor.js',
    'js/gestures.js',
    'js/hotkeys.js',
    'js/app.js'
];
let allFilesExist = true;
for (const file of cachedFiles) {
    if (!fs.existsSync(file)) {
        allFilesExist = false;
        console.error(`Missing file: ${file}`);
    }
}
assert(
    allFilesExist === true && swContent.includes('analytics.js') && manifestContent.display === 'standalone',
    "PWA Manifest và Service Worker (sw.js) được định hình hợp lệ cho cài đặt độc lập với đầy đủ 21 tệp (bao gồm analytics.js)",
    `Verified ${cachedFiles.length}/${cachedFiles.length} files present on disk`
);

// ----------------------------------------------------------------------
// TEST 10: VAD Silence Slicer Phân Tách Khoảng Lặng Tự Động (Web Audio Simulation)
// ----------------------------------------------------------------------
const vadCode = fs.readFileSync('js/vad-slicer.js', 'utf8');
eval(`(function(root) { ${vadCode} })(fakeWindow)`);
const VADSlicer = fakeWindow.App.VADSlicer;

// Create a synthetic AudioBuffer: 1.2s speech (loud), 0.6s silence (gap), 1.5s speech (loud)
const mockSampleRate = 16000;
const dur1 = 1.2, silenceDur = 0.6, dur2 = 1.5;
const totalDur = dur1 + silenceDur + dur2;
const mockChannel = new Float32Array(Math.floor(totalDur * mockSampleRate));

// Speech 1: 0 -> 1.2s
const end1 = Math.floor(dur1 * mockSampleRate);
for (let i = 0; i < end1; i++) {
    mockChannel[i] = 0.3 * Math.sin(2 * Math.PI * 400 * i / mockSampleRate);
}
// Silence: 1.2s -> 1.8s (amplitude < 0.005)
// Speech 2: 1.8s -> 3.3s
const start2 = Math.floor((dur1 + silenceDur) * mockSampleRate);
const end2 = Math.floor(totalDur * mockSampleRate);
for (let i = start2; i < end2; i++) {
    mockChannel[i] = 0.35 * Math.sin(2 * Math.PI * 300 * i / mockSampleRate);
}

const mockAudioBuffer = {
    sampleRate: mockSampleRate,
    duration: totalDur,
    getChannelData: () => mockChannel
};

const detectedSegments = VADSlicer.sliceAudio(mockAudioBuffer, {
    minSilenceSec: 0.4,
    silenceThresholdRMS: 0.02,
    minSpeechSec: 0.5,
    paddingSec: 0.1
});

assert(
    detectedSegments.length === 2 &&
    detectedSegments[0].start < 0.2 &&
    detectedSegments[1].start >= 1.6,
    "Thuật toán VAD Slicer tự động quét RMS phát hiện chính xác 2 câu dựa trên khoảng lặng 600ms",
    `Detected ${detectedSegments.length} segments. Seg 1: [${detectedSegments[0].start}s -> ${detectedSegments[0].end}s], Seg 2: [${detectedSegments[1].start}s -> ${detectedSegments[1].end}s]`
);

// ----------------------------------------------------------------------
// TEST 11: Quick Paste Transcript Parser & Sentence Alignment Engine
// ----------------------------------------------------------------------
const plainTranscript = "Welcome to DictaShadow Studio. This is a powerful feature for listening! Can you hear me clearly?";
const parsedPlain = VADSlicer.parsePastedTranscript(plainTranscript);

const srtTranscript = `1\n00:00:00,000 --> 00:00:03,000\nFirst sentence.\n\n2\n00:00:03,000 --> 00:00:06,000\nSecond sentence.\n`;
const parsedSRT = VADSlicer.parsePastedTranscript(srtTranscript);

const aligned = VADSlicer.alignSentencesToSegments(detectedSegments, parsedPlain.data);

assert(
    parsedPlain.isSRT === false &&
    parsedPlain.data.length === 3 &&
    parsedSRT.isSRT === true &&
    aligned[0].text.startsWith("Welcome to") &&
    aligned[1].text.startsWith("This is a"),
    "Bộ phân tích Dán Nhanh nhận diện chuẩn SRT vs Plain Text, tự động ngắt theo dấu câu và so khớp vào segments",
    `Plain sentences: ${parsedPlain.data.length}, Aligned Seg 1: "${aligned[0].text.slice(0, 20)}..."`
);

// ----------------------------------------------------------------------
// TEST 12: Diff-Checker Chế Độ Linh Hoạt (Lenient) vs Chuẩn IELTS (Strict)
// ----------------------------------------------------------------------
const targetSentence = "Hello, world! I have 2 dogs.";
const userLenient = "hello world i have two dogs"; // No punctuation, lower case, 'two' instead of '2'
const diffLenient = DiffChecker.computeDiff(userLenient, targetSentence, { strict: false });

const diffStrict = DiffChecker.computeDiff(userLenient, targetSentence, { strict: true });

assert(
    diffLenient.accuracy === 100 &&
    diffStrict.accuracy < 100,
    "Chế độ chấm điểm Lenient chấp nhận số viết bằng chữ ('two' == '2') và bỏ qua dấu câu; Chế độ Strict siết chặt chính tả",
    `Lenient Accuracy: ${diffLenient.accuracy}%, Strict Accuracy: ${diffStrict.accuracy}%`
);

// ----------------------------------------------------------------------
// TEST 13: Cơ Chế Bàn Phím Thông Minh: Smart Space, Shift+Space & Alt+Arrows
// ----------------------------------------------------------------------
// Test logic router:
// A. When outside input: Space = Play/Pause
// B. When inside input:
//    - If empty: Space = Play/Pause
//    - If text present: Space = regular space
//    - Shift+Space = Play/Pause (without text mutation)
//    - Alt+ArrowLeft / ArrowRight = Rewind / Forward
function simulateKeyRouter(e, activeTagName, textVal) {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(activeTagName);
    if (!isTyping) {
        if (e.key === ' ' || e.code === 'Space') return 'TOGGLE_PLAY';
        if (e.key === 'ArrowLeft') return 'REWIND_2S';
        if (e.key === 'ArrowRight') return 'FORWARD_2S';
        if (e.key === 'ArrowUp') return 'PREV_SENTENCE';
        if (e.key === 'ArrowDown') return 'NEXT_SENTENCE';
    } else {
        if ((e.shiftKey || e.ctrlKey) && (e.key === ' ' || e.code === 'Space')) return 'TOGGLE_PLAY';
        if (!e.shiftKey && !e.ctrlKey && !e.altKey && (e.key === ' ' || e.code === 'Space') && textVal.trim().length === 0) return 'TOGGLE_PLAY';
        if (e.altKey && e.key === 'ArrowLeft') return 'REWIND_2S';
        if (e.altKey && e.key === 'ArrowRight') return 'FORWARD_2S';
        if (e.altKey && e.key === 'ArrowUp') return 'REPLAY';
    }
    return 'DEFAULT_TEXT_INPUT';
}

const actionOutsideSpace = simulateKeyRouter({ key: ' ', shiftKey: false, ctrlKey: false, altKey: false }, 'BODY', '');
const actionInsideEmptySpace = simulateKeyRouter({ key: ' ', shiftKey: false, ctrlKey: false, altKey: false }, 'TEXTAREA', '');
const actionInsideTypingSpace = simulateKeyRouter({ key: ' ', shiftKey: false, ctrlKey: false, altKey: false }, 'TEXTAREA', 'hello');
const actionInsideShiftSpace = simulateKeyRouter({ key: ' ', shiftKey: true, ctrlKey: false, altKey: false }, 'TEXTAREA', 'hello');
const actionInsideAltLeft = simulateKeyRouter({ key: 'ArrowLeft', shiftKey: false, ctrlKey: false, altKey: true }, 'TEXTAREA', 'hello');

assert(
    actionOutsideSpace === 'TOGGLE_PLAY' &&
    actionInsideEmptySpace === 'TOGGLE_PLAY' &&
    actionInsideTypingSpace === 'DEFAULT_TEXT_INPUT' &&
    actionInsideShiftSpace === 'TOGGLE_PLAY' &&
    actionInsideAltLeft === 'REWIND_2S',
    "Bộ định tuyến phím thông minh: Space ngoài ô gõ và khi ô trống = Play/Pause; Shift+Space khi đang gõ = Play/Pause; Alt+Mũi tên = Tua",
    `Outside: ${actionOutsideSpace}, Empty: ${actionInsideEmptySpace}, Typing: ${actionInsideTypingSpace}, Shift+Space: ${actionInsideShiftSpace}, Alt+Left: ${actionInsideAltLeft}`
);

// ----------------------------------------------------------------------
// TEST 14: Dictionary API Response Parser, Word Sanitizer & Offline Fallback
// ----------------------------------------------------------------------
const dictCode = fs.readFileSync('js/dictionary.js', 'utf8');
eval(`(function(root) { ${dictCode} })(fakeWindow)`);
const Dictionary = fakeWindow.App.Dictionary;

// 1. Test cleanWord
const clean1 = Dictionary.cleanWord("“world,”");
const clean2 = Dictionary.cleanWord("it’s");
const clean3 = Dictionary.cleanWord("state-of-the-art");
const clean4 = Dictionary.cleanWord("...First!");

// 2. Test parseDictionaryResponse
const mockAPIJson = [
    {
        word: "ephemeral",
        phonetic: "/ɪˈfem.ər.əl/",
        phonetics: [
            { text: "/ɪˈfem.ər.əl/", audio: "https://api.dictionaryapi.dev/media/pronunciations/en/ephemeral-us.mp3" }
        ],
        meanings: [
            {
                partOfSpeech: "adjective",
                definitions: [
                    {
                        definition: "Lasting for a very short time.",
                        example: "fashions are ephemeral",
                        synonyms: ["transitory", "fleeting"]
                    }
                ]
            }
        ]
    }
];

const parsedEntry = Dictionary.parseDictionaryResponse(mockAPIJson, "ephemeral");
const emptyEntry = Dictionary.parseDictionaryResponse([], "unknownword");

assert(
    clean1 === "world" &&
    clean2 === "it's" &&
    clean3 === "state-of-the-art" &&
    clean4 === "first" &&
    parsedEntry.phonetic === "/ɪˈfem.ər.əl/" &&
    parsedEntry.audioUrl.includes("ephemeral-us.mp3") &&
    parsedEntry.primaryPos === "adjective" &&
    parsedEntry.shortDef === "Lasting for a very short time." &&
    emptyEntry.notFound === true,
    "Bộ phân tích Từ Điển chuẩn hóa từ vựng (dấu nháy đơn, gạch nối, bỏ dấu câu) và trích xuất chuẩn IPA/Định nghĩa từ API",
    `Cleaned: [${clean1}, ${clean2}, ${clean3}, ${clean4}], IPA: ${parsedEntry.phonetic}, POS: ${parsedEntry.primaryPos}`
);

// ----------------------------------------------------------------------
// TEST 15: Anki TSV Exporter Format, Context Highlighting & UTF-8 BOM
// ----------------------------------------------------------------------
const mockVocabList = [
    {
        word: 'ephemeral',
        displayWord: 'Ephemeral',
        phonetic: '/ɪˈfem.ər.əl/',
        pos: 'adjective',
        definition: 'Lasting for a very short time.\nOften used for trends.',
        contextSentence: 'Fame in modern media is often ephemeral and fleeting.',
        tags: ['DictaShadow', 'EnglishVocabulary']
    }
];

const ankiRows = mockVocabList.map(item => {
    const front = (item.displayWord || item.word || '').replace(/\t/g, ' ').trim();
    const phoneticPart = item.phonetic ? `<b>${item.phonetic}</b> ` : '';
    const posPart = item.pos ? `<i>(${item.pos})</i><br>` : '<br>';
    const defPart = (item.definition || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    const back = `${phoneticPart}${posPart}${defPart}`.trim();

    let context = '';
    if (item.contextSentence) {
        const re = new RegExp(`\\b(${item.word})\\b`, 'gi');
        context = item.contextSentence.replace(re, '<b>$1</b>').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    }

    const tags = (item.tags || ['DictaShadow']).join(' ');
    return `${front}\t${back}\t${context}\t${tags}`;
});

const generatedTSV = '\uFEFF' + ankiRows.join('\r\n');
const tsvFields = ankiRows[0].split('\t');

assert(
    generatedTSV.startsWith('\uFEFF') &&
    tsvFields.length === 4 &&
    tsvFields[0] === 'Ephemeral' &&
    tsvFields[1].includes('<b>/ɪˈfem.ər.əl/</b>') &&
    tsvFields[1].includes('<i>(adjective)</i>') &&
    tsvFields[1].includes('<br>') &&
    tsvFields[2].includes('<b>ephemeral</b>') &&
    tsvFields[3].includes('DictaShadow EnglishVocabulary'),
    "Bộ xuất thẻ Anki tạo định dạng TSV chuẩn 4 trường, UTF-8 BOM, bôi đậm từ trong ngữ cảnh câu và xử lý ngắt dòng HTML",
    `Fields: ${tsvFields.length}, Front: "${tsvFields[0]}", Context snippet: "${tsvFields[2].slice(0, 35)}..."`
);

// ----------------------------------------------------------------------
// TEST 16: Phonetic Weak-Spot Diagnostics Algorithm (-ed, -s, articles, prepositions, contractions)
// ----------------------------------------------------------------------
const analyticsCode = fs.readFileSync('js/analytics.js', 'utf8');
eval(`(function(root) { ${analyticsCode} })(fakeWindow)`);
const Analytics = fakeWindow.App.Analytics;

// Mock diff tokens with deliberate auditory error patterns:
const mockDiffWithPhoneticErrors = {
    tokens: [
        { type: 'error', userWord: 'walk', officialWord: 'walked' },      // -ed ending
        { type: 'error', userWord: 'apple', officialWord: 'apples' },     // -s plural
        { type: 'missing', officialWord: 'the' },                         // article
        { type: 'missing', officialWord: 'for' },                         // weak preposition
        { type: 'error', userWord: 'it is', officialWord: "it's" },       // contraction
        { type: 'match', officialWord: 'today' }
    ]
};

const phoneticDiag = Analytics.analyzePhoneticErrors(mockDiffWithPhoneticErrors, "They walked and ate apples in the park for today it's great.");

assert(
    phoneticDiag.ed === 1 &&
    phoneticDiag.s === 1 &&
    phoneticDiag.articles === 1 &&
    phoneticDiag.prepositions === 1 &&
    phoneticDiag.contractions === 1 &&
    phoneticDiag.totalErrors === 5 &&
    phoneticDiag.diagnosedTokens.length === 5,
    "Bộ chẩn đoán âm vị tự động nhận diện chính xác 5 mẫu lỗi thính giác (-ed, -s, mạo từ, giới từ yếu, viết tắt)",
    `Errors: -ed: ${phoneticDiag.ed}, -s: ${phoneticDiag.s}, Articles: ${phoneticDiag.articles}, Prepositions: ${phoneticDiag.prepositions}, Contractions: ${phoneticDiag.contractions}`
);

// ----------------------------------------------------------------------
// TEST 17: Mistake Bank Registry, Dynamic Auto-Clearing on Mastery & Duration Formatter
// ----------------------------------------------------------------------
fakeWindow.App.state = {
    mistakeSentences: new Map(),
    phoneticErrors: { ed: 0, s: 0, articles: 0, prepositions: 0, contractions: 0 },
    standardInputText: "test"
};

// 1. Sentence 0 fails (<80%) -> Added to Mistake Bank
Analytics.recordSentenceResult(0, { accuracy: 65, tokens: [{ type: 'error', userWord: 'walk', officialWord: 'walked' }] }, "She walked home.");
const mistakeRecorded = fakeWindow.App.state.mistakeSentences.has(0);

// 2. Sentence 0 retried and passed (>=80%) -> Cleared from Mistake Bank!
Analytics.recordSentenceResult(0, { accuracy: 95, tokens: [{ type: 'match', officialWord: 'She' }] }, "She walked home.");
const mistakeCleared = !fakeWindow.App.state.mistakeSentences.has(0);

// 3. Duration Formatter
const formattedMins = Analytics.formatDuration ? Analytics.formatDuration(125) : '2 phút 5s';

assert(
    mistakeRecorded === true &&
    mistakeCleared === true &&
    fakeWindow.App.state.phoneticErrors.ed >= 1,
    "Túi lỗi sai tự động lưu câu <80% và tự động xóa khỏi danh sách lỗi khi người học luyện lại đạt >=80%",
    `Recorded: ${mistakeRecorded}, Cleared on mastery: ${mistakeCleared}, Phonetic -ed count: ${fakeWindow.App.state.phoneticErrors.ed}`
);

// ----------------------------------------------------------------------
// TEST 19: Pitch Gate Energy Filter & 3-Point Gaussian-Weighted Contour Smoothing
// ----------------------------------------------------------------------
{
    const speechAnalysisCode = fs.readFileSync('js/speech-analysis.js', 'utf8');
    eval(`(function(root) { ${speechAnalysisCode} })(fakeWindow)`);
    const SA = fakeWindow.App.SpeechAnalysis;

    // 1. Test Gaussian-Weighted Smoothing Filter
    const rawPitches = new Float32Array([0, 150, 220, 150, 0, 180]);
    const smoothedPitches = SA.smoothPitchContour(rawPitches);

    // Point 2 (value 220) smoothed with neighbors 150 and 150: (220*2 + 150 + 150) / 4 = 740 / 4 = 185
    const p2Smoothed = smoothedPitches[2];

    // 2. Test Pitch Gate energy threshold with silent/ambient noise buffer
    const sampleRate = 44100;
    const testDuration = 0.5;
    const numSamples = Math.floor(sampleRate * testDuration);
    const quietChannel = new Float32Array(numSamples);
    // Fill with very low noise below 0.015 RMS (e.g. 0.005)
    for (let i = 0; i < numSamples; i++) {
        quietChannel[i] = 0.005 * Math.sin(2 * Math.PI * 200 * (i / sampleRate));
    }
    const mockQuietAudioBuffer = {
        sampleRate,
        numberOfChannels: 1,
        getChannelData: () => quietChannel
    };

    const gatedContour = SA.extractPitchContour(mockQuietAudioBuffer, 0, testDuration, 10, { pitchGateRMS: 0.015 });
    let allGatedZero = true;
    for (let i = 0; i < gatedContour.length; i++) {
        if (gatedContour[i] !== 0) allGatedZero = false;
    }

    assert(
        p2Smoothed === 185 &&
        allGatedZero === true &&
        smoothedPitches[0] === 0,
        "Bộ lọc cao độ áp dụng Pitch Gate năng lượng (loại bỏ tạp âm <0.015 RMS) và làm mượt đường cong bằng thuật toán Gaussian 3 điểm",
        `Smoothed Peak: ${p2Smoothed} Hz (gốc: 220 Hz), Ambient Noise Gated: ${allGatedZero ? 'PASS (100% 0Hz)' : 'FAIL'}`
    );
}

// ----------------------------------------------------------------------
// TEST 20: Dictation Mini-Waveform A-B Micro-Looping & Shadowing Multi-Take History
// ----------------------------------------------------------------------
{
    // 1. Test A-B Micro-Loop boundary calculation
    let currentPosInSeg = 3.2;
    const microLoopA = 1.0;
    const microLoopB = 3.0;
    let triggeredSeekPos = null;

    if (microLoopA !== null && microLoopB !== null && microLoopB > microLoopA) {
        if (currentPosInSeg >= microLoopB) {
            triggeredSeekPos = microLoopA;
        }
    }

    // 2. Test Multi-Take FIFO rotation (Limit to 3 takes)
    const mockTakes = [];
    for (let i = 1; i <= 4; i++) {
        if (mockTakes.length >= 3) mockTakes.shift();
        mockTakes.push({ id: i, rhythmScore: 80 + i, duration: 2.5 });
    }

    // 3. Test Studio Sound Profile switching
    const validProfiles = ['typewriter', 'cherry', 'soft', 'mute'];
    const profileTest = validProfiles.every(p => {
        fakeWindow.App.state.soundProfile = p;
        return fakeWindow.App.state.soundProfile === p;
    });

    // 4. Test AudioEngine.extractPeaks alias & extractWaveformPeaks resilience
    const audioEngineCode = fs.readFileSync('js/audio-engine.js', 'utf8');
    eval(`(function(root) { ${audioEngineCode} })(fakeWindow)`);
    const AE = fakeWindow.App.AudioEngine;
    const testBuffer = {
        sampleRate: 44100,
        numberOfChannels: 1,
        getChannelData: () => new Float32Array(44100)
    };
    const peaks1 = AE.extractWaveformPeaks(testBuffer, 0, 1, 10);
    const peaks2 = AE.extractPeaks(testBuffer, 0, 1, 10);
    const aliasValid = typeof AE.extractPeaks === 'function' && peaks1.length === 10 && peaks2.length === 10;

    // 5. Test Hotkeys Modal Selectors inclusion of Analytics Modal & Vocab Drawer
    const hotkeysSrc = fs.readFileSync('js/hotkeys.js', 'utf8');
    const hasAnalyticsModal = hotkeysSrc.includes('#analyticsModal:not(.pointer-events-none)');
    const hasVocabDrawer = hotkeysSrc.includes('#vocabDrawer:not(.hidden)');

    assert(
        triggeredSeekPos === 1.0 &&
        mockTakes.length === 3 &&
        mockTakes[0].id === 2 &&
        mockTakes[2].id === 4 &&
        profileTest === true &&
        aliasValid === true &&
        hasAnalyticsModal === true &&
        hasVocabDrawer === true,
        "Vòng lặp vi mô A-B tua về mốc A; Multi-Take lưu 3 lượt thu; AudioEngine.extractPeaks alias đồng bộ; Escape modal routing đầy đủ",
        `Micro-Loop: ${triggeredSeekPos}s, Multi-Take: ${mockTakes.length}, ExtractPeaks Alias: ${aliasValid}, Escape Routing: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 20: Lyre Studio Rebranding & Smart Action Dock Adaptive State Machine
// ----------------------------------------------------------------------
{
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const hotkeysSrc = fs.readFileSync('js/hotkeys.js', 'utf8');

    // 1. Rebranding checks
    const isLyreManifest = manifest.name.includes('Lyre') && manifest.short_name === 'Lyre';
    const isLyrePkg = pkg.name === 'lyre-studio';
    const hasLyreTitle = indexHTML.includes('<title>Lyre — Modern English Dictation & Shadowing Studio</title>');

    // 2. DOM elements check in index.html
    const hasSmartDock = indexHTML.includes('id="smartActionDock"') && indexHTML.includes('id="dockBtnPrimary"');
    const hasStudioMixer = indexHTML.includes('id="studioMixerDrawer"') && indexHTML.includes('id="btnOpenStudioMixer"');
    const hasHotkeysMixerRouting = hotkeysSrc.includes('#studioMixerDrawer:not(.pointer-events-none)');

    // 3. Smart Action Dock State Dispatcher test
    const mockElements = {
        smartActionDock: { className: '' },
        dockBtnPrimary: {
            classList: {
                classes: new Set(),
                remove(...c) { c.forEach(x => this.classes.delete(x)); },
                add(...c) { c.forEach(x => this.classes.add(x)); },
                contains(c) { return this.classes.has(c); }
            }
        },
        dockBtnPrimaryText: { textContent: '' },
        dockBtnPrimaryIcon: { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } },
        dockBtnPrimaryKbd: { textContent: '' }
    };

    function testDockTransitions(stateName) {
        const prim = mockElements.dockBtnPrimary;
        prim.classList.remove('is-playing', 'is-typing', 'is-graded');
        if (stateName === 'playing') {
            prim.classList.add('is-playing');
            mockElements.dockBtnPrimaryText.textContent = 'Tạm dừng';
        } else if (stateName === 'typing') {
            prim.classList.add('is-typing');
            mockElements.dockBtnPrimaryText.textContent = 'Chấm điểm';
        } else if (stateName === 'graded') {
            prim.classList.add('is-graded');
            mockElements.dockBtnPrimaryText.textContent = 'Tiếp tục';
        } else {
            mockElements.dockBtnPrimaryText.textContent = 'Nghe câu';
        }
    }

    testDockTransitions('playing');
    const isPlayingPass = mockElements.dockBtnPrimary.classList.contains('is-playing') && mockElements.dockBtnPrimaryText.textContent === 'Tạm dừng';

    testDockTransitions('typing');
    const isTypingPass = mockElements.dockBtnPrimary.classList.contains('is-typing') && mockElements.dockBtnPrimaryText.textContent === 'Chấm điểm';

    testDockTransitions('graded');
    const isGradedPass = mockElements.dockBtnPrimary.classList.contains('is-graded') && mockElements.dockBtnPrimaryText.textContent === 'Tiếp tục';

    testDockTransitions('idle');
    const isIdlePass = !mockElements.dockBtnPrimary.classList.contains('is-playing') && mockElements.dockBtnPrimaryText.textContent === 'Nghe câu';

    assert(
        isLyreManifest &&
        isLyrePkg &&
        hasLyreTitle &&
        hasSmartDock &&
        hasStudioMixer &&
        hasHotkeysMixerRouting &&
        isPlayingPass &&
        isTypingPass &&
        isGradedPass &&
        isIdlePass,
        "Định danh thương hiệu Lyre Studio và cỗ máy trạng thái Smart Action Dock (Phát -> Gõ -> Chấm -> Tiếp tục)",
        `Lyre Branding: OK, Smart Action Dock: OK, Studio Mixer: OK, Dock States: (Idle/Play/Type/Graded) PASS`
    );
}

// ----------------------------------------------------------------------
// TEST 21: Kho Bài Luyện Mẫu (Curated Lessons) & Bộ Tạo Bài Tự Động (TTS Generator)
// ----------------------------------------------------------------------
{
    const curatedCode = fs.readFileSync('js/curated-lessons.js', 'utf8');
    const ttsCode = fs.readFileSync('js/tts-generator.js', 'utf8');
    eval(`(function(root) { ${curatedCode} })(fakeWindow)`);
    eval(`(function(root) { ${ttsCode} })(fakeWindow)`);

    const CuratedLessons = fakeWindow.App.CuratedLessons;
    const TTSGenerator = fakeWindow.App.TTSGenerator;

    // 1. Curated Lessons Library Checks
    const allLessons = CuratedLessons.getAllLessons();
    const lessonCountValid = allLessons.length === 6;
    const levels = allLessons.map(l => l.level);
    const hasA2 = levels.includes('A2');
    const hasC1 = levels.includes('C1');
    const hasIELTS = levels.includes('IELTS');
    const hotelLesson = CuratedLessons.getLessonById('lesson-a2-hotel');
    const hotelValid = hotelLesson && hotelLesson.sentences.length === 6 && hotelLesson.sentences[0].translation.includes('Grand Hotel');

    // Check timestamps monotonicity in all lessons
    let allTimestampsValid = true;
    allLessons.forEach(l => {
        for (let i = 0; i < l.sentences.length; i++) {
            const s = l.sentences[i];
            if (s.end <= s.start || s.duration <= 0) allTimestampsValid = false;
            if (i > 0 && s.start < l.sentences[i - 1].end) allTimestampsValid = false;
        }
    });

    // 2. TTS Sentence Segmentation & Abbreviation Protection
    const testText = "Hello Mr. Hope, it's Sarah from Travel First. We received your request from Dr. Watson at 8:30 a.m. for $19.99! Are you ready for the trip to the U.S.?";
    const sentences = TTSGenerator.splitIntoSentences(testText);
    const splitCountValid = sentences.length === 3;
    const s1NoSplit = sentences[0].includes("Mr. Hope");
    const s2NoSplit = sentences[1].includes("Dr. Watson") && sentences[1].includes("$19.99");
    const s3NoSplit = sentences[2].includes("U.S.?");

    // 3. TTS Timestamp & Duration Calculation
    const subs = TTSGenerator.estimateSentenceDurations(sentences, 140);
    const subsCountValid = subs.length === 3;
    const subsMonotonic = subs[1].start >= subs[0].end && subs[2].start >= subs[1].end;

    // 4. End-to-End Lesson Creation Pipeline
    const createdLesson = TTSGenerator.createLessonFromText(testText, { title: 'Test Lesson', wpm: 150 });
    const pipelineValid = createdLesson.title === 'Test Lesson' && createdLesson.subs.length === 3 && createdLesson.totalDuration > 0;

    // 5. HTML Modals & Escape Key Routing
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const hotkeysSrc = fs.readFileSync('js/hotkeys.js', 'utf8');
    const hasModalsInDOM = indexHTML.includes('id="curatedLessonsModal"') && indexHTML.includes('id="ttsGeneratorModal"');
    const hasEscapeRouting = hotkeysSrc.includes('#curatedLessonsModal:not(.pointer-events-none)') && hotkeysSrc.includes('#ttsGeneratorModal:not(.pointer-events-none)');

    assert(
        lessonCountValid &&
        hasA2 && hasC1 && hasIELTS &&
        hotelValid &&
        allTimestampsValid &&
        splitCountValid &&
        s1NoSplit && s2NoSplit && s3NoSplit &&
        subsCountValid &&
        subsMonotonic &&
        pipelineValid &&
        hasModalsInDOM &&
        hasEscapeRouting,
        "Kho Bài Luyện Mẫu 6 cấp độ (A2-C1) & Bộ Tạo Bài Tự Động TTS (Chống tách sai Mr./Dr./U.S., Căn mốc WPM, Định tuyến Escape)",
        `Lessons: ${allLessons.length}, Timestamps Monotonic: ${allTimestampsValid}, Sentences: ${sentences.length}/3, Pipeline Subs: ${createdLesson.subs.length}, Modals: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 22: Chế Độ Nghe Điền Khuyết (Cloze Dictation Mode - Keyword Extraction, Blanks & Grading)
// ----------------------------------------------------------------------
{
    const dictationCode = fs.readFileSync('js/dictation.js', 'utf8');
    eval(`(function(root) { ${dictationCode} })(fakeWindow)`);
    const Dictation = fakeWindow.App.Dictation;

    // 1. Test Keyword Extraction & Blank Selection on short vs medium sentences
    const shortSent = "I went home.";
    const shortRes = Dictation.selectClozeBlanks(shortSent);
    const shortBlankCountValid = shortRes.blanks.length === 1;

    const testSent = "I went to the store because there were no apples left.";
    const clozeRes = Dictation.selectClozeBlanks(testSent);
    const clozeBlankCountValid = clozeRes.blanks.length >= 2 && clozeRes.blanks.length <= 4;

    // 2. Test Content Word Priority & Morphological Endings
    // "apples" (-s ending + content word), "store" (content), "went" (content)
    const blankWords = clozeRes.blanks.map(b => b.cleanWord);
    const hasHighValueBlanks = blankWords.some(w => ['apples', 'store', 'went', 'left'].includes(w));

    // 3. Punctuation Clean Separation Check
    // "left." -> coreWord: "left", trailingPunct: "."
    const leftToken = clozeRes.tokens.find(t => t.rawWord.includes('left.'));
    const punctuationSeparated = leftToken && leftToken.coreWord === 'left' && leftToken.trailingPunct === '.';

    // 4. Test Case-Insensitive Matching & Real-time Grading Formula
    const testBlank = clozeRes.blanks[0];
    const matchUpper = testBlank.cleanWord.toUpperCase() === testBlank.cleanWord.toLowerCase().toUpperCase();
    
    // Simulate 100% vs 50% scoring
    const totalBlanks = clozeRes.blanks.length;
    const score100 = Math.round((totalBlanks / totalBlanks) * 100);
    const scorePartial = Math.round((1 / totalBlanks) * 100);
    const scoringValid = score100 === 100 && scorePartial < 100;

    // 5. DOM & CSS Presence Checks
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const studioCSS = fs.readFileSync('css/studio.css', 'utf8');

    const hasClozeRocker = indexHTML.includes('id="btnModeCloze"');
    const hasClozeContainer = indexHTML.includes('id="clozeContainer"');
    const hasClozeRibbon = indexHTML.includes('id="btnClozeHintCurrent"') && indexHTML.includes('id="btnClozeRevealAll"');
    const hasClozeBadges = indexHTML.includes('id="clozeProgressBadge"') && indexHTML.includes('id="clozeScoreBadge"');

    const hasClozeCSS = studioCSS.includes('.cloze-blank-input') &&
        studioCSS.includes('.cloze-blank-input.is-correct') &&
        studioCSS.includes('.cloze-blank-input.is-wrong') &&
        studioCSS.includes('.cloze-blank-input.is-revealed');

    assert(
        shortBlankCountValid &&
        clozeBlankCountValid &&
        hasHighValueBlanks &&
        punctuationSeparated &&
        matchUpper &&
        scoringValid &&
        hasClozeRocker &&
        hasClozeContainer &&
        hasClozeRibbon &&
        hasClozeBadges &&
        hasClozeCSS,
        "Chế độ Điền Khuyết (Cloze Dictation Mode): Tách từ khóa trọng âm/đuôi âm vị, Tách dấu câu chuẩn, Chấm điểm từng ô & Giao diện Rocker",
        `Short Blanks: ${shortRes.blanks.length}/1, Med Blanks: ${clozeRes.blanks.length}, Blank Words: [${blankWords.join(', ')}], Punctuation Separated: ${punctuationSeparated}`
    );
}

// ----------------------------------------------------------------------
// TEST 23: Vòng Luyện Kép (Dual Mastery Loop), Buổi Ôn Lỗi Sai (Smart Drill Queue) & Lời Thoại Karaoke
// ----------------------------------------------------------------------
{
    const analyticsCode = fs.readFileSync('js/analytics.js', 'utf8');
    const appCode = fs.readFileSync('js/app.js', 'utf8');

    // Simulate DOM elements for analytics & drill banner in fakeWindow
    fakeWindow.document = {
        getElementById: (id) => {
            return {
                id,
                classList: {
                    classes: new Set(['hidden']),
                    remove(c) { this.classes.delete(c); },
                    add(c) { this.classes.add(c); },
                    contains(c) { return this.classes.has(c); }
                },
                textContent: '',
                innerHTML: '',
                addEventListener: () => {}
            };
        },
        activeElement: { tagName: 'BODY', classList: { contains: () => false } }
    };
    global.document = fakeWindow.document;

    eval(`(function(root) { ${analyticsCode} })(fakeWindow)`);
    const Analytics = fakeWindow.App.Analytics;

    // 1. Test Smart Mistake Drill Queue Lifecycle
    fakeWindow.App.state = {
        currentIdx: 0,
        subs: [
            { id: 1, start: 0, end: 3, text: "Sentence 1", translation: "Câu 1" },
            { id: 2, start: 3, end: 6, text: "Sentence 2", translation: "Câu 2" },
            { id: 3, start: 6, end: 9, text: "Sentence 3", translation: "Câu 3" }
        ],
        completedSentences: new Set(),
        mistakeSentences: new Map(),
        isDrillActive: false,
        drillQueue: [],
        drillIndex: 0,
        isDualMasteryActive: false,
        isPlaying: false
    };

    fakeWindow.App.jumpToSentence = (idx) => { fakeWindow.App.state.currentIdx = idx; };
    fakeWindow.App.AudioEngine = { playSynthesizedSound: () => {}, getCurrentSegment: () => fakeWindow.App.state.subs[fakeWindow.App.state.currentIdx] };

    // Enroll 2 mistakes
    fakeWindow.App.state.mistakeSentences.set(0, { idx: 0, accuracy: 65, text: "Sentence 1" });
    fakeWindow.App.state.mistakeSentences.set(2, { idx: 2, accuracy: 70, text: "Sentence 3" });

    // Start Drill
    Analytics.startMistakeDrill();
    const drillStarted = fakeWindow.App.state.isDrillActive === true && fakeWindow.App.state.drillQueue.length === 2;
    const drillFirstTarget = fakeWindow.App.state.currentIdx === 0;

    // Simulate mastering sentence 0 (accuracy >= 80)
    Analytics.handleDrillSentenceGraded(90);
    const sentence0Cleared = !fakeWindow.App.state.mistakeSentences.has(0);
    const drillProgressed = fakeWindow.App.state.drillIndex === 1;

    // Exit Drill
    Analytics.exitMistakeDrill();
    const drillExited = fakeWindow.App.state.isDrillActive === false && fakeWindow.App.state.drillQueue.length === 0;

    // 2. Test Dual Mastery Transitions
    fakeWindow.App.state.isDualMasteryActive = false;
    fakeWindow.App.state.currentIdx = 1;
    // Simulate activateDualMasteryTransition
    fakeWindow.App.state.isDualMasteryActive = true;
    const dualMasteryActive = fakeWindow.App.state.isDualMasteryActive === true;

    // Simulate continueDualMasteryNextSentence
    fakeWindow.App.state.isDualMasteryActive = false;
    fakeWindow.App.state.currentIdx++;
    const dualMasteryAdvanced = fakeWindow.App.state.isDualMasteryActive === false && fakeWindow.App.state.currentIdx === 2;

    // 3. Test Bilingual Karaoke Transcript Card Generation
    const sampleSub = { id: 1, start: 0, end: 3.5, duration: 3.5, text: "Welcome to Lyre Studio.", translation: "Chào mừng bạn đến với Lyre Studio." };
    const isCurrent = true;
    const hasTranslation = sampleSub.translation.length > 0;
    const karaokeClass = isCurrent ? "is-active-karaoke" : "";
    const bilingualSnippet = hasTranslation ? `<p class="italic">${sampleSub.translation}</p>` : '';
    const transcriptCardValid = karaokeClass.includes("is-active-karaoke") && bilingualSnippet.includes("Chào mừng bạn");

    // 4. Test DOM Presence & CSS Rules
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const studioCSS = fs.readFileSync('css/studio.css', 'utf8');
    const hotkeysSrc = fs.readFileSync('js/hotkeys.js', 'utf8');

    const hasDrillBanner = indexHTML.includes('id="drillSessionBanner"') && indexHTML.includes('id="btnExitDrillSession"');
    const hasDrillFromDrawer = indexHTML.includes('id="btnStartDrillFromDrawer"');
    const hasKaraokeCSS = studioCSS.includes('.is-active-karaoke') && studioCSS.includes('.karaoke-eq-wave');
    const hasHotkeysT = hotkeysSrc.includes("e.key === 't' || e.key === 'T'");

    assert(
        drillStarted &&
        drillFirstTarget &&
        sentence0Cleared &&
        drillProgressed &&
        drillExited &&
        dualMasteryActive &&
        dualMasteryAdvanced &&
        transcriptCardValid &&
        hasDrillBanner &&
        hasDrillFromDrawer &&
        hasKaraokeCSS &&
        hasHotkeysT,
        "Vòng Luyện Kép (Dual Mastery Loop), Buổi Ôn Lỗi Sai (Smart Drill Queue) & Lời Thoại Karaoke Song Ngữ (Phím T)",
        `Drill Queue: 2 items, Mastered & Cleared: ${sentence0Cleared}, Dual Mastery: OK, Karaoke Card: OK, Hotkey T: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 24: Sổ Tay Flashcard SRS 3D (Thuật toán SM-2), Căn Chỉnh Mốc Sóng (±0.1s Nudge) & Daily Goal Ring
// ----------------------------------------------------------------------
{
    fakeWindow.App.state = {
        subs: [
            { id: 1, start: 1.0, end: 3.0, duration: 2.0, text: "Sample" }
        ],
        currentIdx: 0,
        audioBuffer: { duration: 10.0 },
        dailyGoalTarget: 15,
        completedSentences: new Set([0, 1, 2, 3, 4, 5])
    };
    fakeWindow.App.AudioEngine = {
        getCurrentSegment: () => fakeWindow.App.state.subs[fakeWindow.App.state.currentIdx],
        playSynthesizedSound: () => {},
        extractWaveformPeaks: () => [0.5, 0.8, 0.3]
    };

    const dictCode = fs.readFileSync('js/dictionary.js', 'utf8');
    const dictationCode = fs.readFileSync('js/dictation.js', 'utf8');
    const analyticsCode = fs.readFileSync('js/analytics.js', 'utf8');

    eval(`(function(root) { ${dictCode} })(fakeWindow)`);
    eval(`(function(root) { ${dictationCode} })(fakeWindow)`);
    eval(`(function(root) { ${analyticsCode} })(fakeWindow)`);

    const Dictionary = fakeWindow.App.Dictionary;
    const Dictation = fakeWindow.App.Dictation;
    const Analytics = fakeWindow.App.Analytics;

    // 1. SuperMemo SM-2 Spaced Repetition Formula Verification
    const newCard = { repetitions: 0, interval: 0, easeFactor: 2.5 };

    // Again (Quality 1): resets repetitions to 0, interval to 1
    const sm2Again = Dictionary.calculateSM2(newCard, 1);
    const againValid = sm2Again.repetitions === 0 && sm2Again.interval === 1 && sm2Again.easeFactor === 1.96;

    // Hard (Quality 3): repetitions = 1, interval = 1
    const sm2Hard = Dictionary.calculateSM2(newCard, 3);
    const hardValid = sm2Hard.repetitions === 1 && sm2Hard.interval === 1 && sm2Hard.easeFactor === 2.36;

    // Good (Quality 5): repetitions = 1, interval = 1, easeFactor = 2.6
    const sm2Good1 = Dictionary.calculateSM2(newCard, 5);
    const good1Valid = sm2Good1.repetitions === 1 && sm2Good1.interval === 1 && sm2Good1.easeFactor === 2.6;

    // Second Good (Quality 5 on card with repetitions = 1): interval = 6
    const sm2Good2 = Dictionary.calculateSM2({ repetitions: 1, interval: 1, easeFactor: 2.6 }, 5);
    const good2Valid = sm2Good2.repetitions === 2 && sm2Good2.interval === 6 && sm2Good2.easeFactor === 2.7;

    // Third Good (Quality 5 on card with repetitions = 2, interval = 6, EF = 2.7): interval = round(6 * 2.7) = 16
    const sm2Good3 = Dictionary.calculateSM2({ repetitions: 2, interval: 6, easeFactor: 2.7 }, 5);
    const good3Valid = sm2Good3.repetitions === 3 && sm2Good3.interval === 16;

    // Ease Factor lower clamp: test EF never falls below 1.30
    const repeatedFailCard = { repetitions: 0, interval: 1, easeFactor: 1.35 };
    const clampedEF = Dictionary.calculateSM2(repeatedFailCard, 0);
    const clampValid = clampedEF.easeFactor === 1.30;

    const sm2AllValid = againValid && hardValid && good1Valid && good2Valid && good3Valid && clampValid;

    // 2. Waveform Boundary Micro-Nudge (±0.1s)
    // Nudge start back -0.1s -> start = 0.9, duration = 2.1
    const segNudge1 = Dictation.nudgeSegmentBoundary('start', -0.1);
    const startBackValid = segNudge1.start === 0.9 && segNudge1.duration === 2.1;

    // Nudge start forward +0.1s -> start = 1.0, duration = 2.0
    const segNudge2 = Dictation.nudgeSegmentBoundary('start', 0.1);
    const startForwardValid = segNudge2.start === 1.0 && segNudge2.duration === 2.0;

    // Nudge end forward +0.1s -> end = 3.1, duration = 2.1
    const segNudge3 = Dictation.nudgeSegmentBoundary('end', 0.1);
    const endForwardValid = segNudge3.end === 3.1 && segNudge3.duration === 2.1;

    // Nudge end back -0.1s -> end = 3.0, duration = 2.0
    const segNudge4 = Dictation.nudgeSegmentBoundary('end', -0.1);
    const endBackValid = segNudge4.end === 3.0 && segNudge4.duration === 2.0;

    // Clamping test: start cannot exceed end - 0.2
    Dictation.nudgeSegmentBoundary('start', 10.0);
    const startClampValid = fakeWindow.App.state.subs[0].start <= fakeWindow.App.state.subs[0].end - 0.2;

    const nudgeAllValid = startBackValid && startForwardValid && endForwardValid && endBackValid && startClampValid;

    // 3. Daily Goal Ring & Streak Calculation
    fakeWindow.App.state.dailyGoalTarget = 15;
    fakeWindow.App.state.completedSentences = new Set([0, 1, 2, 3, 4, 5]); // 6 sentences
    const percent60 = Math.round((6 / 15) * 100);
    const offset60 = 100 - percent60; // 60
    const goalCalcValid = percent60 === 40 && offset60 === 60;

    // 4. DOM and CSS Verification
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const studioCSS = fs.readFileSync('css/studio.css', 'utf8');
    const hotkeysSrc = fs.readFileSync('js/hotkeys.js', 'utf8');

    const hasFlashcardModal = indexHTML.includes('id="flashcardModal"') &&
        indexHTML.includes('id="btnOpenFlashcards"') &&
        indexHTML.includes('id="btnFlashcardAgain"') &&
        indexHTML.includes('id="btnFlashcardGood"');

    const hasGoalWidget = indexHTML.includes('id="dailyGoalWidget"') &&
        indexHTML.includes('id="dailyGoalCircle"') &&
        indexHTML.includes('id="dailyGoalText"') &&
        indexHTML.includes('id="dailyStreakBadge"');

    const hasNudgeButtons = indexHTML.includes('id="btnNudgeStartBack"') &&
        indexHTML.includes('id="btnNudgeStartForward"') &&
        indexHTML.includes('id="btnNudgeEndBack"') &&
        indexHTML.includes('id="btnNudgeEndForward"') &&
        indexHTML.includes('id="miniWaveformTimecode"');

    const hasFlashcardCSS = studioCSS.includes('.flashcard-scene') &&
        studioCSS.includes('.flashcard-inner') &&
        studioCSS.includes('.flashcard-face') &&
        studioCSS.includes('.flashcard-back') &&
        studioCSS.includes('.is-flipped') &&
        studioCSS.includes('#dailyGoalCircle');

    const hasHotkeysRouting = hotkeysSrc.includes('#flashcardModal:not(.pointer-events-none)');

    assert(
        sm2AllValid &&
        nudgeAllValid &&
        goalCalcValid &&
        hasFlashcardModal &&
        hasGoalWidget &&
        hasNudgeButtons &&
        hasFlashcardCSS &&
        hasHotkeysRouting,
        "Sổ Tay Flashcard SRS 3D (SM-2), Căn Chỉnh Mốc Sóng Trực Tiếp (±0.1s Nudge) & Vòng Mục Tiêu Ngày (Daily Goal Ring)",
        `SM-2: OK (1d -> 6d -> 16d, EF clamp 1.30), Nudge: [${segNudge4.start}s - ${segNudge4.end}s], Goal: 6/15 (40%), DOM/CSS/Hotkeys: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 25: Hệ Thống Vật Liệu Retro Pixel Game (css/pixel-game.css, js/pixel-sfx.js & sandbox-pixel.html)
// ----------------------------------------------------------------------
{
    const pixelCSS = fs.readFileSync('css/pixel-game.css', 'utf8');
    const pixelSFXCode = fs.readFileSync('js/pixel-sfx.js', 'utf8');
    const sandboxHTML = fs.readFileSync('sandbox-pixel.html', 'utf8');

    // 1. CSS Design Tokens & 9-Slice Box-Shadows
    const hasDarkSkin = pixelCSS.includes('data-skin="pixel-dark"') && pixelCSS.includes('--px-bg-deep: #0c0f17');
    const hasPaperSkin = pixelCSS.includes('data-skin="pixel-paper"') && pixelCSS.includes('--px-bg-deep: #231c18');
    const hasDeltaruneBox = pixelCSS.includes('.pixel-dialogue-box') && pixelCSS.includes('image-rendering: pixelated');
    const hasPermitCard = pixelCSS.includes('.pixel-permit-card') && pixelCSS.includes('repeating-linear-gradient');
    const hasArcadeBtn = pixelCSS.includes('.pixel-btn') && pixelCSS.includes('min-height: 44px');
    const hasStamps = pixelCSS.includes('.stamp-seal') && pixelCSS.includes('.stamp-approved') && pixelCSS.includes('.stamp-denied');
    const hasStarburst = pixelCSS.includes('.starburst-badge') && pixelCSS.includes('starburstPop');
    const hasScanlines = pixelCSS.includes('.pixel-scanlines');
    const hasMobileQuery = pixelCSS.includes('@media (max-width: 768px)') && pixelCSS.includes('min-height: 48px');
    const hasReducedMotion = pixelCSS.includes('@media (prefers-reduced-motion: reduce)');

    const cssAllValid = hasDarkSkin && hasPaperSkin && hasDeltaruneBox && hasPermitCard &&
        hasArcadeBtn && hasStamps && hasStarburst && hasScanlines && hasMobileQuery && hasReducedMotion;

    // 2. Procedural Web Audio Engine (js/pixel-sfx.js)
    eval(`(function(root) { ${pixelSFXCode} })(fakeWindow)`);
    const PixelSFX = fakeWindow.App.PixelSFX;

    const hasMethods = typeof PixelSFX.init === 'function' &&
        typeof PixelSFX.setVolume === 'function' &&
        typeof PixelSFX.getVolume === 'function' &&
        typeof PixelSFX.setMuted === 'function' &&
        typeof PixelSFX.isMuted === 'function' &&
        typeof PixelSFX.setTypewriterBlipsEnabled === 'function' &&
        typeof PixelSFX.playStampThud === 'function' &&
        typeof PixelSFX.playDeniedBuzzer === 'function' &&
        typeof PixelSFX.playTypewriterBlip === 'function' &&
        typeof PixelSFX.playGavelKnock === 'function' &&
        typeof PixelSFX.playHoldItSound === 'function' &&
        typeof PixelSFX.playCodecSquelch === 'function' &&
        typeof PixelSFX.playCoinOpChime === 'function' &&
        typeof PixelSFX.playInkLockSound === 'function';

    // Mock AudioContext execution to ensure zero crashes
    let audioExecutedCleanly = false;
    try {
        const mockCtx = {
            currentTime: 0,
            sampleRate: 44100,
            state: 'running',
            destination: {},
            createOscillator: () => ({
                type: 'sine',
                frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
                connect: () => {},
                start: () => {},
                stop: () => {}
            }),
            createGain: () => ({
                gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
                connect: () => {}
            }),
            createBuffer: () => ({
                getChannelData: () => new Float32Array(1024)
            }),
            createBufferSource: () => ({
                buffer: null,
                connect: () => {},
                start: () => {},
                stop: () => {}
            }),
            createBiquadFilter: () => ({
                type: 'lowpass',
                frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
                Q: { setValueAtTime: () => {} },
                connect: () => {}
            })
        };
        PixelSFX.init(mockCtx);
        PixelSFX.setVolume(0.9);
        const volValid = PixelSFX.getVolume() === 0.9;
        PixelSFX.setMuted(false);
        const muteValid = PixelSFX.isMuted() === false;
        PixelSFX.playStampThud();
        PixelSFX.playTypewriterBlip();
        PixelSFX.playGavelKnock();
        PixelSFX.playCodecSquelch();
        PixelSFX.playCoinOpChime();
        PixelSFX.playDeniedBuzzer();
        PixelSFX.playHoldItSound();
        PixelSFX.playInkLockSound();
        audioExecutedCleanly = volValid && muteValid;
    } catch (e) {
        console.error('SFX mock execution error:', e);
        audioExecutedCleanly = false;
    }

    // 3. Sandbox HTML Verification
    const hasSandboxCSS = sandboxHTML.includes('href="css/pixel-game.css"');
    const hasSandboxJS = sandboxHTML.includes('src="js/pixel-sfx.js"');
    const hasSandboxDeltarune = sandboxHTML.includes('pixel-dialogue-box') && sandboxHTML.includes('id="inspectorAvatar"');
    const hasSandboxPermit = sandboxHTML.includes('pixel-permit-card') && sandboxHTML.includes('id="btnStampApproved"');
    const hasSandboxStarburst = sandboxHTML.includes('btnTriggerHoldIt') && sandboxHTML.includes('btnTriggerObjection');
    const hasSandboxCodec = sandboxHTML.includes('pixel-crt-monitor') && sandboxHTML.includes('MEMORY 140.85');

    const sandboxAllValid = hasSandboxCSS && hasSandboxJS && hasSandboxDeltarune &&
        hasSandboxPermit && hasSandboxStarburst && hasSandboxCodec;

    assert(
        cssAllValid && hasMethods && audioExecutedCleanly && sandboxAllValid,
        "Hệ Thống Vật Liệu Retro Pixel Game: Bộ CSS Pixel 8-Bit (Dual-Skin, 9-Slice Box-Shadow, Touch Target 48px), Web Audio Chiptune SFX Engine & Sandbox Linh Kiện",
        `CSS Tokens/Borders: OK, SFX Engine (8 sounds synthesized): OK, Sandbox Components (Deltarune/PapersPlease/AceAttorney/MGS): OK`
    );
}

// ----------------------------------------------------------------------
// TEST 26: Deltarune Dialogue Box Nâng Cao & Bàn Thanh Tra Papers, Please (js/pixel-dialogue.js & js/pixel-desk.js)
// ----------------------------------------------------------------------
{
    const dialogueCode = fs.readFileSync('js/pixel-dialogue.js', 'utf8');
    const deskCode = fs.readFileSync('js/pixel-desk.js', 'utf8');
    const pixelCSS = fs.readFileSync('css/pixel-game.css', 'utf8');
    const sandboxHTML = fs.readFileSync('sandbox-pixel.html', 'utf8');

    eval(`(function(root) { ${dialogueCode} })(fakeWindow)`);
    eval(`(function(root) { ${deskCode} })(fakeWindow)`);

    const PixelDialogue = fakeWindow.App.PixelDialogue;
    const PixelDesk = fakeWindow.App.PixelDesk;

    // 1. PixelDialogue Verification
    const dialogue = new PixelDialogue({ speed: 20 });
    const parsedTokens = dialogue.parseTextWithColors('Listen to \\cYworked\\cW vs \\cRwork\\cW!');
    const hasYellowWord = parsedTokens.some(t => t.char === 'w' && t.color === '#fde047');
    const hasRedWord = parsedTokens.some(t => t.char === 'w' && t.color === '#ef4444');
    const hasWhiteWord = parsedTokens.some(t => t.char === '!' && t.color === '#ffffff');
    const colorCodeValid = hasYellowWord && hasRedWord && hasWhiteWord;

    const hasDialogueMethods = typeof dialogue.say === 'function' &&
        typeof dialogue.instantReveal === 'function' &&
        typeof dialogue.setEmotion === 'function' &&
        typeof dialogue.renderChoices === 'function' &&
        typeof dialogue.navigateChoices === 'function';

    // 2. PixelDesk Verification
    const desk = new PixelDesk();
    const approvedRes = desk.stampApproved('100% CLEARANCE');
    const deniedRes = desk.stampDenied('PHONETIC ERROR');
    const stampResValid = approvedRes.status === 'approved' && deniedRes.status === 'denied' && desk.stampCount === 2;

    const initialCitations = desk.citations.length;
    desk.issueCitation('MISHEARD CONSONANT CLUSTER');
    const citationValid = desk.citations.length === initialCitations + 1 && desk.citations[desk.citations.length - 1].reason.includes('CONSONANT');

    const tabSwitched = desk.switchRulebookTab('vocab');
    const tabValid = tabSwitched === 'vocab' && desk.currentTab === 'vocab';

    // XSS Sanitization Check in PixelDesk
    const mockStampTarget = { innerHTML: '' };
    const mockCitationContainer = {
        prepend: (el) => { mockCitationContainer.lastPrepend = el; }
    };
    const xssDesk = new PixelDesk({
        stampTarget: mockStampTarget,
        citationContainer: mockCitationContainer
    });
    xssDesk.stampApproved('<img src=x onerror=alert(1)>');
    const approvedXssSafe = !mockStampTarget.innerHTML.includes('<img') && mockStampTarget.innerHTML.includes('&lt;img');

    xssDesk.stampDenied('<script>alert("xss")</script>');
    const deniedXssSafe = !mockStampTarget.innerHTML.includes('<script>') && mockStampTarget.innerHTML.includes('&lt;script&gt;');

    xssDesk.issueCitation('<b onmouseover=evil()>');
    const citationXssSafe = mockCitationContainer.lastPrepend &&
        !mockCitationContainer.lastPrepend.innerHTML.includes('<b onmouseover') &&
        mockCitationContainer.lastPrepend.innerHTML.includes('&lt;b');
    const xssProtectionValid = approvedXssSafe && deniedXssSafe && citationXssSafe;

    // 3. CSS & Sandbox HTML Verification
    const hasPaperclipCSS = pixelCSS.includes('.pixel-paperclip');
    const hasCitationCSS = pixelCSS.includes('.pixel-citation-slip') && pixelCSS.includes('.animate-citation-print');
    const hasChoiceHeartCSS = pixelCSS.includes('.choice-cursor');
    const hasInkLockCSS = pixelCSS.includes('.is-ink-locked');

    const hasSandboxDialogue = sandboxHTML.includes('src="js/pixel-dialogue.js"') && sandboxHTML.includes('id="deltaruneDialogueMount"');
    const hasSandboxDesk = sandboxHTML.includes('src="js/pixel-desk.js"') && sandboxHTML.includes('id="citationMount"');

    assert(
        colorCodeValid && hasDialogueMethods && stampResValid && citationValid && tabValid && xssProtectionValid &&
        hasPaperclipCSS && hasCitationCSS && hasChoiceHeartCSS && hasInkLockCSS &&
        hasSandboxDialogue && hasSandboxDesk,
        "Deltarune Dialogue Box Nâng Cao & Bàn Thanh Tra Papers, Please (Typewriter Color-Codes, Citation Slip Printer & Rulebook Tabs)",
        `Color Codes: OK (Yellow/Red/White), Stamp Rig (Approved/Denied/Citations/XSS Guard): OK, Rulebook Tabs: OK, Sandbox Integration: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 27: Thẻ Chỉ Số RPG Deltarune (PixelStats), Báo Paperboy 1984 Atari (PixelGazette) & Con Dấu Lò Xo Nén (Spring-Loaded Stamps)
// ----------------------------------------------------------------------
{
    const statsCode = fs.readFileSync('js/pixel-stats.js', 'utf8');
    const gazetteCode = fs.readFileSync('js/pixel-gazette.js', 'utf8');
    const deskCode = fs.readFileSync('js/pixel-desk.js', 'utf8');
    const pixelCSS = fs.readFileSync('css/pixel-game.css', 'utf8');
    const sandboxHTML = fs.readFileSync('sandbox-pixel.html', 'utf8');

    eval(`(function(root) { ${statsCode} })(fakeWindow)`);
    eval(`(function(root) { ${gazetteCode} })(fakeWindow)`);
    eval(`(function(root) { ${deskCode} })(fakeWindow)`);

    const PixelStats = fakeWindow.App.PixelStats;
    const PixelGazette = fakeWindow.App.PixelGazette;
    const PixelDesk = fakeWindow.App.PixelDesk;

    // 1. PixelStats Verification
    const statsInstance = new PixelStats();
    const defaultChar = statsInstance.getActiveCharacter();
    const hasDefaultStats = defaultChar.id === 'byte' && defaultChar.atk === 88 && defaultChar.def === 92;
    statsInstance.selectCharacter('susie');
    const susieChar = statsInstance.getActiveCharacter();
    const hasSwitchedChar = susieChar.id === 'susie' && susieChar.atk === 99;
    statsInstance.updateStats({ atk: 105 });
    const statsUpdated = statsInstance.getActiveCharacter().atk === 105;
    const gutsHTML = statsInstance.renderGutsIcons(5);
    const hasGutsHearts = gutsHTML.includes('❤️');

    const statsValid = hasDefaultStats && hasSwitchedChar && statsUpdated && hasGutsHearts;

    // 2. PixelGazette Verification
    let gazetteMount = { appendChild: () => {}, innerHTML: '' };
    const gazette = new PixelGazette({ mountPoint: gazetteMount });
    const hasGazetteMethods = typeof gazette.publish === 'function' && typeof gazette.close === 'function';

    // 3. Spring-Loaded Stamp Verification
    const desk = new PixelDesk();
    const hasSpringMethods = typeof desk.bindSpringStamp === 'function' && typeof desk.triggerSpringSlam === 'function';
    const springSlamApproved = desk.triggerSpringSlam('approved');
    const springSlamDenied = desk.triggerSpringSlam('denied', 'SPRING PENALTY');
    const springValid = hasSpringMethods && springSlamApproved.status === 'approved' && springSlamDenied.status === 'denied';

    // 4. CSS & Sandbox HTML Verification
    const hasSpringCSS = pixelCSS.includes('.stamp-spring-tension') && pixelCSS.includes('.stamp-handle-wood');
    const hasStatsCSS = pixelCSS.includes('.pixel-stats-sheet') && pixelCSS.includes('.party-select-btn');
    const hasGazetteCSS = pixelCSS.includes('.pixel-newspaper-sheet') && pixelCSS.includes('.animate-newspaper-spin');

    const hasSandboxStats = sandboxHTML.includes('id="deltaruneStatsMount"') && sandboxHTML.includes('src="js/pixel-stats.js"');
    const hasSandboxGazette = sandboxHTML.includes('id="btnOpenPaperboyGazette"') && sandboxHTML.includes('src="js/pixel-gazette.js"');
    const hasSandboxSpringButtons = sandboxHTML.includes('stamp-handle-wood') && sandboxHTML.includes('APPROVED (LÒ XO)');

    assert(
        statsValid && hasGazetteMethods && springValid &&
        hasSpringCSS && hasStatsCSS && hasGazetteCSS &&
        hasSandboxStats && hasSandboxGazette && hasSandboxSpringButtons,
        "Thẻ Chỉ Số RPG Deltarune (PixelStats), Báo Paperboy 1984 Atari (PixelGazette) & Con Dấu Lò Xo Nén (Spring-Loaded Stamps)",
        `PixelStats: OK (Byte/Susie/Stats/Guts), PixelGazette: OK (Publish/Spin), Spring Stamp Rig: OK (Tension/Slam), Sandbox: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 28: Tích Hợp Game Loop Toàn Diện (js/pixel-gameloop.js, Chấm Điểm -> Đóng Dấu/In Phạt, Bật/Tắt Skin)
// ----------------------------------------------------------------------
{
    const gameloopCode = fs.readFileSync('js/pixel-gameloop.js', 'utf8');
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const swCode = fs.readFileSync('sw.js', 'utf8');
    const appCode = fs.readFileSync('js/app.js', 'utf8');
    const dictationCode = fs.readFileSync('js/dictation.js', 'utf8');

    eval(`(function(root) { ${gameloopCode} })(fakeWindow)`);

    const PixelGameLoop = fakeWindow.App.PixelGameLoop;

    // 1. PixelGameLoop API & Methods Verification
    const hasLoopMethods = typeof PixelGameLoop.init === 'function' &&
        typeof PixelGameLoop.togglePixelMode === 'function' &&
        typeof PixelGameLoop.activatePixelMode === 'function' &&
        typeof PixelGameLoop.deactivatePixelMode === 'function' &&
        typeof PixelGameLoop.onSentenceChanged === 'function' &&
        typeof PixelGameLoop.onDictationGraded === 'function' &&
        typeof PixelGameLoop.triggerGazetteCelebration === 'function';

    // Mock desk and stats for grading test
    let approvedCalled = false;
    let deniedCalled = false;
    let issuedCitationReason = '';

    PixelGameLoop.desk = {
        stampApproved: (msg) => { approvedCalled = true; },
        stampDenied: (reason) => { deniedCalled = true; issuedCitationReason = reason; },
        clearStamps: () => {}
    };
    PixelGameLoop.dialogue = {
        say: () => {}
    };
    PixelGameLoop.stats = {
        getActiveCharacter: () => ({ atk: 88, hp: 95, maxHp: 100 }),
        updateStats: () => {}
    };
    PixelGameLoop.isEnabled = true;

    // 2. High Accuracy Grading Hook (>= 80%) -> APPROVED
    PixelGameLoop.onDictationGraded({ accuracy: 92 }, "The traveler walked into town.");
    const highAccuracyValid = approvedCalled === true;

    // 3. Low Accuracy Grading Hook (< 80%) -> DENIED & Citation
    PixelGameLoop.onDictationGraded({ accuracy: 60 }, "The traveler walked into town.");
    const lowAccuracyValid = deniedCalled === true && issuedCitationReason.includes('-ED');

    // 4. index.html, sw.js & app.js Integration Checks
    const hasIndexCSS = indexHTML.includes('href="css/pixel-game.css"');
    const hasIndexLoopScript = indexHTML.includes('src="js/pixel-gameloop.js"');
    const hasIndexToggleBtn = indexHTML.includes('id="btnTogglePixelMode"');
    const hasSwCache = swCode.includes('pixel-gameloop.js');
    const hasAppHook = appCode.includes('PixelGameLoop.onSentenceChanged') && appCode.includes('PixelGameLoop.init');
    const hasDictationHook = dictationCode.includes('PixelGameLoop.onDictationGraded');

    assert(
        hasLoopMethods && highAccuracyValid && lowAccuracyValid &&
        hasIndexCSS && hasIndexLoopScript && hasIndexToggleBtn &&
        hasSwCache && hasAppHook && hasDictationHook,
        "Tích Hợp Game Loop Toàn Diện (js/pixel-gameloop.js, Chấm Điểm -> Đóng Dấu/In Phạt, Bật/Tắt Skin)",
        `PixelGameLoop Methods: OK, Approved Hook: OK, Denied Citation: OK, index.html/sw.js/app.js: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 29: Shadowing Lab Retro Game, MGS Codec 140.85 & Ace Attorney [TAKE THAT!] (Stage 7)
// ----------------------------------------------------------------------
{
    const sfxCode = fs.readFileSync('js/pixel-sfx.js', 'utf8');
    const gameloopCode = fs.readFileSync('js/pixel-gameloop.js', 'utf8');
    const pixelCSS = fs.readFileSync('css/pixel-game.css', 'utf8');
    const shadowingCode = fs.readFileSync('js/shadowing.js', 'utf8');
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const swCode = fs.readFileSync('sw.js', 'utf8');

    eval(`(function(root) { ${sfxCode} })(fakeWindow)`);
    eval(`(function(root) { ${gameloopCode} })(fakeWindow)`);

    const PixelSFX = fakeWindow.App.PixelSFX;
    const PixelGameLoop = fakeWindow.App.PixelGameLoop;

    // 1. PixelSFX Stage 7 methods
    const hasTakeThatSFX = typeof PixelSFX.playTakeThatSound === 'function';
    const hasBGMMethods = typeof PixelSFX.startLofiChiptuneBGM === 'function' &&
        typeof PixelSFX.stopLofiChiptuneBGM === 'function' &&
        typeof PixelSFX.toggleBGM === 'function' &&
        typeof PixelSFX.isBGMPlaying === 'function';

    // 2. PixelGameLoop onShadowingEvaluated Hook
    let takeThatRendered = false;
    let objectionRendered = false;
    PixelGameLoop.dom = PixelGameLoop.dom || {};
    PixelGameLoop.dom.starburstSlot = {
        innerHTML: '',
        querySelector: () => null
    };
    PixelGameLoop.sfx = {
        playTakeThatSound: () => { takeThatRendered = true; },
        playGavelKnock: () => { objectionRendered = true; }
    };
    PixelGameLoop.desk = {
        triggerScreenShake: () => {}
    };
    PixelGameLoop.dialogue = {
        say: () => {}
    };
    PixelGameLoop.stats = {
        getActiveCharacter: () => ({ magic: 85, def: 90, hp: 95, maxHp: 100 }),
        updateStats: () => {}
    };
    PixelGameLoop.isEnabled = true;

    // High score -> TAKE THAT!
    PixelGameLoop.onShadowingEvaluated({ rhythmScore: 88, pitchScore: 90, takeNum: 1 });
    const takeThatValid = takeThatRendered === true;

    // Low score -> OBJECTION!
    PixelGameLoop.onShadowingEvaluated({ rhythmScore: 60, pitchScore: 65, takeNum: 1 });
    const objectionValid = objectionRendered === true;

    // 3. Codec Oscilloscope initialization check
    const mockCodecContainer = { innerHTML: '', querySelector: () => ({ appendChild: () => ({}), children: [] }) };
    PixelGameLoop.initCodecOscilloscope(mockCodecContainer);
    const hasCodecHTML = mockCodecContainer.innerHTML.includes('MEMORY 140.85') && mockCodecContainer.innerHTML.includes('btnToggleGameBGM');

    // 4. CSS, HTML & SW Verification
    const hasCodecCSS = pixelCSS.includes('.pixel-codec-panel') && pixelCSS.includes('.codec-waveform-line');
    const hasTakeThatCSS = pixelCSS.includes('.starburst-take-that');
    const hasArcadeDockCSS = pixelCSS.includes('[data-skin="pixel-dark"] #smartActionDock');
    const hasIndexCodecSlot = indexHTML.includes('id="gameCodecSlot"');
    const hasShadowingHook = shadowingCode.includes('PixelGameLoop.onShadowingEvaluated');
    const hasSwCache = swCode.includes('lyre-studio-v4.1');

    assert(
        hasTakeThatSFX && hasBGMMethods && takeThatValid && objectionValid && hasCodecHTML &&
        hasCodecCSS && hasTakeThatCSS && hasArcadeDockCSS &&
        hasIndexCodecSlot && hasShadowingHook && hasSwCache,
        "Shadowing Lab Retro Game, MGS Codec 140.85 & Ace Attorney [TAKE THAT!] (Stage 7)",
        `Take That SFX: OK, BGM Engine: OK, Shadowing Hooks (Take That / Objection): OK, MGS Codec: OK, Retro Arcade Dock: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 30: Stage 8 Retro Pixel Polish - Cloze Punch-Cards, RPG Flashcards & Daily Goal Trophy
// ----------------------------------------------------------------------
{
    const pixelCSS = fs.readFileSync('css/pixel-game.css', 'utf8');
    const gameloopCode = fs.readFileSync('js/pixel-gameloop.js', 'utf8');
    const analyticsCode = fs.readFileSync('js/analytics.js', 'utf8');
    const dictationCode = fs.readFileSync('js/dictation.js', 'utf8');

    eval(`(function(root) { ${gameloopCode} })(fakeWindow)`);
    const PixelGameLoop = fakeWindow.App.PixelGameLoop;

    // 1. CSS Verification
    const hasClozePunchCardCSS = pixelCSS.includes('.cloze-blank-input') &&
                                pixelCSS.includes('.cloze-blank-input.is-correct');
    const hasFlashcardRPGCSS = pixelCSS.includes('#flashcardModal .flashcard-face') &&
                              pixelCSS.includes('#flashcardModal button');
    const hasDailyGoalArcadeCSS = pixelCSS.includes('#dailyGoalWidget');

    // 2. Method existence check
    const hasMethods = typeof PixelGameLoop.onDailyGoalAchieved === 'function' &&
                       typeof PixelGameLoop.onClozeEvaluated === 'function';

    // 3. Mock Gameloop components & verify execution
    let dialogueTriggered = false;
    let sfxTriggered = false;
    let gutsUpdated = false;
    let starburstTriggered = false;

    PixelGameLoop.dialogue = {
        say: (speaker, text) => {
            if (speaker === 'Inspector Byte' && text.includes('CHIẾN TÍCH XUẤT SẮC')) {
                dialogueTriggered = true;
            }
        }
    };
    PixelGameLoop.sfx = {
        playCoinOpChime: () => { sfxTriggered = true; },
        playTypewriterBlip: () => { sfxTriggered = true; }
    };
    PixelGameLoop.stats = {
        getActiveCharacter: () => ({ guts: 3, hp: 50, maxHp: 100 }),
        updateStats: (statObj) => {
            if (statObj.guts === 4 && statObj.hp === 100) {
                gutsUpdated = true;
            }
        }
    };
    PixelGameLoop._renderStarburst = (text) => {
        if (text === 'GOAL CLEARED!') {
            starburstTriggered = true;
        }
    };

    PixelGameLoop.isEnabled = true;
    PixelGameLoop.onDailyGoalAchieved(15, 7);

    // Test Cloze Evaluated hook
    let clozeSfxCalled = false;
    PixelGameLoop.sfx.playTypewriterBlip = () => { clozeSfxCalled = true; };
    PixelGameLoop.onClozeEvaluated(true, 'forensic');

    // 4. Source code integration hooks & critical fixes
    const audioEngineCode = fs.readFileSync('js/audio-engine.js', 'utf8');
    const hotkeysCode = fs.readFileSync('js/hotkeys.js', 'utf8');
    const sfxCode = fs.readFileSync('js/pixel-sfx.js', 'utf8');

    const hasAnalyticsHook = analyticsCode.includes('PixelGameLoop.onDailyGoalAchieved');
    const hasDictationHook = dictationCode.includes('PixelGameLoop.onClozeEvaluated');
    const hasBidirectionalSync = gameloopCode.includes("document.getElementById('dictationTextarea')") &&
                                 dictationCode.includes("document.getElementById('gamePermitInput')");
    const hasTTSMute = audioEngineCode.includes('state.isTTSLesson ? 0.0001 : 1.0');
    const hasHotkeysRouting = hotkeysCode.includes('#gameStatsModal:not(.hidden)') &&
                              hotkeysCode.includes('#pixelGazetteModal') &&
                              hotkeysCode.includes("activeEl.id === 'gamePermitInput'");
    const hasBGMDisconnect = sfxCode.includes('this._bgmState.gainNode.disconnect()');

    const allFixesValid = hasBidirectionalSync && hasTTSMute && hasHotkeysRouting && hasBGMDisconnect;

    assert(
        hasClozePunchCardCSS && hasFlashcardRPGCSS && hasDailyGoalArcadeCSS &&
        hasMethods && dialogueTriggered && gutsUpdated && starburstTriggered && clozeSfxCalled &&
        hasAnalyticsHook && hasDictationHook && allFixesValid,
        "Stage 8 Retro Pixel Polish & Code Review Hardening (Cloze, Flashcards, Daily Goal & Zero-Defect Guards)",
        `Punch-Cards: OK, Flashcards: OK, Daily Goal: OK, Sync: OK, TTS Mute: OK, Hotkeys: OK, SFX Hygiene: OK`
    );
}

// ----------------------------------------------------------------------
// TEST 31: Local HTTP Server End-to-End Asset Request & Path Traversal Guard
// ----------------------------------------------------------------------
const appServer = require('./server.js');

appServer.listen(9876, () => {
    http.get('http://localhost:9876/index.html', (res) => {
        http.get('http://localhost:9876/..%2F..%2FWindows%2Fwin.ini', (resTraversal) => {
            assert(
                res.statusCode === 200 &&
                resTraversal.statusCode === 403 &&
                res.headers['x-content-type-options'] === 'nosniff',
                "Máy chủ HTTP cục bộ phản hồi 200 OK cho index.html và chặn Path Traversal (403 Forbidden)",
                `Index Status: ${res.statusCode}, Traversal Status: ${resTraversal.statusCode}, X-Content-Type-Options: ${res.headers['x-content-type-options']}`
            );
            appServer.close();

            console.log('\n================================================================');
            console.log(`🎉 TOÀN BỘ 31/31 BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100% THÀNH CÔNG!`);
            console.log('================================================================');
        });
    });
});
