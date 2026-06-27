// comfy-workflows —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { DEFAULT_NEGATIVE, pickFirst } from "../app.js";

function safeLibrarySegment(value) {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return (text || "asset")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "asset";
}

export function buildWan22I2VWorkflow({ sourceImage, prompt, negativePrompt, seed, width, height, length, fps, models }) {
  const highModel = pickFirst(models?.wanI2v, /high/i);
  const lowModel = pickFirst(models?.wanI2v, /low/i);
  const highLora = pickFirst(models?.loras, /high/i);
  const lowLora = pickFirst(models?.loras, /low/i);
  const vae = pickFirst(models?.vae, /wan/i);
  const textEncoder = pickFirst(models?.textEncoders, /umt5/i) || pickFirst(models?.textEncoders, /qwen/i);
  return {
    "1": {
      class_type: "UNETLoader",
      inputs: { unet_name: highModel, weight_dtype: "default" },
    },
    "2": {
      class_type: "LoraLoaderModelOnly",
      inputs: { model: ["1", 0], lora_name: highLora, strength_model: 1.0 },
    },
    "3": {
      class_type: "ModelSamplingSD3",
      inputs: { model: ["2", 0], shift: 5.0 },
    },
    "4": {
      class_type: "UNETLoader",
      inputs: { unet_name: lowModel, weight_dtype: "default" },
    },
    "5": {
      class_type: "LoraLoaderModelOnly",
      inputs: { model: ["4", 0], lora_name: lowLora, strength_model: 1.0 },
    },
    "6": {
      class_type: "ModelSamplingSD3",
      inputs: { model: ["5", 0], shift: 5.0 },
    },
    "7": {
      class_type: "CLIPLoader",
      inputs: { clip_name: textEncoder, type: "wan" },
    },
    "8": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["7", 0], text: prompt },
    },
    "9": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["7", 0], text: negativePrompt },
    },
    "10": {
      class_type: "VAELoader",
      inputs: { vae_name: vae },
    },
    "11": {
      class_type: "LoadImage",
      inputs: { image: sourceImage },
    },
    "12": {
      class_type: "WanImageToVideo",
      inputs: {
        positive: ["8", 0],
        negative: ["9", 0],
        vae: ["10", 0],
        width,
        height,
        length,
        batch_size: 1,
        start_image: ["11", 0],
      },
    },
    "13": {
      class_type: "KSamplerAdvanced",
      inputs: {
        model: ["3", 0],
        add_noise: "enable",
        noise_seed: seed,
        steps: 4,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        positive: ["12", 0],
        negative: ["12", 1],
        latent_image: ["12", 2],
        start_at_step: 0,
        end_at_step: 2,
        return_with_leftover_noise: "enable",
      },
    },
    "14": {
      class_type: "KSamplerAdvanced",
      inputs: {
        model: ["6", 0],
        add_noise: "disable",
        noise_seed: seed,
        steps: 4,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        positive: ["12", 0],
        negative: ["12", 1],
        latent_image: ["13", 0],
        start_at_step: 2,
        end_at_step: 10000,
        return_with_leftover_noise: "disable",
      },
    },
    "15": {
      class_type: "VAEDecode",
      inputs: { samples: ["14", 0], vae: ["10", 0] },
    },
    "16": {
      class_type: "SaveWEBM",
      inputs: { images: ["15", 0], filename_prefix: "lingji_video_sprite", codec: "vp9", fps, crf: 32 },
    },
  };
}

export function buildFlux1Workflow({ prompt, negativePrompt, width, height, seed }) {
  return {
    "10": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "flux1-dev-fp8.safetensors" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["10", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt || DEFAULT_NEGATIVE, clip: ["10", 1] },
    },
    "20": {
      class_type: "FluxGuidance",
      inputs: { guidance: 3.5, conditioning: ["2", 0] },
    },
    "21": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: 1 },
    },
    "22": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps: 22,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1.0,
        model: ["10", 0],
        positive: ["20", 0],
        negative: ["3", 0],
        latent_image: ["21", 0],
      },
    },
    "23": {
      class_type: "VAEDecode",
      inputs: { samples: ["22", 0], vae: ["10", 2] },
    },
    "8": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "lingji_2d_asset", images: ["23", 0] },
    },
  };
}

export function buildFlux1Img2ImgWorkflow({ prompt, negativePrompt, width, height, seed, filename, denoise }) {
  return {
    "10": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "flux1-dev-fp8.safetensors" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["10", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt || DEFAULT_NEGATIVE, clip: ["10", 1] },
    },
    "20": {
      class_type: "FluxGuidance",
      inputs: { guidance: 3.5, conditioning: ["2", 0] },
    },
    "30": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "31": {
      class_type: "ImageScale",
      inputs: { image: ["30", 0], upscale_method: "lanczos", width, height, crop: "center" },
    },
    "32": {
      class_type: "VAEEncode",
      inputs: { pixels: ["31", 0], vae: ["10", 2] },
    },
    "22": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps: 22,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise,
        model: ["10", 0],
        positive: ["20", 0],
        negative: ["3", 0],
        latent_image: ["32", 0],
      },
    },
    "23": {
      class_type: "VAEDecode",
      inputs: { samples: ["22", 0], vae: ["10", 2] },
    },
    "8": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "lingji_2d_asset", images: ["23", 0] },
    },
  };
}

export function buildFlux1PoseImg2ImgWorkflow({
  prompt,
  negativePrompt,
  width,
  height,
  seed,
  filename,
  poseFilename,
  controlNetName,
  denoise,
  controlStrength,
}) {
  return {
    "10": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "flux1-dev-fp8.safetensors" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["10", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt || DEFAULT_NEGATIVE, clip: ["10", 1] },
    },
    "20": {
      class_type: "FluxGuidance",
      inputs: { guidance: 3.5, conditioning: ["2", 0] },
    },
    "30": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "31": {
      class_type: "ImageScale",
      inputs: { image: ["30", 0], upscale_method: "lanczos", width, height, crop: "center" },
    },
    "32": {
      class_type: "VAEEncode",
      inputs: { pixels: ["31", 0], vae: ["10", 2] },
    },
    "40": {
      class_type: "ControlNetLoader",
      inputs: { control_net_name: controlNetName },
    },
    "41": {
      class_type: "SetUnionControlNetType",
      inputs: { control_net: ["40", 0], type: "openpose" },
    },
    "42": {
      class_type: "LoadImage",
      inputs: { image: poseFilename },
    },
    "43": {
      class_type: "ImageScale",
      inputs: { image: ["42", 0], upscale_method: "nearest-exact", width, height, crop: "center" },
    },
    "44": {
      class_type: "ControlNetApplyAdvanced",
      inputs: {
        positive: ["20", 0],
        negative: ["3", 0],
        control_net: ["41", 0],
        image: ["43", 0],
        strength: controlStrength,
        start_percent: 0.0,
        end_percent: 0.62,
        vae: ["10", 2],
      },
    },
    "22": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps: 24,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise,
        model: ["10", 0],
        positive: ["44", 0],
        negative: ["44", 1],
        latent_image: ["32", 0],
      },
    },
    "23": {
      class_type: "VAEDecode",
      inputs: { samples: ["22", 0], vae: ["10", 2] },
    },
    "8": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "lingji_2d_asset", images: ["23", 0] },
    },
  };
}

export function buildSam3LayerSeparationWorkflow({
  filename,
  dimensions,
  modelName,
  threshold,
  refineIterations,
  prompts,
}) {
  const width = Math.max(64, Math.round(Number(dimensions?.width) || 512));
  const height = Math.max(64, Math.round(Number(dimensions?.height) || 512));
  const workflow = {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: modelName },
    },
    "2": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "3": {
      class_type: "PrimitiveBoundingBox",
      inputs: { x: 0, y: 0, width, height },
    },
  };

  prompts.forEach((layer, index) => {
    const base = 10 + index * 10;
    const detectId = String(base);
    const maskImageId = String(base + 1);
    const saveId = String(base + 2);
    if (layer.mode === "bbox") {
      workflow[detectId] = {
        class_type: "SAM3_Detect",
        inputs: {
          model: ["1", 0],
          image: ["2", 0],
          bboxes: ["3", 0],
          threshold,
          refine_iterations: refineIterations,
          individual_masks: false,
        },
      };
    } else {
      const textId = String(base + 3);
      workflow[textId] = {
        class_type: "CLIPTextEncode",
        inputs: { text: layer.prompt, clip: ["1", 1] },
      };
      workflow[detectId] = {
        class_type: "SAM3_Detect",
        inputs: {
          model: ["1", 0],
          image: ["2", 0],
          conditioning: [textId, 0],
          threshold,
          refine_iterations: refineIterations,
          individual_masks: false,
        },
      };
    }
    workflow[maskImageId] = {
      class_type: "MaskToImage",
      inputs: { mask: [detectId, 0] },
    };
    workflow[saveId] = {
      class_type: "SaveImage",
      inputs: {
        filename_prefix: `lingji_spine_layer_${safeLibrarySegment(layer.id)}`,
        images: [maskImageId, 0],
      },
    };
  });

  return workflow;
}

export function buildHunyuan3DWorkflow({ filename, seed, models }) {
  return {
    "1": {
      class_type: "ImageOnlyCheckpointLoader",
      inputs: { ckpt_name: models.checkpoint },
    },
    "4": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "5": {
      class_type: "ImageScaleToTotalPixels",
      inputs: { image: ["4", 0], upscale_method: "lanczos", megapixels: 1.0, resolution_steps: 1 },
    },
    "6": {
      class_type: "CLIPVisionEncode",
      inputs: { clip_vision: ["1", 1], image: ["5", 0], crop: "center" },
    },
    "7": {
      class_type: "Hunyuan3Dv2Conditioning",
      inputs: { clip_vision_output: ["6", 0] },
    },
    "8": {
      class_type: "EmptyLatentHunyuan3Dv2",
      inputs: { resolution: 3072, batch_size: 1 },
    },
    "9": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        seed,
        steps: 50,
        cfg: 5.0,
        sampler_name: "euler",
        scheduler: "simple",
        positive: ["7", 0],
        negative: ["7", 1],
        latent_image: ["8", 0],
        denoise: 1.0,
      },
    },
    "10": {
      class_type: "VAEDecodeHunyuan3D",
      inputs: { samples: ["9", 0], vae: ["1", 2], num_chunks: 8000, octree_resolution: 256 },
    },
    "11": {
      class_type: "VoxelToMesh",
      inputs: { voxel: ["10", 0], algorithm: "surface net", threshold: 0.6 },
    },
    "12": {
      class_type: "SaveGLB",
      inputs: { mesh: ["11", 0], filename_prefix: "lingji_3d_asset" },
    },
  };
}
