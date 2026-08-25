/**
 * Generates PWA icons as PNGs (no image deps): indigo rounded square with a
 * white lightning bolt. Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Lightning bolt polygon in a 0..100 space.
const BOLT = [
  [52, 6], [24, 54], [41, 54], [32, 94], [70, 40], [50, 40], [62, 6],
];

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function render(size, { rounded }) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = rounded ? size * 0.18 : 0;
  const cx = size / 2, cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Rounded-corner test.
      if (rounded) {
        const dx = x < radius ? radius - x : x > size - radius ? x - (size - radius) : 0;
        const dy = y < radius ? radius - y : y > size - radius ? y - (size - radius) : 0;
        if (dx * dx + dy * dy > radius * radius) continue; // transparent corner
      }
      // Indigo gradient-ish background.
      const t = (x + y) / (2 * size);
      rgba[i] = Math.round(99 - 20 * t);
      rgba[i + 1] = Math.round(102 - 10 * t);
      rgba[i + 2] = Math.round(241 - 30 * t);
      rgba[i + 3] = 255;
      // White bolt.
      if (pointInPoly((x / size) * 100, (y / size) * 100, BOLT)) {
        rgba[i] = 255; rgba[i + 1] = 255; rgba[i + 2] = 255;
      }
      void cx; void cy;
    }
  }
  return png(size, size, rgba);
}

mkdirSync("public/icons", { recursive: true });

const targets = [
  ["public/icons/icon-192.png", 192, { rounded: true }],
  ["public/icons/icon-512.png", 512, { rounded: true }],
  ["public/icons/maskable-512.png", 512, { rounded: false }],
  ["public/icons/apple-touch-180.png", 180, { rounded: false }],
  ["public/favicon-32.png", 32, { rounded: true }],
];

for (const [path, size, opts] of targets) {
  writeFileSync(path, render(size, opts));
  console.log("wrote", path);
}
