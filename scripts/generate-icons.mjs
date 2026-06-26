import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type); const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0); name.copy(output, 4); data.copy(output, 8); output.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8); return output;
}

function insideKnight(x, y) {
  const body = x > .25 && x < .74 && y > .63 && y < .82;
  const neck = x > .34 && x < .65 && y > .32 && y < .7;
  const head = x > .25 && x < .72 && y > .18 && y < .48 && y > .68 - x;
  const ear = x > .4 && x < .53 && y > .1 && y < .27;
  const nose = x > .18 && x < .42 && y > .35 && y < .55;
  return body || neck || head || ear || nose;
}

function png(size) {
  const stride = size * 4 + 1; const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) { raw[y * stride] = 0; for (let x = 0; x < size; x++) { const offset = y * stride + 1 + x * 4; const nx = (x + .5) / size; const ny = (y + .5) / size; const cx = Math.max(.08, Math.min(.92, nx)); const cy = Math.max(.08, Math.min(.92, ny)); const visible = (nx - cx) ** 2 + (ny - cy) ** 2 <= .0064; const white = insideKnight(nx, ny); raw[offset] = white ? 255 : 22; raw[offset + 1] = white ? 255 : 119; raw[offset + 2] = white ? 255 : 210; raw[offset + 3] = visible ? 255 : 0; } }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of [16, 32, 48, 128]) writeFileSync(`public/icons/icon${size}.png`, png(size));
