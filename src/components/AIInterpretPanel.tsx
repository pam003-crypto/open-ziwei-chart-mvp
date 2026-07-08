"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAIInterpretCache,
  setAIInterpretCache,
} from "@/lib/ai/aiInterpretCache";
import {
  clearAISettings,
  DEFAULT_AI_SETTINGS,
  loadAISettings,
  saveAISettings,
  type AIConnectionMode,
  type AISettings,
} from "@/lib/ai/aiSettings";
import { requestAIInterpret, testAIConnection } from "@/lib/ai/requestAIInterpret";
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

const CONNECTION_OPTIONS: Array<{ value: AIConnectionMode; label: string }> = [
  { value: "server", label: "服务端默认" },
  { value: "custom", label: "代理 API" },
  { value: "browser", label: "纯 API" },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AI 解读生成失败";
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
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [response, setResponse] = useState<AIInterpretResponse | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const styledRequest = useMemo<AIInterpretRequest>(
    () => ({
      ...request,
      style,
    }),
    [request, style],
  );

  useEffect(() => {
    setSettings(loadAISettings());
  }, []);

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

  useEffect(() => {
    setConnectionStatus("idle");
    setConnectionMessage(null);
  }, [
    settings.mode,
    settings.baseUrl,
    settings.apiKey,
    settings.model,
    settings.endpointType,
  ]);

  const updateSettings = (nextSettings: Partial<AISettings>) => {
    setSettingsSaved(false);
    setSettings((current) => ({
      ...current,
      ...nextSettings,
    }));
  };

  const saveSettings = () => {
    saveAISettings(settings);
    setSettingsSaved(true);
  };

  const resetSettings = () => {
    setSettings(clearAISettings());
    setSettingsSaved(false);
  };

  const requiresConnectionTest = settings.mode === "browser";

  const runConnectionTest = async () => {
    setConnectionStatus("testing");
    setConnectionMessage(null);
    setError(null);

    try {
      const result = await testAIConnection(settings);

      setConnectionStatus("success");
      setConnectionMessage(`${result.message}：${result.endpoint}`);
    } catch (testError) {
      setConnectionStatus("error");
      setConnectionMessage(getErrorMessage(testError));
    }
  };

  const generateInterpretation = async (force = false) => {
    if (requiresConnectionTest && connectionStatus !== "success") {
      setError("纯 API 模式需要先点击“测试连接”，连接成功后再生成 AI 解读。");
      return;
    }

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
      const payload = await requestAIInterpret(styledRequest, settings);

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

      <details className="ai-settings-panel">
        <summary>AI 设置</summary>

        <div className="ai-settings-grid">
          <label className="ai-settings-wide">
            <span>接入模式</span>
            <select
              value={settings.mode}
              onChange={(event) =>
                updateSettings({ mode: event.target.value as AIConnectionMode })
              }
            >
              {CONNECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {settings.mode === "server" ? (
            <p className="ai-settings-note">
              使用当前站点服务端 API。模型和 Key 由服务器环境变量决定。
            </p>
          ) : null}

          {settings.mode === "custom" ? (
            <label className="ai-settings-wide">
              <span>代理 API 地址</span>
              <input
                value={settings.endpoint}
                onChange={(event) => updateSettings({ endpoint: event.target.value })}
                placeholder="https://你的域名/api/ai-interpret"
                type="url"
              />
            </label>
          ) : null}

          {settings.mode === "browser" ? (
            <>
              <label className="ai-settings-wide">
                <span>配置模型</span>
                <input
                  value={settings.model}
                  onChange={(event) => updateSettings({ model: event.target.value })}
                  placeholder="gpt-5.5-mini"
                  type="text"
                />
              </label>

              <label className="ai-settings-wide">
                <span>接口类型</span>
                <select
                  value={settings.endpointType}
                  onChange={(event) =>
                    updateSettings({
                      endpointType: event.target.value as AISettings["endpointType"],
                    })
                  }
                >
                  <option value="chat_completions">Chat Completions API</option>
                  <option value="responses">Responses API</option>
                </select>
              </label>

              <details className="ai-more-options ai-settings-wide" open>
                <summary>更多选项</summary>
                <div className="ai-more-options-grid">
                  <label>
                    <span>Base URL</span>
                    <input
                      value={settings.baseUrl}
                      onChange={(event) => updateSettings({ baseUrl: event.target.value })}
                      placeholder="https://api.openai.com/v1"
                      type="url"
                    />
                  </label>

                  <label>
                    <span>Key</span>
                    <input
                      autoComplete="off"
                      value={settings.apiKey ?? ""}
                      onChange={(event) => updateSettings({ apiKey: event.target.value })}
                      placeholder="sk-..."
                      type="password"
                    />
                  </label>

                  <label className="ai-settings-checkbox">
                    <input
                      checked={settings.rememberKey}
                      onChange={(event) => updateSettings({ rememberKey: event.target.checked })}
                      type="checkbox"
                    />
                    <span>记住到此浏览器。仅建议个人设备使用。</span>
                  </label>

                  <p className="ai-settings-warning">
                    纯 API 模式由本项目服务端转发，不在浏览器直接请求外部 Base URL。若代理不支持当前接口路径，请切换 Responses API / Chat Completions API 后测试。
                  </p>
                </div>
              </details>
            </>
          ) : null}
        </div>

        <div className="ai-settings-actions">
          {settings.mode === "browser" ? (
            <button
              className="ai-secondary-button"
              disabled={connectionStatus === "testing"}
              type="button"
              onClick={runConnectionTest}
            >
              {connectionStatus === "testing" ? "测试中..." : "测试连接"}
            </button>
          ) : null}
          <button className="ai-secondary-button" type="button" onClick={saveSettings}>
            保存设置
          </button>
          <button className="ai-secondary-button" type="button" onClick={resetSettings}>
            清空设置
          </button>
          {settingsSaved ? <span>已保存</span> : null}
        </div>

        {connectionMessage ? (
          <p className={`ai-connection-message is-${connectionStatus}`}>
            {connectionMessage}
          </p>
        ) : null}
      </details>

      <div className="ai-action-row">
        <button
          className="ai-primary-button"
          disabled={isLoading || (requiresConnectionTest && connectionStatus !== "success")}
          type="button"
          onClick={() => generateInterpretation(false)}
        >
          {isLoading
            ? "生成中..."
            : requiresConnectionTest && connectionStatus !== "success"
              ? "请先测试连接"
              : response
                ? "读取 / 生成 AI 解读"
                : "生成 AI 解读"}
        </button>
        <button
          className="ai-secondary-button"
          disabled={isLoading || (requiresConnectionTest && connectionStatus !== "success")}
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
