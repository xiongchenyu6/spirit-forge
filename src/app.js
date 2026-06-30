import { alphaBounds, alphaBoundsInRect, characterOpenPoseDataUrl, composePackSheetBundlePng, composePackSheetPng, composePackTransparentFrames, dataUrlToBlob, pngBytesFromDataUrl } from "./lib/image.js";
export { alphaBounds, alphaBoundsInRect, characterOpenPoseDataUrl, composePackSheetBundlePng, composePackSheetPng, composePackTransparentFrames, dataUrlToBlob, pngBytesFromDataUrl };
import { downloadPackZip, frameStatusCounts, packAnimations, packFrameAlphaZipName, packFrameRect, packFrameZipName, packGridMetrics, packItemBrief, packStatusFromCounts, packZipFrames, shouldPackUseTransparentFrames } from "./lib/pack-export.js";
export { downloadPackZip, frameStatusCounts, packAnimations, packFrameAlphaZipName, packFrameRect, packFrameZipName, packGridMetrics, packItemBrief, packStatusFromCounts, packZipFrames, shouldPackUseTransparentFrames };
import { buildComfyViewUrl, comfyFetchJson, ensureComfyInputImage, ensureSpriteReferenceImage, fetchComfyResponse, firstImageOutput, firstModelOutput, firstVideoOutput, getQueueStatus, imageBlobDimensions, layerIdFromFilename, layerSeparationOutput, listComfyModels, proxyComfyView, selectHunyuanModel, selectLayerSeparation, selectPoseControl, selectVideoToSprite, submitComfyWorkflow, uploadImageToComfy } from "./lib/comfy-client.js";
export { buildComfyViewUrl, comfyFetchJson, ensureComfyInputImage, ensureSpriteReferenceImage, fetchComfyResponse, firstImageOutput, firstModelOutput, firstVideoOutput, getQueueStatus, imageBlobDimensions, layerIdFromFilename, layerSeparationOutput, listComfyModels, proxyComfyView, selectHunyuanModel, selectLayerSeparation, selectPoseControl, selectVideoToSprite, submitComfyWorkflow, uploadImageToComfy };
import { archiveResult, archiveResultSet, getPack, invalidLibraryFileKey, latestPackLayerSeparationJob, libraryViewSecret, listJobs, listLibrary, listPacks, patchJobRecordQuietly, putPackRecord, readJobRecord, readLayerRequestIndex, readLayerSeparationMasks, readPackCompletedFrameFiles, readPackRecord, readPackRequestIndex, refreshPackRecord, rememberJobRecord, rememberLayerRequestIndex, rememberPackFrameJobRecord, rememberPackRecord, rememberPackRequestIndex, safeLibrarySegment, signLibraryViewKey, signedLayerResultFiles, sourceImageForLayerJob, withSignedPackRecord } from "./lib/storage.js";
export { archiveResult, archiveResultSet, getPack, invalidLibraryFileKey, latestPackLayerSeparationJob, libraryViewSecret, listJobs, listLibrary, listPacks, patchJobRecordQuietly, putPackRecord, readJobRecord, readLayerRequestIndex, readLayerSeparationMasks, readPackCompletedFrameFiles, readPackRecord, readPackRequestIndex, refreshPackRecord, rememberJobRecord, rememberLayerRequestIndex, rememberPackFrameJobRecord, rememberPackRecord, rememberPackRequestIndex, safeLibrarySegment, signLibraryViewKey, signedLayerResultFiles, sourceImageForLayerJob, withSignedPackRecord };
import { SPINE_LAYER_PROMPTS, buildSpineRigTemplate, buildSpineSam3LayersTemplate, getPackSpineSam3Preview, normalizeSpineLayerPrompts, packSpineAtlas, packSpineReadme, packSpineSam3LayerSummary, packSpineSkeletonJson, servePackSpineSam3Animation, servePackSpineSam3Part, shouldIncludeSpineExport, spineLayerLabel } from "./lib/spine-sam3.js";
import { OFFICIAL_SAMPLE_MANIFEST_CACHE_SECONDS, downloadOfficialSampleZip, getOfficialSamplesDemo } from "./lib/official-samples.js";
import { getVideoSpriteDemo } from "./lib/video-sprite-demo.js";
import { handleAssets } from "./lib/static-assets.js";
import { PACK_PRESETS } from "./lib/pack-presets.js";
export { PACK_PRESETS };
import { loadPackFrameRerunTarget, normalizePackRequestId, recover2DPackRequestById, recoverSubmitted2DPack, rerunPackFrame, submit2DPack, submit2DPackSheet } from "./lib/pack-generation.js";
import { prepareVideoSpriteExperiment, submitVideoSpriteExperiment } from "./lib/video-sprite-generation.js";
import { submit3DJob } from "./lib/model3d-generation.js";
import { submit2DJob } from "./lib/image2d-generation.js";
import { planPrompt } from "./lib/prompt-planning.js";
import { getCapabilities as readCapabilities } from "./lib/capabilities.js";
import { contentTypeForResult } from "./lib/result-utils.js";
export { contentTypeForResult };
import { getJob } from "./lib/job-results.js";
import { proxyLibraryView } from "./lib/library-view.js";
import { DEFAULT_NEGATIVE, normalizeDimensions } from "./lib/generation-utils.js";
export { DEFAULT_NEGATIVE };
import { enforceUsageLimit, grantUsageReward, meteredJsonResponse, usageCostForPackInput, usageJson, usagePayload, usageStatus } from "./lib/usage.js";
import { buildSam3LayerSeparationWorkflow } from "./lib/comfy-workflows.js";
import { base64UrlEncode, bytesToBase64, constantTimeEqual, decodePngRgba, encodePngRgba, isPngSignature, positiveInteger } from "./lib/binary.js";

const MAX_JSON_BODY_BYTES = 6_000_000;
const MAX_DATA_URL_CHARS = 5_500_000;
export const DEFAULT_USAGE_HOURLY_CREDITS = 240;
export const DEFAULT_USAGE_DAILY_CREDITS = 1200;
export const USAGE_COSTS = {
  prompt: 1,
  generate2d: 20,
  generate2dPackFrame: 12,
  generateLayerSeparation: 8,
  generate3d: 120,
  prepareVideoSprite: 0,
  generateVideoSprite: 80,
};

export const VIDEO_TO_SPRITE_NODE_CANDIDATES = [
  "UNETLoader",
  "LoraLoaderModelOnly",
  "ModelSamplingSD3",
  "CLIPLoader",
  "CLIPTextEncode",
  "VAELoader",
  "WanImageToVideo",
  "WanAnimateToVideo",
  "LTXVImgToVideo",
  "LTXVImgToVideoInplace",
  "SVD_img2vid_Conditioning",
  "HunyuanImageToVideo",
  "HunyuanVideo15ImageToVideo",
  "CreateVideo",
  "SaveVideo",
  "SaveWEBM",
  "LoadVideo",
  "FrameInterpolate",
  "KSamplerAdvanced",
  "VAEDecode",
];

export const LAYER_SEPARATION_NODE_CANDIDATES = [
  "SAM3_Detect",
  "SAM3_TrackToMask",
  "CropByBBoxes",
  "DrawBBoxes",
  "ImageCompositeMasked",
  "ImageToMask",
  "MaskToImage",
  "PrimitiveBoundingBox",
  "GrowMask",
  "FeatherMask",
  "ThresholdMask",
  "BriaRemoveImageBackground",
  "RecraftRemoveBackgroundNode",
];

const ALLOWED_COMFY_FILE_TYPES = new Set(["input", "output", "temp"]);

export const CHARACTER_OPENPOSE_TEMPLATES = {
  idle: {
    nose: [256, 108],
    lEye: [244, 102],
    rEye: [268, 102],
    lEar: [234, 108],
    rEar: [278, 108],
    neck: [256, 155],
    lShoulder: [208, 166],
    rShoulder: [304, 166],
    lElbow: [200, 232],
    rElbow: [316, 232],
    lHand: [196, 288],
    rHand: [320, 288],
    lHip: [228, 286],
    rHip: [284, 286],
    lKnee: [220, 360],
    rKnee: [292, 360],
    lFoot: [208, 442],
    rFoot: [304, 442],
  },
  // 明显的迈步接触姿(mid-stride contact pose):左腿抬起前迈、右腿后蹬支撑,
  // 双臂对侧摆动(右臂前摆/左臂后摆),躯干略前倾。原模板是双脚左右大叉的静态站姿,
  // OpenPose 读不出"走"。此版用前后/高低差与摆臂清晰传达步态。
  walk: {
    nose: [262, 106],
    lEye: [250, 100],
    rEye: [274, 100],
    lEar: [240, 106],
    rEar: [284, 106],
    neck: [258, 154],
    lShoulder: [220, 168],
    rShoulder: [298, 164],
    lElbow: [212, 218],
    rElbow: [304, 212],
    lHand: [200, 262],
    rHand: [292, 246],
    lHip: [236, 286],
    rHip: [286, 286],
    lKnee: [226, 330],
    rKnee: [306, 360],
    lFoot: [210, 392],
    rFoot: [346, 450],
  },
  attack: {
    nose: [244, 108],
    lEye: [232, 102],
    rEye: [256, 102],
    lEar: [222, 108],
    rEar: [266, 108],
    neck: [252, 152],
    lShoulder: [198, 170],
    rShoulder: [310, 156],
    lElbow: [150, 214],
    rElbow: [376, 150],
    lHand: [102, 252],
    rHand: [458, 112],
    lHip: [228, 292],
    rHip: [292, 282],
    lKnee: [202, 368],
    rKnee: [334, 346],
    lFoot: [174, 446],
    rFoot: [388, 402],
  },
  hurt: {
    nose: [292, 118],
    lEye: [280, 112],
    rEye: [304, 112],
    lEar: [270, 118],
    rEar: [314, 118],
    neck: [272, 166],
    lShoulder: [224, 184],
    rShoulder: [316, 190],
    lElbow: [180, 246],
    rElbow: [352, 252],
    lHand: [136, 302],
    rHand: [390, 318],
    lHip: [224, 302],
    rHip: [282, 294],
    lKnee: [202, 374],
    rKnee: [300, 364],
    lFoot: [172, 446],
    rFoot: [338, 436],
  },
};

export const OPENPOSE_LIMBS = [
  ["nose", "neck", [255, 255, 255]],
  ["nose", "lEye", [255, 51, 51]],
  ["lEye", "lEar", [255, 136, 51]],
  ["nose", "rEye", [255, 255, 51]],
  ["rEye", "rEar", [136, 255, 51]],
  ["neck", "lShoulder", [51, 255, 51]],
  ["lShoulder", "lElbow", [51, 255, 136]],
  ["lElbow", "lHand", [51, 255, 255]],
  ["neck", "rShoulder", [51, 136, 255]],
  ["rShoulder", "rElbow", [51, 51, 255]],
  ["rElbow", "rHand", [136, 51, 255]],
  ["neck", "lHip", [255, 51, 255]],
  ["lHip", "lKnee", [255, 51, 136]],
  ["lKnee", "lFoot", [255, 51, 51]],
  ["neck", "rHip", [255, 170, 51]],
  ["rHip", "rKnee", [255, 255, 51]],
  ["rKnee", "rFoot", [136, 255, 51]],
];

export class UsageLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return usageJson({ error: "method_not_allowed" }, 405);
    }

    const input = await request.json().catch(() => ({}));
    const now = Date.now();
    const action = safeString(input.action, "status");
    const refund = input.refund === true;
    const grant = input.grant === true;
    const cost = Math.max(0, Math.min(500, Math.abs(Number(input.cost) || 0)));
    const hourlyLimit = positiveNumber(input.hourlyLimit, DEFAULT_USAGE_HOURLY_CREDITS);
    const dailyLimit = positiveNumber(input.dailyLimit, DEFAULT_USAGE_DAILY_CREDITS);
    const hourStart = Math.floor(now / 3_600_000) * 3_600_000;
    const dayStart = Math.floor(now / 86_400_000) * 86_400_000;
    const stored = await this.state.storage.get(["hour", "day", "reward"]);
    const hour = stored.get("hour")?.start === hourStart
      ? stored.get("hour")
      : { start: hourStart, used: 0 };
    const day = stored.get("day")?.start === dayStart
      ? stored.get("day")
      : { start: dayStart, used: 0 };
    const reward = stored.get("reward")?.start === dayStart
      ? stored.get("reward")
      : { start: dayStart, granted: 0, claims: 0 };

    // 激励广告奖励额度按"当日 bonus"提升小时/日有效上限：daily 是真正的总量约束，
    // hourly 同幅提升只为避免小时节流挡住刚领取的奖励额度。used 计数保持非负，展示清晰。
    const bonus = Math.max(0, Number(reward.granted) || 0);
    const effectiveHourly = hourlyLimit + bonus;
    const effectiveDaily = dailyLimit + bonus;

    if (grant) {
      const grantCredits = Math.max(0, Math.min(100, Math.round(Number(input.grantCredits) || 0)));
      const rewardDailyMax = Math.max(0, Math.min(2000, Math.round(Number(input.rewardDailyMax) || 0)));
      const remainingCredits = Math.max(0, rewardDailyMax - (Number(reward.granted) || 0));
      if (grantCredits <= 0 || remainingCredits < grantCredits) {
        return usageJson({
          allowed: false,
          granted: 0,
          remainingRewards: grantCredits > 0 ? Math.floor(remainingCredits / grantCredits) : 0,
          usage: usagePayload({
            allowed: true,
            action: "reward",
            cost: 0,
            hour,
            day,
            hourlyLimit: effectiveHourly,
            dailyLimit: effectiveDaily,
            retryAt: null,
          }),
        }, 429);
      }
      reward.granted = (Number(reward.granted) || 0) + grantCredits;
      reward.claims = (Number(reward.claims) || 0) + 1;
      await this.state.storage.put({ reward });
      const nextEffectiveHourly = hourlyLimit + reward.granted;
      const nextEffectiveDaily = dailyLimit + reward.granted;
      return usageJson({
        allowed: true,
        granted: grantCredits,
        remainingRewards: Math.floor(Math.max(0, rewardDailyMax - reward.granted) / grantCredits),
        usage: usagePayload({
          allowed: true,
          action: "reward",
          cost: 0,
          hour,
          day,
          hourlyLimit: nextEffectiveHourly,
          dailyLimit: nextEffectiveDaily,
          retryAt: null,
        }),
      });
    }

    if (refund) {
      if (cost > 0) {
        hour.used = Math.max(0, hour.used - cost);
        day.used = Math.max(0, day.used - cost);
        await this.state.storage.put({ hour, day });
      }
      return usageJson(usagePayload({
        allowed: true,
        action,
        cost,
        hour,
        day,
        hourlyLimit: effectiveHourly,
        dailyLimit: effectiveDaily,
        retryAt: null,
      }));
    }

    const hourRemaining = Math.max(0, effectiveHourly - hour.used);
    const dayRemaining = Math.max(0, effectiveDaily - day.used);
    const allowed = cost === 0 || (hourRemaining >= cost && dayRemaining >= cost);
    const retryAt = hourRemaining < cost
      ? hour.start + 3_600_000
      : dayRemaining < cost
        ? day.start + 86_400_000
        : null;

    if (!allowed) {
      return usageJson(usagePayload({
        allowed: false,
        action,
        cost,
        hour,
        day,
        hourlyLimit: effectiveHourly,
        dailyLimit: effectiveDaily,
        retryAt,
      }), 429);
    }

    if (cost > 0) {
      hour.used += cost;
      day.used += cost;
      await this.state.storage.put({ hour, day });
    }

    return usageJson(usagePayload({
      allowed: true,
      action,
      cost,
      hour,
      day,
      hourlyLimit: effectiveHourly,
      dailyLimit: effectiveDaily,
      retryAt,
    }));
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env, url, ctx);
      }
      return await handleAssets(request, env, url);
    } catch (error) {
      const status = Number(error?.status) || 500;
      return jsonResponse(
        {
          error: error?.code || (status >= 500 ? "internal_error" : "bad_request"),
          message: error instanceof Error ? error.message : String(error),
        },
        status,
      );
    }
  },
};

async function handleApi(request, env, url, ctx = null) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (url.pathname === "/api/capabilities" && request.method === "GET") {
    return jsonResponse(await getCapabilities(env));
  }

  if (url.pathname === "/api/comfy/view" && (request.method === "GET" || request.method === "HEAD")) {
    return await proxyComfyView(env, url, request.method);
  }

  if (url.pathname === "/api/library/view" && (request.method === "GET" || request.method === "HEAD")) {
    return await proxyLibraryView(request, env, url, request.method, { authorizeApiRequest });
  }

  if (url.pathname === "/api/demo/video-sprite" && request.method === "GET") {
    return jsonResponse(await getVideoSpriteDemo(env));
  }

  if (url.pathname === "/api/demo/official-samples" && request.method === "GET") {
    return jsonResponse(getOfficialSamplesDemo(), 200, {
      "cache-control": `public, max-age=${OFFICIAL_SAMPLE_MANIFEST_CACHE_SECONDS}`,
    });
  }

  const officialSampleZipMatch = url.pathname.match(/^\/api\/demo\/official-samples\/([^/]+)\/download\.zip$/);
  if (officialSampleZipMatch && request.method === "GET") {
    return await downloadOfficialSampleZip(decodeURIComponent(officialSampleZipMatch[1]), request, env, ctx);
  }

  const authFailure = authorizeApiRequest(request, env);
  if (authFailure) return authFailure;

  // 管理:清空 R2 素材库(token 已鉴权 + 显式 confirm 防误触)。无现成删除 API,
  // 用 R2 list()+delete() 批量清掉 library/ 前缀的全部 jobs/packs/文件。
  if (url.pathname === "/api/admin/library/wipe" && request.method === "POST") {
    if (!env.ASSET_BUCKET) return jsonResponse({ error: "storage_not_configured" }, 503);
    if (url.searchParams.get("confirm") !== "wipe-all") {
      return jsonResponse({ error: "confirm_required", message: "Append ?confirm=wipe-all to wipe the entire library." }, 400);
    }
    const prefix = safeString(url.searchParams.get("prefix")) || "library/";
    let cursor;
    let deleted = 0;
    do {
      const listing = await env.ASSET_BUCKET.list({ prefix, cursor, limit: 1000 });
      const keys = (listing.objects || []).map((o) => o.key);
      if (keys.length) {
        await env.ASSET_BUCKET.delete(keys);
        deleted += keys.length;
      }
      cursor = listing.truncated ? listing.cursor : undefined;
    } while (cursor);
    return jsonResponse({ ok: true, prefix, deleted });
  }

  if (url.pathname === "/api/usage" && request.method === "GET") {
    return jsonResponse(await usageStatus(request, env));
  }

  if (url.pathname === "/api/usage/reward" && request.method === "POST") {
    return await grantUsageReward(request, env);
  }

  if (url.pathname === "/api/queue" && request.method === "GET") {
    return jsonResponse(await getQueueStatus(env, url));
  }

  if (url.pathname === "/api/jobs" && request.method === "GET") {
    return jsonResponse(await listJobs(env, url));
  }

  if (url.pathname === "/api/packs" && request.method === "GET") {
    return jsonResponse(await listPacks(env, url));
  }

  const packRequestMatch = url.pathname.match(/^\/api\/requests\/2d-pack\/([^/]+)$/);
  if (packRequestMatch && request.method === "GET") {
    const recovered = await recover2DPackRequestById(decodeURIComponent(packRequestMatch[1]), env);
    return jsonResponse(recovered || { ok: false, error: "request_not_found" }, recovered ? 200 : 404);
  }

  const layerRequestMatch = url.pathname.match(/^\/api\/requests\/layer-separation\/([^/]+)$/);
  if (layerRequestMatch && request.method === "GET") {
    const recovered = await recoverLayerSeparationRequestById(decodeURIComponent(layerRequestMatch[1]), env);
    return jsonResponse(recovered || { ok: false, error: "request_not_found" }, recovered ? 200 : 404);
  }

  if (url.pathname === "/api/library" && request.method === "GET") {
    return jsonResponse(await listLibrary(env, url));
  }

  if (url.pathname === "/api/prompt" && request.method === "POST") {
    const input = await readJson(request);
    const limited = await enforceUsageLimit(request, env, "prompt", USAGE_COSTS.prompt);
    if (limited) return limited;
    return jsonResponse(await planPrompt(input, env));
  }

  if (url.pathname === "/api/generate/2d" && request.method === "POST") {
    const input = await readJson(request);
    return await meteredJsonResponse(request, env, "generate2d", USAGE_COSTS.generate2d, async () => (
      await submit2DJob(input, env, {
        planPrompt,
        generateCost: USAGE_COSTS.generate2d,
      })
    ));
  }

  if (url.pathname === "/api/generate/2d-pack" && request.method === "POST") {
    const input = await readJson(request);
    const recovered = await recoverSubmitted2DPack(input, env);
    if (recovered) return jsonResponse(recovered);
    const cost = usageCostForPackInput(input);
    // sheet=true(且无参考图):一句话单图整套→切片,身份天然一致。有参考图仍走逐帧 img2img。
    if (input.sheet && !input.referenceImage?.filename) {
      return await meteredJsonResponse(request, env, "generate2d-pack", cost, async () => (
        await submit2DPackSheet(input, env, { getCapabilities, planPrompt })
      ));
    }
    return await meteredJsonResponse(request, env, "generate2d-pack", cost, async () => (
      await submit2DPack(input, env, { getCapabilities })
    ));
  }

  if (url.pathname === "/api/generate/video-sprite" && request.method === "POST") {
    const input = await readJson(request);
    const videoSpriteOptions = {
      getCapabilities,
      prepareCost: USAGE_COSTS.prepareVideoSprite,
      generateCost: USAGE_COSTS.generateVideoSprite,
    };
    if (input.submit === true) {
      const prepared = await prepareVideoSpriteExperiment(input, env, videoSpriteOptions);
      if (!prepared.ok) return jsonResponse(prepared);
      return await meteredJsonResponse(request, env, "generate-video-sprite", USAGE_COSTS.generateVideoSprite, async () => (
        await submitVideoSpriteExperiment(input, env, prepared, videoSpriteOptions)
      ));
    }
    return jsonResponse(await prepareVideoSpriteExperiment(input, env, videoSpriteOptions));
  }

  const packLayerMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/layers\/generate$/);
  if (packLayerMatch && request.method === "POST") {
    const input = await readJson(request);
    const target = await loadPackLayerSeparationTarget(decodeURIComponent(packLayerMatch[1]), input, env);
    const recovered = await recoverSubmittedLayerSeparation(input, env, target.pack.packId);
    if (recovered) return jsonResponse(recovered);
    return await meteredJsonResponse(request, env, "generate-layer-separation", USAGE_COSTS.generateLayerSeparation, async () => (
      await submitPackLayerSeparation(target, input, env)
    ));
  }

  const packSam3PreviewMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/spine-sam3\/preview\.json$/);
  if (packSam3PreviewMatch && request.method === "GET") {
    return jsonResponse(await getPackSpineSam3Preview(decodeURIComponent(packSam3PreviewMatch[1]), env));
  }

  const packSam3AnimMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/spine-sam3\/animation\/([a-z]+)\.gif$/);
  if (packSam3AnimMatch && request.method === "GET") {
    return await servePackSpineSam3Animation(
      decodeURIComponent(packSam3AnimMatch[1]),
      packSam3AnimMatch[2],
      env,
    );
  }

  const packSam3PartMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/spine-sam3\/(parts|cleaned-parts)\/([^/]+)\.png$/);
  if (packSam3PartMatch && request.method === "GET") {
    return await servePackSpineSam3Part(
      decodeURIComponent(packSam3PartMatch[1]),
      packSam3PartMatch[2],
      decodeURIComponent(packSam3PartMatch[3]),
      env,
    );
  }

  const packFrameRerunMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/frames\/([^/]+)\/rerun$/);
  if (packFrameRerunMatch && request.method === "POST") {
    const input = await readJson(request);
    const target = await loadPackFrameRerunTarget(
      decodeURIComponent(packFrameRerunMatch[1]),
      decodeURIComponent(packFrameRerunMatch[2]),
      input,
      env,
    );
    return await meteredJsonResponse(request, env, "generate2d-pack-frame-rerun", USAGE_COSTS.generate2dPackFrame, async () => (
      await rerunPackFrame(target, input, env)
    ));
  }

  if (url.pathname === "/api/generate/3d" && request.method === "POST") {
    const input = await readJson(request);
    return await meteredJsonResponse(request, env, "generate3d", USAGE_COSTS.generate3d, async () => (
      await submit3DJob(input, env, {
        getCapabilities,
        generateCost: USAGE_COSTS.generate3d,
      })
    ));
  }

  const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (jobMatch && request.method === "GET") {
    return jsonResponse(await getJob(jobMatch[1], env, url));
  }

  const packZipMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/download\.zip$/);
  if (packZipMatch && request.method === "GET") {
    return await downloadPackZip(packZipMatch[1], env);
  }

  const packMatch = url.pathname.match(/^\/api\/packs\/([^/]+)$/);
  if (packMatch && request.method === "GET") {
    return jsonResponse(await getPack(packMatch[1], env));
  }

  return jsonResponse({ error: "not_found" }, 404);
}

async function getCapabilities(env) {
  return await readCapabilities(env, {
    usageCosts: USAGE_COSTS,
    defaultHourlyCredits: DEFAULT_USAGE_HOURLY_CREDITS,
    defaultDailyCredits: DEFAULT_USAGE_DAILY_CREDITS,
  });
}

export function averageNumbers(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((total, value) => total + value, 0) / clean.length : 0;
}

async function loadPackLayerSeparationTarget(packId, input, env) {
  if (!env.ASSET_BUCKET) throw httpError(503, "Storage is not configured.", "storage_not_configured");
  const pack = await readPackRecord(env, packId);
  if (!pack) throw httpError(404, "Pack not found.", "not_found");
  const refreshed = await refreshPackRecord(env, packId).catch((error) => {
    console.warn("R2 pack refresh failed", error);
    return pack;
  });
  const current = refreshed || pack;
  if (current.packKind !== "sprite-actions") {
    throw httpError(400, "Spine layer separation is only available for sprite action packs.", "pack_unavailable");
  }
  const frameId = safeString(input.frameId);
  const frame = frameId
    ? (current.frames || []).find((item) => item.id === frameId || item.promptId === frameId)
    : (current.frames || []).find((item) => item.result?.fileKey);
  if (!frame) throw httpError(404, "Pack frame not found.", "frame_not_found");
  const fileKey = frame.result?.fileKey;
  if (!fileKey) {
    throw httpError(409, "The selected frame is not archived yet.", "frame_not_ready");
  }
  const invalid = invalidLibraryFileKey(fileKey);
  if (invalid) throw httpError(400, invalid, "invalid_file");
  const object = await env.ASSET_BUCKET.get(fileKey);
  if (!object) throw httpError(404, "Archived frame image not found.", "frame_file_not_found");
  const bytes = await object.arrayBuffer();
  const blob = new Blob([bytes], { type: contentTypeForResult(frame.result) || "image/png" });
  const dimensions = await imageBlobDimensions(blob) || frame.dimensions || current.metadata || {};
  return {
    pack: current,
    frame,
    blob,
    dimensions: {
      width: Number(dimensions.width || current.metadata?.cellWidth || 512),
      height: Number(dimensions.height || current.metadata?.cellHeight || 512),
    },
  };
}

async function recoverSubmittedLayerSeparation(input, env, packId = null) {
  const requestId = normalizePackRequestId(input);
  if (!requestId) return null;
  return await recoverLayerSeparationRequestById(requestId, env, packId);
}

async function recoverLayerSeparationRequestById(requestId, env, packId = null) {
  const normalizedRequestId = normalizePackRequestId(requestId);
  if (!normalizedRequestId) return null;
  const index = await readLayerRequestIndex(env, normalizedRequestId).catch((error) => {
    console.warn("Layer request index read failed", error);
    return null;
  });
  if (!index?.promptId) return null;
  const job = await readJobRecord(env, index.promptId).catch((error) => {
    console.warn("Layer request job read failed", error);
    return null;
  });
  if (!job || (packId && job.packId !== packId)) return null;
  return layerSeparationResponseFromJob(job, {
    requestId: normalizedRequestId,
    idempotent: true,
    recovered: true,
  });
}

function layerSeparationResponseFromJob(job, extra = {}) {
  return {
    ok: true,
    kind: "layer-separation",
    promptId: job.promptId,
    clientId: job.clientId,
    packId: job.packId,
    frameId: job.frameId,
    frameLabel: job.frameLabel,
    sourceImage: job.sourceImage,
    layers: Array.isArray(job.layers) ? job.layers : [],
    pollUrl: job.pollUrl || `/api/jobs/${job.promptId}?kind=layer-separation`,
    status: job.status || "queued",
    result: job.result || null,
    ...extra,
  };
}

async function submitPackLayerSeparation(target, input, env) {
  const requestId = normalizePackRequestId(input);
  const recovered = requestId ? await recoverLayerSeparationRequestById(requestId, env, target.pack.packId) : null;
  if (recovered) return recovered;
  const capabilities = await getCapabilities(env);
  if (!capabilities.layerSeparation.available) {
    return {
      ok: false,
      error: "layer_separation_unavailable",
      message: "SAM3 layer separation needs local SAM3 nodes and a SAM3 checkpoint on ComfyUI.",
      missing: capabilities.layerSeparation.missing,
      models: capabilities.layerSeparation.models,
      detectedNodes: capabilities.layerSeparation.detectedNodes,
    };
  }

  const filename = await uploadImageToComfy(env, target.blob, `lingji_spine_layer_${target.pack.packId}_${target.frame.id}.png`);
  const prompts = normalizeSpineLayerPrompts(input.prompts);
  const workflow = buildSam3LayerSeparationWorkflow({
    filename,
    dimensions: target.dimensions,
    modelName: capabilities.layerSeparation.models.sam3Checkpoint,
    threshold: normalizeLayerThreshold(input.threshold),
    refineIterations: normalizeLayerRefineIterations(input.refineIterations),
    prompts,
  });
  const submitted = await submitComfyWorkflow(env, workflow);
  const job = {
    ok: true,
    kind: "layer-separation",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    packId: target.pack.packId,
    frameId: target.frame.id,
    frameLabel: target.frame.label,
    sourceImage: filename,
    layers: prompts.map(({ id, label, prompt, mode }) => ({ id, label, prompt, mode })),
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=layer-separation`,
  };
  await rememberJobRecord(env, {
    id: `layer-separation:${submitted.prompt_id}`,
    kind: "layer-separation",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    packId: target.pack.packId,
    packPreset: target.pack.preset,
    packKind: target.pack.packKind,
    frameId: target.frame.id,
    frameLabel: target.frame.label,
    sourceImage: filename,
    sourceFileKey: target.frame.result?.fileKey || null,
    layers: job.layers,
    cost: USAGE_COSTS.generateLayerSeparation,
    workflow: "SAM3 text-prompt Spine layer separation",
    pollUrl: job.pollUrl,
  });
  if (requestId) {
    await rememberLayerRequestIndex(env, requestId, submitted.prompt_id, {
      packId: target.pack.packId,
      frameId: target.frame.id,
      frameLabel: target.frame.label,
    }).catch((error) => {
      console.warn("Layer request index write failed", error);
    });
  }
  return job;
}

function normalizeLayerThreshold(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.45;
  return Math.max(0.05, Math.min(0.95, number));
}

function normalizeLayerRefineIterations(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 2;
  return Math.max(0, Math.min(5, Math.round(number)));
}

function authorizeApiRequest(request, env) {
  // 公开模式:放行所有 /api(过渡期对外开放,后续接谷歌 SSO 再关闭此开关)。
  // 注意:开启即对持有 URL 的任何人开放本机算力,仅在额度无限/自有显卡场景下使用。
  if (safeString(env.GENERATOR_PUBLIC) === "true") return null;
  const expected = safeString(env.GENERATOR_ACCESS_TOKEN);
  if (!expected) return null;
  const provided = apiAccessToken(request);
  if (provided && provided === expected) return null;
  return jsonResponse(
    {
      error: "auth_required",
      message: "This generator requires an access token.",
      auth: { required: true },
    },
    401,
  );
}

export function apiAccessToken(request) {
  const explicit = safeString(request.headers.get("x-lingji-access-token"));
  if (explicit) return explicit;
  const authorization = safeString(request.headers.get("authorization"));
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function pickFirst(values = [], pattern = /./) {
  return (Array.isArray(values) ? values : []).find((value) => pattern.test(value)) || firstArrayItem(values) || "";
}

export function normalizeFileCandidate(candidate) {
  if (!candidate) return null;
  if (typeof candidate === "string") {
    return { filename: candidate, subfolder: "", type: "output" };
  }
  if (typeof candidate === "object" && typeof candidate.filename === "string") {
    return {
      filename: candidate.filename,
      subfolder: typeof candidate.subfolder === "string" ? candidate.subfolder : "",
      type: typeof candidate.type === "string" ? candidate.type : "output",
    };
  }
  return null;
}

export function firstArrayItem(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

export const PACK_ALPHA_CONFIG = {
  method: "edge-connected-corner-flood",
  threshold: 34,
  feather: 22,
};

export function validateImageDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || dataUrl.length > MAX_DATA_URL_CHARS) {
    throw httpError(413, "Image data URL is too large.", "payload_too_large");
  }
  const match = /^data:([^;,]+)?(;base64)?,/i.exec(dataUrl);
  if (!match || match[2] !== ";base64") {
    throw httpError(400, "Image data URL must be base64 encoded.", "invalid_image_data_url");
  }
  const mime = match[1] || "";
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) {
    throw httpError(400, "Image data URL must be PNG, JPEG, or WebP.", "invalid_image_data_url");
  }
}

export function mimeToExtension(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/png") return "png";
  return null;
}

async function readJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BODY_BYTES) {
    throw httpError(413, "Request body is too large.", "payload_too_large");
  }
  const text = await request.text();
  if (text.length > MAX_JSON_BODY_BYTES) {
    throw httpError(413, "Request body is too large.", "payload_too_large");
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, "Invalid JSON request body", "invalid_json");
  }
}

export function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

export function validateComfyImageMeta(meta) {
  const invalid = invalidComfyImageMeta(meta);
  if (invalid) throw httpError(400, invalid, "invalid_file");
}

export function invalidComfyImageMeta(meta) {
  const filename = safeString(meta?.filename);
  const subfolder = safeString(meta?.subfolder);
  const type = safeString(meta?.type, "output");
  if (!filename || filename.length > 180) return "Invalid Comfy filename.";
  if (subfolder.length > 180) return "Invalid Comfy subfolder.";
  if (!ALLOWED_COMFY_FILE_TYPES.has(type)) return "Invalid Comfy file type.";
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return "Invalid Comfy filename.";
  if (subfolder.includes("\\") || subfolder.includes("..")) return "Invalid Comfy subfolder.";
  return "";
}

export function httpError(status, message, code = "bad_request") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,HEAD,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-lingji-access-token",
  };
}
