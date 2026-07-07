import type { AIInterpretRequest, AIInterpretResponse } from "./types";

const CACHE_PREFIX = "open-ziwei-chart-mvp:ai-interpret:v1";

type CachedAIInterpret = {
  createdAt: string;
  response: AIInterpretResponse;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function hashText(text: string): string {
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

export function getAIInterpretCacheKey(request: AIInterpretRequest): string {
  return `${CACHE_PREFIX}:${hashText(stableStringify(request))}`;
}

export function getAIInterpretCache(request: AIInterpretRequest): CachedAIInterpret | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getAIInterpretCacheKey(request));

    return raw ? (JSON.parse(raw) as CachedAIInterpret) : null;
  } catch {
    return null;
  }
}

export function setAIInterpretCache(
  request: AIInterpretRequest,
  response: AIInterpretResponse,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const cache: CachedAIInterpret = {
    createdAt: new Date().toISOString(),
    response,
  };

  try {
    window.localStorage.setItem(getAIInterpretCacheKey(request), JSON.stringify(cache));
  } catch {
    // Cache failures should never block the interpretation flow.
  }
}
