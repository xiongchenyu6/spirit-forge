const ROUTE_ALIAS = {
  "/": "/landing/",
  "/favicon.ico": "/assets/logo-emblem-transparent.png",
  "/generator/": "/generator/",
  "/landing/": "/landing/",
  "/studio/": "/studio/",
  "/library/": "/library/",
  "/templates/": "/templates/",
  "/pricing/": "/pricing/",
  "/onboarding/": "/onboarding/",
  "/en/": "/landing/",
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

  const matched = await tryFetchAsset(request, env, candidates);
  if (matched) {
    const headers = new Headers(matched.headers);
    const ct = headers.get("content-type") || "";
    const isHtml = pathname.endsWith(".html") || ct.includes("text/html");
    const isCode = /\.(m?js|css|json)$/i.test(pathname) || ct.includes("javascript") || ct.includes("css");
    if (isHtml) {
      headers.set("cache-control", "no-store");
    } else if (isCode) {
      // 代码文件名无内容哈希、每次部署内容会变;用 immutable 会让浏览器长期缓存旧
      // app.js/gif-encoder.js,部署更新后仍加载旧文件 → 页面卡死/MIME 错。改为
      // no-cache(每次带 ETag 校验,未变则 304),始终拿到最新代码。
      headers.set("cache-control", "no-cache");
    } else if (/\/assets\/generated\//.test(pathname)) {
      // 生成类素材(展示页 GIF/PNG/sheet 等)会被同名覆盖更新;用 no-cache 走 ETag 校验,
      // 改了就拿新的(未变 304),根治"删/换了素材浏览器还显示旧图"。
      headers.set("cache-control", "no-cache");
    } else {
      // 真正静态的图片/字体(logo 等)用适度缓存。
      headers.set("cache-control", "public, max-age=3600");
    }
    return new Response(matched.body, {
      status: matched.status,
      statusText: matched.statusText,
      headers,
    });
  }

  if (isFilePath(pathname)) {
    return new Response("Not Found", { status: 404 });
  }

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
