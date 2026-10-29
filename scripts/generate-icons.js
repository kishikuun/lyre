const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePNG(width, height, pixelFn) {
  // Each row has 1 filter byte (0) + width * 4 bytes (RGBA)
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

function renderStudioIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.46;

  // Background rounded rect check
  const cornerR = w * 0.22;
  const inBoxX = Math.abs(dx) <= cx - cornerR;
  const inBoxY = Math.abs(dy) <= cy - cornerR;
  const cornerDist = Math.hypot(
    Math.max(0, Math.abs(dx) - (cx - cornerR)),
    Math.max(0, Math.abs(dy) - (cy - cornerR))
  );

  if (cornerDist > cornerR) {
    return [0, 0, 0, 0]; // Transparent outside icon bounding squircle
  }

  // Base background: Obsidian Dark Void (#08090C)
  let r = 8, g = 9, b = 12, a = 255;

  // Outer border glow
  if (cornerDist > cornerR - 3) {
    return [217, 119, 6, 180]; // Amber edge glow
  }

  // Tape reel / Vinyl grooved platter
  if (dist <= radius) {
    // Platter background (#12151D)
    r = 18; g = 21; b = 29;

    // Outer rim of tape reel (#D97706)
    if (dist > radius - w * 0.04) {
      r = 217; g = 119; b = 6;
    }
    // Subtle acoustic concentric grooves
    else if (dist > w * 0.22) {
      const groove = Math.sin(dist * 0.35);
      if (groove > 0.6) {
        r = 28; g = 33; b = 44;
      }
    }

    // 3 Cassette tape reel spokes / cutouts
    const angle = Math.atan2(dy, dx);
    const spokeDistMin = w * 0.22;
    const spokeDistMax = w * 0.38;
    if (dist >= spokeDistMin && dist <= spokeDistMax) {
      // 3 holes at 0, 120, 240 degrees (2pi/3)
      const normAngle = ((angle % ((2 * Math.PI) / 3)) + (2 * Math.PI) / 3) % ((2 * Math.PI) / 3);
      const angleDiff = Math.abs(normAngle - Math.PI / 3);
      if (angleDiff < 0.28) {
        // Cutout hole showing deep void (#08090C) with amber rim
        if (angleDiff > 0.25 || dist < spokeDistMin + 3 || dist > spokeDistMax - 3) {
          r = 217; g = 119; b = 6; // Amber rim
        } else {
          r = 8; g = 9; b = 12;
        }
      }
    }

    // Center metallic hub ring
    if (dist <= w * 0.18 && dist > w * 0.14) {
      r = 217; g = 119; b = 6; // Amber metal ring
    } else if (dist <= w * 0.14 && dist > w * 0.05) {
      // Inner spindle hub (#1C222E)
      r = 28; g = 34; b = 46;
    } else if (dist <= w * 0.05) {
      // Center spindle point (#00E5FF cyan indicator)
      r = 0; g = 229; b = 255;
    }
  }

  return [r, g, b, a];
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');
const png192 = makePNG(192, 192, renderStudioIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
console.log('Created icons/icon-192.png (' + png192.length + ' bytes)');

const png512 = makePNG(512, 512, renderStudioIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
console.log('Created icons/icon-512.png (' + png512.length + ' bytes)');

