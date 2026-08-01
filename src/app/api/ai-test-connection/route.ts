import { NextResponse } from "next/server";
import {
  getAIProviderPublicError,
  testAIProviderConnection,
} from "@/lib/ai/providerClient";
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
      return NextResponse.json(
        {
          ok: false,
          errorType: "unknown",
          message: "测试连接参数不完整，请填写 Base URL、模型、Key 和接口类型。",
        },
        { status: 400 },
      );
    }

    const result = await testAIProviderConnection(providerConfig);

    return NextResponse.json(result);
  } catch (error) {
    const providerError = getAIProviderPublicError(error);

    return NextResponse.json(providerError, { status: providerError.status ?? 502 });
  }
}
