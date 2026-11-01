/**
 * ============================================================================
 * LYRE STUDIO — MINIMALIST ICON GENERATOR
 * ============================================================================
 * Generates pristine, minimalist PWA app icons (icon-192.png & icon-512.png)
 * using mathematical Signed Distance Fields (SDF) and 4x Super-Sampled (SSAA)
 * sub-pixel anti-aliasing via pure Node.js (zlib + Buffer).
 * 
 * Motif: The Minimalist Acoustic Lyre
 * - Deep Obsidian Void Squircle (#08090D -> #141824)
 * - Warm Golden Amber Lyre Frame (#D97706 -> #F59E0B -> #FBBF24)
 * - Triple Acoustic Voice Waveform Bars (Dictation, Pitch & Shadowing Echo)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePNG(width, height, pixelFn) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcVal = zlib.crc32(typeAndData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);

    return Buffer.concat([lenBuf, typeAndData, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function sdRoundedBox(px, py, bx, by, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

function sdSegment(px, py, ax, ay, bx, by, r) {
  const pax = px - ax, pay = py - ay;
  const bax = bx - ax, bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}

function sampleMinimalistLyre(px, py, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 512;

  const nx = (px - cx) / scale;
  const ny = (py - cy) / scale;

  // 1. Squircle Bounding Box (460x460, corner radius 108)
  const dBox = sdRoundedBox(nx, ny, 230, 230, 108);
  if (dBox > 1.0) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Smooth background gradient (Midnight Obsidian)
  const tBg = (nx + ny + 400) / 800;
  let bgR = Math.round(20 * (1 - tBg) + 8 * tBg);
  let bgG = Math.round(24 * (1 - tBg) + 10 * tBg);
  let bgB = Math.round(36 * (1 - tBg) + 14 * tBg);

  // Squircle border
  if (dBox > -2.5) {
    return [34, 43, 61, 255];
  }

  // 2. Minimalist Lyre U-Frame:
  // Arm radius 24, center X = 105, arc center Y = 30
  let dFrame = 999;
  const armR = 24;
  const armX = 105;
  const armTop = -100;
  const arcY = 30;

  if (ny <= arcY) {
    const dLeft = sdSegment(nx, ny, -armX, armTop, -armX, arcY, armR);
    const dRight = sdSegment(nx, ny, armX, armTop, armX, arcY, armR);
    dFrame = Math.min(dLeft, dRight);
  } else {
    const distToCenter = Math.hypot(nx, ny - arcY);
    dFrame = Math.abs(distToCenter - armX) - armR;
  }

  // 3. Triple Voice Equalizer Strings (Dictation & Shadowing resonance):
  // Center bar: Tallest (0, -95) to (0, 60), radius 12
  const dStrCenter = sdSegment(nx, ny, 0, -95, 0, 60, 12);
  // Left bar: Harmonic resonance (-52, -45) to (-52, 45), radius 10
  const dStrLeft = sdSegment(nx, ny, -52, -45, -52, 45, 10);
  // Right bar: Shadowing echo (52, -45) to (52, 45), radius 10
  const dStrRight = sdSegment(nx, ny, 52, -45, 52, 45, 10);

  const dStrings = Math.min(dStrCenter, dStrLeft, dStrRight);

  // 4. Acoustic Base Foot:
  const dBase = sdSegment(nx, ny, -24, 166, 24, 166, 8);

  const dEmblem = Math.min(dFrame, dStrings, dBase);

  // Color calculation with smooth Anti-Aliasing
  if (dEmblem <= 0) {
    // Gradient from golden amber (#FBBF24) to deep amber (#D97706)
    const tGold = Math.max(0, Math.min(1, (ny + 100) / 266));
    const rG = Math.round(251 * (1 - tGold) + 217 * tGold);
    const gG = Math.round(191 * (1 - tGold) + 119 * tGold);
    const bG = Math.round(36 * (1 - tGold) + 6 * tGold);

    // Center bar subtle luminous glow
    if (dStrCenter <= 0) {
      return [254, 240, 138, 255]; // Warm yellow-gold
    }
    return [rG, gG, bG, 255];
  } else if (dEmblem < 1.5) {
    // Anti-aliased boundary edge ramp
    const alpha = (1.5 - dEmblem) / 1.5;
    const rG = 245, gG = 158, bG = 11;
    return [
      Math.round(rG * alpha + bgR * (1 - alpha)),
      Math.round(gG * alpha + bgG * (1 - alpha)),
      Math.round(bG * alpha + bgB * (1 - alpha)),
      255
    ];
  }

  // Subtle ambient acoustic glow around emblem
  if (dEmblem < 32) {
    const glow = (32 - dEmblem) / 32 * 0.10;
    bgR = Math.round(bgR * (1 - glow) + 245 * glow);
    bgG = Math.round(bgG * (1 - glow) + 158 * glow);
    bgB = Math.round(bgB * (1 - glow) + 11 * glow);
  }

  return [bgR, bgG, bgB, 255];
}

function renderMinimalistIcon(x, y, w, h) {
  // 4x Subsampling for pristine anti-aliasing
  const subOffsets = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75]
  ];
  let r = 0, g = 0, b = 0, a = 0;
  for (let i = 0; i < 4; i++) {
    const s = sampleMinimalistLyre(x + subOffsets[i][0], y + subOffsets[i][1], w, h);
    r += s[0]; g += s[1]; b += s[2]; a += s[3];
  }
  return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4), Math.round(a / 4)];
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating Minimalist Lyre PWA icons...');
const png192 = makePNG(192, 192, renderMinimalistIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
console.log('Created icons/icon-192.png (' + png192.length + ' bytes)');

const png512 = makePNG(512, 512, renderMinimalistIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
console.log('Created icons/icon-512.png (' + png512.length + ' bytes)');
