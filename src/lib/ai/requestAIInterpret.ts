import type { AISettings } from "./aiSettings";
import type {
  AIEndpointType,
  AIInterpretRequest,
  AIInterpretResponse,
  AIProviderConfig,
  AIProviderErrorResponse,
  AITestConnectionResponse,
} from "./types";
import { buildProviderEndpoint } from "./openaiPayload";

const configuredProjectApiOrigin = process.env.NEXT_PUBLIC_AI_API_ORIGIN?.trim().replace(/\/+$/, "");

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

function resolveProjectEndpoint(endpoint: string): string {
  const pathname = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return configuredProjectApiOrigin ? `${configuredProjectApiOrigin}${pathname}` : pathname;
}

function getAbsoluteEndpoint(endpoint: string): string {
  if (typeof window === "undefined") {
    return endpoint;
  }

  try {
    return new URL(endpoint, window.location.origin).toString();
  } catch {
    return endpoint;
  }
}

function getStaticHostingHint(): string {
  if (typeof window !== "undefined" && window.location.hostname.endsWith("github.io")) {
    return "当前页面运行在 GitHub Pages 静态托管上，GitHub Pages 无法执行 Next.js /api Route Handler。请将项目部署到 Vercel 或 Node 服务，或通过 NEXT_PUBLIC_AI_API_ORIGIN 指向本项目的服务端部署。";
  }

  return "请确认当前 Next.js 部署支持 Route Handler，并且本项目服务端正在运行。";
}

function formatProjectApiFailure(params: {
  projectEndpoint: string;
  endpointType: AIEndpointType;
  providerEndpoint: string;
  status?: number;
  detail?: string;
  networkMessage?: string;
}): string {
  const reason = params.status === 404
    ? "本项目 AI Route Handler 不存在或未部署。"
    : params.networkMessage
      ? `浏览器无法连接本项目 AI 接口：${params.networkMessage}`
      : "本项目 AI 接口返回了无法识别的响应。";

  return [
    reason,
    `项目接口：${getAbsoluteEndpoint(params.projectEndpoint)}`,
    `外部接口类型：${getEndpointTypeLabel(params.endpointType)}`,
    `预期外部地址：${params.providerEndpoint}`,
    params.status ? `HTTP 状态码：${params.status}` : "",
    params.detail ? `接口返回：${params.detail.slice(0, 1000)}` : "",
    getStaticHostingHint(),
    "API Key 未包含在错误信息中。",
  ]
    .filter(Boolean)
    .join("\n");
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

async function readErrorMessage(
  response: Response,
  projectEndpoint: string,
  providerConfig: AIProviderConfig,
): Promise<string> {
  const providerEndpoint = buildProviderEndpoint(
    providerConfig.baseUrl,
    providerConfig.endpointType,
  );
  const responseText = await response.text();

  try {
    const payload = JSON.parse(responseText) as unknown;

    if (isProviderErrorResponse(payload)) {
      return formatProviderError(payload);
    }

    if (isRecord(payload)) {
      return String(payload.error || payload.message || "AI 解读生成失败");
    }

    return formatProjectApiFailure({
      projectEndpoint,
      endpointType: providerConfig.endpointType,
      providerEndpoint,
      status: response.status,
    });
  } catch {
    return formatProjectApiFailure({
      projectEndpoint,
      endpointType: providerConfig.endpointType,
      providerEndpoint,
      status: response.status,
      detail: responseText,
    });
  }
}

async function postProjectEndpoint<T>(
  endpoint: string,
  body: unknown,
  providerConfig: AIProviderConfig,
): Promise<T> {
  const projectEndpoint = resolveProjectEndpoint(endpoint);
  let response: Response;

  try {
    response = await fetch(projectEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const networkMessage = error instanceof Error ? error.message : "网络请求失败";

    throw new Error(
      formatProjectApiFailure({
        projectEndpoint,
        endpointType: providerConfig.endpointType,
        providerEndpoint: buildProviderEndpoint(
          providerConfig.baseUrl,
          providerConfig.endpointType,
        ),
        networkMessage,
      }),
    );
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, projectEndpoint, providerConfig));
  }

  return (await response.json()) as T;
}

export async function testAIConnection(settings: AISettings): Promise<AITestConnectionResponse> {
  const providerConfig = buildProviderConfig(settings);
  const payload = await postProjectEndpoint<AITestConnectionResponse>(
    "/api/ai-test-connection",
    providerConfig,
    providerConfig,
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
  const providerConfig = buildProviderConfig(settings);

  if (settings.mode === "browser") {
    return postProjectEndpoint<AIInterpretResponse>("/api/ai-interpret", {
      request,
      providerConfig,
    }, providerConfig);
  }

  if (settings.mode === "custom") {
    return postProjectEndpoint<AIInterpretResponse>("/api/ai-interpret", {
      request,
      proxyEndpoint: settings.endpoint,
    }, providerConfig);
  }

  return postProjectEndpoint<AIInterpretResponse>("/api/ai-interpret", {
    request,
  }, providerConfig);
}
