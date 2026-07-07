import { AI_INTERPRET_SYSTEM_PROMPT, getAIStylePrompt } from "./prompts";
import type { AIInterpretRequest, AIInterpretResponse } from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

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

const AI_RESPONSE_SCHEMA = {
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

type OpenAIContentBlock = {
  text?: string;
  type?: string;
};

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: OpenAIContentBlock[];
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

function parseAIResponse(text: string): AIInterpretResponse {
  const parsed = JSON.parse(text) as AIInterpretResponse;

  if (!parsed.title || !parsed.summary || !parsed.sections || !parsed.disclaimer) {
    throw new Error("AI 返回格式不完整");
  }

  return sanitizeResponse(parsed);
}

function buildUserPrompt(request: AIInterpretRequest): string {
  return [
    getAIStylePrompt(request.style ?? "professional"),
    "请只基于下面 JSON 中的本地规则结果生成解读，不得补充 JSON 中不存在的星曜、四化、宫位或时间。",
    "每个栏目请写成自然段，但内容必须包含“依据、结论、建议”的逻辑。",
    "如果某栏目线索不足，请直接说明线索不集中，并给低风险建议。",
    JSON.stringify(request),
  ].join("\n\n");
}

export async function callOpenAIInterpret(
  request: AIInterpretRequest,
): Promise<AIInterpretResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("未配置 OPENAI_API_KEY");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5-mini";
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
  });

  const payload = (await response.json()) as OpenAIResponsePayload;

  if (!response.ok) {
    throw new Error(payload.error?.message || "AI 解读生成失败");
  }

  const text = getResponseText(payload);

  if (!text) {
    throw new Error("AI 返回内容为空");
  }

  return parseAIResponse(text);
}
