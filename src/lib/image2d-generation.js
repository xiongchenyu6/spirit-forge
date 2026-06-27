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
  // 像素画风（pixel / pixel-art）走 FLUX-2 Klein + pixel LoRA 分支，产出真·像素图；
  // 其它画风（production/anime/isometric/realistic）行为完全不变，仍走 flux1-dev。
  // Klein 工作流已在真实 ComfyUI 验证通过（CLIPLoader+Qwen3 type=flux2 + Klein VAE +
  // 真 CFG），默认启用；可设 env.DISABLE_PIXEL_KLEIN="true" 临时关闭。
  // 模型缺失/清单异常等任一环节失败都安全回退 flux1-dev + 强化像素文本提示。
  let workflow = null;
  if (
    (normalized.style === "pixel" || normalized.style === "pixel-art") &&
    env.DISABLE_PIXEL_KLEIN !== "true"
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
