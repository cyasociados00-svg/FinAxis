// Pure-Node PNG icon generator for FinAxis PWA (no external deps).
// Draws a rounded-square slate background with a rising emerald chart line.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [30, 41, 59, 255];        // slate-800  #1e293b
const LINE = [52, 211, 153, 255];    // emerald-400 #34d399
const DOT = [255, 255, 255, 255];

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
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  // raw scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function set(buf, w, x, y, color, a = 1) {
  if (x < 0 || y < 0 || x >= w || y >= buf.length / 4 / w) return;
  const i = (y * w + x) * 4;
  for (let k = 0; k < 3; k++) buf[i + k] = Math.round(color[k] * a + buf[i + k] * (1 - a));
  buf[i + 3] = 255;
}

function makeIcon(size, padded) {
  const w = size, h = size;
  const buf = Buffer.alloc(w * h * 4);
  const r = padded ? size * 0.18 : 0; // corner radius
  // rounded-rect background (or full bleed for maskable)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = true;
      if (padded) {
        const cx = Math.min(x, w - 1 - x), cy = Math.min(y, h - 1 - y);
        if (cx < r && cy < r) {
          const dx = r - cx, dy = r - cy;
          inside = dx * dx + dy * dy <= r * r;
        }
      }
      if (inside) set(buf, w, x, y, BG);
      else { const i = (y * w + x) * 4; buf[i + 3] = 0; }
    }
  }
  // rising chart polyline through normalized points
  const pts = [[0.18, 0.70], [0.38, 0.52], [0.58, 0.60], [0.82, 0.26]];
  const px = pts.map(([nx, ny]) => [nx * size, ny * size]);
  const thick = Math.max(2, size * 0.055);
  for (let s = 0; s < px.length - 1; s++) {
    const [x0, y0] = px[s], [x1, y1] = px[s + 1];
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) * 2;
    for (let t = 0; t <= steps; t++) {
      const x = x0 + (x1 - x0) * (t / steps);
      const y = y0 + (y1 - y0) * (t / steps);
      for (let oy = -thick; oy <= thick; oy++)
        for (let ox = -thick; ox <= thick; ox++) {
          const d = Math.hypot(ox, oy);
          if (d <= thick) set(buf, w, Math.round(x + ox), Math.round(y + oy), LINE, Math.min(1, thick - d + 0.5));
        }
    }
  }
  // dot at the peak (last point)
  const [hx, hy] = px[px.length - 1];
  const dotR = Math.max(3, size * 0.075);
  for (let oy = -dotR; oy <= dotR; oy++)
    for (let ox = -dotR; ox <= dotR; ox++) {
      const d = Math.hypot(ox, oy);
      if (d <= dotR) set(buf, w, Math.round(hx + ox), Math.round(hy + oy), DOT, Math.min(1, dotR - d + 0.5));
    }
  return encodePNG(w, h, buf);
}

mkdirSync("public", { recursive: true });
writeFileSync("public/icon-192.png", makeIcon(192, true));
writeFileSync("public/icon-512.png", makeIcon(512, true));
writeFileSync("public/icon-maskable-512.png", makeIcon(512, false));
writeFileSync("public/apple-touch-icon.png", makeIcon(180, true));
console.log("Icons written to public/");
