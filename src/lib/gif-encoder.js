// gif-encoder.js — GIF89a 动画编码器(无依赖,Worker 可用)。
// 从 ui_kits/generator/gif-encoder.js 移植纯编码逻辑,去掉浏览器 DOM 辅助。
// 供 rig-render.js 在 Worker 内把骨骼动画帧编码为循环 GIF。

function gifQuantizeColors(frames, maxColors, useTransparent) {
  const colorSet = {};
  let colorList = [];
  for (let fi = 0; fi < frames.length; fi++) {
    const data = frames[fi].imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (useTransparent && a < 128) continue;
      const key = (r << 16) | (g << 8) | b;
      if (!colorSet[key]) { colorSet[key] = true; colorList.push([r, g, b]); }
    }
  }
  let transparentIndex = null;
  let palette;
  if (useTransparent) {
    const transparentPlaceholder = [0, 0, 0];
    let attempt = 0;
    while (colorSet[((transparentPlaceholder[0] << 16) | (transparentPlaceholder[1] << 8) | transparentPlaceholder[2])] && attempt < 256) {
      transparentPlaceholder[0] = (transparentPlaceholder[0] + 17) & 0xFF;
      transparentPlaceholder[1] = (transparentPlaceholder[1] + 13) & 0xFF;
      transparentPlaceholder[2] = (transparentPlaceholder[2] + 7) & 0xFF;
      attempt++;
    }
    transparentIndex = 0;
    if (colorList.length > maxColors - 1) colorList = gifMedianCut(colorList, maxColors - 1);
    palette = [transparentPlaceholder].concat(colorList);
  } else {
    if (colorList.length > maxColors) colorList = gifMedianCut(colorList, maxColors);
    palette = colorList;
  }
  while (palette.length < 2 || (palette.length & (palette.length - 1)) !== 0) palette.push([0, 0, 0]);
  return { palette, transparentIndex };
}

function gifMedianCut(colors, maxColors) {
  if (colors.length <= maxColors) return colors;
  let buckets = [colors.slice()];
  while (buckets.length < maxColors) {
    let splitIdx = 0, maxRange = -1;
    for (let bi = 0; bi < buckets.length; bi++) {
      const range = gifColorRange(buckets[bi]);
      if (range.max > maxRange) { maxRange = range.max; splitIdx = bi; }
    }
    const bucket = buckets[splitIdx];
    if (bucket.length <= 1) break;
    const range = gifColorRange(bucket);
    const ch = range.channel;
    bucket.sort((a, b) => a[ch] - b[ch]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(splitIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }
  return buckets.map((bucket) => {
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < bucket.length; i++) { r += bucket[i][0]; g += bucket[i][1]; b += bucket[i][2]; }
    const n = bucket.length;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

function gifColorRange(colors) {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    if (c[0] < minR) minR = c[0]; if (c[0] > maxR) maxR = c[0];
    if (c[1] < minG) minG = c[1]; if (c[1] > maxG) maxG = c[1];
    if (c[2] < minB) minB = c[2]; if (c[2] > maxB) maxB = c[2];
  }
  const rRange = maxR - minR, gRange = maxG - minG, bRange = maxB - minB;
  if (rRange >= gRange && rRange >= bRange) return { channel: 0, max: rRange };
  if (gRange >= bRange) return { channel: 1, max: gRange };
  return { channel: 2, max: bRange };
}

function gifBuildColorMap(palette, transparentIndex) {
  const cache = {};
  return function (r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    if (cache[key] !== undefined) return cache[key];
    let bestIdx = transparentIndex !== null ? 1 : 0;
    let bestDist = Infinity;
    const start = transparentIndex !== null ? 1 : 0;
    for (let i = start; i < palette.length; i++) {
      const dr = r - palette[i][0], dg = g - palette[i][1], db = b - palette[i][2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    cache[key] = bestIdx;
    return bestIdx;
  };
}

function gifLzwCompress(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  let maxCode = 1 << codeSize;
  let table = {};
  function resetTable() {
    table = {};
    for (let i = 0; i < clearCode; i++) table[(-1 << 8) | i] = i;
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
    maxCode = 1 << codeSize;
  }
  const output = [];
  let bitBuffer = 0, bitCount = 0;
  function writeBits(code) {
    bitBuffer |= (code << bitCount);
    bitCount += codeSize;
    while (bitCount >= 8) { output.push(bitBuffer & 0xFF); bitBuffer >>= 8; bitCount -= 8; }
  }
  function flushBits() { if (bitCount > 0) { output.push(bitBuffer & 0xFF); bitBuffer = 0; bitCount = 0; } }
  resetTable();
  writeBits(clearCode);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const pixel = indices[i];
    const key = (prefix << 8) | pixel;
    if (table[key] !== undefined) {
      prefix = table[key];
    } else {
      writeBits(prefix);
      if (nextCode <= 4095) {
        table[key] = nextCode++;
        if (nextCode > maxCode && codeSize < 12) { codeSize++; maxCode = 1 << codeSize; }
      } else {
        writeBits(clearCode);
        resetTable();
      }
      prefix = pixel;
    }
  }
  writeBits(prefix);
  writeBits(eoiCode);
  flushBits();
  return new Uint8Array(output);
}

function gifSubBlocks(data) {
  const result = [];
  let i = 0;
  while (i < data.length) {
    const blockSize = Math.min(255, data.length - i);
    result.push(blockSize);
    for (let j = 0; j < blockSize; j++) result.push(data[i + j]);
    i += blockSize;
  }
  result.push(0x00);
  return result;
}

export function encodeAnimatedGif(frames, options) {
  options = options || {};
  const delay = options.delay !== undefined ? options.delay : 150;
  const loop = options.loop !== undefined ? options.loop : 0;
  const useTransparent = options.transparent !== false;
  if (!frames || frames.length === 0) throw new Error("encodeAnimatedGif: no frames provided");
  const width = frames[0].imageData.width;
  const height = frames[0].imageData.height;
  const delayCentis = Math.max(1, Math.round(delay / 10));
  const quantized = gifQuantizeColors(frames, 256, useTransparent);
  const palette = quantized.palette;
  const transparentIndex = quantized.transparentIndex;
  const paletteSize = palette.length;
  const colorTableExp = Math.round(Math.log2(paletteSize)) - 1;
  const minCodeSize = Math.max(2, colorTableExp + 1);
  const colorMap = gifBuildColorMap(palette, transparentIndex);
  const encodedFrames = [];
  for (let fi = 0; fi < frames.length; fi++) {
    const data = frames[fi].imageData.data;
    const pixelCount = width * height;
    const indices = new Uint8Array(pixelCount);
    for (let pi = 0; pi < pixelCount; pi++) {
      const r = data[pi * 4], g = data[pi * 4 + 1], b = data[pi * 4 + 2], a = data[pi * 4 + 3];
      indices[pi] = (useTransparent && a < 128) ? transparentIndex : colorMap(r, g, b);
    }
    encodedFrames.push(gifLzwCompress(indices, minCodeSize));
  }
  const bytes = [];
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  bytes.push(width & 0xFF, (width >> 8) & 0xFF, height & 0xFF, (height >> 8) & 0xFF);
  bytes.push(0x80 | (colorTableExp << 4) | colorTableExp, 0x00, 0x00);
  for (let ci = 0; ci < paletteSize; ci++) { const c = palette[ci]; bytes.push(c[0], c[1], c[2]); }
  bytes.push(0x21, 0xFF, 0x0B, 0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, 0x03, 0x01, loop & 0xFF, (loop >> 8) & 0xFF, 0x00);
  for (let fi2 = 0; fi2 < frames.length; fi2++) {
    const subBlocks = gifSubBlocks(encodedFrames[fi2]);
    bytes.push(0x21, 0xF9, 0x04, useTransparent ? (0x08 | 0x01) : 0x08, delayCentis & 0xFF, (delayCentis >> 8) & 0xFF, useTransparent ? transparentIndex : 0x00, 0x00);
    bytes.push(0x2C, 0x00, 0x00, 0x00, 0x00, width & 0xFF, (width >> 8) & 0xFF, height & 0xFF, (height >> 8) & 0xFF, 0x00);
    bytes.push(minCodeSize);
    for (let si = 0; si < subBlocks.length; si++) bytes.push(subBlocks[si]);
  }
  bytes.push(0x3B);
  return new Uint8Array(bytes);
}
