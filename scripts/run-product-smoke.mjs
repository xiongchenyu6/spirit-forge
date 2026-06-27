#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_WORKER_URL = "https://lingji-forge.xiongchenyu6.workers.dev";
const DEFAULT_TIMEOUT_MS = 15000;

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printUsage();
  process.exit(0);
}

const workerUrl = normalizeBaseUrl(options.workerUrl || process.env.GENERATOR_WORKER_URL || DEFAULT_WORKER_URL);
const workerOrigin = new URL(workerUrl).origin;
const accessToken = options.accessToken || process.env.GENERATOR_ACCESS_TOKEN || "";
const checkedAt = new Date().toISOString();
const checks = [];

console.log(`Product smoke: ${workerUrl}`);
console.log("");

await runChecks();

const ok = checks.every((check) => check.ok);
const report = {
  ok,
  checkedAt,
  workerUrl,
  checks,
};

if (options.outputPath) {
  const outputPath = resolve(options.outputPath);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log("");
  console.log(`Report: ${outputPath}`);
}

console.log("");
console.log(`Product smoke: ${ok ? "PASS" : "FAIL"} (${checks.filter((check) => check.ok).length}/${checks.length})`);
process.exit(ok ? 0 : 1);

async function runChecks() {
  await checkTextRoute({
    name: "root generator route",
    path: "/",
    includes: ["assetBlueprint", "usageGuidance"],
  });
  await checkRedirectRoute({
    name: "clean generator redirect",
    path: "/generator",
    locationPath: "/generator/",
  });
  await checkRedirectRoute({
    name: "clean generator redirect preserves query",
    path: "/generator?preset=monster-actions&brief=smoke",
    locationPath: "/generator/",
    locationSearchIncludes: ["preset=monster-actions", "brief=smoke"],
  });
  await checkRedirectRoute({
    name: "clean landing redirect",
    path: "/landing",
    locationPath: "/landing/",
  });
  await checkRedirectRoute({
    name: "clean studio redirect",
    path: "/studio",
    locationPath: "/studio/",
  });
  await checkRedirectRoute({
    name: "clean library redirect",
    path: "/library",
    locationPath: "/library/",
  });
  await checkRedirectRoute({
    name: "clean templates redirect",
    path: "/templates",
    locationPath: "/templates/",
  });
  await checkRedirectRoute({
    name: "clean pricing redirect",
    path: "/pricing",
    locationPath: "/pricing/",
  });
  await checkRedirectRoute({
    name: "clean onboarding redirect",
    path: "/onboarding",
    locationPath: "/onboarding/",
  });
  await checkTextRoute({
    name: "generator route",
    path: "/generator/",
    includes: ["assetBlueprint", "usageGuidance"],
  });
  await checkTextRoute({
    name: "landing route",
    path: "/landing/",
    includes: ["GenreShowcase", "TopNav", "Hero"],
  });
  await checkTextRoute({
    name: "library route",
    path: "/library/",
    includes: ["data-kind=\"sample\"", "./app.js"],
  });
  await checkTextRoute({
    name: "templates route",
    path: "/templates/",
    includes: ["TEMPLATE_INPUTS", "generatorHrefForTemplate"],
  });
  await checkTextRoute({
    name: "pricing route",
    path: "/pricing/",
    includes: ["NAV_HREFS", "/generator/", "/templates/", "/pricing/", "/library/"],
    excludes: ["href=\"#\""],
  });
  await checkTextRoute({
    name: "studio route",
    path: "/studio/",
    includes: ["StudioCanvas", "StudioTopBar", "ParamPanel"],
  });
  await checkTextRoute({
    name: "onboarding route",
    path: "/onboarding/",
    includes: ["href=\"/generator/\"", "window.location.href = \"/generator/\""],
    excludes: ["href=\"#\""],
  });
  await checkProtectedApiRequiresToken();
  await checkAuthenticatedApi();
  await checkPageResourceReferences({
    name: "page internal resources",
    pages: ["/", "/generator/", "/landing/", "/library/", "/templates/", "/pricing/", "/studio/", "/onboarding/"],
  });
  await checkTextRoute({
    name: "generator html",
    path: "/generator/index.html",
    includes: ["assetBlueprint", "usageGuidance"],
  });
  await checkTextRoute({
    name: "landing html",
    path: "/landing/index.html",
    includes: ["GenreShowcase", "TopNav", "Hero"],
  });
  await checkTextRoute({
    name: "landing sample cards",
    path: "/landing/Shared.jsx",
    includes: ["OFFICIAL_SAMPLE_BY_IMAGE", "data-sample-id", "sample-monster-actions", "Download ZIP"],
  });
  await checkTextRoute({
    name: "landing routes",
    path: "/landing/TopNav.jsx",
    includes: ["navHrefs", "/generator/", "/templates/", "/pricing/", "/library/"],
  });
  await checkTextRoute({
    name: "landing footer routes",
    path: "/landing/Sections.jsx",
    includes: ["footerHref", "/generator/", "/templates/", "/library/", "/pricing/"],
    excludes: ["href=\"#\""],
  });
  await checkTextRoute({
    name: "landing official showcase",
    path: "/landing/GenreShowcase.jsx",
    includes: ["data-official-showcase", "repeat(auto-fit"],
  });
  await checkTextRoute({
    name: "studio official previews",
    path: "/studio/StudioCanvas.jsx",
    includes: ["GENERATED_PREVIEWS", "VideoSpriteDemoCard", "monster-idle.png", "monster-attack.png"],
  });
  await checkTextRoute({
    name: "pricing routes",
    path: "/pricing/index.html",
    includes: ["NAV_HREFS", "/generator/", "/templates/", "/pricing/", "/library/"],
    excludes: ["href=\"#\""],
  });
  await checkTextRoute({
    name: "onboarding routes",
    path: "/onboarding/index.html",
    includes: ["href=\"/generator/\"", "window.location.href = \"/generator/\""],
    excludes: ["href=\"#\""],
  });
  await checkTextRoute({
    name: "generator app",
    path: "/generator/app.js",
    includes: ["requestedGeneratorInput", "applyInitialQueryInput", "PACK_BLUEPRINTS"],
  });
  await checkTextRoute({
    name: "library html",
    path: "/library/index.html",
    includes: ["data-kind=\"sample\""],
  });
  await checkTextRoute({
    name: "library app",
    path: "/library/app.js",
    includes: ["loadOfficialSamples", "normalizeOfficialSampleFiles", "sampleZipHref"],
  });
  await checkTextRoute({
    name: "library styles",
    path: "/library/styles.css",
    includes: [".sample-detail-grid", ".sample-frame-strip"],
  });
  await checkTextRoute({
    name: "templates handoff",
    path: "/templates/index.html",
    includes: ["TEMPLATE_INPUTS", "generatorHrefForTemplate"],
  });
  await checkOfficialSamplesApi();
  await checkVideoSpriteDemoApi();
  await checkOfficialSampleLinks();
  await checkAllOfficialSampleZips();
  await checkOfficialSampleZipCacheReuse();
  await checkBinaryRoute({
    name: "official map sample png",
    path: "/assets/generated/official/map-grass.png",
    contentTypeIncludes: "image/png",
    minBytes: 256,
  });
}

async function checkProtectedApiRequiresToken() {
  await recordCheck("protected api rejects anonymous usage", async () => {
    const response = await fetchWithTimeout(urlFor("/api/usage"), { timeoutMs: options.timeoutMs });
    const data = await readJsonBody(response);
    const failures = [];
    if (response.status !== 401) failures.push(`status ${response.status}`);
    if (data?.error !== "auth_required") failures.push(`error ${data?.error || "missing"}`);
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : "401 auth_required",
      meta: {
        path: "/api/usage",
        status: response.status,
        error: data?.error || null,
      },
    };
  });
}

async function checkAuthenticatedApi() {
  if (!accessToken) {
    await recordCheck("authenticated api smoke", async () => {
      const failures = options.requireAuthApi ? ["missing GENERATOR_ACCESS_TOKEN"] : [];
      return {
        ok: failures.length === 0,
        detail: failures.length ? failures.join("; ") : "skipped; set GENERATOR_ACCESS_TOKEN or --access-token to enable",
        meta: {
          skipped: failures.length === 0,
          authConfigured: false,
        },
      };
    });
    return;
  }

  await recordCheck("authenticated usage api", async () => {
    const response = await fetchWithTimeout(urlFor("/api/usage"), {
      timeoutMs: options.timeoutMs,
      headers: authHeaders(),
    });
    const data = await readJsonBody(response);
    const failures = [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (data?.configured !== true) failures.push("configured false");
    if (!data?.hourly || typeof data.hourly.remaining !== "number") failures.push("missing hourly remaining");
    if (!data?.daily || typeof data.daily.remaining !== "number") failures.push("missing daily remaining");
    if (!data?.hourly?.resetAt || !data?.daily?.resetAt) failures.push("missing resetAt");
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `hourly ${data.hourly.remaining}/${data.hourly.limit}, daily ${data.daily.remaining}/${data.daily.limit}`,
      meta: {
        path: "/api/usage",
        status: response.status,
        hourly: data?.hourly || null,
        daily: data?.daily || null,
      },
    };
  });

  await recordCheck("authenticated capabilities api", async () => {
    const response = await fetchWithTimeout(urlFor("/api/capabilities"), {
      timeoutMs: options.timeoutMs,
      headers: authHeaders(),
    });
    const data = await readJsonBody(response);
    const failures = [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (data?.ok !== true) failures.push("ok false");
    if (data?.account !== "worldsmith") failures.push(`account ${data?.account || "missing"}`);
    if (data?.llm?.provider !== "mistral") failures.push(`llm provider ${data?.llm?.provider || "missing"}`);
    if (data?.llm?.model !== "mistral-small-latest") failures.push(`llm model ${data?.llm?.model || "missing"}`);
    if (data?.comfy?.configured !== true) failures.push("comfy not configured");
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${data.account}, ${data.llm.provider}/${data.llm.model}`,
      meta: {
        path: "/api/capabilities",
        status: response.status,
        account: data?.account || null,
        llm: data?.llm || null,
        comfyConfigured: data?.comfy?.configured === true,
      },
    };
  });

  await recordCheck("authenticated packs api", async () => {
    const response = await fetchWithTimeout(urlFor("/api/packs?limit=5"), {
      timeoutMs: options.timeoutMs,
      headers: authHeaders(),
    });
    const data = await readJsonBody(response);
    const packs = Array.isArray(data?.packs) ? data.packs : [];
    const failures = [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (data?.ok !== true) failures.push("ok false");
    if (packs.length === 0) failures.push("no packs");
    const packIds = packs.map((pack) => pack.packId || pack.id).filter(Boolean);
    if (new Set(packIds).size !== packIds.length) failures.push("duplicate pack ids in page");
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${packs.length} packs`,
      meta: {
        path: "/api/packs?limit=5",
        status: response.status,
        packCount: packs.length,
        packIds,
      },
    };
  });

  await checkAuthenticatedRequestRecovery("2d-pack");
  await checkAuthenticatedRequestRecovery("layer-separation");
}

async function checkAuthenticatedRequestRecovery(kind) {
  await recordCheck(`authenticated ${kind} recovery miss`, async () => {
    const path = `/api/requests/${kind}/missing-smoke-request`;
    const response = await fetchWithTimeout(urlFor(path), {
      timeoutMs: options.timeoutMs,
      headers: authHeaders(),
    });
    const data = await readJsonBody(response);
    const failures = [];
    if (response.status !== 404) failures.push(`status ${response.status}`);
    if (data?.error !== "request_not_found") failures.push(`error ${data?.error || "missing"}`);
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : "404 request_not_found",
      meta: {
        path,
        status: response.status,
        error: data?.error || null,
      },
    };
  });
}

async function checkPageResourceReferences({ name, pages }) {
  await recordCheck(name, async () => {
    const failures = [];
    const resources = new Map();
    let pagesChecked = 0;
    for (const page of pages) {
      const pageUrl = urlFor(page);
      const response = await fetchWithTimeout(pageUrl, { timeoutMs: options.timeoutMs });
      const body = await response.text();
      if (response.status !== 200) {
        failures.push(`${page} status ${response.status}`);
        continue;
      }
      pagesChecked += 1;
      for (const ref of extractHtmlRefs(body)) {
        const resourceUrl = resolveInternalResourceUrl(ref, pageUrl);
        if (!resourceUrl) continue;
        resources.set(resourceUrl.toString(), { page, ref });
      }
    }

    for (const [resourceUrl, source] of resources) {
      const response = await fetchWithTimeout(resourceUrl, { timeoutMs: options.timeoutMs });
      const body = Buffer.from(await response.arrayBuffer());
      if (response.status !== 200) {
        failures.push(`${source.page} -> ${source.ref} status ${response.status}`);
      } else if (body.length === 0) {
        failures.push(`${source.page} -> ${source.ref} empty`);
      }
    }

    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.slice(0, 8).join("; ") : `${pagesChecked} pages, ${resources.size} resources`,
      meta: {
        pages,
        pagesChecked,
        resourceCount: resources.size,
        failures,
      },
    };
  });
}

function extractHtmlRefs(html) {
  const refs = [];
  const pattern = /\s(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

function resolveInternalResourceUrl(ref, pageUrl) {
  if (!ref || ref === "#" || ref.startsWith("#")) return null;
  if (/^(?:mailto:|tel:|javascript:|data:|blob:)/i.test(ref)) return null;
  const url = new URL(ref, pageUrl);
  if (url.origin !== workerOrigin) return null;
  if (url.pathname.startsWith("/api/")) return null;
  url.hash = "";
  return url;
}

async function checkRedirectRoute({ name, path, locationPath, locationSearchIncludes = [] }) {
  await recordCheck(name, async () => {
    const response = await fetchWithTimeout(urlFor(path), {
      timeoutMs: options.timeoutMs,
      redirect: "manual",
    });
    const location = response.headers.get("location") || "";
    const locationUrl = location ? new URL(location, workerUrl) : null;
    const failures = [];
    if (![301, 302, 307, 308].includes(response.status)) failures.push(`status ${response.status}`);
    if (!locationUrl) {
      failures.push("missing location");
    } else if (locationUrl.pathname !== locationPath) {
      failures.push(`location ${locationUrl.pathname}`);
    }
    for (const token of locationSearchIncludes) {
      if (!locationUrl?.search.includes(token)) failures.push(`missing query ${token}`);
    }
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${response.status} -> ${locationPath}${locationSearchIncludes.length ? locationUrl.search : ""}`,
      meta: {
        path,
        status: response.status,
        location,
        locationSearch: locationUrl?.search || "",
      },
    };
  });
}

async function checkTextRoute({ name, path, includes, excludes = [] }) {
  await recordCheck(name, async () => {
    const response = await fetchWithTimeout(urlFor(path), { timeoutMs: options.timeoutMs });
    const body = await response.text();
    const failures = [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    for (const token of includes) {
      if (!body.includes(token)) failures.push(`missing ${token}`);
    }
    for (const token of excludes) {
      if (body.includes(token)) failures.push(`unexpected ${token}`);
    }
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${body.length} bytes`,
      meta: {
        path,
        status: response.status,
        bytes: body.length,
      },
    };
  });
}

async function checkBinaryRoute({ name, path, contentTypeIncludes, minBytes }) {
  await recordCheck(name, async () => {
    const response = await fetchWithTimeout(urlFor(path), { timeoutMs: options.timeoutMs });
    const contentType = response.headers.get("content-type") || "";
    const body = Buffer.from(await response.arrayBuffer());
    const failures = [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (!contentType.includes(contentTypeIncludes)) failures.push(`content-type ${contentType || "missing"}`);
    if (body.length < minBytes) failures.push(`small body ${body.length}`);
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${contentType}, ${body.length} bytes`,
      meta: {
        path,
        status: response.status,
        contentType,
        bytes: body.length,
      },
    };
  });
}

async function checkOfficialSamplesApi() {
  await recordCheck("official samples api", async () => {
    const response = await fetchWithTimeout(urlFor("/api/demo/official-samples"), { timeoutMs: options.timeoutMs });
    const text = await response.text();
    let data = null;
    const failures = [];
    try {
      data = JSON.parse(text);
    } catch (error) {
      failures.push(`invalid json: ${error.message}`);
    }

    const samples = Array.isArray(data?.samples) ? data.samples : Array.isArray(data) ? data : [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (samples.length < 5) failures.push(`expected >=5 samples, got ${samples.length}`);

    const ids = new Set();
    for (const sample of samples) {
      if (typeof sample?.id === "string") ids.add(sample.id);
      if (!sample?.id) failures.push("sample missing id");
      if (!sample?.generatorUrl) failures.push(`${sample?.id || "sample"} missing generatorUrl`);
      if (!sample?.zipUrl) failures.push(`${sample?.id || "sample"} missing zipUrl`);
      if (!Array.isArray(sample?.files) || sample.files.length === 0) failures.push(`${sample?.id || "sample"} missing files`);
    }
    for (const requiredId of ["sample-monster-actions", "sample-ui-kit", "sample-map-tiles", "sample-ui-icons", "sample-skill-vfx"]) {
      if (!ids.has(requiredId)) failures.push(`missing ${requiredId}`);
    }

    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${samples.length} samples`,
      meta: {
        path: "/api/demo/official-samples",
        status: response.status,
        sampleCount: samples.length,
        sampleIds: Array.from(ids).sort(),
      },
    };
  });
}

async function checkVideoSpriteDemoApi() {
  await recordCheck("video sprite demo api", async () => {
    const response = await fetchWithTimeout(urlFor("/api/demo/video-sprite"), { timeoutMs: options.timeoutMs });
    const data = await readJsonBody(response);
    const demos = Array.isArray(data?.demos) ? data.demos : [];
    const ids = new Set(demos.map((demo) => demo?.id).filter(Boolean));
    const failures = [];

    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (data?.ok !== true) failures.push("ok false");
    if (data?.configured !== true) failures.push("configured false");
    if (data?.available !== true) failures.push("available false");
    if (data?.demo?.id !== "pure-chroma-slime-v1") failures.push(`default ${data?.demo?.id || "missing"}`);
    if (demos.length < 3) failures.push(`expected >=3 demos, got ${demos.length}`);

    for (const requiredId of ["pure-chroma-slime-v1", "wan-smoke-slime-v1", "expressive-slime-hop-v1"]) {
      if (!ids.has(requiredId)) failures.push(`missing ${requiredId}`);
    }

    for (const demo of demos) {
      const id = demo?.id || "demo";
      if (!demo?.title) failures.push(`${id} missing title`);
      if (!demo?.fileKey?.startsWith("library/files/video-sprite/")) failures.push(`${id} fileKey mismatch`);
      if (!demo?.url) failures.push(`${id} missing signed url`);
      if (demo?.url) {
        try {
          const signedUrl = new URL(demo.url, workerUrl);
          if (signedUrl.pathname !== "/api/library/view") failures.push(`${id} signed path ${signedUrl.pathname}`);
          if (!signedUrl.searchParams.get("key")) failures.push(`${id} missing key param`);
          if (!signedUrl.searchParams.get("exp")) failures.push(`${id} missing exp param`);
          if (!signedUrl.searchParams.get("sig")) failures.push(`${id} missing sig param`);
        } catch (error) {
          failures.push(`${id} invalid signed url: ${error.message}`);
        }
      }
      if (!String(demo?.contentType || "").includes("video/webm")) failures.push(`${id} contentType ${demo?.contentType || "missing"}`);
      if (typeof demo?.size !== "number" || demo.size <= 0) failures.push(`${id} missing size`);
      if (demo?.frames !== 4) failures.push(`${id} frames ${demo?.frames || "missing"}`);
      if (demo?.dimensions?.width !== 512 || demo?.dimensions?.height !== 512) failures.push(`${id} dimensions mismatch`);
      if (demo?.quality?.score !== 100) failures.push(`${id} score ${demo?.quality?.score ?? "missing"}`);
      if (typeof demo?.quality?.motion?.motionScore !== "number") failures.push(`${id} missing motionScore`);
      if (typeof demo?.quality?.motion?.loopScore !== "number") failures.push(`${id} missing loopScore`);
      if (demo?.generatorPath !== `/generator/?demo=video-sprite&sample=${encodeURIComponent(id)}`) failures.push(`${id} generatorPath mismatch`);
    }

    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.slice(0, 8).join("; ") : `${demos.length} demos, default ${data.demo.id}`,
      meta: {
        path: "/api/demo/video-sprite",
        status: response.status,
        available: data?.available === true,
        demoIds: Array.from(ids).sort(),
        failures,
      },
    };
  });
}

async function checkAllOfficialSampleZips() {
  const samples = await fetchOfficialSamples();
  for (const sample of samples) {
    const expectedEntries = [
      "manifest.json",
      "README.txt",
      ...normalizeOfficialSampleFiles(sample).map((file) => file.path).filter(Boolean),
    ];
    await checkOfficialSampleZip({
      id: sample.id,
      path: sample.zipUrl || `/api/demo/official-samples/${encodeURIComponent(sample.id)}/download.zip`,
      expectedEntries,
    });
  }
}

async function checkOfficialSampleZipCacheReuse() {
  await recordCheck("official sample zip cache reuse", async () => {
    const samples = await fetchOfficialSamples();
    const sample = samples.find((item) => item.id === "sample-ui-kit") || samples[0];
    const path = sample?.zipUrl || `/api/demo/official-samples/${encodeURIComponent(sample?.id || "")}/download.zip`;
    const response = await fetchWithTimeout(urlFor(path), { timeoutMs: options.timeoutMs });
    const cacheHeader = response.headers.get("x-lingji-official-sample-cache") || "";
    const body = Buffer.from(await response.arrayBuffer());
    const failures = [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (cacheHeader !== "hit") failures.push(`cache ${cacheHeader || "missing"}`);
    if (body.length < 1024) failures.push(`small zip ${body.length}`);
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${sample.id} ${cacheHeader}, ${body.length} bytes`,
      meta: {
        sampleId: sample?.id || null,
        path,
        status: response.status,
        cacheHeader,
        bytes: body.length,
      },
    };
  });
}

async function checkOfficialSampleLinks() {
  await recordCheck("official sample generator links", async () => {
    const samples = await fetchOfficialSamples();
    const generatorOptions = await fetchGeneratorFormOptions();
    const failures = [];
    const checked = [];
    for (const sample of samples) {
      const generatorUrl = new URL(sample.generatorUrl || "", workerUrl);
      const params = generatorUrl.searchParams;
      if (generatorUrl.pathname !== "/generator/") failures.push(`${sample.id} path ${generatorUrl.pathname}`);
      for (const key of ["preset", "assetType", "style", "camera"]) {
        const value = params.get(key);
        if (!value) {
          failures.push(`${sample.id} missing ${key}`);
        } else if (!generatorOptions[key]?.has(value)) {
          failures.push(`${sample.id} unsupported ${key}=${value}`);
        }
      }
      const brief = params.get("brief") || "";
      if (brief.trim().length < 12) failures.push(`${sample.id} brief too short`);
      const response = await fetchWithTimeout(generatorUrl, { timeoutMs: options.timeoutMs });
      const body = await response.text();
      if (response.status !== 200) failures.push(`${sample.id} generator status ${response.status}`);
      if (!body.includes("assetBlueprint") || !body.includes("usageGuidance")) failures.push(`${sample.id} generator content mismatch`);
      checked.push(sample.id);
    }
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.slice(0, 8).join("; ") : `${checked.length} generator URLs`,
      meta: {
        sampleIds: checked,
        failures,
      },
    };
  });

  await recordCheck("official sample image assets", async () => {
    const samples = await fetchOfficialSamples();
    const failures = [];
    const assets = [];
    for (const sample of samples) {
      for (const file of normalizeOfficialSampleFiles(sample)) {
        const assetUrl = new URL(file.url || `/assets/generated/official/${file.filename}`, workerUrl);
        const response = await fetchWithTimeout(assetUrl, { timeoutMs: options.timeoutMs });
        const contentType = response.headers.get("content-type") || "";
        const body = Buffer.from(await response.arrayBuffer());
        if (response.status !== 200) failures.push(`${sample.id}/${file.filename} status ${response.status}`);
        if (!contentType.includes("image/png")) failures.push(`${sample.id}/${file.filename} content-type ${contentType || "missing"}`);
        if (body.length < 256) failures.push(`${sample.id}/${file.filename} small ${body.length}`);
        assets.push({ sampleId: sample.id, filename: file.filename, bytes: body.length });
      }
    }
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.slice(0, 8).join("; ") : `${assets.length} png assets`,
      meta: {
        assetCount: assets.length,
        assets,
        failures,
      },
    };
  });
}

async function fetchGeneratorFormOptions() {
  const response = await fetchWithTimeout(urlFor("/generator/"), { timeoutMs: options.timeoutMs });
  const html = await response.text();
  if (response.status !== 200) {
    throw new Error(`generator form failed: ${response.status}`);
  }
  return {
    assetType: parseSelectOptionValues(html, "assetType"),
    camera: parseSelectOptionValues(html, "camera"),
    preset: parseSelectOptionValues(html, "preset"),
    style: parseSelectOptionValues(html, "style"),
  };
}

function parseSelectOptionValues(html, selectId) {
  const selectPattern = new RegExp(`<select\\b[^>]*\\bid=["']${escapeRegex(selectId)}["'][^>]*>([\\s\\S]*?)<\\/select>`, "i");
  const selectMatch = selectPattern.exec(html);
  if (!selectMatch) {
    throw new Error(`missing generator select ${selectId}`);
  }
  const values = new Set();
  const optionPattern = /<option\b[^>]*\bvalue=["']([^"']+)["'][^>]*>/gi;
  let optionMatch;
  while ((optionMatch = optionPattern.exec(selectMatch[1])) !== null) {
    values.add(optionMatch[1]);
  }
  if (values.size === 0) {
    throw new Error(`empty generator select ${selectId}`);
  }
  return values;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function checkOfficialSampleZip({ id, path, expectedEntries }) {
  await recordCheck(`${id} zip`, async () => {
    const response = await fetchWithTimeout(urlFor(path), { timeoutMs: options.timeoutMs });
    const contentType = response.headers.get("content-type") || "";
    const sampleHeader = response.headers.get("x-lingji-official-sample") || "";
    const cacheHeader = response.headers.get("x-lingji-official-sample-cache") || "";
    const cacheControl = response.headers.get("cache-control") || "";
    const body = Buffer.from(await response.arrayBuffer());
    const zipText = body.toString("latin1");
    const failures = [];
    if (response.status !== 200) failures.push(`status ${response.status}`);
    if (!contentType.includes("application/zip")) failures.push(`content-type ${contentType || "missing"}`);
    if (sampleHeader && sampleHeader !== id) failures.push(`sample header ${sampleHeader}`);
    if (!["hit", "miss"].includes(cacheHeader)) failures.push(`cache ${cacheHeader || "missing"}`);
    if (!cacheControl.includes("max-age=")) failures.push(`cache-control ${cacheControl || "missing"}`);
    if (body.length < 1024) failures.push(`small zip ${body.length}`);
    for (const entry of expectedEntries) {
      if (!zipText.includes(entry)) failures.push(`missing ${entry}`);
    }
    return {
      ok: failures.length === 0,
      detail: failures.length ? failures.join("; ") : `${body.length} bytes`,
      meta: {
        path,
        status: response.status,
        contentType,
        sampleHeader,
        cacheHeader,
        cacheControl,
        bytes: body.length,
        expectedEntries,
      },
    };
  });
}

async function fetchOfficialSamples() {
  const response = await fetchWithTimeout(urlFor("/api/demo/official-samples"), { timeoutMs: options.timeoutMs });
  const data = await readJsonBody(response);
  if (response.status !== 200 || !Array.isArray(data?.samples)) {
    throw new Error(`official samples api failed: ${response.status}`);
  }
  return data.samples;
}

function normalizeOfficialSampleFiles(sample) {
  return (Array.isArray(sample?.files) ? sample.files : []).map((file) => {
    if (Array.isArray(file)) {
      const label = file[1] || file[0] || "";
      return {
        filename: file[0] || "",
        label,
        path: `frames/${zipSegment(label)}.png`,
      };
    }
    return {
      filename: file?.filename || "",
      label: file?.label || file?.filename || "",
      path: file?.path || "",
      url: file?.url || "",
    };
  });
}

function zipSegment(value) {
  return String(value || "file")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "file";
}

async function recordCheck(name, fn) {
  try {
    const result = await fn();
    checks.push({ name, ...result });
    console.log(`${result.ok ? "PASS" : "FAIL"} ${name}: ${result.detail}`);
  } catch (error) {
    const detail = error?.message || String(error);
    checks.push({ name, ok: false, detail });
    console.log(`FAIL ${name}: ${detail}`);
  }
}

async function fetchWithTimeout(url, { timeoutMs, redirect = "follow", headers = {} }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect,
      headers: {
        "cache-control": "no-cache",
        ...headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJsonBody(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { parseError: true, text: text.slice(0, 240) };
  }
}

function authHeaders() {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

function urlFor(path) {
  const url = new URL(path, workerUrl);
  if (!url.pathname.startsWith("/api/")) {
    url.searchParams.set("smoke", checkedAt);
  }
  return url;
}

function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    failFast(`Invalid worker URL: ${value}`);
  }
  url.pathname = url.pathname.replace(/\/+$/, "/");
  url.search = "";
  url.hash = "";
  return url.toString();
}

function parseArgs(argv) {
  const parsed = {
    accessToken: null,
    help: false,
    outputPath: null,
    requireAuthApi: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    workerUrl: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--access-token") {
      parsed.accessToken = requiredValue(argv, i += 1, "--access-token");
    } else if (arg === "--require-auth-api") {
      parsed.requireAuthApi = true;
    } else if (arg === "--worker-url") {
      parsed.workerUrl = requiredValue(argv, i += 1, "--worker-url");
    } else if (arg === "--output") {
      parsed.outputPath = requiredValue(argv, i += 1, "--output");
    } else if (arg === "--timeout-ms") {
      parsed.timeoutMs = Number(requiredValue(argv, i += 1, "--timeout-ms"));
      if (!Number.isFinite(parsed.timeoutMs) || parsed.timeoutMs <= 0) failFast("--timeout-ms must be a positive number.");
    } else {
      failFast(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) failFast(`${flag} requires a value.`);
  return value;
}

function printUsage() {
  console.log(`Usage: node scripts/run-product-smoke.mjs [options]

Checks the deployed Landing, Generator, Library, Templates, official sample API, sample handoff links, and sample ZIP downloads.

Options:
  --access-token <token>  Access token for authenticated API smoke. Defaults to GENERATOR_ACCESS_TOKEN.
  --require-auth-api      Fail when no access token is available.
  --worker-url <url>   Worker base URL. Defaults to GENERATOR_WORKER_URL or ${DEFAULT_WORKER_URL}
  --output <path>      Write a JSON report.
  --timeout-ms <n>     Per-request timeout. Default: ${DEFAULT_TIMEOUT_MS}
  -h, --help           Show this help.
`);
}

function failFast(message) {
  console.error(message);
  process.exit(2);
}
