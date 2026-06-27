// gif-encoder.js — GIF89a animated GIF encoder (no external dependencies)
// Used by ui_kits/generator/app.js to export sprite animation frames as animated GIFs.
// Supports: multiple frames, NETSCAPE2.0 infinite loop, transparency via index 0.
// Code style: 2-space indent, semicolons, double quotes.

"use strict";

// ──────────────────────────── Color Quantization ────────────────────────────

/**
 * Collect up to maxColors unique RGB triples from all frames.
 * Transparent pixels (alpha < 128) are excluded from palette building.
 * Returns { palette: [[r,g,b], ...], transparentIndex: number|null }
 * palette[0] is always the transparent placeholder if useTransparent is true.
 */
function gifQuantizeColors(frames, maxColors, useTransparent) {
  var colorSet = {};
  var colorList = [];

  for (var fi = 0; fi < frames.length; fi++) {
    var data = frames[fi].imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];
      var a = data[i + 3];
      if (useTransparent && a < 128) continue;
      var key = (r << 16) | (g << 8) | b;
      if (!colorSet[key]) {
        colorSet[key] = true;
        colorList.push([r, g, b]);
      }
    }
  }

  var transparentIndex = null;
  var palette;

  if (useTransparent) {
    // Reserve slot 0 for transparent; fill with a color not in the image
    var transparentPlaceholder = [0, 0, 0];
    // Make sure placeholder doesn't collide with real colors
    var attempt = 0;
    while (colorSet[((transparentPlaceholder[0] << 16) | (transparentPlaceholder[1] << 8) | transparentPlaceholder[2])] && attempt < 256) {
      transparentPlaceholder[0] = (transparentPlaceholder[0] + 17) & 0xFF;
      transparentPlaceholder[1] = (transparentPlaceholder[1] + 13) & 0xFF;
      transparentPlaceholder[2] = (transparentPlaceholder[2] + 7) & 0xFF;
      attempt++;
    }
    transparentIndex = 0;

    if (colorList.length > maxColors - 1) {
      colorList = gifMedianCut(colorList, maxColors - 1);
    }

    palette = [transparentPlaceholder].concat(colorList);
  } else {
    if (colorList.length > maxColors) {
      colorList = gifMedianCut(colorList, maxColors);
    }
    palette = colorList;
  }

  // Pad palette to next power of 2 (minimum 2)
  var minSize = useTransparent ? 2 : 2;
  while (palette.length < minSize || (palette.length & (palette.length - 1)) !== 0) {
    palette.push([0, 0, 0]);
  }

  return { palette: palette, transparentIndex: transparentIndex };
}

/**
 * Simple median-cut quantizer. Reduces colorList to at most maxColors entries.
 * @param {Array<[number,number,number]>} colors
 * @param {number} maxColors
 * @returns {Array<[number,number,number]>}
 */
function gifMedianCut(colors, maxColors) {
  if (colors.length <= maxColors) return colors;

  // Start with one bucket containing all colors
  var buckets = [colors.slice()];

  while (buckets.length < maxColors) {
    // Find the bucket with the largest range in any channel
    var splitIdx = 0;
    var maxRange = -1;
    for (var bi = 0; bi < buckets.length; bi++) {
      var range = gifColorRange(buckets[bi]);
      if (range.max > maxRange) {
        maxRange = range.max;
        splitIdx = bi;
      }
    }

    var bucket = buckets[splitIdx];
    if (bucket.length <= 1) break;

    var range = gifColorRange(bucket);
    // Sort by the channel with max range
    var ch = range.channel;
    bucket.sort(function (a, b) { return a[ch] - b[ch]; });

    var mid = Math.floor(bucket.length / 2);
    buckets.splice(splitIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  // Replace each bucket with its average color
  return buckets.map(function (bucket) {
    var r = 0, g = 0, b = 0;
    for (var i = 0; i < bucket.length; i++) {
      r += bucket[i][0];
      g += bucket[i][1];
      b += bucket[i][2];
    }
    var n = bucket.length;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

/**
 * Returns { channel: 0|1|2, max: number } for the channel with the largest range.
 */
function gifColorRange(colors) {
  var minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (var i = 0; i < colors.length; i++) {
    var c = colors[i];
    if (c[0] < minR) minR = c[0];
    if (c[0] > maxR) maxR = c[0];
    if (c[1] < minG) minG = c[1];
    if (c[1] > maxG) maxG = c[1];
    if (c[2] < minB) minB = c[2];
    if (c[2] > maxB) maxB = c[2];
  }
  var rRange = maxR - minR;
  var gRange = maxG - minG;
  var bRange = maxB - minB;
  if (rRange >= gRange && rRange >= bRange) return { channel: 0, max: rRange };
  if (gRange >= bRange) return { channel: 1, max: gRange };
  return { channel: 2, max: bRange };
}

/**
 * Build a fast nearest-color lookup map from palette.
 * Returns a function: (r, g, b) → paletteIndex
 */
function gifBuildColorMap(palette, transparentIndex) {
  // Cache exact matches for speed
  var cache = {};
  return function (r, g, b) {
    var key = (r << 16) | (g << 8) | b;
    if (cache[key] !== undefined) return cache[key];
    var bestIdx = transparentIndex !== null ? 1 : 0;
    var bestDist = Infinity;
    var start = transparentIndex !== null ? 1 : 0;
    for (var i = start; i < palette.length; i++) {
      var dr = r - palette[i][0];
      var dg = g - palette[i][1];
      var db = b - palette[i][2];
      var dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    cache[key] = bestIdx;
    return bestIdx;
  };
}

// ─────────────────────────────── LZW Encoding ───────────────────────────────

/**
 * GIF LZW compression.
 * @param {Uint8Array|Array<number>} indices - pixel color indices
 * @param {number} minCodeSize - LZW minimum code size (2–8)
 * @returns {Uint8Array} compressed data (sub-block format NOT applied here)
 */
function gifLzwCompress(indices, minCodeSize) {
  var clearCode = 1 << minCodeSize;
  var eoiCode = clearCode + 1;
  var codeSize = minCodeSize + 1;
  var nextCode = eoiCode + 1;
  var maxCode = 1 << codeSize;

  // LZW code table: string "prefix,pixel" → code
  // Use flat array indexed by prefix*256 + pixel for small tables,
  // but we need a hash for large tables. Use a plain object.
  var table = {};

  // Initialize with single-pixel codes
  function resetTable() {
    table = {};
    for (var i = 0; i < clearCode; i++) {
      table[(-1 << 8) | i] = i; // prefix=-1 means single-char entry (unused here)
    }
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
    maxCode = 1 << codeSize;
  }

  // Bit output buffer
  var output = [];
  var bitBuffer = 0;
  var bitCount = 0;

  function writeBits(code) {
    bitBuffer |= (code << bitCount);
    bitCount += codeSize;
    while (bitCount >= 8) {
      output.push(bitBuffer & 0xFF);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  }

  function flushBits() {
    if (bitCount > 0) {
      output.push(bitBuffer & 0xFF);
      bitBuffer = 0;
      bitCount = 0;
    }
  }

  resetTable();
  writeBits(clearCode);

  var prefix = indices[0];

  for (var i = 1; i < indices.length; i++) {
    var pixel = indices[i];
    var key = (prefix << 8) | pixel;
    if (table[key] !== undefined) {
      prefix = table[key];
    } else {
      writeBits(prefix);
      if (nextCode <= 4095) {
        table[key] = nextCode++;
        if (nextCode > maxCode && codeSize < 12) {
          codeSize++;
          maxCode = 1 << codeSize;
        }
      } else {
        // Code table full: emit CLEAR and reset
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

// ───────────────────────────── GIF Binary Writer ────────────────────────────

/**
 * Write a 16-bit little-endian value into array at position pos.
 */
function gifWriteU16(arr, pos, val) {
  arr[pos] = val & 0xFF;
  arr[pos + 1] = (val >> 8) & 0xFF;
}

/**
 * Pack compressed LZW bytes into GIF sub-blocks (max 255 bytes each).
 * Returns array of bytes including sub-block sizes and the 0x00 terminator.
 */
function gifSubBlocks(data) {
  var result = [];
  var i = 0;
  while (i < data.length) {
    var blockSize = Math.min(255, data.length - i);
    result.push(blockSize);
    for (var j = 0; j < blockSize; j++) {
      result.push(data[i + j]);
    }
    i += blockSize;
  }
  result.push(0x00); // Block terminator
  return result;
}

// ─────────────────────────── Public API ─────────────────────────────────────

/**
 * Encode an animated GIF from an array of { imageData: ImageData } frame objects.
 *
 * @param {Array<{imageData: ImageData}>} frames
 * @param {object} [options]
 *   @param {number} [options.delay=150]        Frame delay in milliseconds.
 *   @param {number} [options.loop=0]           Loop count: 0 = infinite.
 *   @param {boolean} [options.transparent=true] Map alpha<128 pixels to transparent index.
 * @returns {Uint8Array} Complete GIF89a file bytes.
 */
function encodeAnimatedGif(frames, options) {
  options = options || {};
  var delay = options.delay !== undefined ? options.delay : 150;
  var loop = options.loop !== undefined ? options.loop : 0;
  var useTransparent = options.transparent !== false;

  if (!frames || frames.length === 0) throw new Error("encodeAnimatedGif: no frames provided");

  var width = frames[0].imageData.width;
  var height = frames[0].imageData.height;

  // Clamp delay to GIF centiseconds (1–655 seconds)
  var delayCentis = Math.max(1, Math.round(delay / 10));

  // ── 1. Build global color palette ────────────────────────────────────────
  var quantized = gifQuantizeColors(frames, 256, useTransparent);
  var palette = quantized.palette;
  var transparentIndex = quantized.transparentIndex;
  var paletteSize = palette.length; // always a power of 2
  var colorTableExp = Math.round(Math.log2(paletteSize)) - 1; // so 2^(exp+1) = paletteSize
  var minCodeSize = Math.max(2, colorTableExp + 1);

  var colorMap = gifBuildColorMap(palette, transparentIndex);

  // ── 2. Encode each frame's pixels into index arrays ──────────────────────
  var encodedFrames = [];
  for (var fi = 0; fi < frames.length; fi++) {
    var imgData = frames[fi].imageData;
    var data = imgData.data;
    var pixelCount = width * height;
    var indices = new Uint8Array(pixelCount);
    for (var pi = 0; pi < pixelCount; pi++) {
      var r = data[pi * 4];
      var g = data[pi * 4 + 1];
      var b = data[pi * 4 + 2];
      var a = data[pi * 4 + 3];
      if (useTransparent && a < 128) {
        indices[pi] = transparentIndex;
      } else {
        indices[pi] = colorMap(r, g, b);
      }
    }
    encodedFrames.push(gifLzwCompress(indices, minCodeSize));
  }

  // ── 3. Assemble GIF binary ───────────────────────────────────────────────
  var bytes = [];

  // Header: "GIF89a"
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);

  // Logical Screen Descriptor
  bytes.push(width & 0xFF, (width >> 8) & 0xFF);
  bytes.push(height & 0xFF, (height >> 8) & 0xFF);
  // Flags: GCT present (bit7=1), color resolution (bits4-6 = colorTableExp), no sort (bit3=0), size (bits0-2 = colorTableExp)
  bytes.push(0x80 | (colorTableExp << 4) | colorTableExp);
  bytes.push(0x00); // Background color index
  bytes.push(0x00); // Pixel aspect ratio

  // Global Color Table
  for (var ci = 0; ci < paletteSize; ci++) {
    var c = palette[ci];
    bytes.push(c[0], c[1], c[2]);
  }

  // NETSCAPE2.0 Application Extension (loop)
  bytes.push(
    0x21, 0xFF,       // Extension introducer + Application extension label
    0x0B,             // Block size: 11 bytes
    0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, // "NETSCAPE"
    0x32, 0x2E, 0x30, // "2.0"
    0x03,             // Sub-block size: 3 bytes
    0x01,             // Sub-block ID: 1
    loop & 0xFF, (loop >> 8) & 0xFF, // Loop count (little-endian)
    0x00              // Block terminator
  );

  // Frames
  for (var fi2 = 0; fi2 < frames.length; fi2++) {
    var compressed = encodedFrames[fi2];
    var subBlocks = gifSubBlocks(compressed);

    // Graphic Control Extension
    bytes.push(
      0x21, 0xF9,     // Extension introducer + Graphic Control label
      0x04,           // Block size: 4 bytes
      // Flags: disposal=2 (restore to background), no user input, transparent flag
      useTransparent ? (0x08 | 0x01) : 0x08,
      delayCentis & 0xFF, (delayCentis >> 8) & 0xFF, // Delay time
      useTransparent ? transparentIndex : 0x00,       // Transparent color index
      0x00            // Block terminator
    );

    // Image Descriptor
    bytes.push(0x2C);                       // Image separator
    bytes.push(0x00, 0x00, 0x00, 0x00);     // Left, Top (0,0)
    bytes.push(width & 0xFF, (width >> 8) & 0xFF);
    bytes.push(height & 0xFF, (height >> 8) & 0xFF);
    bytes.push(0x00);                       // No local color table, no interlace

    // LZW minimum code size
    bytes.push(minCodeSize);

    // Image data sub-blocks
    for (var si = 0; si < subBlocks.length; si++) {
      bytes.push(subBlocks[si]);
    }
  }

  // Trailer
  bytes.push(0x3B);

  return new Uint8Array(bytes);
}

/**
 * Helper: load a URL (blob: or data:) as an ImageData via an offscreen canvas.
 * Returns a Promise<ImageData>.
 */
function gifImageDataFromUrl(url, width, height) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = width || img.naturalWidth;
      canvas.height = height || img.naturalHeight;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = function () {
      reject(new Error("gifImageDataFromUrl: failed to load " + url));
    };
    img.src = url;
  });
}

/**
 * Encode frames from an array of URL strings (blob: or data:) as an animated GIF.
 * All frames are scaled to targetWidth × targetHeight.
 * Returns a Promise<Blob> (image/gif).
 */
async function encodeGifFromUrls(urls, targetWidth, targetHeight, options) {
  var frames = [];
  for (var i = 0; i < urls.length; i++) {
    var imageData = await gifImageDataFromUrl(urls[i], targetWidth, targetHeight);
    frames.push({ imageData: imageData });
  }
  var gifBytes = encodeAnimatedGif(frames, options);
  return new Blob([gifBytes], { type: "image/gif" });
}

// ─────────────────────────── Browser Global Export ──────────────────────────
// Loaded as a classic (non-module) <script> before generator/app.js. Expose a
// single, explicit namespace so app.js can depend on it deterministically
// instead of relying on bare top-level function hoisting.
if (typeof window !== "undefined") {
  window.LingjiGifEncoder = {
    encodeAnimatedGif: encodeAnimatedGif,
    encodeGifFromUrls: encodeGifFromUrls,
    gifImageDataFromUrl: gifImageDataFromUrl,
  };
}
