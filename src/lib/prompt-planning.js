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
          "You are a game asset prompt engineer. Return strict JSON only. No markdown.\n\n" +
          "ABSOLUTE TOP PRIORITY — FAITHFULNESS TO input.brief. The brief is a HARD CONSTRAINT, not a loose hint. The generated prompt MUST faithfully reproduce what the brief describes:\n" +
          "- GENRE / WORLD: Keep the exact setting stated or implied by the brief (仙侠/xianxia, 武侠/wuxia, 西幻/western-fantasy, 科幻/sci-fi, 赛博朋克/cyberpunk, 现代/modern, 末世/post-apocalyptic, Q版, pixel, etc.). NEVER modernize a classical or fantasy brief, and NEVER swap one genre for another. A 仙侠 swordsman in a 青衫 robe must stay a robed cultivator, not become a person in a modern hoodie.\n" +
          "- OBJECT CLASS: Generate exactly the object the brief names. A sword (剑) stays a sword — NEVER turn it into a gun, rifle, firearm or any other object. A staff stays a staff, a shield stays a shield. Do not substitute the subject.\n" +
          "- MATERIAL: Preserve named materials (jade/玉, bronze/青铜, gilded/鎏金, silver, bone, lacquer, etc.).\n" +
          "- COMPOSITION / FRAMING: Honor the requested framing. If the brief asks for a half-body 半身立绘, produce a half-body bust, not a full-body shot. Respect bust/full-body/portrait wording.\n" +
          "- The brief's subject must be the dominant, highest-weight element of the prompt; input.assetType, input.style, input.preset and input.camera are MODIFIERS that refine it, never a generic template that replaces it.\n" +
          "STRICTLY FORBIDDEN: replacing the subject object, modernizing a classical/fantasy brief, or overriding the specific description with a generic 'anime character + gradient background' template.\n\n" +
          "PRODUCTION RULES (apply without overriding the brief). Optimize for practical 2D game production through ComfyUI. Respect the requested preset exactly: action sprite sheets need equal-width frames and a consistent character; UI icon sheets need clean grids; map tiles need strict top-down orthographic seamless tiles, not isometric blocks. For non-map assets, require an isolated flat solid background color clearly different from the subject so deterministic edge-connected background removal can create transparent sprites. Avoid text, labels, watermarks, floor shadows, gradients, textured backgrounds, and busy scenes. For weapon/prop assets show the object alone with no character or hands; for vfx assets show the standalone energy/spell effect with no character or body.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "Create a concise English prompt plan for game asset generation. Keep the prompt visual, concrete, and production-oriented. Put the brief's subject (its genre, object class, materials and framing) first and make it the dominant element; treat assetType/style/preset/camera as modifiers only. Do not substitute the subject object, do not modernize the genre, and do not fall back to a generic character template.",
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
