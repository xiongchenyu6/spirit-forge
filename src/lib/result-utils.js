export function contentTypeForResult(result) {
  const filename = safeString(result?.filename).toLowerCase();
  if (result?.kind === "model" || filename.endsWith(".glb")) return "model/gltf-binary";
  if (filename.endsWith(".gltf")) return "model/gltf+json";
  if (result?.kind === "video" || filename.endsWith(".mp4")) return "video/mp4";
  if (filename.endsWith(".webm")) return "video/webm";
  if (filename.endsWith(".mov")) return "video/quicktime";
  if (filename.endsWith(".gif")) return "image/gif";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
