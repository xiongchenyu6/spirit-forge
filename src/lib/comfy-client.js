// comfy-client —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { LAYER_SEPARATION_NODE_CANDIDATES, VIDEO_TO_SPRITE_NODE_CANDIDATES, dataUrlToBlob, firstArrayItem, httpError, invalidComfyImageMeta, jsonResponse, mimeToExtension, normalizeFileCandidate, safeString, validateComfyImageMeta, validateImageDataUrl } from "../worker.js";
import { isPngSignature } from "./binary.js";

const COMFY_SPINE_LAYER_PROMPTS = [
  { id: "subject", label: "Subject" },
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "hips", label: "Hips" },
  { id: "arm_l", label: "Left arm" },
  { id: "arm_r", label: "Right arm" },
  { id: "leg_l", label: "Left leg" },
  { id: "leg_r", label: "Right leg" },
];

function comfySpineLayerLabel(layerId) {
  return COMFY_SPINE_LAYER_PROMPTS.find((item) => item.id === layerId)?.label || layerId;
}

function safeLibrarySegment(value) {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return (text || "asset")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "asset";
}

export function selectVideoToSprite(objectInfo = {}, modelLists = {}) {
  const hasNode = (name) => Boolean(objectInfo && objectInfo[name]);
  const detected = VIDEO_TO_SPRITE_NODE_CANDIDATES.filter(hasNode);
  const openSourceNodes = detected.filter((name) => !/Api|Node$/i.test(name));
  const hasVideoOutput = detected.some((name) => ["CreateVideo", "SaveVideo", "SaveWEBM", "LoadVideo"].includes(name));
  const hasImageToVideo = detected.some((name) => /ImageToVideo|ImgToVideo|img2vid|AnimateToVideo/i.test(name));
  const diffusion = Array.isArray(modelLists.diffusion) ? modelLists.diffusion : [];
  const vae = Array.isArray(modelLists.vae) ? modelLists.vae : [];
  const textEncoders = Array.isArray(modelLists.textEncoders) ? modelLists.textEncoders : [];
  const loras = Array.isArray(modelLists.loras) ? modelLists.loras : [];
  const models = {
    wanI2v: diffusion.filter((name) => /wan.*i2v|i2v.*wan/i.test(name)),
    wanT2v: diffusion.filter((name) => /wan.*t2v|t2v.*wan/i.test(name)),
    vae: vae.filter((name) => /wan/i.test(name)),
    textEncoders: textEncoders.filter((name) => /umt5|qwen/i.test(name)),
    loras: loras.filter((name) => /Wan2\.2-Lightning_I2V/i.test(name)),
  };
  const missing = [];
  if (!hasImageToVideo) missing.push("missing image-to-video workflow node");
  if (!hasVideoOutput) missing.push("missing video load/save node");
  if (models.wanI2v.length === 0) missing.push("missing Wan image-to-video diffusion model");
  if (models.vae.length === 0) missing.push("missing Wan VAE");
  if (models.textEncoders.length === 0) missing.push("missing Wan text encoder");
  if (!models.loras.some((name) => /HIGH/i.test(name))) missing.push("missing Wan2.2 Lightning I2V high-noise LoRA");
  if (!models.loras.some((name) => /LOW/i.test(name))) missing.push("missing Wan2.2 Lightning I2V low-noise LoRA");
  return {
    available: hasImageToVideo && hasVideoOutput && missing.length === 0,
    experimental: true,
    workflow: "Video-to-Sprite A/B experiment",
    strategy: "generate short solid-background motion video, sample keyframes, remove background, align subject, export sprite sheet",
    detectedNodes: detected,
    openSourceNodes,
    models,
    missing,
  };
}

export function selectLayerSeparation(objectInfo = {}, modelLists = {}) {
  const hasNode = (name) => Boolean(objectInfo && objectInfo[name]);
  const detectedNodes = LAYER_SEPARATION_NODE_CANDIDATES.filter(hasNode);
  const localSegmentationNodes = detectedNodes.filter((name) => !/Bria|Recraft/i.test(name));
  const apiNodes = detectedNodes.filter((name) => /Bria|Recraft/i.test(name));
  const checkpoints = Array.isArray(modelLists.checkpoints) ? modelLists.checkpoints : [];
  const sam3Checkpoint = checkpoints.find((name) => /sam[-_. ]?3/i.test(name)) || null;
  const requiredLocal = [
    "CheckpointLoaderSimple",
    "CLIPTextEncode",
    "SAM3_Detect",
    "MaskToImage",
    "PrimitiveBoundingBox",
    "SaveImage",
  ];
  const helpfulLocal = [
    "CropByBBoxes",
    "DrawBBoxes",
    "ImageCompositeMasked",
    "GrowMask",
    "FeatherMask",
    "ThresholdMask",
    "ImageToMask",
  ];
  const missing = [];
  for (const node of requiredLocal) {
    if (!hasNode(node)) missing.push(`missing node: ${node}`);
  }
  if (!sam3Checkpoint) missing.push("missing SAM3 checkpoint");
  const available = missing.length === 0;
  return {
    available,
    experimental: true,
    workflow: available
      ? "SAM3 checkpoint + text-prompt masks for first-pass Spine layer separation"
      : "heuristic rig-template only",
    strategy: available
      ? "use local SAM3 text masks to create subject and body-part layer previews for the Spine rig-template"
      : "export heuristic first-frame crops and quality.json until local segmentation nodes and model are available",
    mode: available ? "local-open-segmentation" : "heuristic-template",
    models: {
      sam3Checkpoint,
      checkpointSource: sam3Checkpoint ? "checkpoints" : null,
    },
    detectedNodes,
    localSegmentationNodes,
    apiNodes,
    requiredLocal: requiredLocal.reduce((acc, node) => {
      acc[node] = hasNode(node);
      return acc;
    }, {}),
    helpfulLocal: helpfulLocal.reduce((acc, node) => {
      acc[node] = hasNode(node);
      return acc;
    }, {}),
    missing,
    notes: [
      apiNodes.length
        ? "Bria/Recraft API nodes are detected but are not treated as the default open-source path."
        : "No Bria/Recraft API nodes detected.",
      available
        ? "Local segmentation is available for a future precise layer-generation workflow."
        : "The current ZIP still exports the heuristic rig-template scaffold.",
    ],
  };
}

export async function fetchComfyResponse(env, meta) {
  const view = new URL(`${comfyBase(env)}/view`);
  view.searchParams.set("filename", meta.filename);
  view.searchParams.set("type", meta.type || "output");
  view.searchParams.set("subfolder", meta.subfolder || "");
  return await fetch(view.toString(), {
    headers: comfyHeaders(env),
  });
}

export async function proxyComfyView(env, url, method = "GET") {
  const filename = url.searchParams.get("filename");
  if (!filename) return jsonResponse({ error: "missing_filename" }, 400);
  const meta = {
    filename,
    subfolder: url.searchParams.get("subfolder") || "",
    type: url.searchParams.get("type") || "output",
  };
  const invalid = invalidComfyImageMeta(meta);
  if (invalid) return jsonResponse({ error: "invalid_file", message: invalid }, 400);
  const view = new URL(`${comfyBase(env)}/view`);
  view.searchParams.set("filename", meta.filename);
  view.searchParams.set("type", meta.type);
  view.searchParams.set("subfolder", meta.subfolder);
  const response = await fetch(view.toString(), {
    headers: comfyHeaders(env),
  });
  if (!response.ok) {
    return jsonResponse({ error: "comfy_view_failed", status: response.status }, response.status);
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "private, max-age=3600");
  headers.set("access-control-allow-origin", "*");
  return new Response(method === "HEAD" ? null : response.body, { status: response.status, headers });
}

export async function submitComfyWorkflow(env, workflow) {
  const clientId = crypto.randomUUID();
  const response = await fetch(`${comfyBase(env)}/prompt`, {
    method: "POST",
    headers: comfyHeaders(env, { "content-type": "application/json" }),
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new Error(`Comfy POST /prompt failed: ${response.status} ${text.slice(0, 800)}`);
  }
  if (!json?.prompt_id) {
    throw new Error(`Comfy POST /prompt returned no prompt_id: ${text.slice(0, 800)}`);
  }
  if (json.node_errors && Object.keys(json.node_errors).length > 0) {
    throw new Error(`Comfy workflow validation failed: ${JSON.stringify(json.node_errors).slice(0, 1000)}`);
  }
  return { ...json, client_id: clientId };
}

export async function ensureComfyInputImage(input, env, fallbackName = "lingji_3d_source.png") {
  const blob = await sourceImageBlob(input, env);
  return await uploadImageToComfy(env, blob, fallbackName);
}

export async function ensureSpriteReferenceImage(input, env, fallbackName = "lingji_pack_reference.png") {
  const blob = await sourceImageBlob(input, env);
  await validateSingleFrameReferenceImage(blob);
  return await uploadImageToComfy(env, blob, fallbackName);
}

async function sourceImageBlob(input, env) {
  if (input.comfyImage?.filename) {
    validateComfyImageMeta(input.comfyImage);
    return await fetchComfyFile(env, input.comfyImage);
  }
  if (input.imageUrl) {
    const response = await fetch(input.imageUrl);
    if (!response.ok) throw new Error(`Could not fetch source image: ${response.status}`);
    return await response.blob();
  }
  if (input.imageDataUrl) {
    validateImageDataUrl(input.imageDataUrl);
    return dataUrlToBlob(input.imageDataUrl);
  }
  throw new Error("Generation needs a source image first.");
}

async function validateSingleFrameReferenceImage(blob) {
  const dimensions = await imageBlobDimensions(blob);
  if (!dimensions) return;
  const ratio = dimensions.width / dimensions.height;
  if (ratio < 0.62 || ratio > 1.62) {
    throw httpError(
      400,
      `动作包参考图需要是单帧角色/怪物素材，当前图片尺寸 ${dimensions.width}x${dimensions.height} 像是 sheet 或宽幅图。请先生成一张单帧 2D 定稿，再生成动作包。`,
      "invalid_reference_image",
    );
  }
}

export async function imageBlobDimensions(blob) {
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  if (bytes.length >= 24 && isPngSignature(bytes)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      width: view.getUint32(16, false),
      height: view.getUint32(20, false),
      type: "image/png",
    };
  }
  return null;
}

async function fetchComfyFile(env, meta) {
  const view = new URL(`${comfyBase(env)}/view`);
  view.searchParams.set("filename", meta.filename);
  view.searchParams.set("subfolder", meta.subfolder || "");
  view.searchParams.set("type", meta.type || "output");
  const response = await fetch(view.toString(), { headers: comfyHeaders(env) });
  if (!response.ok) throw new Error(`Could not fetch Comfy source image: ${response.status}`);
  return await response.blob();
}

export async function uploadImageToComfy(env, blob, fallbackName) {
  const ext = mimeToExtension(blob.type) || "png";
  const filename = `${fallbackName.replace(/\.[^.]+$/, "")}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const form = new FormData();
  form.append("image", blob, filename);
  form.append("type", "input");
  form.append("overwrite", "true");
  const response = await fetch(`${comfyBase(env)}/upload/image`, {
    method: "POST",
    headers: comfyHeaders(env),
    body: form,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Comfy upload failed: ${response.status} ${text.slice(0, 500)}`);
  const json = text ? JSON.parse(text) : {};
  if (!json.name) throw new Error(`Comfy upload returned no name: ${text.slice(0, 500)}`);
  return json.name;
}

export async function listComfyModels(env) {
  const endpoints = {
    checkpoints: "/models/checkpoints",
    controlnet: "/models/controlnet",
    diffusion: "/models/diffusion_models",
    clipVision: "/models/clip_vision",
    vae: "/models/vae",
    textEncoders: "/models/text_encoders",
    loras: "/models/loras",
  };
  const entries = await Promise.all(
    Object.entries(endpoints).map(async ([key, endpoint]) => {
      try {
        const value = await comfyFetchJson(env, endpoint);
        return [key, Array.isArray(value) ? value : []];
      } catch {
        return [key, []];
      }
    }),
  );
  return Object.fromEntries(entries);
}

export function selectPoseControl(objectInfo, modelLists, env = {}) {
  const hasNode = (name) => Boolean(objectInfo && objectInfo[name]);
  const controlnetModels = Array.isArray(modelLists.controlnet) ? modelLists.controlnet : [];
  const configured = env.POSE_CONTROLNET_MODEL || null;
  const model = configured || controlnetModels.find((name) => /openpose|dwpose|pose|union|controlnet.*flux|flux.*controlnet/i.test(name)) || null;
  const requiredNodes = [
    "ControlNetLoader",
    "ControlNetApplyAdvanced",
    "LoadImage",
    "ImageScale",
    "VAEEncode",
  ];
  const missing = [];
  for (const node of requiredNodes) {
    if (!hasNode(node)) missing.push(`missing node: ${node}`);
  }
  if (!model) missing.push("missing ControlNet/OpenPose model");
  return {
    available: missing.length === 0,
    workflow: "reference img2img + pose ControlNet",
    model,
    modelSource: configured ? "env" : model ? "auto" : null,
    nodes: requiredNodes.reduce((acc, node) => {
      acc[node] = hasNode(node);
      return acc;
    }, {}),
    missing,
  };
}

export function selectHunyuanModel(objectInfo, env = {}) {
  const fromCombo = (nodeName, inputName) => {
    const value = objectInfo?.[nodeName]?.input?.required?.[inputName]?.[0];
    return Array.isArray(value) ? value : [];
  };
  const values = fromCombo("ImageOnlyCheckpointLoader", "ckpt_name");
  const checkpoint = env.HUNYUAN3D_CHECKPOINT
    || values.find((name) => /hunyuan.*3d|3d.*hunyuan|hy3d/i.test(name))
    || null;
  return {
    checkpoint,
  };
}

export async function comfyFetchJson(env, path) {
  const response = await fetch(`${comfyBase(env)}${path}`, {
    headers: comfyHeaders(env),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Comfy ${path} failed: ${response.status} ${text.slice(0, 500)}`);
  }
  return await response.json();
}

function comfyBase(env) {
  const base = env.COMFY_UPSTREAM_BASE || env.COMFY_REST_PROXY_URL;
  if (!base) throw new Error("COMFY_UPSTREAM_BASE is not configured");
  return base.replace(/\/+$/, "");
}

function comfyHeaders(env, extra = {}) {
  const headers = new Headers(extra);
  if (env.COMFY_API_TOKEN) headers.set("authorization", `Bearer ${env.COMFY_API_TOKEN}`);
  return headers;
}

export async function getQueueStatus(env, url) {
  const promptId = safeString(url.searchParams.get("promptId"));
  const data = await comfyFetchJson(env, "/queue");
  const running = normalizeQueueItems(data.queue_running);
  const pending = normalizeQueueItems(data.queue_pending);
  const all = [...running, ...pending];
  const match = promptId ? all.find((item) => item.promptId === promptId) : null;
  return {
    ok: true,
    running: running.length,
    pending: pending.length,
    total: running.length + pending.length,
    promptId: promptId || null,
    current: match
      ? {
          state: running.some((item) => item.promptId === promptId) ? "running" : "pending",
          index: match.index,
          promptId: match.promptId,
        }
      : promptId
        ? { state: "not_in_queue", index: null, promptId }
        : null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeQueueItems(items) {
  return Array.isArray(items)
    ? items.map((item, index) => ({
        index,
        promptId: queuePromptId(item),
      })).filter((item) => item.promptId)
    : [];
}

function queuePromptId(item) {
  if (Array.isArray(item)) {
    return safeString(item[1] || item[0]?.prompt_id || item[0]?.promptId);
  }
  return safeString(item?.prompt_id || item?.promptId || item?.id);
}

export function firstImageOutput(outputs) {
  for (const nodeOutput of Object.values(outputs || {})) {
    const image = firstArrayItem(nodeOutput?.images);
    if (image?.filename) {
      return {
        kind: "image",
        filename: image.filename,
        subfolder: image.subfolder || "",
        type: image.type || "output",
      };
    }
  }
  return null;
}

export function layerSeparationOutput(outputs) {
  const files = [];
  for (const [nodeId, nodeOutput] of Object.entries(outputs || {})) {
    for (const image of nodeOutput?.images || []) {
      if (!image?.filename) continue;
      const layerId = layerIdFromFilename(image.filename);
      files.push({
        kind: "image",
        nodeId,
        layerId,
        label: comfySpineLayerLabel(layerId),
        filename: image.filename,
        subfolder: image.subfolder || "",
        type: image.type || "output",
      });
    }
  }
  if (files.length === 0) return null;
  const order = new Map(COMFY_SPINE_LAYER_PROMPTS.map((item, index) => [item.id, index]));
  files.sort((a, b) => (order.get(a.layerId) ?? 999) - (order.get(b.layerId) ?? 999));
  return {
    kind: "layer-separation",
    files,
  };
}

export function layerIdFromFilename(filename) {
  const name = safeString(filename).toLowerCase();
  const match = name.match(/lingji_spine_layer_([a-z0-9_-]+?)(?:_\d+_)?\.(?:png|webp|jpg|jpeg)$/i);
  return match ? match[1] : safeLibrarySegment(name.replace(/\.[^.]+$/, ""));
}

export function firstModelOutput(outputs) {
  for (const nodeOutput of Object.values(outputs || {})) {
    for (const key of ["gltf", "glb", "models", "files", "3d", "model"]) {
      const candidate = firstArrayItem(nodeOutput?.[key]);
      const normalized = normalizeFileCandidate(candidate);
      if (normalized) return { kind: "model", ...normalized };
    }
    const normalized = normalizeFileCandidate(nodeOutput);
    if (normalized) return { kind: "model", ...normalized };
  }
  return null;
}

export function firstVideoOutput(outputs) {
  for (const nodeOutput of Object.values(outputs || {})) {
    const imageLikeVideo = firstArrayItem(nodeOutput?.images);
    if (imageLikeVideo?.filename && (nodeOutput?.animated?.[0] || /\.(mp4|webm|mov|gif)$/i.test(imageLikeVideo.filename))) {
      return {
        kind: "video",
        filename: imageLikeVideo.filename,
        subfolder: imageLikeVideo.subfolder || "",
        type: imageLikeVideo.type || "output",
      };
    }
    for (const key of ["videos", "video", "files", "gifs", "animated"]) {
      const candidate = firstArrayItem(nodeOutput?.[key]);
      const normalized = normalizeFileCandidate(candidate);
      if (normalized) return { kind: "video", ...normalized };
    }
    const normalized = normalizeFileCandidate(nodeOutput);
    if (normalized && /\.(mp4|webm|mov|gif)$/i.test(normalized.filename)) {
      return { kind: "video", ...normalized };
    }
  }
  return null;
}

export function buildComfyViewUrl(meta) {
  const params = new URLSearchParams();
  params.set("filename", meta.filename);
  params.set("subfolder", meta.subfolder || "");
  params.set("type", meta.type || "output");
  return `/api/comfy/view?${params.toString()}`;
}
