// binary —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
export function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function decodePngRgba(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (data.length < 33 || !isPngSignature(data)) throw new Error("Unsupported PNG signature.");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks = [];

  while (offset + 12 <= data.length) {
    const length = view.getUint32(offset, false);
    const type = asciiFromBytes(data.subarray(offset + 4, offset + 8));
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + length;
    if (chunkEnd + 4 > data.length) throw new Error("Truncated PNG chunk.");
    const chunk = data.subarray(chunkStart, chunkEnd);
    if (type === "IHDR") {
      const chunkView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      width = chunkView.getUint32(0, false);
      height = chunkView.getUint32(4, false);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === "IDAT") {
      idatChunks.push(chunk);
    } else if (type === "IEND") {
      break;
    }
    offset = chunkEnd + 4;
  }

  if (!width || !height || !idatChunks.length) throw new Error("PNG is missing IHDR or IDAT.");
  if (bitDepth !== 8 || interlace !== 0) throw new Error("Only 8-bit non-interlaced PNG files are supported.");
  const channels = pngChannels(colorType);
  if (!channels) throw new Error(`Unsupported PNG color type: ${colorType}`);

  const inflated = await inflateBytes(concatUint8(idatChunks));
  const rowBytes = width * channels;
  const expected = height * (rowBytes + 1);
  if (inflated.length < expected) throw new Error("PNG pixel stream is shorter than expected.");
  const unpacked = new Uint8Array(width * height * channels);
  const bpp = channels;
  let inputOffset = 0;

  for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const rowStart = rowIndex * rowBytes;
    const previousStart = rowStart - rowBytes;
    for (let index = 0; index < rowBytes; index += 1) {
      const raw = inflated[inputOffset + index];
      const left = index >= bpp ? unpacked[rowStart + index - bpp] : 0;
      const up = rowIndex > 0 ? unpacked[previousStart + index] : 0;
      const upLeft = rowIndex > 0 && index >= bpp ? unpacked[previousStart + index - bpp] : 0;
      unpacked[rowStart + index] = (raw + pngFilterPredictor(filter, left, up, upLeft)) & 0xff;
    }
    inputOffset += rowBytes;
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const sourceIndex = pixel * channels;
    const targetIndex = pixel * 4;
    if (colorType === 6) {
      rgba[targetIndex] = unpacked[sourceIndex];
      rgba[targetIndex + 1] = unpacked[sourceIndex + 1];
      rgba[targetIndex + 2] = unpacked[sourceIndex + 2];
      rgba[targetIndex + 3] = unpacked[sourceIndex + 3];
    } else if (colorType === 2) {
      rgba[targetIndex] = unpacked[sourceIndex];
      rgba[targetIndex + 1] = unpacked[sourceIndex + 1];
      rgba[targetIndex + 2] = unpacked[sourceIndex + 2];
      rgba[targetIndex + 3] = 255;
    } else if (colorType === 4) {
      const gray = unpacked[sourceIndex];
      rgba[targetIndex] = gray;
      rgba[targetIndex + 1] = gray;
      rgba[targetIndex + 2] = gray;
      rgba[targetIndex + 3] = unpacked[sourceIndex + 1];
    } else {
      const gray = unpacked[sourceIndex];
      rgba[targetIndex] = gray;
      rgba[targetIndex + 1] = gray;
      rgba[targetIndex + 2] = gray;
      rgba[targetIndex + 3] = 255;
    }
  }

  return { width, height, data: rgba };
}

export async function encodePngRgba(width, height, rgba) {
  const rowBytes = width * 4;
  const raw = new Uint8Array(height * (rowBytes + 1));
  for (let row = 0; row < height; row += 1) {
    const sourceStart = row * rowBytes;
    const targetStart = row * (rowBytes + 1);
    raw[targetStart] = 0;
    raw.set(rgba.subarray(sourceStart, sourceStart + rowBytes), targetStart + 1);
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = await deflateBytes(raw);
  return concatUint8([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ]);
}

export function isPngSignature(bytes) {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

function pngChannels(colorType) {
  return { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType] || 0;
}

function pngFilterPredictor(filter, left, up, upLeft) {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return Math.floor((left + up) / 2);
  if (filter === 4) return paethPredictor(left, up, upLeft);
  throw new Error(`Unsupported PNG filter: ${filter}`);
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  return upDistance <= upLeftDistance ? up : upLeft;
}

function pngChunk(type, bytes) {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + bytes.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, bytes.length, false);
  chunk.set(typeBytes, 4);
  chunk.set(bytes, 8);
  view.setUint32(8 + bytes.length, crc32(concatUint8([typeBytes, bytes])), false);
  return chunk;
}

async function inflateBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function deflateBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function concatUint8(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function asciiFromBytes(bytes) {
  return String.fromCharCode(...bytes);
}

export function positiveInteger(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

export async function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  let centralSize = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const bytes = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);
    const crc = crc32(bytes);
    const { time, date } = dosDateTime(new Date());
    const localHeader = zipLocalHeader(nameBytes, bytes.length, crc, time, date);
    const centralHeader = zipCentralHeader(nameBytes, bytes.length, crc, time, date, offset);

    localParts.push(localHeader, nameBytes, bytes);
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.byteLength + nameBytes.byteLength + bytes.byteLength;
    centralSize += centralHeader.byteLength + nameBytes.byteLength;
  }

  const end = zipEndRecord(files.length, centralSize, offset);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function zipLocalHeader(nameBytes, size, crc, time, date) {
  const header = new Uint8Array(30);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, time, true);
  view.setUint16(12, date, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.byteLength, true);
  view.setUint16(28, 0, true);
  return header;
}

function zipCentralHeader(nameBytes, size, crc, time, date, offset) {
  const header = new Uint8Array(46);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, time, true);
  view.setUint16(14, date, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.byteLength, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  return header;
}

function zipEndRecord(entryCount, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return header;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  const table = crc32.table || (crc32.table = makeCrc32Table());
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrc32Table() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
}

function dosDateTime(value) {
  const year = Math.max(1980, value.getFullYear());
  return {
    time: (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate(),
  };
}

export function bytesToBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}
