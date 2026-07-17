// Small home-screen-shortcut icons for the "Registrar ingreso/gasto" manifest
// shortcuts: a colored circle with a +/- glyph, matching the app's palette.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const BG = [30, 41, 59, 255];        // slate-800, same as the app icon background
const POSITIVE = [52, 211, 153, 255]; // emerald-400 (ingreso)
const NEGATIVE = [248, 113, 113, 255]; // red-400 (gasto)
const WHITE = [255, 255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
function set(buf, w, x, y, color, a = 1) {
  if (x < 0 || y < 0 || x >= w || y >= buf.length / 4 / w) return;
  const i = (y * w + x) * 4;
  for (let k = 0; k < 3; k++) buf[i + k] = Math.round(color[k] * a + buf[i + k] * (1 - a));
  buf[i + 3] = 255;
}
function circle(buf, w, cx, cy, r, color) {
  // Loop bounds must be integers — a fractional radius (e.g. size*0.32) makes
  // x/y fractional too, and Buffer/TypedArray writes at a non-integer index
  // are silently dropped, so nothing gets painted at all.
  const rr = Math.ceil(r);
  for (let y = -rr; y <= rr; y++)
    for (let x = -rr; x <= rr; x++) {
      const d = Math.hypot(x, y);
      if (d <= r) set(buf, w, cx + x, cy + y, color, Math.min(1, r - d + 0.5));
    }
}
function bar(buf, w, cx, cy, len, thick, color, vertical) {
  const hl = len / 2, ht = thick / 2;
  for (let y = -Math.ceil(vertical ? hl : ht); y <= Math.ceil(vertical ? hl : ht); y++)
    for (let x = -Math.ceil(vertical ? ht : hl); x <= Math.ceil(vertical ? ht : hl); x++) {
      set(buf, w, cx + x, cy + y, color);
    }
}

function makeIcon(sign) {
  const size = 192;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const r = size * 0.18;
      const cx = Math.min(x, size - 1 - x), cy = Math.min(y, size - 1 - y);
      if (cx < r && cy < r) {
        const dx = r - cx, dy = r - cy;
        if (dx * dx + dy * dy > r * r) { const i = (y * size + x) * 4; buf[i + 3] = 0; continue; }
      }
      set(buf, size, x, y, BG);
    }
  const color = sign === "+" ? POSITIVE : NEGATIVE;
  circle(buf, size, size / 2, size / 2, size * 0.32, color);
  const barLen = size * 0.34, barThick = size * 0.075;
  bar(buf, size, size / 2, size / 2, barLen, barThick, WHITE, false);
  if (sign === "+") bar(buf, size, size / 2, size / 2, barLen, barThick, WHITE, true);
  return encodePNG(size, size, buf);
}

writeFileSync("public/shortcut-ingreso.png", makeIcon("+"));
writeFileSync("public/shortcut-gasto.png", makeIcon("-"));
console.log("Shortcut icons written to public/");
