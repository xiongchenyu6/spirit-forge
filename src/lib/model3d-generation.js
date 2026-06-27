import { ensureComfyInputImage, submitComfyWorkflow } from "./comfy-client.js";
import { buildHunyuan3DWorkflow } from "./comfy-workflows.js";
import { normalizeGenerationInput, randomSeed } from "./generation-utils.js";
import { rememberJobRecord } from "./storage.js";

export async function submit3DJob(input, env, options = {}) {
  const getCapabilities = options.getCapabilities;
  if (typeof getCapabilities !== "function") {
    throw new Error("submit3DJob requires getCapabilities.");
  }
  const capabilities = await getCapabilities(env);
  if (!capabilities.threeD.available) {
    return {
      ok: false,
      error: "3d_unavailable",
      message: "Hunyuan3D nodes are present, but the required open-source image-only checkpoint is not installed on ComfyUI yet.",
      missing: capabilities.threeD.missing,
    };
  }

  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const filename = await ensureComfyInputImage(input, env);
  const workflow = buildHunyuan3DWorkflow({
    filename,
    seed,
    models: capabilities.threeD.models,
  });
  const submitted = await submitComfyWorkflow(env, workflow, 900_000);
  const job = {
    ok: true,
    kind: "3d",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=3d`,
  };
  await rememberJobRecord(env, {
    id: `3d:${submitted.prompt_id}`,
    kind: "3d",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    input: normalizeGenerationInput(input),
    sourceImage: filename,
    cost: options.generateCost ?? 120,
    workflow: "Hunyuan3D-v2 image-to-GLB",
    pollUrl: job.pollUrl,
  });
  return job;
}
