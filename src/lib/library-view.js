import { constantTimeEqual } from "./binary.js";
import { invalidLibraryFileKey, libraryViewSecret, signLibraryViewKey } from "./storage.js";

export async function proxyLibraryView(request, env, url, method = "GET", options = {}) {
  if (!env.ASSET_BUCKET) return jsonResponse({ error: "storage_not_configured" }, 503);
  const key = safeString(url.searchParams.get("key"));
  const invalid = invalidLibraryFileKey(key);
  if (invalid) return jsonResponse({ error: "invalid_file", message: invalid }, 400);
  const accessFailure = await authorizeLibraryView(request, env, url, key, options);
  if (accessFailure) return accessFailure;

  const object = await env.ASSET_BUCKET.get(key);
  if (!object) return jsonResponse({ error: "not_found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=3600");
  headers.set("access-control-allow-origin", "*");
  return new Response(method === "HEAD" ? null : object.body, { headers });
}

async function authorizeLibraryView(request, env, url, key, options = {}) {
  const authorizeApiRequest = options.authorizeApiRequest;
  if (typeof authorizeApiRequest === "function" && !authorizeApiRequest(request, env)) return null;
  const secret = libraryViewSecret(env);
  if (!secret) return null;

  const exp = Number(url.searchParams.get("exp") || 0);
  const sig = safeString(url.searchParams.get("sig"));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || exp < now || !sig) {
    return jsonResponse({ error: "signed_url_required", message: "This library file URL has expired or is unsigned." }, 401);
  }

  const expected = await signLibraryViewKey(secret, key, exp);
  if (!constantTimeEqual(sig, expected)) {
    return jsonResponse({ error: "invalid_signature", message: "Invalid library file signature." }, 401);
  }
  return null;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,HEAD,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-lingji-access-token",
    },
  });
}

function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
