import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePng(width, height, isMaskable = false) {
  // Generate RGBA pixels
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const rCircle = width * (isMaskable ? 0.32 : 0.38);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter byte: 0 (None)
    for (let x = 0; x < width; x++) {
      const pOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background color: #0F172A
      let r = 15, g = 23, b = 42, a = 255;

      // Outer rounded mask or circle
      if (dist < rCircle) {
        // Violet gradient: #8B5CF6 to #6366F1
        const t = (x + y) / (width + height);
        r = Math.round(139 * (1 - t) + 99 * t);
        g = Math.round(92 * (1 - t) + 102 * t);
        b = Math.round(246 * (1 - t) + 241 * t);

        // Inner play triangle:
        // Triangle roughly inside (cx - 0.1w, cy - 0.15h) to (cx + 0.15w, cy) to (cx - 0.1w, cy + 0.15h)
        const triX0 = cx - width * 0.08;
        const triX1 = cx + width * 0.15;
        const triY0 = cy - height * 0.14;
        const triY1 = cy + height * 0.14;

        if (x >= triX0 && x <= triX1) {
          const ratio = (x - triX0) / (triX1 - triX0);
          const topBound = cy - (1 - ratio) * (cy - triY0);
          const botBound = cy + (1 - ratio) * (triY1 - cy);
          if (y >= topBound && y <= botBound) {
            // Amber color: #F59E0B
            r = 245;
            g = 158;
            b = 11;
          }
        }
      }

      raw[pOffset] = r;
      raw[pOffset + 1] = g;
      raw[pOffset + 2] = b;
      raw[pOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(raw);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

fs.writeFileSync('./public/pwa-192x192.png', generatePng(192, 192, false));
fs.writeFileSync('./public/pwa-512x512.png', generatePng(512, 512, false));
fs.writeFileSync('./public/pwa-maskable-512x512.png', generatePng(512, 512, true));
fs.writeFileSync('./public/apple-touch-icon.png', generatePng(180, 180, false));
fs.writeFileSync('./public/favicon.ico', generatePng(64, 64, false));

console.log('PNG Icons successfully generated in public/ directory.');
