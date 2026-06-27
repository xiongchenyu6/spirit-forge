import { localPromptPlan, normalizeGenerationInput, sanitizePromptPlan } from "./generation-utils.js";

export async function planPrompt(input, env) {
  const normalized = normalizeGenerationInput(input);
  const fallback = localPromptPlan(normalized);

  if (!env.MISTRAL_API_KEY) {
    return { ...fallback, source: "local-fallback", warning: "MISTRAL_API_KEY is not configured" };
  }

  const body = {
    model: env.MISTRAL_MODEL || "mistral-small-latest",
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content:
          "You are a game asset prompt engineer. Return strict JSON only. No markdown. Optimize for practical 2D game production through ComfyUI. Respect the requested preset exactly: action sprite sheets need equal-width frames and a consistent character; UI icon sheets need clean grids; map tiles need strict top-down orthographic seamless tiles, not isometric blocks. For non-map assets, require an isolated flat solid background color clearly different from the subject so deterministic edge-connected background removal can create transparent sprites. Avoid text, labels, watermarks, floor shadows, gradients, textured backgrounds, and busy scenes.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "Create a concise English prompt plan for game asset generation. Keep the prompt visual, concrete, and production-oriented.",
          schema: {
            title: "short asset name in Chinese",
            prompt: "English positive prompt",
            negativePrompt: "English negative prompt",
            styleTags: ["short tags"],
            productionNotes: ["short Chinese notes"],
          },
          input: normalized,
        }),
      },
    ],
  };

  try {
    const response = await fetch(`${mistralBase(env)}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Mistral ${response.status}: ${text.slice(0, 500)}`);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content);
    return sanitizePromptPlan(parsed, fallback, normalized);
  } catch (error) {
    return {
      ...fallback,
      source: "local-fallback",
      warning: error instanceof Error ? error.message : String(error),
    };
  }
}

function mistralBase(env) {
  return String(env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1").replace(/\/+$/, "");
}

function parseJsonObject(content) {
  const trimmed = String(content || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object in Mistral response");
    return JSON.parse(match[0]);
  }
}
