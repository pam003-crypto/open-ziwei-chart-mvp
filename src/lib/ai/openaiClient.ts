import type { AIInterpretRequest, AIInterpretResponse } from "./types";
import {
  buildOpenAIResponseBody,
  DEFAULT_OPENAI_MODEL,
  OPENAI_RESPONSES_URL,
  parseOpenAIResponsePayload,
  type OpenAIResponsePayload,
} from "./openaiPayload";

export async function callOpenAIInterpret(
  request: AIInterpretRequest,
): Promise<AIInterpretResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("未配置 OPENAI_API_KEY");
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildOpenAIResponseBody(request, model)),
  });

  const payload = (await response.json()) as OpenAIResponsePayload;

  if (!response.ok) {
    throw new Error(payload.error?.message || "AI 解读生成失败");
  }

  return parseOpenAIResponsePayload(payload);
}
