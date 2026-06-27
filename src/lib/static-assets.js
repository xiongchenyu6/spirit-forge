const ROUTE_ALIAS = {
  "/": "/generator/",
  "/generator/": "/generator/",
  "/landing/": "/landing/",
  "/studio/": "/studio/",
  "/library/": "/library/",
  "/templates/": "/templates/",
  "/pricing/": "/pricing/",
  "/onboarding/": "/onboarding/",
  "/en/": "/generator/",
  "/en/generator/": "/generator/",
  "/en/landing/": "/landing/",
  "/en/studio/": "/studio/",
  "/en/library/": "/library/",
  "/en/templates/": "/templates/",
  "/en/pricing/": "/pricing/",
  "/en/onboarding/": "/onboarding/",
};

const CLEAN_ALIAS_REDIRECT = [
  "/generator",
  "/landing",
  "/studio",
  "/library",
  "/templates",
  "/pricing",
  "/onboarding",
  "/en",
  "/en/generator",
  "/en/landing",
  "/en/studio",
  "/en/library",
  "/en/templates",
  "/en/pricing",
  "/en/onboarding",
];

const PAGE_PREFIXES = [
  "/generator/",
  "/landing/",
  "/studio/",
  "/library/",
  "/templates/",
  "/pricing/",
  "/onboarding/",
];

export async function handleAssets(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const original = decodeURIComponent(url.pathname || "/");
  if (CLEAN_ALIAS_REDIRECT.includes(original)) {
    const redirectUrl = new URL(url);
    redirectUrl.pathname = `${original}/`;
    return Response.redirect(redirectUrl.toString(), 301);
  }

  const normalized = normalizePath(original);
  const pathname = ROUTE_ALIAS[normalized] || mapSectionPath(normalized) || normalized;
  const candidates = [pathname];

  if (pathname.endsWith("/") && pathname !== "/") {
    candidates.push(`${pathname}index.html`);
  } else if (!isFilePath(pathname) && pathname !== "/") {
    candidates.push(`${pathname}/index.html`);
  }

  if (pathname === "/" || original === "") {
    candidates.push("/ui_kits/generator/index.html");
  }

  const matched = await tryFetchAsset(request, env, candidates);
  if (matched) {
    const headers = new Headers(matched.headers);
    const isHtml = pathname.endsWith(".html") || headers.get("content-type")?.includes("text/html");
    if (!isHtml) {
      headers.set("cache-control", "public, max-age=31536000, immutable");
    } else {
      headers.set("cache-control", "no-store");
    }
    return new Response(matched.body, {
      status: matched.status,
      statusText: matched.statusText,
      headers,
    });
  }

  const fallback = await env.ASSETS.fetch(buildAssetRequest(request, "/ui_kits/generator/index.html"));
  if (fallback.status !== 404) return fallback;
  return new Response("Not Found", { status: 404 });
}

function normalizePath(pathname) {
  return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
}

function isFilePath(pathname) {
  return /\.([a-zA-Z0-9]+)$/.test(pathname);
}

function mapSectionPath(pathname) {
  const match = PAGE_PREFIXES.find((prefix) => pathname.startsWith(prefix));
  if (!match) return null;
  return pathname;
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
    if (res.status !== 404) return res;
  }
  return null;
}
