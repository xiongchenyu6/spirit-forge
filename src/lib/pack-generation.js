import { ensureComfyInputImage, ensureSpriteReferenceImage, fetchComfyResponse, listComfyModels, submitComfyWorkflow, uploadImageToComfy, waitForComfyImageOutput } from "./comfy-client.js";
import { buildFlux1Img2ImgWorkflow, buildFlux1PoseImg2ImgWorkflow, buildFlux1Workflow, buildPixelFlux2Workflow } from "./comfy-workflows.js";
import { characterOpenPoseDataUrl } from "./image.js";
import { decodePngRgba, encodePngRgba } from "./binary.js";
import { frameStatusCounts, packItemBrief, packStatusFromCounts } from "./pack-export.js";
import { PACK_PRESETS } from "./pack-presets.js";
import {
  DEFAULT_NEGATIVE,
  denoiseForPackItem,
  localPromptPlan,
  normalizeGenerationInput,
  poseDenoiseForPackItem,
  poseStrengthForPackItem,
  randomSeed,
  titleFromBrief,
} from "./generation-utils.js";
import {
  archiveResult,
  putPackRecord,
  readPackRecord,
  readPackRequestIndex,
  refreshPackRecord,
  rememberPackFrameJobRecord,
  rememberPackRecord,
  rememberPackRequestIndex,
  withSignedPackRecord,
} from "./storage.js";

// 动作表跨帧身份一致性约束（英文，进 FLUX prompt）：减少颜色/服装/体型漂移。
// 身份一致性约束:必须强调"单个角色/单帧",否则 "model sheet"/"turnaround"/
// "across frames" 之类会让模型画出多视图角色设定图(一排多个角色拼图)。
const SPRITE_IDENTITY_PROMPT =
  "same single character identity as the reference, identical outfit, colors and proportions, exactly one full-body figure, centered single character, no character sheet, no multiple poses, no multiple views, no duplicate characters, no collage";

// 给 sprite-actions 帧的 prompt 追加身份一致性约束（去重，避免重复堆叠）。
function withIdentityConsistencyPrompt(prompt) {
  const base = typeof prompt === "string" ? prompt.trim() : "";
  if (base.includes("no duplicate characters")) return base.slice(0, 1600);
  return [base, SPRITE_IDENTITY_PROMPT].filter(Boolean).join(", ").slice(0, 1600);
}

// 复刻 submitPackItemJob 的 packInput 推导，供锚点帧与动作帧共用，避免漂移。
function buildPackItemGenerationInput(normalized, preset, item) {
  // 关键:单帧生成必须剥离用户 brief 里的"多帧/动作表"指令(如"需要 idle、walk、
  // attack、hurt 四帧"),否则会被画成带标注的一排角色设定图(sprite sheet)。
  // 每帧的动作由 item.prompt 决定,brief 只保留角色主体描述。
  const cleanBrief = stripFrameInstructions(normalized.brief);
  const cleanNormalized = { ...normalized, brief: cleanBrief };
  return {
    ...cleanNormalized,
    // 用户原始主体(已剥离多帧指令),供 localPromptPlan 重点加权,避免被动作/共享描述稀释。
    subject: cleanBrief,
    assetType: item.assetType || preset.assetType || normalized.assetType,
    style: item.style || preset.style || normalized.style,
    camera: item.camera || preset.camera || normalized.camera,
    preset: item.preset || (
      preset.kind === "tile-pack"
        ? "map-tile"
        : preset.kind === "icon-pack"
            ? "icon"
            : preset.kind === "ui-pack"
            ? "ui-component"
            : "sprite"
    ),
    brief: packItemBrief(cleanNormalized, preset, item),
  };
}

// 按子句切分 brief,丢弃提及"帧/动作表/idle·walk·attack·hurt/sprite sheet"等
// 多帧/动作清单的子句,只保留角色主体描述。全被丢弃时回退原文。
function stripFrameInstructions(brief) {
  const text = typeof brief === "string" ? brief : "";
  if (!text) return text;
  const FRAME_RE = /帧|动作表|多帧|分帧|序列|sprite\s*sheet|\bframes?\b|\bidle\b|\bwalk\b|\battack\b|\bhurt\b|\bmove\b|\bdeath\b|\brun\b|\bjump\b/i;
  const clauses = text.split(/[，,;；。\n]+/).map((s) => s.trim()).filter(Boolean);
  const kept = clauses.filter((c) => !FRAME_RE.test(c));
  return (kept.length ? kept : clauses).join("，");
}

// 无外部参考图时，自动用一个中性帧（优先 idle）文生图生成“身份锚点”成品，
// 再把它上传为 Comfy 输入图，供其余帧 img2img + pose 锁定同一身份。
// 任何失败/超时返回 null，调用方回退到统一种子 + 一致性提示策略。
async function establishIdentityAnchor({ env, normalized, preset, seed }) {
  const anchorItem = preset.items.find((item) => item.id === "idle") || preset.items[0];
  if (!anchorItem) return null;
  const packInput = buildPackItemGenerationInput(normalized, preset, anchorItem);
  const plan = localPromptPlan(packInput);
  const [width, height] = preset.cell;
  const submitted = await submitComfyWorkflow(
    env,
    buildFlux1Workflow({
      prompt: withIdentityConsistencyPrompt(plan.prompt),
      negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
      width,
      height,
      seed,
    }),
  );
  const meta = await waitForComfyImageOutput(env, submitted.prompt_id);
  if (!meta?.filename) return null;
  const response = await fetchComfyResponse(env, meta);
  if (!response.ok) return null;
  const blob = await response.blob();
  const referenceImage = await uploadImageToComfy(env, blob, "lingji_pack_anchor.png");
  return { referenceImage, anchorItemId: anchorItem.id, anchorPromptId: submitted.prompt_id };
}

export async function recoverSubmitted2DPack(input, env) {
  const requestId = normalizePackRequestId(input);
  if (!requestId) return null;
  return await recover2DPackRequestById(requestId, env);
}

export async function recover2DPackRequestById(requestId, env) {
  const normalizedRequestId = normalizePackRequestId(requestId);
  if (!normalizedRequestId) return null;
  const index = await readPackRequestIndex(env, normalizedRequestId).catch((error) => {
    console.warn("2D pack request index read failed", error);
    return null;
  });
  if (!index?.packId) return null;
  const pack = await refreshPackRecord(env, index.packId).catch(async (error) => {
    console.warn("2D pack request recovery refresh failed", error);
    return await readPackRecord(env, index.packId).catch(() => null);
  });
  if (!pack) return null;
  return await packSubmitResponseFromRecord(env, pack, {
    requestId: normalizedRequestId,
    idempotent: true,
    recovered: true,
  });
}

export async function packSubmitResponseFromRecord(env, pack, extra = {}) {
  return {
    ok: true,
    kind: "2d-pack",
    packId: pack.packId,
    preset: pack.preset,
    packKind: pack.packKind,
    metadata: pack.metadata,
    jobs: (pack.frames || []).map((frame) => ({
      id: frame.id,
      label: frame.label,
      promptId: frame.promptId,
      clientId: frame.clientId,
      seed: frame.seed,
      dimensions: frame.dimensions,
      referenceDenoise: frame.referenceDenoise,
      poseControl: frame.poseControl,
      plan: frame.plan,
      status: frame.status || "queued",
      pollUrl: frame.pollUrl || `/api/jobs/${frame.promptId}?kind=2d`,
      index: frame.index,
      row: frame.row,
      column: frame.column,
      direction: frame.direction ?? null,
    })),
    pack: await withSignedPackRecord(env, pack).catch(() => pack),
    ...extra,
  };
}

export function normalizePackRequestId(input) {
  const value = typeof input === "string"
    ? input
    : input?.requestId || input?.clientRequestId || input?.idempotencyKey;
  const text = stringValue(value).trim();
  if (!text) return "";
  return text
    .replace(/[^a-z0-9._:-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export async function loadPackFrameRerunTarget(packId, frameId, input, env) {
  if (!env.ASSET_BUCKET) throw httpError(503, "Storage is not configured.", "storage_not_configured");
  const pack = await readPackRecord(env, packId);
  if (!pack) throw httpError(404, "Pack not found.", "not_found");
  const refreshed = await refreshPackRecord(env, packId).catch((error) => {
    console.warn("R2 pack refresh failed", error);
    return pack;
  });
  const current = refreshed || pack;
  const preset = PACK_PRESETS[current.preset];
  if (!preset) throw httpError(400, "Pack preset is not rerunnable.", "pack_unavailable");
  const index = preset.items.findIndex((item) => item.id === frameId);
  if (index < 0) throw httpError(404, "Pack frame not found.", "frame_not_found");
  const frame = (current.frames || []).find((item) => item.id === frameId) || null;
  if (!frame) throw httpError(404, "Pack frame not found.", "frame_not_found");
  return {
    pack: current,
    frame,
    preset,
    item: preset.items[index],
    index,
    normalized: normalizeGenerationInput({ ...(current.input || {}), preset: current.preset }),
    seed: Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed(),
  };
}

export async function rerunPackFrame(target, input, env) {
  const { pack, frame, preset, item, index, normalized, seed } = target;
  const referenceImage = pack.reference?.mode?.startsWith("img2img") ? safeString(pack.reference.source) : null;
  const poseImage = safeString(frame?.poseControl?.poseImage);
  const poseControl = poseImage && (frame?.poseControl?.model || pack.reference?.poseControl?.model)
    ? { model: frame?.poseControl?.model || pack.reference.poseControl.model }
    : null;
  const job = await submitPackItemJob({
    env,
    normalized,
    rawInput: { ...(pack.input || {}), ...input },
    preset,
    item,
    index,
    seed,
    referenceImage,
    poseImage,
    poseControl,
  });
  const packReference = pack.reference || { mode: referenceImage ? "img2img" : "text-to-image" };
  const frames = (pack.frames || []).map((candidate) => {
    if (candidate.id !== item.id) return candidate;
    return {
      ...candidate,
      promptId: job.promptId,
      clientId: job.clientId,
      seed: job.seed,
      dimensions: job.dimensions,
      status: "queued",
      pollUrl: job.pollUrl,
      result: null,
      rawStatus: null,
      completedAt: null,
      referenceDenoise: job.referenceDenoise,
      poseControl: job.poseControl,
      previous: candidate.promptId
        ? {
            promptId: candidate.promptId,
            seed: candidate.seed ?? null,
            result: candidate.result || null,
            completedAt: candidate.completedAt || null,
          }
        : candidate.previous || null,
      rerunAt: new Date().toISOString(),
    };
  });
  const counts = frameStatusCounts(frames);
  const updated = await putPackRecord(env, {
    ...pack,
    status: packStatusFromCounts(counts),
    counts,
    frames,
    completedAt: null,
    metadata: {
      ...(pack.metadata || {}),
      lastRerunAt: new Date().toISOString(),
      lastRerunFrameId: item.id,
    },
  });
  await rememberPackFrameJobRecord(env, {
    job,
    normalized,
    preset,
    packId: pack.packId,
    packReference,
    rerunOfPromptId: frame?.promptId || null,
  });
  return {
    ok: true,
    kind: "2d-pack-frame-rerun",
    packId: pack.packId,
    frameId: item.id,
    job,
    pack: await withSignedPackRecord(env, updated),
  };
}

export async function submit2DPack(input, env, options = {}) {
  const requestId = normalizePackRequestId(input);
  const recovered = requestId ? await recover2DPackRequestById(requestId, env) : null;
  if (recovered) return recovered;
  const normalized = normalizeGenerationInput(input);
  const preset = PACK_PRESETS[normalized.preset];
  if (!preset) {
    return {
      ok: false,
      error: "pack_unavailable",
      message: "This preset does not have a multi-job asset pack workflow yet.",
      supportedPresets: Object.keys(PACK_PRESETS),
    };
  }

  const seedBase = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const packId = crypto.randomUUID();
  const shouldUseReference = Boolean(input.referenceImage?.filename && preset.kind === "sprite-actions");
  const externalReference = shouldUseReference
    ? await ensureSpriteReferenceImage({ comfyImage: input.referenceImage }, env, "lingji_pack_reference.png")
    : null;
  // 无外部参考图的动作表：自动建立身份锚点（先生成中性帧再以其为 img2img 参考），
  // 让所有帧锁定同一角色。锚点失败时 referenceImage 仍为 null，走统一种子回退。
  let anchor = null;
  if (!externalReference && preset.kind === "sprite-actions") {
    anchor = await establishIdentityAnchor({ env, normalized, preset, seed: seedBase }).catch((error) => {
      console.warn("身份锚点生成失败，回退到统一种子一致性策略", error);
      return null;
    });
  }
  const referenceImage = externalReference || anchor?.referenceImage || null;
  // 无参考图回退：所有帧共用同一种子，配合一致性提示最大化跨帧身份一致性。
  const useUnifiedSeed = !referenceImage && preset.kind === "sprite-actions";
  const poseControlPresets = new Set(["character-actions", "character-walk-4dir", "character-walk-8dir"]);
  const shouldUsePoseControl = Boolean(referenceImage && poseControlPresets.has(normalized.preset));
  const poseControl = shouldUsePoseControl && typeof options.getCapabilities === "function"
    ? (await options.getCapabilities(env)).poseControl
    : null;
  const jobs = await Promise.all(
    preset.items.map(async (item, index) => {
      const seed = useUnifiedSeed ? seedBase >>> 0 : (seedBase + index) >>> 0;
      // 4 方向行走预设的 item 携带 pose 复合键（walk4:<direction>:<phase>）；
      // 其余动作预设回退到 item.id 查既有动作模板。
      const poseKey = item.pose || item.id;
      const poseDataUrl = poseControl?.available
        ? safeString(input.poseImages?.[item.id]) || await characterOpenPoseDataUrl(poseKey)
        : "";
      const poseImage = poseDataUrl
        ? await ensureComfyInputImage({ imageDataUrl: poseDataUrl }, env, `lingji_pose_${item.id}.png`)
        : null;
      return await submitPackItemJob({
        env,
        normalized,
        rawInput: input,
        preset,
        item,
        index,
        seed,
        referenceImage,
        poseImage,
        poseControl,
      });
    }),
  );
  const usedPoseControl = jobs.some((job) => job.poseControl);
  const packReference = referenceImage
    ? {
        mode: usedPoseControl ? "img2img+pose" : "img2img",
        source: referenceImage,
        // 锚点参考为本服务自动生成（非用户上传定稿）。
        auto: Boolean(anchor),
        anchorPromptId: anchor?.anchorPromptId || null,
        anchorItemId: anchor?.anchorItemId || null,
        actionStrength: normalized.actionStrength,
        poseControl: usedPoseControl
          ? {
              model: poseControl.model,
              type: "openpose",
            }
          : null,
      }
    : {
        mode: "text-to-image",
        // 无参考图回退：统一种子 + 一致性提示约束跨帧身份。
        consistency: useUnifiedSeed ? "unified-seed+identity-prompt" : null,
      };
  const packMetadata = {
    output: "separate-images",
    reference: packReference,
    columns: preset.columns,
    rows: preset.rows,
    cellWidth: preset.cell[0],
    cellHeight: preset.cell[1],
    items: preset.items.map((item, index) => ({
      id: item.id,
      label: item.label,
      index,
      row: Math.floor(index / preset.columns),
      column: index % preset.columns,
      // 4 方向行走：行=朝向、列=帧；非朝向预设 direction 为 null。
      direction: item.direction || null,
    })),
    notes: [
      "Images are generated as separate jobs first to improve action/item control.",
      "Cloud ZIP downloads compose sheet.png, import manifests, and transparent frames where suitable.",
    ],
  };
  const storedPack = await rememberPackRecord(env, {
    id: `2d-pack:${packId}`,
    kind: "2d-pack",
    packId,
    status: "queued",
    preset: normalized.preset,
    packKind: preset.kind,
    input: normalized,
    reference: packReference,
    metadata: packMetadata,
    counts: {
      total: jobs.length,
      complete: 0,
      failed: 0,
      pending: jobs.length,
    },
    frames: jobs.map((job) => {
      const itemMeta = packMetadata.items.find((item) => item.id === job.id) || {};
      return {
        id: job.id,
        label: job.label,
        promptId: job.promptId,
        clientId: job.clientId,
        seed: job.seed,
        dimensions: job.dimensions,
        referenceDenoise: job.referenceDenoise,
        poseControl: job.poseControl,
        plan: job.plan,
        status: "queued",
        pollUrl: job.pollUrl,
        index: itemMeta.index ?? job.index,
        row: itemMeta.row ?? job.row,
        column: itemMeta.column ?? job.column,
        direction: itemMeta.direction ?? job.direction ?? null,
      };
    }),
  });
  if (requestId) {
    await rememberPackRequestIndex(env, requestId, packId, {
      preset: normalized.preset,
      packKind: preset.kind,
    }).catch((error) => {
      console.warn("2D pack request index write failed", error);
    });
  }
  await Promise.all(jobs.map((job) => rememberPackFrameJobRecord(env, {
    job,
    normalized,
    preset,
    packId,
    packReference,
  })));

  return {
    ok: true,
    kind: "2d-pack",
    packId,
    preset: normalized.preset,
    packKind: preset.kind,
    metadata: packMetadata,
    jobs,
    pack: storedPack ? await withSignedPackRecord(env, storedPack).catch(() => storedPack) : null,
    requestId: requestId || null,
  };
}

// 单动作的网格姿势短语(用于 model sheet 各格)。
const SHEET_ACTION_PHRASE = {
  idle: "standing idle in a relaxed ready stance",
  walk: "walking mid-stride with arms swinging",
  move: "moving forward mid-stride",
  attack: "attacking with the weapon in a dynamic action pose",
  hurt: "recoiling backward after being hit, off-balance",
  death: "collapsing and falling to the ground",
};
const SHEET_STYLE_HINT = {
  production: "polished 2D game production art, clean line and shading",
  anime: "anime cel-shaded game art",
  realistic: "semi-realistic painterly game art",
  isometric: "isometric game art",
  pixel: "crisp pixel art",
  "pixel-art": "crisp pixel art",
};
const SHEET_POSITION_WORD = ["top-left", "top-right", "bottom-left", "bottom-right", "center-left", "center-right"];

// 「一句话生成动作包」:一次文生图画出 2×N 网格整套(同一次生成→身份天然一致、严格对题),
// 再切片成各动作单帧、归档 R2,组成与现有 pack 兼容的记录(ZIP/Spine 照常导出)。
// 单帧 img2img+pose 逐帧生成会因每帧不同种子、为改姿势重绘半数像素而把角色画成不同人,
// 故整套改用此单图切片路线。每个动作取一帧(idle/walk/attack/hurt)。
export async function submit2DPackSheet(input, env, options = {}) {
  const requestId = normalizePackRequestId(input);
  const recovered = requestId ? await recover2DPackRequestById(requestId, env) : null;
  if (recovered) return recovered;
  const planPrompt = options.planPrompt;
  const normalized = normalizeGenerationInput(input);
  const preset = PACK_PRESETS[normalized.preset];
  if (!preset || preset.kind !== "sprite-actions") {
    return {
      ok: false,
      error: "pack_unavailable",
      message: "Sheet-pack mode only supports character/monster action presets.",
      supportedPresets: Object.keys(PACK_PRESETS).filter((k) => PACK_PRESETS[k].kind === "sprite-actions"),
    };
  }
  if (!env.ASSET_BUCKET) {
    return { ok: false, error: "storage_not_configured", message: "Sheet pack requires R2 storage." };
  }
  // 每个动作取一帧:按 item.action(动作,而非每帧唯一的 item.id)去重,最多 4 个走 2×2。
  const seen = new Set();
  const actions = [];
  for (const item of preset.items) {
    const actionId = item.action || item.clip || item.id;
    if (seen.has(actionId)) continue;
    seen.add(actionId);
    const baseLabel = (item.label || actionId).replace(/\s*\d+$/, "").trim();
    actions.push({ id: actionId, label: baseLabel });
    if (actions.length >= 4) break;
  }
  const cols = 2;
  const rows = Math.ceil(actions.length / cols);
  const [cellW, cellH] = preset.cell;
  const sheetW = cellW * cols;
  const sheetH = cellH * rows;
  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) >>> 0 : randomSeed();
  const packId = crypto.randomUUID();

  const cleanBrief = stripFrameInstructions(normalized.brief);
  const styleHint = SHEET_STYLE_HINT[normalized.style] || SHEET_STYLE_HINT.production;
  const cellPhrases = actions
    .map((a, i) => `${SHEET_POSITION_WORD[i]} cell: ${SHEET_ACTION_PHRASE[a.id] || a.label.toLowerCase()}`)
    .join(", ");
  // FLUX 的 T5 对中文支持差,正常 2D 路径经 planPrompt(Mistral)翻译/增强为英文主体描述。
  // 这里同样把 brief 过一遍 planner 得到强英文角色描述,避免"画成通用角色/无视提示词"。
  let subjectPrompt = cleanBrief;
  if (typeof planPrompt === "function") {
    const plan = await planPrompt({ ...normalized, brief: cleanBrief, preset: "square" }, env).catch(() => null);
    if (plan?.prompt) subjectPrompt = plan.prompt;
  }
  const prompt = [
    `a ${cols}x${rows} grid game character sprite sheet of the SAME single character repeated in ${actions.length} equal cells`,
    `the character: (${subjectPrompt}:1.3)`,
    "the EXACT SAME character in every cell — identical face, hairstyle, hair color, outfit and colors and body proportions",
    "exactly one centered full-body figure per cell, evenly spaced equal cells with thin gutters",
    cellPhrases,
    styleHint,
    "plain flat light-gray background, full body in frame, clean separable game asset, no text, no watermark, no labels",
  ].join(", ").slice(0, 1800);
  const negativePrompt = `${DEFAULT_NEGATIVE}, inconsistent character, different characters, changing outfit, model sheet labels, text annotations, uneven layout, cropped figure`;

  // 1) 单次文生图整套。像素风(pixel/pixel-art)走 FLUX-2 Klein + pixel LoRA 出真像素,
  //    与单图 2D 路径一致;模型缺失/异常安全回退 flux1-dev。
  const sheetArgs = { prompt, negativePrompt, width: sheetW, height: sheetH, seed };
  let sheetWorkflow = null;
  if ((normalized.style === "pixel" || normalized.style === "pixel-art") && env.DISABLE_PIXEL_KLEIN !== "true") {
    try {
      const models = await listComfyModels(env);
      sheetWorkflow = buildPixelFlux2Workflow({ ...sheetArgs, models });
    } catch {
      sheetWorkflow = null;
    }
  }
  if (!sheetWorkflow) sheetWorkflow = buildFlux1Workflow(sheetArgs);
  // 异步:只提交大图任务即秒回,避免单请求里同步「生成+切片+上传」超 CF 边缘 ~100s → 503。
  // 客户端轮询大图就绪后再调 /api/packs/:id/sheet-slice 完成切片(短请求)。
  const submitted = await submitComfyWorkflow(env, sheetWorkflow);
  const sheetPromptId = submitted.prompt_id;
  const items = actions.map((a, index) => ({ id: a.id, label: a.label, index, row: Math.floor(index / cols), column: index % cols, direction: null }));
  const packMetadata = {
    output: "separate-images",
    reference: { mode: "single-sheet-slice", auto: true, sheetPromptId },
    columns: cols, rows, cellWidth: cellW, cellHeight: cellH,
    items,
    // sheetPlan 供 slicePackSheet 复原切片(异步第二段读取)。
    sheetPlan: { sheetPromptId, cols, rows, cellW, cellH, seed, actions },
    notes: [
      "Generated as one consistent model sheet then sliced per action (identity locked by single generation).",
      "Cloud ZIP downloads compose sheet.png, import manifests, and transparent frames where suitable.",
    ],
  };
  await rememberPackRecord(env, {
    id: `2d-pack:${packId}`,
    kind: "2d-pack",
    packId,
    status: "generating",
    preset: normalized.preset,
    packKind: preset.kind,
    input: normalized,
    reference: packMetadata.reference,
    metadata: packMetadata,
    counts: { total: actions.length, complete: 0, failed: 0, pending: actions.length },
    frames: items.map((it) => ({ ...it, promptId: `${packId}-${it.id}`, seed, dimensions: { width: cellW, height: cellH }, status: "queued" })),
  });
  if (requestId) {
    await rememberPackRequestIndex(env, requestId, packId, { preset: normalized.preset, packKind: preset.kind })
      .catch((error) => console.warn("sheet pack request index write failed", error));
  }
  return {
    ok: true,
    kind: "2d-pack",
    packId,
    preset: normalized.preset,
    packKind: preset.kind,
    metadata: packMetadata,
    sheet: true,
    pending: true,
    sheetPromptId,
    sheetPollUrl: `/api/jobs/${sheetPromptId}?kind=2d`,
    sliceUrl: `/api/packs/${packId}/sheet-slice`,
    requestId: requestId || null,
  };
}

// 异步第二段:大图就绪后切片成各动作帧、归档 R2、把 pack 标记完成并返回。
// 单请求只做 fetch+切片+N×上传/归档(~10-20s),稳在 CF 边缘上限内。
export async function slicePackSheet(packId, env) {
  if (!env.ASSET_BUCKET) return { ok: false, error: "storage_not_configured" };
  const pack = await readPackRecord(env, packId).catch(() => null);
  if (!pack) return { ok: false, error: "not_found", message: "Pack not found." };
  if (pack.status === "complete" && pack.frames?.every((f) => f.result?.url)) {
    return { ok: true, kind: "2d-pack", packId, preset: pack.preset, packKind: pack.packKind, metadata: pack.metadata,
      jobs: pack.frames.map((f) => ({ id: f.id, label: f.label, promptId: f.promptId, seed: f.seed, status: "complete", result: f.result, dimensions: f.dimensions })),
      pack: await withSignedPackRecord(env, pack).catch(() => pack), sheet: true };
  }
  const plan = pack.metadata?.sheetPlan;
  if (!plan?.sheetPromptId) return { ok: false, error: "sheet_plan_missing", message: "No sheet plan on this pack." };
  const { cols, cellW, cellH, seed, actions } = plan;
  const meta = await waitForComfyImageOutput(env, plan.sheetPromptId);
  if (!meta?.filename) return { ok: false, error: "sheet_generation_failed", message: "Sheet image not ready." };
  const response = await fetchComfyResponse(env, meta);
  if (!response.ok) return { ok: false, error: "sheet_fetch_failed", message: `Sheet fetch failed: ${response.status}` };
  const sheet = await decodePngRgba(new Uint8Array(await response.arrayBuffer()));

  const frames = [];
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    const cx = (index % cols) * cellW;
    const cy = Math.floor(index / cols) * cellH;
    const cell = sliceRgbaCell(sheet, cx, cy, cellW, cellH);
    const cellBytes = await encodePngRgba(cellW, cellH, cell);
    const uploadedName = await uploadImageToComfy(env, new Blob([cellBytes], { type: "image/png" }), `lingji_sheet_${packId}_${action.id}.png`);
    const framePromptId = `${packId}-${action.id}`;
    const archived = await archiveResult(env, {
      promptId: framePromptId, kind: "2d",
      result: { filename: uploadedName, subfolder: "", type: "input" },
      entry: { status: { status_str: "success" } },
    });
    frames.push({
      id: action.id, label: action.label, promptId: framePromptId, seed,
      dimensions: { width: cellW, height: cellH }, status: "complete",
      index, row: Math.floor(index / cols), column: index % cols, direction: null,
      result: archived ? { ...archived, url: archived.url, filename: archived.filename, fileKey: archived.fileKey } : { filename: uploadedName, subfolder: "", type: "input" },
    });
  }
  const updated = { ...pack, status: "complete", counts: { total: frames.length, complete: frames.length, failed: 0, pending: 0 }, frames };
  const storedPack = await rememberPackRecord(env, updated).catch(() => updated);
  return {
    ok: true, kind: "2d-pack", packId, preset: pack.preset, packKind: pack.packKind, metadata: pack.metadata,
    jobs: frames.map((f) => ({ id: f.id, label: f.label, promptId: f.promptId, seed, status: "complete", result: f.result, dimensions: f.dimensions })),
    pack: storedPack ? await withSignedPackRecord(env, storedPack).catch(() => storedPack) : null,
    sheet: true,
  };
}

// 从整套大图切出一格 RGBA buffer。
function sliceRgbaCell(image, x0, y0, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    const sy = y0 + y;
    if (sy >= image.height) break;
    for (let x = 0; x < w; x += 1) {
      const sx = x0 + x;
      if (sx >= image.width) continue;
      const si = (sy * image.width + sx) * 4;
      const di = (y * w + x) * 4;
      out[di] = image.data[si];
      out[di + 1] = image.data[si + 1];
      out[di + 2] = image.data[si + 2];
      out[di + 3] = image.data[si + 3];
    }
  }
  return out;
}

async function submitPackItemJob({
  env,
  normalized,
  rawInput = {},
  preset,
  item,
  index,
  seed,
  referenceImage = null,
  poseImage = null,
  poseControl = null,
}) {
  const packInput = buildPackItemGenerationInput(normalized, preset, item);
  const basePlan = localPromptPlan(packInput);
  const plan = {
    ...basePlan,
    // 仅动作表帧追加跨帧身份一致性约束；单图/图标/瓦片等预设不受影响。
    prompt: preset.kind === "sprite-actions"
      ? withIdentityConsistencyPrompt(basePlan.prompt)
      : basePlan.prompt,
    title: `${titleFromBrief(normalized.brief)}_${item.id}`,
    source: "local-pack",
  };
  const [width, height] = preset.cell;
  const referenceDenoise = poseImage
    ? poseDenoiseForPackItem(rawInput, normalized, item)
    : referenceImage
      ? denoiseForPackItem(rawInput, normalized, item)
      : null;
  const workflow = referenceImage && poseImage && poseControl?.model
    ? buildFlux1PoseImg2ImgWorkflow({
        prompt: plan.prompt,
        negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
        width,
        height,
        seed,
        filename: referenceImage,
        poseFilename: poseImage,
        controlNetName: poseControl.model,
        denoise: referenceDenoise,
        controlStrength: poseStrengthForPackItem(item),
      })
    : referenceImage
      ? buildFlux1Img2ImgWorkflow({
          prompt: plan.prompt,
          negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
          width,
          height,
          seed,
          filename: referenceImage,
          denoise: referenceDenoise,
        })
      : buildFlux1Workflow({
          prompt: plan.prompt,
          negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
          width,
          height,
          seed,
        });
  const submitted = await submitComfyWorkflow(env, workflow);
  return {
    id: item.id,
    label: item.label,
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    referenceDenoise,
    poseControl: poseImage && poseControl?.model
      ? {
          model: poseControl.model,
          poseImage,
          strength: poseStrengthForPackItem(item),
          type: "openpose",
        }
      : null,
    dimensions: { width, height },
    plan,
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=2d`,
    index,
    row: Math.floor(index / preset.columns),
    column: index % preset.columns,
    direction: item.direction || null,
  };
}

function stringValue(value) {
  return value === undefined || value === null ? "" : String(value);
}

function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function httpError(status, message, code = "bad_request") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}
