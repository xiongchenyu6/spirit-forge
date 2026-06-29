import { ensureComfyInputImage, submitComfyWorkflow } from "./comfy-client.js";
import { buildWan22I2VWorkflow } from "./comfy-workflows.js";
import { clampVideoDimension, clampVideoFps, clampVideoLength, normalizeGenerationInput, randomSeed, videoSpriteNegativePrompt, videoSpritePrompt } from "./generation-utils.js";
import { rememberJobRecord } from "./storage.js";

export async function prepareVideoSpriteExperiment(input, env, options = {}) {
  const getCapabilities = options.getCapabilities;
  if (typeof getCapabilities !== "function") {
    throw new Error("prepareVideoSpriteExperiment requires getCapabilities.");
  }
  const capabilities = await getCapabilities(env);
  if (!capabilities.videoToSprite.available) {
    return {
      ok: false,
      error: "video_to_sprite_unavailable",
      message: "Video-to-Sprite needs Wan image-to-video nodes, video save/load nodes, Wan I2V models, Wan VAE, and a compatible text encoder.",
      missing: capabilities.videoToSprite.missing,
      detectedNodes: capabilities.videoToSprite.detectedNodes,
      models: capabilities.videoToSprite.models,
    };
  }

  let sourceImage = null;
  try {
    sourceImage = await ensureComfyInputImage(input, env, "lingji_video_sprite_source.png");
  } catch (error) {
    return {
      ok: false,
      error: "source_image_required",
      message: "Video-to-Sprite needs a 2D source frame first. Generate or restore a character/monster image, then run video sprite generation.",
      detail: error instanceof Error ? error.message : String(error),
      detectedNodes: capabilities.videoToSprite.openSourceNodes,
      models: capabilities.videoToSprite.models,
    };
  }

  return {
    ok: true,
    kind: "video-sprite",
    status: "prepared",
    submitted: false,
    chargeable: false,
    cost: options.prepareCost ?? 0,
    sourceImage,
    workflow: {
      candidate: "Wan2.2 image-to-video, solid-background motion clip, sampled into sprite frames",
      reason: "Wan I2V model files, Lightning LoRAs, Wan VAE, text encoder, and video save nodes are present. The graph has passed WEBM smoke testing; the browser extracts keyframes and exports sprite deliverables.",
      detectedNodes: capabilities.videoToSprite.openSourceNodes,
      models: capabilities.videoToSprite.models,
    },
    plan: {
      prompt: safeString(input.brief || input.prompt, "same creature, short readable game animation, solid green background"),
      preset: safeString(input.preset, "monster-actions"),
      frameTargets: ["idle", "move", "attack", "death"],
      sampling: {
        durationSeconds: 2,
        fps: 12,
        keyframes: 4,
      },
      postprocess: [
        "sample evenly spaced keyframes from generated video",
        "remove solid background with edge-connected chroma pass",
        "normalize subject bounds and center point",
        "reject frames with excessive scale drift",
        "compose transparent PNG frames and sprite sheet",
      ],
      qa: [
        "identity consistency",
        "motion amplitude",
        "background removal quality",
        "center drift",
        "sprite scale consistency",
        "loop readability",
      ],
    },
  };
}

export async function submitVideoSpriteExperiment(input, env, prepared = null, options = {}) {
  prepared ||= await prepareVideoSpriteExperiment(input, env, options);
  if (!prepared.ok) return prepared;

  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const width = clampVideoDimension(input.width || 512);
  const height = clampVideoDimension(input.height || 512);
  const length = clampVideoLength(input.length || 33);
  const fps = clampVideoFps(input.fps || 12);
  const prompt = videoSpritePrompt(input);
  // 可选尾帧(FLF2V):传 endImageDataUrl / endComfyImage 即用首尾帧引导插补,提高可控性、稳住单角色。
  let endImage = null;
  if (input.endComfyImage?.filename || input.endImageDataUrl || input.endImageUrl) {
    endImage = await ensureComfyInputImage(
      { comfyImage: input.endComfyImage, imageDataUrl: input.endImageDataUrl, imageUrl: input.endImageUrl },
      env,
      "lingji_video_sprite_end.png",
    ).catch(() => null);
  }
  const workflow = buildWan22I2VWorkflow({
    sourceImage: prepared.sourceImage,
    endImage,
    prompt,
    negativePrompt: videoSpriteNegativePrompt(input),
    seed,
    width,
    height,
    length,
    fps,
    models: prepared.workflow.models,
  });
  const submitted = await submitComfyWorkflow(env, workflow);
  const job = {
    ok: true,
    kind: "video-sprite",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions: { width, height, length, fps },
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=video-sprite`,
    plan: prepared.plan,
  };
  await rememberJobRecord(env, {
    id: `video-sprite:${submitted.prompt_id}`,
    kind: "video-sprite",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions: job.dimensions,
    input: normalizeGenerationInput(input),
    sourceImage: prepared.sourceImage,
    cost: options.generateCost ?? 80,
    workflow: "Wan2.2 I2V Lightning WEBM smoke",
    plan: prepared.plan,
    pollUrl: job.pollUrl,
  });
  return job;
}

function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
