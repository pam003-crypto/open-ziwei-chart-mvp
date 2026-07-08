import {
  buildOpenAIChatCompletionBody,
  buildOpenAIResponseBody,
  buildProviderEndpoint,
  parseOpenAIChatCompletionPayload,
  parseOpenAIResponsePayload,
  type OpenAIChatCompletionPayload,
  type OpenAIResponsePayload,
} from "./openaiPayload";
import type {
  AIEndpointType,
  AIInterpretRequest,
  AIInterpretResponse,
  AIProviderConfig,
  AIProviderErrorResponse,
  AIProviderErrorType,
  AITestConnectionResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_DETAIL_LENGTH = 1000;

type ProviderFetchPayload = {
  endpoint: string;
  endpointType: AIEndpointType;
  responseText: string;
};

export class AIProviderRequestError extends Error {
  public readonly publicError: AIProviderErrorResponse;

  constructor(publicError: AIProviderErrorResponse) {
    super(publicError.message);
    this.name = "AIProviderRequestError";
    this.publicError = publicError;
  }
}

function truncateDetail(detail: string): string {
  return detail.slice(0, MAX_DETAIL_LENGTH);
}

function redactSensitiveText(text: string, apiKey: string): string {
  if (!apiKey) {
    return text;
  }

  return text.split(apiKey).join("[REDACTED_API_KEY]");
}

function getProviderAdvice(errorType: AIProviderErrorType): string {
  switch (errorType) {
    case "unauthorized":
      return "请检查 Key 是否正确、是否有模型权限，或中转服务是否要求不同的鉴权方式。";
    case "not_found":
      return "当前接口路径可能不支持，请切换 Responses API / Chat Completions API 后重新测试。";
    case "model_error":
      return "模型名称可能不存在或不可用，请更换模型名后重试。";
    case "timeout":
      return "请求超时，请检查代理稳定性、网络连通性，或稍后重试。";
    case "network":
      return "服务端无法连接该 Base URL，请检查域名、证书、网络或代理服务状态。";
    case "provider_error":
      return "外部服务返回错误，请查看状态码和接口返回详情。";
    default:
      return "请检查 Base URL、接口类型、模型名和服务商返回详情。";
  }
}

function getErrorType(status: number | undefined, detail: string): AIProviderErrorType {
  const normalizedDetail = detail.toLowerCase();

  if (status === 401 || status === 403) {
    return "unauthorized";
  }

  if (status === 404) {
    return "not_found";
  }

  if (
    normalizedDetail.includes("model") ||
    normalizedDetail.includes("模型") ||
    normalizedDetail.includes("does not exist") ||
    normalizedDetail.includes("not found")
  ) {
    return "model_error";
  }

  if (status && status >= 400) {
    return "provider_error";
  }

  return "unknown";
}

function buildPublicError(params: {
  errorType: AIProviderErrorType;
  message?: string;
  status?: number;
  endpoint?: string;
  endpointType?: AIEndpointType;
  detail?: string;
  apiKey?: string;
}): AIProviderErrorResponse {
  const safeDetail = params.detail
    ? truncateDetail(redactSensitiveText(params.detail, params.apiKey ?? ""))
    : undefined;
  const advice = getProviderAdvice(params.errorType);
  const message = params.message ? `${params.message} ${advice}` : advice;

  return {
    ok: false,
    errorType: params.errorType,
    message,
    status: params.status,
    endpoint: params.endpoint,
    endpointType: params.endpointType,
    detail: safeDetail,
  };
}

function getAbortReason(error: unknown): AIProviderErrorType {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "timeout";
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "timeout";
  }

  return "network";
}

function validateProviderConfig(config: AIProviderConfig): void {
  if (!config.baseUrl.trim()) {
    throw new AIProviderRequestError(
      buildPublicError({
        errorType: "unknown",
        message: "请填写 Base URL。",
        endpointType: config.endpointType,
      }),
    );
  }

  if (!config.apiKey.trim()) {
    throw new AIProviderRequestError(
      buildPublicError({
        errorType: "unauthorized",
        message: "请填写 API Key。",
        endpointType: config.endpointType,
      }),
    );
  }

  if (!config.model.trim()) {
    throw new AIProviderRequestError(
      buildPublicError({
        errorType: "model_error",
        message: "请填写模型名称。",
        endpointType: config.endpointType,
      }),
    );
  }
}

async function postToProvider(
  config: AIProviderConfig,
  body: unknown,
): Promise<ProviderFetchPayload> {
  validateProviderConfig(config);

  const endpoint = buildProviderEndpoint(config.baseUrl, config.endpointType);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    });
    const responseText = await response.text();

    if (!response.ok) {
      const errorType = getErrorType(response.status, responseText);

      throw new AIProviderRequestError(
        buildPublicError({
          errorType,
          message: `外部 AI 接口返回 ${response.status}。`,
          status: response.status,
          endpoint,
          endpointType: config.endpointType,
          detail: responseText,
          apiKey: config.apiKey,
        }),
      );
    }

    return {
      endpoint,
      endpointType: config.endpointType,
      responseText,
    };
  } catch (error) {
    if (error instanceof AIProviderRequestError) {
      throw error;
    }

    const errorType = getAbortReason(error);
    const message = error instanceof Error ? error.message : "外部 AI 接口请求失败。";

    throw new AIProviderRequestError(
      buildPublicError({
        errorType,
        message: errorType === "timeout" ? "外部 AI 接口请求超时。" : `外部 AI 接口请求失败：${message}`,
        endpoint,
        endpointType: config.endpointType,
        detail: message,
        apiKey: config.apiKey,
      }),
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseProviderJson<T>(responseText: string, config: AIProviderConfig, endpoint: string): T {
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new AIProviderRequestError(
      buildPublicError({
        errorType: "provider_error",
        message: "外部 AI 接口没有返回合法 JSON。",
        endpoint,
        endpointType: config.endpointType,
        detail: responseText,
        apiKey: config.apiKey,
      }),
    );
  }
}

export async function callAIProviderInterpret(
  request: AIInterpretRequest,
  config: AIProviderConfig,
): Promise<AIInterpretResponse> {
  const body =
    config.endpointType === "responses"
      ? buildOpenAIResponseBody(request, config.model)
      : buildOpenAIChatCompletionBody(request, config.model);
  const result = await postToProvider(config, body);

  if (config.endpointType === "responses") {
    const payload = parseProviderJson<OpenAIResponsePayload>(
      result.responseText,
      config,
      result.endpoint,
    );

    return parseOpenAIResponsePayload(payload, request.title);
  }

  const payload = parseProviderJson<OpenAIChatCompletionPayload>(
    result.responseText,
    config,
    result.endpoint,
  );

  return parseOpenAIChatCompletionPayload(payload, request.title);
}

export async function testAIProviderConnection(
  config: AIProviderConfig,
): Promise<AITestConnectionResponse> {
  const body =
    config.endpointType === "responses"
      ? {
          model: config.model,
          input: "请只回复：连接成功",
        }
      : {
          model: config.model,
          messages: [
            {
              role: "user",
              content: "请只回复：连接成功",
            },
          ],
        };
  const result = await postToProvider(config, body);

  return {
    ok: true,
    message: "连接成功",
    endpoint: result.endpoint,
    endpointType: result.endpointType,
  };
}

export function getAIProviderPublicError(error: unknown): AIProviderErrorResponse {
  if (error instanceof AIProviderRequestError) {
    return error.publicError;
  }

  const message = error instanceof Error ? error.message : "AI 接口请求失败。";

  return buildPublicError({
    errorType: "unknown",
    message,
    detail: message,
  });
}
