// usage —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { DEFAULT_USAGE_DAILY_CREDITS, DEFAULT_USAGE_HOURLY_CREDITS, PACK_PRESETS, USAGE_COSTS, apiAccessToken, jsonResponse, positiveNumber, safeString } from "../worker.js";

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

  const scope = await usageScope(request);
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

async function usageScope(request) {
  const token = apiAccessToken(request);
  const source = token || request.headers.get("cf-connecting-ip") || "anonymous";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return base64UrlEncode(new Uint8Array(digest)).slice(0, 32);
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
