import { AI_INTERPRET_SYSTEM_PROMPT, getAIStylePrompt } from "./prompts";
import type { AIEndpointType, AIInterpretRequest, AIInterpretResponse } from "./types";

export const DEFAULT_OPENAI_MODEL = "gpt-5.5-mini";

export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

const FORBIDDEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/必定/g, "倾向于"],
  [/一定/g, "通常"],
  [/绝对/g, "需要注意"],
  [/注定/g, "可能"],
  [/大凶/g, "波动较大"],
  [/大灾/g, "明显压力"],
  [/破产/g, "财务压力"],
  [/离婚/g, "关系压力"],
  [/必发财/g, "财务机会增强"],
];

export const AI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "sections", "disclaimer"],
  properties: {
    title: {
      type: "string",
      maxLength: 80,
    },
    summary: {
      type: "string",
      maxLength: 420,
    },
    sections: {
      type: "object",
      additionalProperties: false,
      required: ["overview", "career", "wealth", "relationship", "health", "risk", "advice"],
      properties: {
        overview: { type: "string", maxLength: 520 },
        career: { type: "string", maxLength: 520 },
        wealth: { type: "string", maxLength: 520 },
        relationship: { type: "string", maxLength: 520 },
        health: { type: "string", maxLength: 520 },
        risk: { type: "string", maxLength: 520 },
        advice: { type: "string", maxLength: 520 },
      },
    },
    disclaimer: {
      type: "string",
      maxLength: 180,
    },
  },
} as const;

export type OpenAIContentBlock = {
  text?: string;
  type?: string;
};

export type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: OpenAIContentBlock[];
  }>;
  error?: {
    message?: string;
  };
};

export type OpenAIChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getResponseText(payload: OpenAIResponsePayload): string {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

function getChatCompletionText(payload: OpenAIChatCompletionPayload): string {
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

function sanitizeText(text: string): string {
  return FORBIDDEN_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  ).trim();
}

function sanitizeResponse(response: AIInterpretResponse): AIInterpretResponse {
  return {
    title: sanitizeText(response.title),
    summary: sanitizeText(response.summary),
    sections: {
      overview: sanitizeText(response.sections.overview),
      career: sanitizeText(response.sections.career),
      wealth: sanitizeText(response.sections.wealth),
      relationship: sanitizeText(response.sections.relationship),
      health: sanitizeText(response.sections.health),
      risk: sanitizeText(response.sections.risk),
      advice: sanitizeText(response.sections.advice),
    },
    disclaimer: sanitizeText(response.disclaimer),
  };
}

export function buildProviderEndpoint(baseUrl: string, endpointType: AIEndpointType): string {
  const normalizedBaseUrl = (baseUrl || DEFAULT_OPENAI_BASE_URL).trim().replace(/\/+$/, "");

  if (endpointType === "responses") {
    return normalizedBaseUrl.endsWith("/responses")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/responses`;
  }

  return normalizedBaseUrl.endsWith("/chat/completions")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/chat/completions`;
}

function buildPlainTextFallback(text: string, fallbackTitle: string): AIInterpretResponse {
  const cleanText = sanitizeText(text).slice(0, 1800);
  const summary = cleanText.slice(0, 420) || "模型未返回标准 JSON，暂时只能显示原始文本。";

  return sanitizeResponse({
    title: fallbackTitle,
    summary,
    sections: {
      overview: cleanText,
      career: "模型未返回标准 JSON，本栏目暂无法结构化拆分。请尝试更换模型、接口类型，或重新生成。",
      wealth: "模型未返回标准 JSON，本栏目暂无法结构化拆分。请尝试更换模型、接口类型，或重新生成。",
      relationship: "模型未返回标准 JSON，本栏目暂无法结构化拆分。请尝试更换模型、接口类型，或重新生成。",
      health: "模型未返回标准 JSON，本栏目暂无法结构化拆分。请尝试更换模型、接口类型，或重新生成。",
      risk: "模型未返回标准 JSON，风险提示仅能参考原始文本，不宜作确定性判断。",
      advice: "建议切换 Responses / Chat Completions 接口类型，或使用更稳定支持 JSON 输出的模型。",
    },
    disclaimer: "模型未返回标准 JSON，以上为原始文本兜底展示，仅供学习参考。",
  });
}

export function buildUserPrompt(request: AIInterpretRequest): string {
  return [
    getAIStylePrompt(request.style ?? "professional"),
    "请只基于下面 JSON 中的本地规则结果生成解读，不得补充 JSON 中不存在的星曜、四化、宫位或时间。",
    "每个栏目请写成自然段，但内容必须包含“依据、结论、建议”的逻辑。",
    "如果某栏目线索不足，请直接说明线索不集中，并给低风险建议。",
    "请返回符合 JSON schema 的 JSON 字符串，不要使用 Markdown 代码块。",
    JSON.stringify(request),
  ].join("\n\n");
}

export function buildOpenAIResponseBody(request: AIInterpretRequest, model: string) {
  return {
    model,
    input: [
      {
        role: "system",
        content: AI_INTERPRET_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserPrompt(request),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ziwei_ai_interpretation",
        strict: true,
        schema: AI_RESPONSE_SCHEMA,
      },
    },
    store: false,
  };
}

export function buildOpenAIChatCompletionBody(request: AIInterpretRequest, model: string) {
  return {
    model,
    messages: [
      {
        role: "system",
        content: AI_INTERPRET_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserPrompt(request),
      },
    ],
  };
}

export function parseAIResponseText(text: string, fallbackTitle = "AI 解读"): AIInterpretResponse {
  if (!text) {
    throw new Error("AI 返回内容为空");
  }

  const normalizedText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(normalizedText) as AIInterpretResponse;

    if (!parsed.title || !parsed.summary || !parsed.sections || !parsed.disclaimer) {
      throw new Error("AI 返回格式不完整");
    }

    return sanitizeResponse(parsed);
  } catch {
    return buildPlainTextFallback(normalizedText, fallbackTitle);
  }
}

export function parseOpenAIResponsePayload(
  payload: OpenAIResponsePayload,
  fallbackTitle = "AI 解读",
): AIInterpretResponse {
  const text = getResponseText(payload);

  return parseAIResponseText(text, fallbackTitle);
}

export function parseOpenAIChatCompletionPayload(
  payload: OpenAIChatCompletionPayload,
  fallbackTitle = "AI 解读",
): AIInterpretResponse {
  const text = getChatCompletionText(payload);

  return parseAIResponseText(text, fallbackTitle);
}
