import { DEFAULT_OPENAI_BASE_URL, DEFAULT_OPENAI_MODEL } from "./openaiPayload";
import type { AIEndpointType } from "./types";

const SETTINGS_KEY = "open-ziwei-chart-mvp:ai-settings:v1";
const SESSION_KEY = "open-ziwei-chart-mvp:ai-key:session:v1";
const LOCAL_KEY = "open-ziwei-chart-mvp:ai-key:local:v1";

export type AIConnectionMode = "server" | "custom" | "browser";

export type AISettings = {
  mode: AIConnectionMode;
  endpoint: string;
  baseUrl: string;
  model: string;
  endpointType: AIEndpointType;
  rememberKey: boolean;
  apiKey?: string;
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  mode: "server",
  endpoint: "api/ai-interpret",
  baseUrl: DEFAULT_OPENAI_BASE_URL,
  model: DEFAULT_OPENAI_MODEL,
  endpointType: "chat_completions",
  rememberKey: false,
  apiKey: "",
};

type StoredAISettings = Omit<AISettings, "apiKey">;

function getEndpointType(value: unknown): AIEndpointType {
  return value === "responses" || value === "chat_completions"
    ? value
    : DEFAULT_AI_SETTINGS.endpointType;
}

function getStorageItem(storage: Storage, key: string): string {
  try {
    return storage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function loadAISettings(): AISettings {
  if (typeof window === "undefined") {
    return DEFAULT_AI_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<StoredAISettings>) : {};
    const rememberKey = Boolean(stored.rememberKey);
    const apiKey = rememberKey
      ? getStorageItem(window.localStorage, LOCAL_KEY)
      : getStorageItem(window.sessionStorage, SESSION_KEY);

    return {
      ...DEFAULT_AI_SETTINGS,
      ...stored,
      rememberKey,
      apiKey,
      endpoint: stored.endpoint || DEFAULT_AI_SETTINGS.endpoint,
      baseUrl: stored.baseUrl || DEFAULT_AI_SETTINGS.baseUrl,
      model: stored.model || DEFAULT_AI_SETTINGS.model,
      endpointType: getEndpointType(stored.endpointType),
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === "undefined") {
    return;
  }

  const { apiKey, ...stored } = settings;

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored));

    if (settings.rememberKey) {
      window.localStorage.setItem(LOCAL_KEY, apiKey ?? "");
      window.sessionStorage.removeItem(SESSION_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_KEY, apiKey ?? "");
      window.localStorage.removeItem(LOCAL_KEY);
    }
  } catch {
    // Settings persistence is a convenience feature; generation can still proceed.
  }
}

export function clearAISettings(): AISettings {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(SETTINGS_KEY);
      window.localStorage.removeItem(LOCAL_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  return DEFAULT_AI_SETTINGS;
}
