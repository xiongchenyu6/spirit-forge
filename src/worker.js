const ROUTE_ALIAS = {
  "/": "/ui_kits/landing/index.html",
  "/landing/": "/ui_kits/landing/index.html",
  "/studio/": "/ui_kits/studio/index.html",
  "/library/": "/ui_kits/library/index.html",
  "/templates/": "/ui_kits/templates/index.html",
  "/pricing/": "/ui_kits/pricing/index.html",
  "/onboarding/": "/ui_kits/onboarding/index.html",
  "/en/": "/ui_kits/landing/index.html",
  "/en/landing/": "/ui_kits/landing/index.html",
  "/en/studio/": "/ui_kits/studio/index.html",
  "/en/library/": "/ui_kits/library/index.html",
  "/en/templates/": "/ui_kits/templates/index.html",
  "/en/pricing/": "/ui_kits/pricing/index.html",
  "/en/onboarding/": "/ui_kits/onboarding/index.html",
};

const CLEAN_ALIAS_REDIRECT = [
  "/landing",
  "/studio",
  "/library",
  "/templates",
  "/pricing",
  "/onboarding",
  "/en",
  "/en/landing",
  "/en/studio",
  "/en/library",
  "/en/templates",
  "/en/pricing",
  "/en/onboarding",
];

const PAGE_PREFIXES = ["/landing/", "/studio/", "/library/", "/templates/", "/pricing/", "/onboarding/"];

function normalizePath(pathname) {
  return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
}

function isFilePath(pathname) {
  return /\.([a-zA-Z0-9]+)$/.test(pathname);
}

function mapSectionPath(pathname) {
  const match = PAGE_PREFIXES.find((prefix) => pathname.startsWith(prefix));
  if (!match) return null;

  if (pathname === "/") return null;

  return `/ui_kits${pathname}`;
}

function buildAssetRequest(request, pathname) {
  const target = new URL(request.url);
  target.pathname = pathname;
  return new Request(target.toString(), request);
}

async function tryFetchAsset(request, env, candidates) {
  for (const pathname of candidates) {
    const assetReq = buildAssetRequest(request, pathname);
    const res = await env.ASSETS.fetch(assetReq);
    if (res.status !== 404) {
      return res;
    }
  }
  return null;
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const original = decodeURIComponent(url.pathname || "/");

    if (CLEAN_ALIAS_REDIRECT.includes(original)) {
      return Response.redirect(`${url.origin}${original}/`, 301);
    }

    const normalized = normalizePath(original);
    let pathname = ROUTE_ALIAS[normalized] || mapSectionPath(normalized) || normalized;

    const candidates = [pathname];

    // 支持目录路径自动映射到目录下 index.html。
    if (pathname.endsWith("/") && pathname !== "/") {
      candidates.push(`${pathname}index.html`);
    } else if (!isFilePath(pathname) && pathname !== "/") {
      candidates.push(`${pathname}/index.html`);
    }

    if (pathname === "/" || original === "") {
      candidates.push("/ui_kits/landing/index.html");
    }

    const matched = await tryFetchAsset(request, env, candidates);
    if (matched) {
      const headers = new Headers(matched.headers);
      const isHtml = pathname.endsWith(".html");
      if (!isHtml) {
        headers.set("cache-control", "public, max-age=31536000, immutable");
      }
      return new Response(matched.body, {
        status: matched.status,
        statusText: matched.statusText,
        headers,
      });
    }

    // 通用回退：落到 landing。
    const fallback = await env.ASSETS.fetch(buildAssetRequest(request, "/ui_kits/landing/index.html"));
    if (fallback.status !== 404) {
      return fallback;
    }

    return new Response("Not Found", { status: 404 });
  },
};
