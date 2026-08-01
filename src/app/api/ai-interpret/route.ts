import { NextResponse } from "next/server";
import { callOpenAIInterpret } from "@/lib/ai/openaiClient";
import {
  callAIProviderInterpret,
  getAIProviderPublicError,
} from "@/lib/ai/providerClient";
import type { AIEndpointType, AIInterpretRequest, AIProviderConfig } from "@/lib/ai/types";

export const runtime = "nodejs";

const MAX_BODY_LENGTH = 100_000;
const VALID_SCOPES = new Set(["natal", "decade", "year", "month", "day", "hour"]);
const VALID_ENDPOINT_TYPES = new Set(["responses", "chat_completions"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateRequestBody(body: unknown): body is AIInterpretRequest {
  if (!isRecord(body)) {
    return false;
  }

  if (typeof body.title !== "string" || !VALID_SCOPES.has(String(body.scope))) {
    return false;
  }

  if (!isRecord(body.birthInfo) || !isRecord(body.selectedTime)) {
    return false;
  }

  if (!Array.isArray(body.mainPalaces) || body.mainPalaces.length > 8) {
    return false;
  }

  if (!Array.isArray(body.signals) || body.signals.length > 60) {
    return false;
  }

  if (!isRecord(body.ruleInterpretation)) {
    return false;
  }

  return true;
}

function validateProviderConfig(value: unknown): value is AIProviderConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.mode === "pure_api" &&
    typeof value.baseUrl === "string" &&
    typeof value.apiKey === "string" &&
    typeof value.model === "string" &&
    VALID_ENDPOINT_TYPES.has(String(value.endpointType))
  );
}

function getProviderConfig(value: unknown): AIProviderConfig | null {
  if (!validateProviderConfig(value)) {
    return null;
  }

  return {
    mode: "pure_api",
    baseUrl: value.baseUrl,
    apiKey: value.apiKey,
    model: value.model,
    endpointType: value.endpointType as AIEndpointType,
  };
}

function getRouteBody(body: unknown): {
  request: AIInterpretRequest;
  providerConfig?: AIProviderConfig;
  proxyEndpoint?: string;
} | null {
  if (validateRequestBody(body)) {
    return { request: body };
  }

  if (!isRecord(body) || !validateRequestBody(body.request)) {
    return null;
  }

  const providerConfig = getProviderConfig(body.providerConfig);
  const proxyEndpoint = typeof body.proxyEndpoint === "string" ? body.proxyEndpoint : undefined;

  return {
    request: body.request,
    providerConfig: providerConfig ?? undefined,
    proxyEndpoint,
  };
}

async function readProxyError(response: Response): Promise<string> {
  const detail = await response.text();

  try {
    const payload = JSON.parse(detail) as { error?: string; message?: string };

    return payload.error || payload.message || detail.slice(0, 1000);
  } catch {
    return detail.slice(0, 1000) || "代理 API 返回错误。";
  }
}

async function callProxyEndpoint(
  request: AIInterpretRequest,
  endpoint: string,
) {
  if (!endpoint.trim()) {
    throw new Error("请填写代理 API 地址。");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`代理 API 返回 ${response.status}：${await readProxyError(response)}`);
  }

  return response.json();
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: "AI 解读输入过大" }, { status: 413 });
    }

    const body = JSON.parse(rawBody) as unknown;
    const routeBody = getRouteBody(body);

    if (!routeBody) {
      return NextResponse.json({ error: "AI 解读输入格式不正确" }, { status: 400 });
    }

    if (routeBody.providerConfig) {
      const interpretation = await callAIProviderInterpret(
        routeBody.request,
        routeBody.providerConfig,
      );

      return NextResponse.json(interpretation);
    }

    if (routeBody.proxyEndpoint) {
      const interpretation = await callProxyEndpoint(routeBody.request, routeBody.proxyEndpoint);

      return NextResponse.json(interpretation);
    }

    const interpretation = await callOpenAIInterpret(routeBody.request);

    return NextResponse.json(interpretation);
  } catch (error) {
    const providerError = getAIProviderPublicError(error);

    if (providerError.errorType !== "unknown" || providerError.endpoint) {
      return NextResponse.json(providerError, { status: providerError.status ?? 502 });
    }

    const message = error instanceof Error ? error.message : "AI 解读生成失败";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
