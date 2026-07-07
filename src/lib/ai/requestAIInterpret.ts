import type { AISettings } from "./aiSettings";
import {
  buildOpenAIResponseBody,
  OPENAI_RESPONSES_URL,
  parseOpenAIResponsePayload,
  type OpenAIResponsePayload,
} from "./openaiPayload";
import type { AIInterpretRequest, AIInterpretResponse } from "./types";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };

    return payload.error || "AI 解读生成失败";
  } catch {
    return "AI 解读暂时不可用，请检查 API 设置或浏览器网络权限。";
  }
}

async function callCompatibleEndpoint(
  request: AIInterpretRequest,
  endpoint: string,
): Promise<AIInterpretResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AIInterpretResponse;
}

async function callOpenAIInBrowser(
  request: AIInterpretRequest,
  settings: AISettings,
): Promise<AIInterpretResponse> {
  const apiKey = settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error("请先在 AI 设置中填写 API Key。");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildOpenAIResponseBody(request, settings.model)),
  });
  const payload = (await response.json()) as OpenAIResponsePayload;

  if (!response.ok) {
    throw new Error(payload.error?.message || "浏览器直连 OpenAI 失败。");
  }

  return parseOpenAIResponsePayload(payload);
}

export async function requestAIInterpret(
  request: AIInterpretRequest,
  settings: AISettings,
): Promise<AIInterpretResponse> {
  if (settings.mode === "browser") {
    return callOpenAIInBrowser(request, settings);
  }

  if (settings.mode === "custom") {
    return callCompatibleEndpoint(request, settings.endpoint);
  }

  return callCompatibleEndpoint(request, "api/ai-interpret");
}
