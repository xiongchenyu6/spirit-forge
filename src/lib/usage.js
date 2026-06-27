// usage —— 额度计量 + 按用户/按 key 限流 + 激励广告奖励额度闭环。
import { PACK_PRESETS } from "./pack-presets.js";
import { DEFAULT_USAGE_DAILY_CREDITS, DEFAULT_USAGE_HOURLY_CREDITS, USAGE_COSTS, apiAccessToken, jsonResponse, positiveNumber, safeString } from "../worker.js";

// 激励广告奖励额度：每次播放完广告后端发放固定额度，每日封顶。
// 默认每次 5 灵石、每日上限 15 灵石（即每天最多领 3 次）。
export const REWARD_CREDITS = 5;
export const REWARD_DAILY_MAX = 15;

export async function enforceUsageLimit(request, env, action, cost) {
  const usage = await requestUsage(request, env, action, cost);
  if (usage.allowed) return null;
  return jsonResponse(
    {
      error: "rate_limited",
      message: usageLimitMessage(usage),
      usage,
    },
    429,
    usageHeaders(usage),
  );
}

export async function meteredJsonResponse(request, env, action, cost, operation) {
  const limited = await enforceUsageLimit(request, env, action, cost);
  if (limited) return limited;

  try {
    const result = await operation();
    if (result?.ok === false) {
      await refundUsageCost(request, env, action, cost);
    }
    return jsonResponse(result);
  } catch (error) {
    await refundUsageCost(request, env, action, cost);
    throw error;
  }
}

async function refundUsageCost(request, env, action, cost) {
  if (!cost || cost <= 0) return null;
  try {
    return await requestUsage(request, env, `${action}:refund`, cost, { refund: true });
  } catch (error) {
    console.warn("Usage refund failed", error);
    return null;
  }
}

export async function usageStatus(request, env) {
  return await requestUsage(request, env, "status", 0);
}

async function requestUsage(request, env, action, cost, options = {}) {
  if (!env.USAGE_LIMITER) {
    return {
      allowed: true,
      configured: false,
      action,
      cost,
      hourly: { used: 0, limit: 0, remaining: 0, resetAt: null },
      daily: { used: 0, limit: 0, remaining: 0, resetAt: null },
    };
  }

  const scope = await deriveUserKey(request);
  const id = env.USAGE_LIMITER.idFromName(scope);
  const stub = env.USAGE_LIMITER.get(id);
  const response = await stub.fetch("https://usage.lingji/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action,
      cost,
      refund: options.refund === true,
      hourlyLimit: positiveNumber(env.USAGE_HOURLY_CREDITS, DEFAULT_USAGE_HOURLY_CREDITS),
      dailyLimit: positiveNumber(env.USAGE_DAILY_CREDITS, DEFAULT_USAGE_DAILY_CREDITS),
    }),
  });
  return await response.json();
}

// 按用户/按 key 派生限流维度（每个 user/key 独立的小时/日额度）。
// 优先级：x-lingji-user-id 请求头 > access token 的 SHA-256 十六进制 > "anonymous"。
// 命名空间前缀（uid:/tok:）避免 user-id 与 token 摘要互相碰撞；不传 user-id 的老客户端
// 仍按 token 维度计量，向后兼容。
export async function deriveUserKey(request) {
  const userId = safeString(request.headers.get("x-lingji-user-id"));
  if (userId) return `uid:${sanitizeUserKeySegment(userId)}`;
  const token = apiAccessToken(request);
  if (token) return `tok:${await sha256Hex(token)}`;
  return "anonymous";
}

function sanitizeUserKeySegment(value) {
  const text = safeString(value)
    .replace(/[^a-zA-Z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
  return text || "anonymous";
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// 激励广告额度闭环：广告播放完成 → 后端可信发放固定额度（每日封顶）。
export async function grantUsageReward(request, env) {
  // TODO(ad-sdk): 接入真实激励视频平台的服务端回调校验（Google AdMob SSV / 微信小游戏 /
  // 抖音小游戏激励视频）。当前阶段只实现"广告完成 → 后端发额度"这一侧：信任前端已播完广告，
  // nonce 仅作占位/幂等线索；未来应改为先校验平台回调签名再发额度，避免被伪造刷量。
  const body = await request.json().catch(() => ({}));
  const nonce = safeString(body?.nonce).slice(0, 128);
  if (!env.USAGE_LIMITER) {
    const usage = await usageStatus(request, env);
    return jsonResponse(
      { ok: false, error: "usage_not_configured", granted: 0, remainingRewards: 0, usage },
      503,
    );
  }
  const result = await requestReward(request, env, nonce);
  const payload = {
    ok: result.allowed === true,
    granted: Number(result.granted) || 0,
    remainingRewards: Number(result.remainingRewards) || 0,
    usage: result.usage,
  };
  if (!payload.ok) payload.error = "reward_daily_limit";
  return jsonResponse(payload, payload.ok ? 200 : 429);
}

async function requestReward(request, env, nonce) {
  const scope = await deriveUserKey(request);
  const id = env.USAGE_LIMITER.idFromName(scope);
  const stub = env.USAGE_LIMITER.get(id);
  const response = await stub.fetch("https://usage.lingji/reward", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "reward",
      grant: true,
      grantCredits: REWARD_CREDITS,
      rewardDailyMax: REWARD_DAILY_MAX,
      nonce,
      hourlyLimit: positiveNumber(env.USAGE_HOURLY_CREDITS, DEFAULT_USAGE_HOURLY_CREDITS),
      dailyLimit: positiveNumber(env.USAGE_DAILY_CREDITS, DEFAULT_USAGE_DAILY_CREDITS),
    }),
  });
  return await response.json();
}

export function usageCostForPackInput(input) {
  const preset = PACK_PRESETS[safeString(input?.preset)];
  const frames = Math.max(1, preset?.items?.length || 4);
  return frames * USAGE_COSTS.generate2dPackFrame;
}

function usageLimitMessage(usage) {
  const retry = usage.retryAfterSeconds
    ? `约 ${Math.ceil(usage.retryAfterSeconds / 60)} 分钟后重试`
    : "稍后重试";
  return `生成额度已达到当前限制，${retry}。`;
}

function usageHeaders(usage) {
  const headers = {
    "x-ratelimit-limit": String(usage.hourly?.limit || 0),
    "x-ratelimit-remaining": String(usage.hourly?.remaining || 0),
  };
  if (usage.hourly?.resetAt) headers["x-ratelimit-reset"] = usage.hourly.resetAt;
  if (usage.retryAfterSeconds) headers["retry-after"] = String(usage.retryAfterSeconds);
  return headers;
}

export function usagePayload({ allowed, action, cost, hour, day, hourlyLimit, dailyLimit, retryAt }) {
  const now = Date.now();
  return {
    allowed,
    configured: true,
    action,
    cost,
    retryAfterSeconds: retryAt ? Math.max(1, Math.ceil((retryAt - now) / 1000)) : null,
    hourly: {
      used: hour.used,
      limit: hourlyLimit,
      remaining: Math.max(0, hourlyLimit - hour.used),
      resetAt: new Date(hour.start + 3_600_000).toISOString(),
    },
    daily: {
      used: day.used,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - day.used),
      resetAt: new Date(day.start + 86_400_000).toISOString(),
    },
  };
}

export function usageJson(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
