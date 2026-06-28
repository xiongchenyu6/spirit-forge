const ACCESS_TOKEN_KEY = "lingji-forge.generator-access-token.v1";
const LIBRARY_ITEM_PAGE_SIZE = 24;
const PACK_PAGE_SIZE = 12;

const state = {
  items: [],
  packs: [],
  samples: [],
  filter: "all",
  query: "",
  pagination: {
    itemCursor: null,
    packCursor: null,
    itemHasMore: false,
    packHasMore: false,
    loadingMore: false,
  },
  preview: {
    packId: "",
    frames: [],
    index: 0,
    playing: false,
    timer: null,
    frameRate: 8,
  },
  rerunRequest: 0,
  sam3PreviewUrls: [],
};

const $ = (selector) => document.querySelector(selector);
const els = {
  status: $("#libraryStatus"),
  grid: $("#assetGrid"),
  searchInput: $("#searchInput"),
  filterTabs: document.querySelectorAll("[data-kind]"),
  refreshBtn: $("#refreshBtn"),
  authPanel: $("#authPanel"),
  accessToken: $("#accessToken"),
  saveAccessTokenBtn: $("#saveAccessTokenBtn"),
  packDetailPanel: $("#packDetailPanel"),
  paginationBar: $("#paginationBar"),
};

const OFFICIAL_SAMPLE_BASE = "../../assets/generated/official/";
const OFFICIAL_MONSTER_ACTIONS_PACK_ID = "db8c0fff-918e-4e76-baef-9064e9b47052";
const OFFICIAL_MONSTER_ACTIONS_FRAME_COUNT = 8;
const OFFICIAL_MONSTER_ACTIONS_BRIEF = "同一只红黑色甲壳怪物，橙红背刺，深色腹甲，弯尾，尖牙大嘴，完整身体居中，纯色背景；生成 idle、move、attack、death 四个动作 clip，每个动作 8 帧；每一帧必须是不同关键姿势，保持同一怪物身份和比例";
const OFFICIAL_MONSTER_ACTION_FILES = monsterActionFiles(OFFICIAL_MONSTER_ACTIONS_FRAME_COUNT);
const OFFICIAL_SAMPLES = [
  {
    id: "sample-monster-actions",
    title: "怪物动作 4×8 帧",
    kind: "sample",
    assetKind: "pack",
    preset: "monster-actions",
    assetType: "creature",
    style: "pixel",
    camera: "front",
    brief: OFFICIAL_MONSTER_ACTIONS_BRIEF,
    summary: "Idle / Move / Attack / Death 四个动作 clip，每个动作 8 帧；用于当前 2D 怪物动作、Sprite Sheet、Godot/Unity 导入和 SAM3 Spine 回归基线",
    tags: ["monster", "sprite", "sam3"],
    demoPackId: OFFICIAL_MONSTER_ACTIONS_PACK_ID,
    files: OFFICIAL_MONSTER_ACTION_FILES,
  },
  {
    id: "sample-skill-vfx",
    title: "技能特效四帧",
    kind: "sample",
    assetKind: "2d",
    preset: "skill-vfx",
    assetType: "vfx",
    style: "pixel",
    camera: "front",
    brief: "像素风雷火技能特效，蓝紫闪电缠绕金色火花；需要 charge、burst、impact、fade 四帧循环，居中，纯色背景，轮廓清晰",
    summary: "Charge / Burst / Impact / Fade 真实输出样本，用于校准 VFX 帧表节奏和透明导出",
    tags: ["vfx", "sprite", "sheet"],
    files: [
      ["skill-vfx-charge.png", "Charge"],
      ["skill-vfx-burst.png", "Burst"],
      ["skill-vfx-impact.png", "Impact"],
      ["skill-vfx-fade.png", "Fade"],
    ],
  },
  {
    id: "sample-map-tiles",
    title: "地图 Tile 样本",
    kind: "sample",
    assetKind: "2d",
    preset: "map-tiles",
    assetType: "map",
    style: "pixel",
    camera: "top-down",
    brief: "俯视 RPG 地图 tile 表：草地、泥路、石路、水边、悬崖、沙地、森林地表、熔岩岩地；需要可平铺方块",
    summary: "俯视地形 tile 真实输出样本，用于检查视角、边缘连续性和 tileability",
    tags: ["map", "tile", "top-down"],
    files: [
      ["map-grass.png", "Grass"],
      ["map-stone-road.png", "Stone"],
      ["map-water-edge.png", "Water"],
      ["map-forest-floor.png", "Forest"],
    ],
  },
  {
    id: "sample-ui-kit",
    title: "奇幻 UI 套件",
    kind: "sample",
    assetKind: "2d",
    preset: "ui-kit",
    assetType: "ui",
    style: "production",
    camera: "front",
    brief: "奇幻游戏 UI 套件：生命条、法力条、背包格、动作按钮、对话面板、任务面板、九宫格角件、装饰分隔线；每格一个可切图组件",
    summary: "4x2 UI 组件 sheet 和 HUD 真实输出样本，用于检查组件可切性、边框完整度和材质一致性",
    tags: ["ui", "atlas", "hud"],
    files: [
      ["ui-kit-components-sheet.png", "Components"],
      ["ui-modern-hud.png", "HUD"],
    ],
  },
  {
    id: "sample-ui-icons",
    title: "物品图标样本",
    kind: "sample",
    assetKind: "2d",
    preset: "ui-icons",
    assetType: "icon",
    style: "pixel",
    camera: "front",
    brief: "RPG 背包图标表：玉剑、红药水、盾、钥匙、金币、卷轴、宝石、靴子；每格一个物品",
    summary: "背包和奖励图标真实输出样本，用于检查单格清晰度和光照统一",
    tags: ["icon", "item", "inventory"],
    files: [
      ["item-gem.png", "Gem"],
      ["item-jade-sword.png", "Sword"],
      ["item-shield.png", "Shield"],
    ],
  },
];

function monsterActionFiles(frameCount) {
  return ["idle", "move", "attack", "death"].flatMap((action) => (
    Array.from({ length: frameCount }, (_, index) => [
      `monster-actions/${action}-${index + 1}.png`,
      `${action[0].toUpperCase()}${action.slice(1)} ${index + 1}`,
    ])
  ));
}

function accessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

async function api(path) {
  const token = accessToken();
  const response = await fetch(path, {
    headers: token ? { "x-lingji-access-token": token } : {},
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) {
    showAuth();
  }
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `${response.status}`);
  }
  return data;
}

async function loadLibrary() {
  state.rerunRequest += 1;
  stopPackPreview();
  revokeSam3PreviewUrls();
  resetPagination();
  state.samples = await loadOfficialSamples();
  els.packDetailPanel.hidden = true;
  els.packDetailPanel.innerHTML = "";
  if (!accessToken()) {
    state.items = [];
    state.packs = [];
    showAuth();
    setStatus(`${state.samples.length} 个官方样本`, "warn");
    render();
    return;
  }
  setStatus("连接中", "loading");
  els.grid.innerHTML = renderLoading();
  try {
    const [libraryResult, packResult] = await Promise.allSettled([
      api(`/api/library?limit=${LIBRARY_ITEM_PAGE_SIZE}`),
      api(`/api/packs?limit=${PACK_PAGE_SIZE}`),
    ]);
    const libraryData = libraryResult.status === "fulfilled" ? libraryResult.value : null;
    const packData = packResult.status === "fulfilled" ? packResult.value : null;
    if (!libraryData && !packData) {
      throw libraryResult.reason || packResult.reason || new Error("素材库暂时不可用");
    }
    state.items = Array.isArray(libraryData?.items) ? libraryData.items : [];
    state.packs = Array.isArray(packData?.packs) ? packData.packs : [];
    applyPagination(libraryData, packData);
    els.authPanel.hidden = true;
    const configured = Boolean(libraryData?.configured || packData?.configured);
    const total = state.items.length + state.packs.length + state.samples.length;
    const hasMore = state.pagination.itemHasMore || state.pagination.packHasMore;
    const partial = !libraryData || !packData;
    setStatus(
      configured
        ? partial
          ? `${total} 个已加载 · 部分刷新${hasMore ? " · 可继续加载" : ""}`
          : `${total} 个已加载${hasMore ? " · 可继续加载" : ""}`
        : "未配置存储",
      configured && !partial ? "ready" : "warn",
    );
    render();
  } catch (error) {
    state.items = [];
    state.packs = [];
    showAuth();
    setStatus(`${state.samples.length} 个官方样本 · 云端读取失败`, "warn");
    render();
  }
}

function resetPagination() {
  state.pagination = {
    itemCursor: null,
    packCursor: null,
    itemHasMore: false,
    packHasMore: false,
    loadingMore: false,
  };
}

function applyPagination(libraryData, packData) {
  if (libraryData) {
    state.pagination.itemCursor = libraryData.nextCursor || null;
    state.pagination.itemHasMore = Boolean(libraryData.nextCursor || libraryData.page?.hasMore);
  }
  if (packData) {
    state.pagination.packCursor = packData.nextCursor || null;
    state.pagination.packHasMore = Boolean(packData.nextCursor || packData.page?.hasMore);
  }
}

async function loadMoreLibrary() {
  if (state.pagination.loadingMore) return;
  const canLoadItems = state.pagination.itemHasMore && state.pagination.itemCursor !== null;
  const canLoadPacks = state.pagination.packHasMore && state.pagination.packCursor !== null;
  if (!canLoadItems && !canLoadPacks) return;

  state.pagination.loadingMore = true;
  renderPagination();
  setStatus("加载下一页", "loading");
  try {
    const [libraryResult, packResult] = await Promise.allSettled([
      canLoadItems
        ? api(`/api/library?limit=${LIBRARY_ITEM_PAGE_SIZE}&cursor=${encodeURIComponent(state.pagination.itemCursor)}`)
        : Promise.resolve(null),
      canLoadPacks
        ? api(`/api/packs?limit=${PACK_PAGE_SIZE}&cursor=${encodeURIComponent(state.pagination.packCursor)}`)
        : Promise.resolve(null),
    ]);
    const libraryData = libraryResult.status === "fulfilled" ? libraryResult.value : null;
    const packData = packResult.status === "fulfilled" ? packResult.value : null;
    if (libraryData?.items?.length) appendUniqueBy(state.items, libraryData.items, "id");
    if (packData?.packs?.length) appendUniqueBy(state.packs, packData.packs, "packId");
    applyPagination(libraryData, packData);
    const failed = (canLoadItems && libraryResult.status === "rejected") || (canLoadPacks && packResult.status === "rejected");
    const total = state.items.length + state.packs.length + state.samples.length;
    const hasMore = state.pagination.itemHasMore || state.pagination.packHasMore;
    setStatus(`${total} 个已加载${hasMore ? " · 可继续加载" : ""}`, failed ? "warn" : "ready");
    render();
  } catch (error) {
    setStatus("分页加载失败", "warn");
    console.warn("Library pagination failed", error);
  } finally {
    state.pagination.loadingMore = false;
    renderPagination();
  }
}

function appendUniqueBy(target, items, key) {
  const seen = new Set(target.map((item) => item?.[key]).filter(Boolean));
  for (const item of items) {
    const id = item?.[key];
    if (!id || seen.has(id)) continue;
    target.push(item);
    seen.add(id);
  }
}

async function loadOfficialSamples() {
  try {
    const response = await fetch("/api/demo/official-samples", {
      headers: { accept: "application/json" },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(data?.samples)) throw new Error(data?.message || data?.error || `${response.status}`);
    return data.samples.map(normalizeOfficialSample).filter(Boolean);
  } catch (error) {
    console.warn("Official samples API failed, using local fallback", error);
    return OFFICIAL_SAMPLES.map(normalizeOfficialSample).filter(Boolean);
  }
}

function normalizeOfficialSample(sample) {
  if (!sample?.id) return null;
  const input = sample.input || {};
  return {
    id: sample.id,
    title: sample.title || sample.id,
    kind: sample.kind || "official-sample",
    assetKind: sample.assetKind || (sample.preset === "monster-actions" ? "pack" : "2d"),
    preset: sample.preset || input.preset || "",
    assetType: sample.assetType || input.assetType || "",
    style: sample.style || input.style || "",
    camera: sample.camera || input.camera || "",
    brief: sample.brief || input.brief || "",
    summary: sample.summary || "",
    tags: Array.isArray(sample.tags) ? sample.tags : [],
    demoPackId: sample.demoPackId || "",
    generatorUrl: sample.generatorUrl || "",
    zipUrl: sample.zipUrl || "",
    files: normalizeOfficialSampleFiles(sample.files),
  };
}

function normalizeOfficialSampleFiles(files) {
  return (Array.isArray(files) ? files : []).map((file, index) => {
    if (Array.isArray(file)) {
      const [filename, label] = file;
      return {
        index,
        label: label || filename,
        filename,
        url: sampleFileUrl(filename),
      };
    }
    return {
      index: Number.isFinite(Number(file?.index)) ? Number(file.index) : index,
      label: file?.label || file?.filename || `Frame ${index + 1}`,
      filename: file?.filename || "",
      path: file?.path || "",
      url: file?.url || sampleFileUrl(file?.filename),
    };
  }).filter((file) => file.filename || file.url);
}

function showAuth() {
  els.authPanel.hidden = false;
  els.accessToken.value = accessToken();
}

function setStatus(text, tone) {
  els.status.classList.toggle("ready", tone === "ready");
  els.status.classList.toggle("warn", tone === "warn");
  els.status.querySelector("span:last-child").textContent = text;
}

function render() {
  const entries = filteredEntries();
  if (entries.length === 0) {
    els.grid.innerHTML = renderEmpty("暂无匹配素材", "官方样本和云端素材都没有匹配当前筛选");
  } else {
    els.grid.innerHTML = entries.map(renderEntryCard).join("");
  }
  renderPagination();
  if (window.lucide) window.lucide.createIcons();
}

function renderPagination() {
  if (!els.paginationBar) return;
  const cloudCount = state.items.length + state.packs.length;
  const hasMore = state.pagination.itemHasMore || state.pagination.packHasMore;
  const loading = state.pagination.loadingMore;
  if (!accessToken() || (cloudCount === 0 && !hasMore)) {
    els.paginationBar.hidden = true;
    els.paginationBar.innerHTML = "";
    return;
  }
  els.paginationBar.hidden = false;
  els.paginationBar.innerHTML = `
    <div>
      <strong>已加载 ${cloudCount} 个云端素材</strong>
      <span>${hasMore ? "继续分页加载，避免首屏拉取过重" : "已到当前列表末尾"}</span>
    </div>
    <button type="button" data-library-page-action="more" ${!hasMore || loading ? "disabled" : ""}>
      ${loading ? '<span class="spinner"></span>' : '<i data-lucide="chevrons-down"></i>'}
      <span>${loading ? "加载中" : hasMore ? "加载更多" : "没有更多"}</span>
    </button>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function filteredEntries() {
  const query = state.query.toLowerCase();
  const samples = state.samples.map((sample, index) => ({
    type: "sample",
    sortAt: Number.MAX_SAFE_INTEGER - index,
    sample,
  }));
  const assets = state.items.map((item) => ({
    type: "asset",
    sortAt: item.createdAt,
    item,
  }));
  const packs = state.packs.map((pack) => ({
    type: "pack",
    sortAt: pack.updatedAt || pack.createdAt,
    pack,
  }));
  return [...samples, ...packs, ...assets]
    .filter((entry) => {
      if (entry.type === "sample") {
        if (!["all", "sample"].includes(state.filter) && state.filter !== entry.sample.assetKind) return false;
        if (!query) return true;
        return sampleSearchValues(entry.sample).some((value) => String(value || "").toLowerCase().includes(query));
      }
      if (entry.type === "pack") {
        if (!["all", "pack"].includes(state.filter)) return false;
        if (!query) return true;
        return packSearchValues(entry.pack).some((value) => String(value || "").toLowerCase().includes(query));
      }
      if (state.filter !== "all" && entry.item.kind !== state.filter) return false;
      if (!query) return true;
      return [
        entry.item.filename,
        entry.item.promptId,
        entry.item.kind,
        entry.item.contentType,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((a, b) => entrySortValue(b) - entrySortValue(a));
}

function entrySortValue(entry) {
  if (typeof entry.sortAt === "number") return entry.sortAt;
  const timestamp = new Date(entry.sortAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sampleSearchValues(sample) {
  return [
    sample.id,
    sample.title,
    sample.preset,
    sample.brief,
    sample.summary,
    sample.assetKind,
    sample.assetType,
    sample.style,
    sample.camera,
    ...(sample.tags || []),
    ...(sample.files || []).flatMap((file) => [file.filename, file.label, file.url, file.path]),
  ];
}

function packSearchValues(pack) {
  return [
    pack.packId,
    pack.preset,
    pack.packKind,
    pack.status,
    ...(packHasSpineExport(pack) ? ["spine", "rig-template", "skeleton.json", "skeleton.atlas", "parts.atlas"] : []),
    ...(packHasSam3Layers(pack) ? ["sam3", "sam3-layers", "layer-separation", "分层", "quality.json"] : []),
    pack.input?.brief,
    ...(pack.frames || []).flatMap((frame) => [frame.id, frame.label, frame.promptId, frame.result?.filename]),
  ];
}

function renderEntryCard(entry) {
  if (entry.type === "sample") return renderSampleCard(entry.sample);
  return entry.type === "pack" ? renderPackCard(entry.pack) : renderAssetCard(entry.item);
}

function renderSampleCard(sample) {
  const files = sample.files || [];
  const cover = files[0]?.url || "";
  const generatorHref = sampleGeneratorHref(sample);
  return `
    <article class="asset-card sample-card">
      <a class="asset-preview sample-preview" href="${escapeHtml(cover || generatorHref)}" target="_blank" rel="noreferrer">
        ${cover
          ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(sample.title)}" loading="lazy" />`
          : `<i data-lucide="image"></i>`}
        <span>OFFICIAL</span>
      </a>
      <div class="sample-frame-strip">
        ${files.map((file) => `
          <a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(file.label || file.filename)}">
            <img src="${escapeHtml(file.url)}" alt="" loading="lazy" />
          </a>
        `).join("")}
      </div>
      <div class="asset-body">
        <strong title="${escapeHtml(sample.title)}">${escapeHtml(sample.title)}</strong>
        <span>${escapeHtml(sample.preset || "sample")} · ${escapeHtml((sample.tags || []).join(" / "))}</span>
        <small>${escapeHtml(sample.summary)}</small>
      </div>
      <div class="asset-actions">
        <button type="button" data-sample-action="detail" data-sample-id="${escapeHtml(sample.id)}">
          <i data-lucide="eye"></i>
          <span>详情</span>
        </button>
        <a href="${escapeHtml(generatorHref)}">
          <i data-lucide="wand-sparkles"></i>
          <span>生成同类</span>
        </a>
        <a href="${escapeHtml(sampleZipHref(sample))}" download>
          <i data-lucide="archive"></i>
          <span>ZIP</span>
        </a>
        ${cover ? `<a href="${escapeHtml(cover)}" download><i data-lucide="download"></i><span>下载</span></a>` : ""}
      </div>
    </article>
  `;
}

function sampleFileUrl(file) {
  return `${OFFICIAL_SAMPLE_BASE}${file}`;
}

function sampleGeneratorHref(sample) {
  if (sample.generatorUrl) return sample.generatorUrl;
  const params = new URLSearchParams();
  if (sample.preset) params.set("preset", sample.preset);
  if (sample.assetType) params.set("assetType", sample.assetType);
  if (sample.style) params.set("style", sample.style);
  if (sample.camera) params.set("camera", sample.camera);
  if (sample.brief) params.set("brief", sample.brief);
  if (sample.demoPackId) params.set("demoPackId", sample.demoPackId);
  return `/generator/?${params.toString()}`;
}

function sampleZipHref(sample) {
  if (sample.zipUrl) return sample.zipUrl;
  return `/api/demo/official-samples/${encodeURIComponent(sample.id)}/download.zip`;
}

function openSampleDetail(sampleId) {
  const sample = state.samples.find((item) => item.id === sampleId);
  if (!sample) return;
  renderSampleDetail(sample);
  setStatus("官方样本详情已打开", "ready");
}

function renderSampleDetail(sample) {
  stopPackPreview();
  revokeSam3PreviewUrls();
  const files = sample.files || [];
  const manifestHref = sampleManifestDataHref(sample);
  const manifestName = `${safeFilename(sample.preset || sample.id)}-official-sample.json`;
  const generatorHref = sampleGeneratorHref(sample);
  const zipHref = sampleZipHref(sample);
  els.packDetailPanel.hidden = false;
  els.packDetailPanel.innerHTML = `
    <div class="pack-detail-header">
      <div>
        <strong>${escapeHtml(sample.title)}</strong>
        <span>官方样本 · ${escapeHtml(sample.preset || "sample")} · ${files.length} 张</span>
      </div>
      <button class="pack-detail-close" type="button" data-pack-detail-close aria-label="关闭详情">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="sample-detail-summary">
      <p>${escapeHtml(sample.summary)}</p>
      <div class="sample-detail-tags">
        ${(sample.tags || []).map((tag) => `<code>${escapeHtml(tag)}</code>`).join("")}
      </div>
    </div>
    <div class="pack-detail-actions">
      <a href="${escapeHtml(generatorHref)}">
        <i data-lucide="wand-sparkles"></i>
        <span>生成同类</span>
      </a>
      <a href="${escapeHtml(manifestHref)}" download="${escapeHtml(manifestName)}">
        <i data-lucide="braces"></i>
        <span>下载 Manifest</span>
      </a>
      <a href="${escapeHtml(zipHref)}" download>
        <i data-lucide="archive"></i>
        <span>下载 ZIP</span>
      </a>
    </div>
    <section class="sample-detail-grid" aria-label="官方样本帧">
      ${files.map((file, index) => renderSampleDetailFrame(sample, file, index)).join("")}
    </section>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function renderSampleDetailFrame(sample, file, index) {
  const url = file.url;
  const name = file.label || file.filename || `Frame ${index + 1}`;
  return `
    <article class="sample-detail-frame">
      <a class="sample-detail-thumb" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" loading="lazy" />
      </a>
      <div class="sample-detail-frame-body">
        <strong>${escapeHtml(name)}</strong>
        <span>${escapeHtml(file.filename || url)}</span>
        <small>${escapeHtml(sample.preset || "sample")} · ${escapeHtml(file.path || `frame ${index + 1}`)}</small>
      </div>
      <div class="pack-detail-frame-actions">
        <a href="${escapeHtml(url)}" download>
          <i data-lucide="download"></i>
          <span>下载</span>
        </a>
        <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">打开</a>
      </div>
    </article>
  `;
}

function sampleManifestDataHref(sample) {
  const body = {
    version: 1,
    kind: "official-sample",
    id: sample.id,
    title: sample.title,
    preset: sample.preset,
    assetKind: sample.assetKind,
    input: {
      brief: sample.brief,
      assetType: sample.assetType,
      style: sample.style,
      camera: sample.camera,
      preset: sample.preset,
    },
    summary: sample.summary,
    tags: sample.tags || [],
    demoPackId: sample.demoPackId || "",
    files: (sample.files || []).map((file, index) => ({
      index: file.index ?? index,
      label: file.label,
      filename: file.filename,
      path: file.path || "",
      url: file.url,
    })),
    generatorUrl: sampleGeneratorHref(sample),
    zipUrl: sampleZipHref(sample),
  };
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(body, null, 2))}`;
}

function renderAssetCard(item) {
  const isImage = item.contentType?.startsWith("image/");
  const label = item.kind === "3d" ? "3D GLB" : "2D PNG";
  return `
    <article class="asset-card">
      <a class="asset-preview" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
        ${isImage
          ? `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.filename)}" loading="lazy" />`
          : `<i data-lucide="box"></i>`}
        <span>${escapeHtml(label)}</span>
      </a>
      <div class="asset-body">
        <strong title="${escapeHtml(item.filename)}">${escapeHtml(item.filename)}</strong>
        <span>${escapeHtml(formatDate(item.createdAt))}</span>
        <small>${escapeHtml(item.promptId)}</small>
      </div>
      <div class="asset-actions">
        <a href="${escapeHtml(item.url)}" download>
          <i data-lucide="download"></i>
          <span>下载</span>
        </a>
        ${item.comfyUrl ? `<a href="${escapeHtml(item.comfyUrl)}" target="_blank" rel="noreferrer">源文件</a>` : ""}
      </div>
    </article>
  `;
}

function renderPackCard(pack) {
  const frames = Array.isArray(pack.frames) ? pack.frames : [];
  const completed = pack.counts?.complete || frames.filter((frame) => frame.status === "complete").length;
  const total = pack.counts?.total || frames.length;
  const title = pack.input?.brief || pack.preset || "云端资产包";
  const cover = pack.cover?.url || frames.find((frame) => frame.result?.url)?.result?.url || "";
  const metadataHref = metadataDataHref(pack);
  const metadataName = `${safeFilename(pack.preset || "asset-pack")}-${String(pack.packId || "pack").slice(0, 8)}-metadata.json`;
  const importLabel = packHasSam3Layers(pack)
    ? " · SAM3 Spine ZIP"
    : packHasSpineExport(pack)
      ? " · Spine Rig ZIP"
      : "";
  return `
    <article class="asset-card pack-card">
      <a class="asset-preview pack-preview" href="${escapeHtml(cover || metadataHref)}" target="_blank" rel="noreferrer">
        ${cover
          ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="lazy" />`
          : `<i data-lucide="folder"></i>`}
        <span>2D PACK</span>
      </a>
      <div class="pack-frame-strip">
        ${frames.slice(0, 4).map((frame) => frame.result?.url
          ? `<a href="${escapeHtml(frame.result.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(frame.label || frame.id)}"><img src="${escapeHtml(frame.result.url)}" alt="" loading="lazy" /></a>`
          : `<span title="${escapeHtml(frame.label || frame.id)}"><i data-lucide="image"></i></span>`).join("")}
      </div>
      <div class="asset-body">
        <strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
        <span>${escapeHtml(packStatusLabel(pack.status))} · ${completed}/${total} 帧 · ${escapeHtml(pack.preset || "pack")}${escapeHtml(importLabel)}</span>
        <small>${escapeHtml(pack.packId)}</small>
      </div>
      <div class="asset-actions">
        <button type="button" data-pack-action="detail" data-pack-id="${escapeHtml(pack.packId)}">
          <i data-lucide="play"></i>
          <span>预览</span>
        </button>
        <button type="button" data-pack-action="zip" data-pack-id="${escapeHtml(pack.packId)}">
          <i data-lucide="archive"></i>
          <span>ZIP</span>
        </button>
        <a href="${escapeHtml(metadataHref)}" download="${escapeHtml(metadataName)}">
          <i data-lucide="braces"></i>
          <span>Metadata</span>
        </a>
        ${cover ? `<a href="${escapeHtml(cover)}" target="_blank" rel="noreferrer">封面</a>` : ""}
      </div>
    </article>
  `;
}

function metadataDataHref(pack) {
  const body = {
    packId: pack.packId,
    kind: pack.kind,
    status: pack.status,
    preset: pack.preset,
    packKind: pack.packKind,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
    counts: pack.counts,
    input: pack.input || null,
    metadata: pack.metadata || null,
    spineSam3Layers: pack.spineSam3Layers || null,
    frames: (pack.frames || []).map((frame) => ({
      id: frame.id,
      label: frame.label,
      promptId: frame.promptId,
      seed: frame.seed,
      status: frame.status,
      row: frame.row,
      column: frame.column,
      dimensions: frame.dimensions,
      filename: frame.result?.filename || null,
      contentType: frame.result?.contentType || null,
      url: frame.result?.url || null,
      comfyUrl: frame.result?.comfyUrl || null,
    })),
  };
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(body, null, 2))}`;
}

function packStatusLabel(status) {
  const map = {
    queued: "等待中",
    partial: "部分完成",
    complete: "完成",
    error: "失败",
  };
  return map[status] || status || "未知";
}

function safeFilename(value) {
  return String(value || "asset-pack").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "asset-pack";
}

async function downloadPackZip(packId) {
  if (!packId) return;
  const pack = state.packs.find((item) => item.packId === packId);
  setStatus("打包下载中", "loading");
  const response = await fetch(`/api/packs/${encodeURIComponent(packId)}/download.zip`, {
    headers: accessToken() ? { "x-lingji-access-token": accessToken() } : {},
  });
  if (response.status === 401) {
    showAuth();
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || data?.error || `${response.status}`);
  }
  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get("content-disposition"))
    || `${safeFilename(pack?.preset || "asset-pack")}-${String(packId).slice(0, 8)}.zip`;
  triggerBlobDownload(blob, filename);
  setStatus("ZIP 已开始下载", "ready");
}

async function rerunPackFrame(packId, frameId) {
  if (!packId || !frameId) return;
  const pack = state.packs.find((item) => item.packId === packId);
  const frame = (pack?.frames || []).find((item) => item.id === frameId);
  const label = frame?.label || frameId;
  if (!window.confirm(`重跑 ${label} 会消耗一次单帧生成额度，继续吗？`)) return;
  setStatus("提交单帧重跑", "loading");
  const response = await fetch(`/api/packs/${encodeURIComponent(packId)}/frames/${encodeURIComponent(frameId)}/rerun`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessToken() ? { "x-lingji-access-token": accessToken() } : {}),
    },
    body: JSON.stringify({}),
  });
  if (response.status === 401) {
    showAuth();
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `${response.status}`);
  }
  if (data?.pack) {
    state.packs = [data.pack, ...state.packs.filter((item) => item.packId !== data.pack.packId)];
    renderPackDetail(data.pack);
    render();
  }
  setStatus(`${label} 已提交重跑`, "loading");
  if (data?.job?.promptId) {
    await pollRerunCompletion({
      packId,
      frameId,
      promptId: data.job.promptId,
      label,
    });
  } else {
    setStatus(`${label} 已提交重跑`, "ready");
  }
}

async function pollRerunCompletion({ packId, frameId, promptId, label }) {
  const requestId = ++state.rerunRequest;
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    if (requestId !== state.rerunRequest) return;
    await sleep(2500);
    if (requestId !== state.rerunRequest) return;
    setStatus(`${label} 重跑中 ${attempt}`, "loading");
    const job = await api(`/api/jobs/${encodeURIComponent(promptId)}?kind=2d`);
    if (job.status === "complete" && job.result?.url) {
      const pack = await loadPackDetail(packId);
      if (pack) {
        state.packs = [pack, ...state.packs.filter((item) => item.packId !== pack.packId)];
        render();
        renderPackDetail(pack);
      }
      setStatus(`${label} 重跑完成`, "ready");
      return;
    }
    if (job.status === "error" || job.status === "complete_no_result") {
      const pack = await loadPackDetail(packId).catch(() => null);
      if (pack) renderPackDetail(pack);
      throw new Error(`${frameId} 重跑失败：${job.status}`);
    }
  }
  const pack = await loadPackDetail(packId).catch(() => null);
  if (pack) renderPackDetail(pack);
  setStatus(`${label} 仍在队列中`, "warn");
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function openPackDetail(packId) {
  if (!packId) return;
  setStatus("读取整包详情", "loading");
  const pack = await loadPackDetail(packId);
  renderPackDetail(pack);
  setStatus("整包详情已打开", "ready");
}

async function loadPackDetail(packId) {
  const cached = state.packs.find((item) => item.packId === packId);
  const response = await fetch(`/api/packs/${encodeURIComponent(packId)}`, {
    headers: accessToken() ? { "x-lingji-access-token": accessToken() } : {},
  });
  if (response.status === 401) {
    showAuth();
  }
  if (!response.ok) {
    if (cached) return cached;
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || data?.error || `${response.status}`);
  }
  const data = await response.json();
  const pack = data.pack || cached;
  if (pack) {
    state.packs = [pack, ...state.packs.filter((item) => item.packId !== pack.packId)];
  }
  return pack;
}

function renderPackDetail(pack) {
  if (!pack) return;
  stopPackPreview();
  revokeSam3PreviewUrls();
  const frames = Array.isArray(pack.frames) ? pack.frames : [];
  const previewFrames = playablePackFrames(pack);
  const completed = pack.counts?.complete || frames.filter((frame) => frame.status === "complete").length;
  const total = pack.counts?.total || frames.length;
  const title = pack.input?.brief || pack.preset || "云端资产包";
  const metadataHref = metadataDataHref(pack);
  const metadataName = `${safeFilename(pack.preset || "asset-pack")}-${String(pack.packId || "pack").slice(0, 8)}-metadata.json`;
  els.packDetailPanel.hidden = false;
  els.packDetailPanel.innerHTML = `
    <div class="pack-detail-header">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(packStatusLabel(pack.status))} · ${completed}/${total} 帧 · ${escapeHtml(pack.preset || "pack")}</span>
      </div>
      <button class="pack-detail-close" type="button" data-pack-detail-close aria-label="关闭详情">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="pack-detail-meta">
      <span>Pack ID</span>
      <code>${escapeHtml(pack.packId)}</code>
      <span>更新时间</span>
      <code>${escapeHtml(formatDate(pack.updatedAt || pack.createdAt))}</code>
    </div>
    ${renderPackImportBadges(pack)}
    <div class="pack-detail-actions">
      <button type="button" data-pack-action="zip" data-pack-id="${escapeHtml(pack.packId)}">
        <i data-lucide="archive"></i>
        <span>下载 ZIP</span>
      </button>
      <a href="${escapeHtml(metadataHref)}" download="${escapeHtml(metadataName)}">
        <i data-lucide="braces"></i>
        <span>下载 Metadata</span>
      </a>
    </div>
    ${renderPackPreviewSection(pack, previewFrames)}
    ${renderSam3PartComparison(pack)}
    <div class="pack-detail-frames">
      ${frames.map((frame) => renderPackDetailFrame(frame, pack)).join("")}
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
  if (packHasAnimationPreview(pack)) startPackPreview(pack, previewFrames);
  if (packHasSam3Layers(pack)) loadSam3PartComparisons(pack);
}

function playablePackFrames(pack) {
  return (pack.frames || []).filter((frame) => frame.result?.url);
}

function renderPackImportBadges(pack) {
  const manifests = packImportManifestNames(pack);
  if (manifests.length === 0) return "";
  return `
    <div class="pack-detail-imports" aria-label="导入清单">
      <span>导入清单</span>
      ${manifests.map((name) => `<code>${escapeHtml(name)}</code>`).join("")}
    </div>
  `;
}

function packImportManifestNames(pack) {
  const base = [
    "engine-import.json",
    "phaser-animations.json",
    "unity-sprites.json",
    "godot-sprites.json",
  ];
  if (pack.packKind === "tile-pack") return [...base, "tiled-tileset.json"];
  if (pack.packKind === "icon-pack" || pack.packKind === "ui-pack") return [...base, "ui-atlas.json", "phaser-atlas.json"];
  if (packHasSpineExport(pack)) {
    const spine = [
      ...base,
      "spine/skeleton.json",
      "spine/skeleton.atlas",
      "spine/rig-template/skeleton.json",
      "spine/rig-template/parts.atlas",
      "spine/rig-template/parts.json",
      "spine/rig-template/quality.json",
    ];
    if (packHasSam3Layers(pack)) {
      spine.push(
        "spine/sam3-layers/skeleton.json",
        "spine/sam3-layers/parts.atlas",
        "spine/sam3-layers/parts.json",
        "spine/sam3-layers/quality.json",
        "spine/sam3-layers/cleanup.json",
        "spine/sam3-layers/cleaned-skeleton.json",
        "spine/sam3-layers/cleaned-parts.atlas",
      );
    }
    return spine;
  }
  return base;
}

function packHasSpineExport(pack) {
  return pack?.packKind === "sprite-actions";
}

function packHasSam3Layers(pack) {
  return Boolean(pack?.spineSam3Layers?.available || pack?.spineSam3Layers?.jobId);
}

function renderSam3PartComparison(pack) {
  if (!packHasSam3Layers(pack)) return "";
  const parts = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];
  const cleanup = pack.spineSam3Layers?.cleanup || null;
  const cleanupSummary = cleanup?.summary || null;
  return `
    <section class="sam3-part-compare" aria-label="SAM3 Spine 分层对比">
      <div class="sam3-part-compare-head">
        <div>
          <strong>SAM3 Spine 分层对比</strong>
          <span>原始 cutout / cleaned cutout</span>
        </div>
        <code data-sam3-preview-status>${cleanupSummary
          ? `cleaned · ${cleanupSummary.remainingRiskyPairs ?? "-"} risky left`
          : "preview loading"}</code>
      </div>
      <div class="sam3-quality-strip" data-sam3-quality-strip>
        <span class="sam3-quality-pill info">读取质量摘要</span>
      </div>
      <p class="sam3-diagnostics" data-sam3-diagnostics>正在载入 SAM3 semantic diagnostics</p>
      <div class="sam3-anim-row" data-sam3-anim-row>
        <div class="sam3-anim-head"><strong>骨骼驱动动画</strong><span>Spine 绑骨 · 关节驱动循环</span></div>
        <div class="sam3-anim-clips">
          ${["idle", "walk", "attack"].map((clip) => `
            <figure class="sam3-anim-clip loading" data-rig-clip="${clip}">
              <img alt="${escapeHtml(`${clip} 骨骼动画`)}" loading="lazy" />
              <figcaption>${clip}</figcaption>
            </figure>
          `).join("")}
        </div>
      </div>
      <div class="sam3-part-grid">
        ${parts.map((part) => `
          <article class="sam3-part-row">
            <strong>${escapeHtml(sam3PartLabel(part))}</strong>
            ${renderSam3PartSlot(pack, "parts", part, "原始")}
            ${renderSam3PartSlot(pack, "cleaned-parts", part, "Cleaned")}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSam3PartSlot(pack, variant, part, label) {
  return `
    <a class="sam3-part-slot loading"
      href="${escapeHtml(sam3PartPreviewPath(pack, variant, part))}"
      target="_blank"
      rel="noreferrer"
      data-sam3-part-slot
      data-sam3-variant="${escapeHtml(variant)}"
      data-sam3-part="${escapeHtml(part)}">
      <span>${escapeHtml(label)}</span>
      <img alt="${escapeHtml(`${label} ${sam3PartLabel(part)}`)}" loading="lazy" />
    </a>
  `;
}

function sam3PartPreviewPath(pack, variant, part) {
  return `/api/packs/${encodeURIComponent(pack.packId)}/spine-sam3/${encodeURIComponent(variant)}/${encodeURIComponent(part)}.png`;
}

function sam3PartLabel(part) {
  return {
    head: "Head",
    torso: "Torso",
    hips: "Hips",
    arm_l: "Arm L",
    arm_r: "Arm R",
    leg_l: "Leg L",
    leg_r: "Leg R",
  }[part] || part;
}

function sam3QualityStatusLabel(status) {
  return {
    pass: "PASS",
    warn: "WARN",
    fail: "FAIL",
  }[status] || "CHECK";
}

function sam3SemanticProfileLabel(profile) {
  return {
    default: "Default",
    "monster-sideview-v1": "Monster side-view",
  }[profile] || profile || "Default";
}

function sam3SideViewOcclusionLabels(quality) {
  const pairBalance = quality?.semantics?.pairBalance || {};
  return [
    pairBalance.arms?.sideViewOcclusion ? "arms" : "",
    pairBalance.legs?.sideViewOcclusion ? "legs" : "",
  ].filter(Boolean);
}

function sam3QualityPillsHtml(data) {
  const quality = data?.quality || {};
  const cleanup = data?.cleanup?.summary || {};
  const summary = quality.summary || {};
  const profile = quality.semantics?.profile || "default";
  const remainingRiskyPairs = cleanup.remainingRiskyPairs ?? summary.cleanupRemainingRiskyPairs;
  const cleanupActions = cleanup.actions ?? summary.cleanupActions;
  const trimmedPixels = cleanup.trimmedPixels;
  const sideViewOcclusion = sam3SideViewOcclusionLabels(quality);
  const chips = [
    { label: "Score", value: `${quality.score ?? "-"} / 100`, tone: quality.status || "info" },
    { label: "Profile", value: sam3SemanticProfileLabel(profile), tone: profile === "monster-sideview-v1" ? "info" : "" },
    { label: "Risky left", value: remainingRiskyPairs ?? "-", tone: Number(remainingRiskyPairs || 0) === 0 ? "pass" : "warn" },
    cleanupActions != null
      ? { label: "Cleanup", value: trimmedPixels != null ? `${cleanupActions} / ${trimmedPixels}px` : cleanupActions, tone: "info" }
      : null,
    sideViewOcclusion.length
      ? { label: "Side-view", value: sideViewOcclusion.join(", "), tone: "info" }
      : null,
  ].filter(Boolean);
  return chips.map((chip) => `
    <span class="sam3-quality-pill ${escapeHtml(chip.tone || "info")}">
      <b>${escapeHtml(chip.label)}</b>${escapeHtml(String(chip.value))}
    </span>
  `).join("");
}

function sam3DiagnosticsText(data) {
  const quality = data?.quality || {};
  const sideViewOcclusion = sam3SideViewOcclusionLabels(quality);
  const warnings = Array.isArray(quality.warnings)
    ? quality.warnings.filter((warning) => warning.severity === "warn" || warning.severity === "fail")
    : [];
  if (warnings.length) {
    return warnings.slice(0, 2).map((warning) => warning.message).join(" · ");
  }
  if (sideViewOcclusion.length) {
    return `侧身怪物 profile 已把 ${sideViewOcclusion.join(" / ")} 的近中心点记录为遮挡诊断，不作为结构告警扣分`;
  }
  const semanticDiagnostics = quality.summary?.semanticDiagnostics;
  return semanticDiagnostics
    ? `${semanticDiagnostics} 条 semantic diagnostics，未发现需要阻断的结构告警`
    : "无结构性分层告警";
}

async function loadSam3PartComparisons(pack) {
  const card = els.packDetailPanel.querySelector(".sam3-part-compare");
  const status = card?.querySelector("[data-sam3-preview-status]");
  const qualityStrip = card?.querySelector("[data-sam3-quality-strip]");
  const diagnostics = card?.querySelector("[data-sam3-diagnostics]");
  const slots = [...els.packDetailPanel.querySelectorAll("[data-sam3-part-slot]")];
  try {
    const data = await api(`/api/packs/${encodeURIComponent(pack.packId)}/spine-sam3/preview.json`);
    const partByName = new Map((data.parts || []).map((part) => [part.name, part]));
    for (const slot of slots) {
      const variant = slot.dataset.sam3Variant;
      const partName = slot.dataset.sam3Part;
      const img = slot.querySelector("img");
      const item = partByName.get(partName);
      const payload = variant === "cleaned-parts" ? item?.cleaned : item?.original;
      if (!img || !payload?.dataUrl) {
        slot.classList.remove("loading");
        slot.classList.add("failed");
        continue;
      }
      img.src = payload.dataUrl;
      slot.classList.remove("loading");
      slot.classList.add("ready");
      if (payload.cleanup?.trimmedPixels) {
        slot.title = `${sam3PartLabel(partName)} · trimmed ${payload.cleanup.trimmedPixels}px`;
      }
    }
    if (status) {
      status.textContent = `${sam3QualityStatusLabel(data.quality?.status)} · ${data.quality?.score ?? "-"} / 100`;
    }
    if (qualityStrip) qualityStrip.innerHTML = sam3QualityPillsHtml(data);
    if (diagnostics) diagnostics.textContent = sam3DiagnosticsText(data);
    await loadSam3RigAnimations(pack, data);
  } catch (error) {
    for (const slot of slots) {
      slot.classList.remove("loading");
      slot.classList.add("failed");
    }
    if (status) status.textContent = "preview failed";
    if (diagnostics) diagnostics.textContent = "SAM3 preview 读取失败，请稍后重试";
    console.warn("SAM3 part comparison failed", error);
  }
}

// 骨骼驱动动画:GIF 端点需鉴权头,<img> 无法直接带;故用 token 拉成 blob → objectURL。
// 未烘焙(404 not_baked)的 clip 静默隐藏,前端不报错。
async function loadSam3RigAnimations(pack, data) {
  const row = els.packDetailPanel.querySelector("[data-sam3-anim-row]");
  if (!row) return;
  const animations = Array.isArray(data?.animations) ? data.animations : [];
  const byClip = new Map(animations.map((a) => [a.clip, a.url]));
  const figures = [...row.querySelectorAll("[data-rig-clip]")];
  let anyReady = false;
  await Promise.all(figures.map(async (fig) => {
    const clip = fig.dataset.rigClip;
    const url = byClip.get(clip);
    const img = fig.querySelector("img");
    try {
      if (!url) throw new Error("no clip");
      const res = await fetch(url, { headers: accessToken() ? { "x-lingji-access-token": accessToken() } : {} });
      if (!res.ok) throw new Error(String(res.status));
      const blobUrl = URL.createObjectURL(await res.blob());
      state.sam3PreviewUrls.push(blobUrl);
      img.src = blobUrl;
      fig.classList.remove("loading");
      fig.classList.add("ready");
      anyReady = true;
    } catch {
      fig.classList.remove("loading");
      fig.classList.add("missing");
    }
  }));
  // 全部未烘焙则整行隐藏,避免空占位。
  if (!anyReady) row.hidden = true;
}

function revokeSam3PreviewUrls() {
  for (const url of state.sam3PreviewUrls) URL.revokeObjectURL(url);
  state.sam3PreviewUrls = [];
}

function renderPackPreviewSection(pack, frames) {
  return packHasAnimationPreview(pack)
    ? renderPackAnimationPreview(pack, frames)
    : renderPackGridPreview(pack, frames);
}

function packHasAnimationPreview(pack) {
  return pack?.packKind === "sprite-actions";
}

function renderPackAnimationPreview(pack, frames) {
  if (frames.length === 0) {
    return `
      <section class="pack-animation-preview">
        <div class="pack-animation-empty">
          <i data-lucide="image-off"></i>
          <strong>暂无可播放帧</strong>
          <span>等待整包帧归档完成后，这里会显示动作预览</span>
        </div>
      </section>
    `;
  }
  const frame = frames[0];
  const label = frame.label || frame.id || "frame";
  const frameRate = packPreviewFrameRate(pack);
  return `
    <section class="pack-animation-preview" aria-label="整包动作预览">
      <div class="pack-animation-stage">
        <img data-pack-preview-image src="${escapeHtml(frame.result.url)}" alt="${escapeHtml(label)}" loading="eager" />
        <span class="pack-animation-badge" data-pack-preview-counter>1 / ${frames.length}</span>
      </div>
      <div class="pack-animation-info">
        <strong data-pack-preview-title>${escapeHtml(label)}</strong>
        <span data-pack-preview-meta>${escapeHtml(frameMetaText(frame))}</span>
      </div>
      <div class="pack-animation-controls">
        <button type="button" data-preview-action="prev" aria-label="上一帧">
          <i data-lucide="skip-back"></i>
        </button>
        <input data-preview-scrub class="pack-animation-scrub" type="range" min="0" max="${Math.max(0, frames.length - 1)}" value="0" step="1" aria-label="帧序" />
        <button type="button" data-preview-action="toggle">
          <i data-lucide="play"></i>
          <span data-preview-toggle-label>${frames.length > 1 ? "暂停" : "播放"}</span>
        </button>
        <button type="button" data-preview-action="next" aria-label="下一帧">
          <i data-lucide="skip-forward"></i>
        </button>
      </div>
      <div class="pack-animation-strip" aria-label="帧缩略图">
        ${frames.map((item, index) => `
          <button class="pack-animation-thumb" type="button" data-preview-frame="${index}" aria-current="${index === 0 ? "true" : "false"}" title="${escapeHtml(item.label || item.id || `Frame ${index + 1}`)}">
            <img src="${escapeHtml(item.result.url)}" alt="" loading="lazy" />
            <span>${escapeHtml(item.label || item.id || String(index + 1))}</span>
          </button>
        `).join("")}
      </div>
      <small class="pack-animation-note">${frames.length} 帧 · ${frameRate} fps · 使用云端归档原图播放 · ${packHasSam3Layers(pack) ? "ZIP 含 SAM3 Spine 分层" : "ZIP 含 Spine JSON/Atlas"}</small>
    </section>
  `;
}

function renderPackGridPreview(pack, frames) {
  if (frames.length === 0) {
    return `
      <section class="pack-grid-preview">
        <div class="pack-animation-empty">
          <i data-lucide="image-off"></i>
          <strong>暂无可预览帧</strong>
          <span>等待整包帧归档完成后，这里会显示网格预览</span>
        </div>
      </section>
    `;
  }
  const columns = Math.max(1, Math.min(6, Number(pack.metadata?.columns) || 4));
  return `
    <section class="pack-grid-preview" aria-label="整包网格预览">
      <div class="pack-grid-preview-head">
        <div>
          <strong>${escapeHtml(packPreviewTitle(pack))}</strong>
          <span>${frames.length} 帧 · ${escapeHtml(packGridMetaText(pack))}</span>
        </div>
        <span>${escapeHtml(packKindLabel(pack.packKind))}</span>
      </div>
      <div class="pack-grid-list" style="--pack-grid-columns: ${columns};">
        ${frames.map((frame, index) => {
          const label = frame.label || frame.id || `Frame ${index + 1}`;
          return `
            <a class="pack-grid-item" href="${escapeHtml(frame.result.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(label)}">
              <img src="${escapeHtml(frame.result.url)}" alt="${escapeHtml(label)}" loading="lazy" />
              <span>${escapeHtml(label)}</span>
            </a>
          `;
        }).join("")}
      </div>
      <small class="pack-animation-note">${escapeHtml(packGridNote(pack))}</small>
    </section>
  `;
}

function packPreviewTitle(pack) {
  if (pack.packKind === "tile-pack") return "Tilemap 网格预览";
  if (pack.packKind === "ui-pack") return "UI Atlas 网格预览";
  if (pack.packKind === "icon-pack") return "Icon Atlas 网格预览";
  return "整包网格预览";
}

function packGridMetaText(pack) {
  const width = pack.metadata?.cellWidth || "-";
  const height = pack.metadata?.cellHeight || "-";
  const columns = pack.metadata?.columns || "-";
  const rows = pack.metadata?.rows || "-";
  return `${columns}x${rows} · ${width}x${height}`;
}

function packGridNote(pack) {
  if (pack.packKind === "tile-pack") return "地图包保持不透明原图，ZIP 内含 Tiled tileset 清单";
  if (pack.packKind === "ui-pack") return "UI 包可通过 ZIP 内的 UI atlas 或 Phaser atlas 导入";
  if (pack.packKind === "icon-pack") return "图标包可通过 ZIP 内的 UI atlas 或单帧透明 PNG 导入";
  return "使用云端归档帧展示";
}

function packKindLabel(packKind) {
  const labels = {
    "sprite-actions": "动作帧",
    "tile-pack": "地图 Tile",
    "icon-pack": "图标 Atlas",
    "ui-pack": "UI Atlas",
  };
  return labels[packKind] || packKind || "资产包";
}

function startPackPreview(pack, frames) {
  if (frames.length === 0) return;
  state.preview = {
    packId: pack.packId || "",
    frames,
    index: 0,
    playing: frames.length > 1,
    timer: null,
    frameRate: packPreviewFrameRate(pack),
  };
  updatePackPreviewFrame();
  syncPackPreviewTimer();
}

function stopPackPreview() {
  if (state.preview.timer) {
    window.clearInterval(state.preview.timer);
  }
  state.preview = {
    packId: "",
    frames: [],
    index: 0,
    playing: false,
    timer: null,
    frameRate: 8,
  };
}

function syncPackPreviewTimer() {
  if (state.preview.timer) {
    window.clearInterval(state.preview.timer);
    state.preview.timer = null;
  }
  if (!state.preview.playing || state.preview.frames.length < 2) return;
  state.preview.timer = window.setInterval(() => {
    setPackPreviewIndex(state.preview.index + 1);
  }, 1000 / state.preview.frameRate);
}

function setPackPreviewIndex(index) {
  if (state.preview.frames.length === 0) return;
  const total = state.preview.frames.length;
  state.preview.index = (index + total) % total;
  updatePackPreviewFrame();
}

function togglePackPreview() {
  if (state.preview.frames.length < 2) return;
  state.preview.playing = !state.preview.playing;
  updatePackPreviewFrame();
  syncPackPreviewTimer();
}

function updatePackPreviewFrame() {
  const frame = state.preview.frames[state.preview.index];
  if (!frame) return;
  const image = els.packDetailPanel.querySelector("[data-pack-preview-image]");
  const counter = els.packDetailPanel.querySelector("[data-pack-preview-counter]");
  const title = els.packDetailPanel.querySelector("[data-pack-preview-title]");
  const meta = els.packDetailPanel.querySelector("[data-pack-preview-meta]");
  const scrub = els.packDetailPanel.querySelector("[data-preview-scrub]");
  const toggleLabel = els.packDetailPanel.querySelector("[data-preview-toggle-label]");
  const label = frame.label || frame.id || "frame";
  if (image) {
    image.src = frame.result.url;
    image.alt = label;
  }
  if (counter) counter.textContent = `${state.preview.index + 1} / ${state.preview.frames.length}`;
  if (title) title.textContent = label;
  if (meta) meta.textContent = frameMetaText(frame);
  if (scrub) scrub.value = String(state.preview.index);
  if (toggleLabel) toggleLabel.textContent = state.preview.playing ? "暂停" : "播放";
  els.packDetailPanel.querySelectorAll("[data-preview-frame]").forEach((node) => {
    node.setAttribute("aria-current", String(Number(node.dataset.previewFrame) === state.preview.index));
  });
}

function packPreviewFrameRate(pack) {
  const value = Number(pack.metadata?.frameRate || pack.input?.frameRate || 8);
  if (!Number.isFinite(value)) return 8;
  return Math.max(1, Math.min(24, value));
}

function frameMetaText(frame) {
  const dimensions = frame.dimensions?.width && frame.dimensions?.height
    ? `${frame.dimensions.width}x${frame.dimensions.height}`
    : "-";
  return `${packStatusLabel(frame.status)} · seed ${frame.seed ?? "-"} · ${dimensions}`;
}

function renderPackDetailFrame(frame, pack) {
  const result = frame.result || {};
  const url = result.url || "";
  const label = frame.label || frame.id || "frame";
  const canRerun = Boolean(pack?.packId && frame.id);
  return `
    <article class="pack-detail-frame">
      <a class="pack-detail-thumb" href="${escapeHtml(url || "#")}" target="_blank" rel="noreferrer">
        ${url
          ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" loading="lazy" />`
          : `<i data-lucide="image"></i>`}
      </a>
      <div class="pack-detail-frame-body">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(frameMetaText(frame))}</span>
        <small title="${escapeHtml(frame.promptId || "-")}">${escapeHtml(frame.promptId || "-")}</small>
        <small title="${escapeHtml(result.filename || "")}">${escapeHtml(result.filename || "未归档")}</small>
      </div>
      <div class="pack-detail-frame-actions">
        ${canRerun ? `
          <button type="button" data-pack-action="rerun-frame" data-pack-id="${escapeHtml(pack.packId)}" data-frame-id="${escapeHtml(frame.id)}">
            <i data-lucide="rotate-ccw"></i>
            <span>重跑</span>
          </button>
        ` : ""}
        ${url ? `<a href="${escapeHtml(url)}" download><i data-lucide="download"></i><span>下载</span></a>` : ""}
        ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">打开</a>` : ""}
      </div>
    </article>
  `;
}

function filenameFromDisposition(value) {
  const match = String(value || "").match(/filename="([^"]+)"/i);
  return match?.[1] || "";
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderLoading() {
  return `
    <div class="library-empty">
      <span class="spinner"></span>
      <strong>读取素材库</strong>
      <span>正在从 Cloudflare R2 加载归档结果</span>
    </div>
  `;
}

function renderEmpty(title, detail) {
  return `
    <div class="library-empty">
      <i data-lucide="folder-open"></i>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
  `;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

els.searchInput.addEventListener("input", () => {
  state.query = els.searchInput.value.trim();
  render();
});

els.filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.filter = tab.dataset.kind;
    els.filterTabs.forEach((item) => item.classList.toggle("active", item === tab));
    render();
  });
});

els.refreshBtn.addEventListener("click", loadLibrary);
els.paginationBar?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-library-page-action]");
  if (action?.dataset.libraryPageAction === "more") {
    loadMoreLibrary();
  }
});
els.grid.addEventListener("click", (event) => {
  const sampleAction = event.target.closest("[data-sample-action]");
  if (sampleAction?.dataset.sampleAction === "detail") {
    openSampleDetail(sampleAction.dataset.sampleId);
    return;
  }
  const action = event.target.closest("[data-pack-action]");
  if (!action) return;
  if (action.dataset.packAction === "detail") {
    openPackDetail(action.dataset.packId).catch((error) => {
      setStatus("详情读取失败", "warn");
      console.warn("Pack detail failed", error);
    });
    return;
  }
  if (action.dataset.packAction === "zip") {
    downloadPackZip(action.dataset.packId).catch((error) => {
      setStatus("下载失败", "warn");
      console.warn("Pack ZIP download failed", error);
    });
  }
});
els.packDetailPanel.addEventListener("click", (event) => {
  const close = event.target.closest("[data-pack-detail-close]");
  if (close) {
    stopPackPreview();
    revokeSam3PreviewUrls();
    els.packDetailPanel.hidden = true;
    return;
  }
  const previewAction = event.target.closest("[data-preview-action]");
  if (previewAction) {
    const action = previewAction.dataset.previewAction;
    if (action === "prev") setPackPreviewIndex(state.preview.index - 1);
    if (action === "next") setPackPreviewIndex(state.preview.index + 1);
    if (action === "toggle") togglePackPreview();
    return;
  }
  const previewFrame = event.target.closest("[data-preview-frame]");
  if (previewFrame) {
    setPackPreviewIndex(Number(previewFrame.dataset.previewFrame));
    return;
  }
  const action = event.target.closest("[data-pack-action]");
  if (action?.dataset.packAction === "rerun-frame") {
    rerunPackFrame(action.dataset.packId, action.dataset.frameId).catch((error) => {
      setStatus("重跑提交失败", "warn");
      console.warn("Pack frame rerun failed", error);
    });
    return;
  }
  if (action?.dataset.packAction === "zip") {
    downloadPackZip(action.dataset.packId).catch((error) => {
      setStatus("下载失败", "warn");
      console.warn("Pack ZIP download failed", error);
    });
  }
});
els.packDetailPanel.addEventListener("input", (event) => {
  if (event.target.matches("[data-preview-scrub]")) {
    setPackPreviewIndex(Number(event.target.value));
  }
});
els.saveAccessTokenBtn.addEventListener("click", () => {
  const token = els.accessToken.value.trim();
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  loadLibrary();
});

loadLibrary().then(() => {
  if (window.lucide) window.lucide.createIcons();
});
