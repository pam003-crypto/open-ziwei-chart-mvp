"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAIInterpretCache,
  setAIInterpretCache,
} from "@/lib/ai/aiInterpretCache";
import type {
  AIInterpretRequest,
  AIInterpretResponse,
  AIInterpretStyle,
  AISignalDomain,
} from "@/lib/ai/types";

type AIInterpretPanelProps = {
  request: AIInterpretRequest;
  variant?: "desktop" | "mobile";
};

const STYLE_OPTIONS: Array<{ value: AIInterpretStyle; label: string }> = [
  { value: "professional", label: "专业" },
  { value: "gentle", label: "温和" },
  { value: "direct", label: "直白" },
  { value: "classical", label: "古风" },
];

const SECTION_LABELS: Array<{ key: AISignalDomain; label: string }> = [
  { key: "overview", label: "总结" },
  { key: "career", label: "事业" },
  { key: "wealth", label: "财务" },
  { key: "relationship", label: "感情 / 合作" },
  { key: "health", label: "健康 / 压力" },
  { key: "risk", label: "风险" },
  { key: "advice", label: "建议" },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AI 解读生成失败";
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };

    return payload.error || "AI 解读生成失败";
  } catch {
    return "AI 解读暂时不可用，请确认服务端 API 已部署并配置 OPENAI_API_KEY。";
  }
}

function buildCopyText(response: AIInterpretResponse): string {
  return [
    response.title,
    "",
    response.summary,
    "",
    ...SECTION_LABELS.flatMap(({ key, label }) => [
      `【${label}】`,
      response.sections[key],
      "",
    ]),
    response.disclaimer,
  ].join("\n");
}

function AIResult({ response }: { response: AIInterpretResponse }) {
  return (
    <div className="ai-result">
      <div className="ai-summary-card">
        <h4>{response.title}</h4>
        <p>{response.summary}</p>
      </div>

      <div className="ai-result-grid">
        {SECTION_LABELS.map(({ key, label }) => (
          <article className="ai-result-card" key={key}>
            <span>{label}</span>
            <p>{response.sections[key]}</p>
          </article>
        ))}
      </div>

      <p className="ai-disclaimer">{response.disclaimer}</p>
    </div>
  );
}

export function AIInterpretPanel({
  request,
  variant = "desktop",
}: AIInterpretPanelProps) {
  const [style, setStyle] = useState<AIInterpretStyle>("professional");
  const [response, setResponse] = useState<AIInterpretResponse | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const styledRequest = useMemo<AIInterpretRequest>(
    () => ({
      ...request,
      style,
    }),
    [request, style],
  );

  useEffect(() => {
    const cached = getAIInterpretCache(styledRequest);

    setError(null);
    setCopied(false);

    if (cached) {
      setResponse(cached.response);
      setCachedAt(cached.createdAt);
      return;
    }

    setResponse(null);
    setCachedAt(null);
  }, [styledRequest]);

  const generateInterpretation = async (force = false) => {
    const cached = force ? null : getAIInterpretCache(styledRequest);

    if (cached) {
      setResponse(cached.response);
      setCachedAt(cached.createdAt);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const apiResponse = await fetch("api/ai-interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(styledRequest),
      });

      if (!apiResponse.ok) {
        throw new Error(await readErrorMessage(apiResponse));
      }

      const payload = (await apiResponse.json()) as AIInterpretResponse;

      setResponse(payload);
      setCachedAt(new Date().toISOString());
      setAIInterpretCache(styledRequest, payload);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const copyInterpretation = async () => {
    if (!response) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildCopyText(response));
      setCopied(true);
    } catch {
      setError("复制失败，请检查浏览器剪贴板权限。");
    }
  };

  const content = (
    <>
      <div className="ai-panel-header">
        <div>
          <p className="section-kicker">AI Interpretation</p>
          <h3>{response?.title ?? `${request.title} AI 解读`}</h3>
          <p>AI 只基于上方本地规则结果进行整理，不直接自由解盘。</p>
        </div>

        <label className="ai-style-select">
          <span>风格</span>
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as AIInterpretStyle)}
          >
            {STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="ai-action-row">
        <button
          className="ai-primary-button"
          disabled={isLoading}
          type="button"
          onClick={() => generateInterpretation(false)}
        >
          {isLoading ? "生成中..." : response ? "读取 / 生成 AI 解读" : "生成 AI 解读"}
        </button>
        <button
          className="ai-secondary-button"
          disabled={isLoading}
          type="button"
          onClick={() => generateInterpretation(true)}
        >
          重新生成
        </button>
        <button
          className="ai-secondary-button"
          disabled={!response}
          type="button"
          onClick={copyInterpretation}
        >
          {copied ? "已复制" : "复制解读"}
        </button>
      </div>

      {cachedAt ? (
        <p className="ai-cache-note">已读取缓存：{new Date(cachedAt).toLocaleString()}</p>
      ) : null}

      {error ? <p className="ai-error">{error}</p> : null}
      {isLoading ? <p className="ai-loading">正在根据本地规则生成 AI 解读...</p> : null}
      {response ? <AIResult response={response} /> : null}
    </>
  );

  if (variant === "mobile") {
    return (
      <details className="ai-interpret-panel is-mobile" open={Boolean(response || isLoading)}>
        <summary>AI 解读</summary>
        <div className="ai-mobile-content">{content}</div>
      </details>
    );
  }

  return <section className="ai-interpret-panel is-desktop">{content}</section>;
}
