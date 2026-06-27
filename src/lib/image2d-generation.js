import { submitComfyWorkflow } from "./comfy-client.js";
import { buildFlux1Workflow } from "./comfy-workflows.js";
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
  const workflow = buildFlux1Workflow({
    prompt: plan.prompt,
    negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
    width: dimensions.width,
    height: dimensions.height,
    seed,
  });
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
