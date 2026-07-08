import type { AISettings } from "./aiSettings";
import type {
  AIInterpretRequest,
  AIInterpretResponse,
  AIProviderConfig,
  AIProviderErrorResponse,
  AITestConnectionResponse,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isProviderErrorResponse(value: unknown): value is AIProviderErrorResponse {
  return isRecord(value) && value.ok === false && typeof value.message === "string";
}

function buildProviderConfig(settings: AISettings): AIProviderConfig {
  return {
    mode: "pure_api",
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey ?? "",
    model: settings.model,
    endpointType: settings.endpointType,
  };
}

function getEndpointTypeLabel(endpointType?: string): string {
  return endpointType === "responses" ? "Responses API" : "Chat Completions API";
}

function getSuggestion(error: AIProviderErrorResponse): string {
  switch (error.errorType) {
    case "unauthorized":
      return "建议检查 Key 是否正确、是否有模型权限，或中转服务是否需要不同鉴权方式。";
    case "not_found":
      return "建议切换 Responses API / Chat Completions API，很多中转只支持其中一种路径。";
    case "model_error":
      return "建议更换模型名，或确认该 Key 是否有调用当前模型的权限。";
    case "network":
      return "建议检查 Base URL 域名、证书、网络连通性和代理服务状态。";
    case "timeout":
      return "建议稍后重试，或更换更稳定的代理地址。";
    default:
      return "建议检查 Base URL、接口类型、模型名和服务商返回详情。";
  }
}

function formatProviderError(error: AIProviderErrorResponse): string {
  return [
    error.message,
    error.endpoint ? `请求地址：${error.endpoint}` : "",
    error.endpointType ? `接口类型：${getEndpointTypeLabel(error.endpointType)}` : "",
    error.status ? `HTTP 状态码：${error.status}` : "",
    error.detail ? `接口返回：${error.detail}` : "",
    getSuggestion(error),
    "前端已改为请求本项目服务端接口；如果仍看到网络错误，通常是服务端无法访问外部代理或当前部署环境不支持 API Route。",
  ]
    .filter(Boolean)
    .join("\n");
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;

    if (isProviderErrorResponse(payload)) {
      return formatProviderError(payload);
    }

    if (isRecord(payload)) {
      return String(payload.error || payload.message || "AI 解读生成失败");
    }

    return "AI 解读生成失败";
  } catch {
    return "AI 解读暂时不可用。请确认当前部署环境支持 /api/ai-interpret。";
  }
}

async function postProjectEndpoint<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

export async function testAIConnection(settings: AISettings): Promise<AITestConnectionResponse> {
  const payload = await postProjectEndpoint<AITestConnectionResponse>(
    "api/ai-test-connection",
    buildProviderConfig(settings),
  );

  if (!payload.ok) {
    throw new Error(formatProviderError(payload));
  }

  return payload;
}

export async function requestAIInterpret(
  request: AIInterpretRequest,
  settings: AISettings,
): Promise<AIInterpretResponse> {
  if (settings.mode === "browser") {
    return postProjectEndpoint<AIInterpretResponse>("api/ai-interpret", {
      request,
      providerConfig: buildProviderConfig(settings),
    });
  }

  if (settings.mode === "custom") {
    return postProjectEndpoint<AIInterpretResponse>("api/ai-interpret", {
      request,
      proxyEndpoint: settings.endpoint,
    });
  }

  return postProjectEndpoint<AIInterpretResponse>("api/ai-interpret", {
    request,
  });
}
