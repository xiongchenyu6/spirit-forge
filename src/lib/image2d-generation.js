import { listComfyModels, submitComfyWorkflow } from "./comfy-client.js";
import { buildFlux1Workflow, buildPixelFlux2Workflow } from "./comfy-workflows.js";
import { DEFAULT_NEGATIVE, localPromptPlan, normalizeDimensions, normalizeGenerationInput, randomSeed } from "./generation-utils.js";
import { rememberJobRecord } from "./storage.js";

export async function submit2DJob(input, env, options = {}) {
  const planPrompt = options.planPrompt;
  if (typeof planPrompt !== "function") {
    throw new Error("submit2DJob requires planPrompt.");
  }
  const normalized = normalizeGenerationInput(input);
  const plan = input.prompt ? localPromptPlan({ ...normalized, brief: input.prompt }) : await planPrompt(normalized, env);
  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const dimensions = normalizeDimensions(input.width, input.height, normalized.preset);
  const flux1Args = {
    prompt: plan.prompt,
    negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
    width: dimensions.width,
    height: dimensions.height,
    seed,
  };
  // 像素画风（pixel / pixel-art）可走 FLUX-2 Klein + pixel LoRA 分支；
  // 其它画风（production/anime/isometric/realistic）行为完全不变，仍走 flux1-dev。
  // 注意：Klein 工作流的节点/采样参数尚未在真实 ComfyUI 验证（实测会 error），
  // 故默认关闭，仅当 env.ENABLE_PIXEL_KLEIN 显式开启时启用；否则像素风回退到
  // flux1-dev + 强化的像素文本提示，保证稳定出图。任一环节失败也安全回退。
  let workflow = null;
  if (
    (normalized.style === "pixel" || normalized.style === "pixel-art") &&
    env.ENABLE_PIXEL_KLEIN
  ) {
    try {
      const models = await listComfyModels(env);
      workflow = buildPixelFlux2Workflow({ ...flux1Args, models });
    } catch {
      workflow = null;
    }
  }
  if (!workflow) {
    workflow = buildFlux1Workflow(flux1Args);
  }
  const submitted = await submitComfyWorkflow(env, workflow);
  const job = {
    ok: true,
    kind: "2d",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions,
    plan,
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=2d`,
  };
  await rememberJobRecord(env, {
    id: `2d:${submitted.prompt_id}`,
    kind: "2d",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions,
    input: normalized,
    plan,
    cost: options.generateCost ?? 20,
    pollUrl: job.pollUrl,
  });
  return job;
}
