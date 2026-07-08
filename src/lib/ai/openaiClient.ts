import { DEFAULT_OPENAI_BASE_URL, DEFAULT_OPENAI_MODEL } from "./openaiPayload";
import { callAIProviderInterpret } from "./providerClient";
import type { AIEndpointType, AIInterpretRequest, AIInterpretResponse } from "./types";

function getEndpointType(value: string | undefined): AIEndpointType {
  return value === "chat_completions" ? "chat_completions" : "responses";
}

export async function callOpenAIInterpret(
  request: AIInterpretRequest,
): Promise<AIInterpretResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("未配置 OPENAI_API_KEY");
  }

  return callAIProviderInterpret(request, {
    mode: "pure_api",
    baseUrl: process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL,
    apiKey,
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    endpointType: getEndpointType(process.env.OPENAI_ENDPOINT_TYPE),
  });
}
