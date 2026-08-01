import {
  getAIProviderPublicError,
  testAIProviderConnection,
} from "@/lib/ai/providerClient";
import { aiJsonResponse, aiOptionsResponse } from "@/lib/ai/routeResponse";
import type { AIEndpointType, AIProviderConfig } from "@/lib/ai/types";

export const runtime = "nodejs";

const VALID_ENDPOINT_TYPES = new Set(["responses", "chat_completions"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getProviderConfig(body: unknown): AIProviderConfig | null {
  if (!isRecord(body)) {
    return null;
  }

  if (
    typeof body.baseUrl !== "string" ||
    typeof body.apiKey !== "string" ||
    typeof body.model !== "string" ||
    !VALID_ENDPOINT_TYPES.has(String(body.endpointType))
  ) {
    return null;
  }

  return {
    mode: "pure_api",
    baseUrl: body.baseUrl,
    apiKey: body.apiKey,
    model: body.model,
    endpointType: body.endpointType as AIEndpointType,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const providerConfig = getProviderConfig(body);

    if (!providerConfig) {
      return aiJsonResponse(
        request,
        {
          ok: false,
          errorType: "unknown",
          message: "测试连接参数不完整，请填写 Base URL、模型、Key 和接口类型。",
        },
        400,
      );
    }

    const result = await testAIProviderConnection(providerConfig);

    return aiJsonResponse(request, result);
  } catch (error) {
    const providerError = getAIProviderPublicError(error);

    return aiJsonResponse(request, providerError, providerError.status ?? 502);
  }
}

export function OPTIONS(request: Request) {
  return aiOptionsResponse(request);
}
