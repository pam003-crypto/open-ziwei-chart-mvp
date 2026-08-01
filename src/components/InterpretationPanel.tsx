"use client";

import { useMemo, useState } from "react";
import { interpretWithRuleResult, resolveInterpretationScope } from "@/lib/interpretation/interpret";
import type { AstrolabeResult } from "@/lib/astrolabe";
import type {
  InterpretationResult,
  InterpretationSection,
  PalaceBrief,
  TransitContext,
} from "@/types/interpretation";

type InterpretationPanelProps = {
  astrolabe: AstrolabeResult;
  onPalaceSelect?: (palaceName: string) => void;
  onPalaceHover?: (palaceName: string | null) => void;
  transitContext: TransitContext;
  targetDate: Date;
  transitHour: number;
  selectedPalaceId?: number | string | null;
  variant?: "desktop" | "mobile";
};

type SectionKey = keyof InterpretationResult["sections"];
type InterpretationTab = "life" | "trine" | "pattern" | "decade" | "year";

const SECTION_LABELS: Array<{ key: SectionKey; title: string }> = [
  { key: "overview", title: "总体趋势" },
  { key: "career", title: "事业" },
  { key: "wealth", title: "财务" },
  { key: "relationship", title: "感情 / 合作" },
  { key: "health", title: "健康 / 压力" },
  { key: "risk", title: "风险提醒" },
  { key: "advice", title: "行动建议" },
];

const INTERPRETATION_TABS: Array<{ key: InterpretationTab; label: string }> = [
  { key: "life", label: "命宫解读" },
  { key: "trine", label: "三方四正" },
  { key: "pattern", label: "格局分析" },
  { key: "decade", label: "大运趋势" },
  { key: "year", label: "流年分析" },
];

const TAB_SECTIONS: Record<InterpretationTab, SectionKey[]> = {
  life: ["overview", "relationship", "health"],
  trine: ["overview", "career", "wealth"],
  pattern: ["career", "wealth", "relationship", "health"],
  decade: ["overview", "risk", "advice"],
  year: ["overview", "career", "wealth", "risk", "advice"],
};

const PALACE_NAMES = [
  "命宫",
  "兄弟",
  "夫妻",
  "子女",
  "财帛",
  "疾厄",
  "迁移",
  "交友",
  "官禄",
  "田宅",
  "福德",
  "父母",
];

function PalaceGroup({
  label,
  onPalaceHover,
  onPalaceSelect,
  palaces,
}: {
  label: string;
  onPalaceHover?: (palaceName: string | null) => void;
  onPalaceSelect?: (palaceName: string) => void;
  palaces: PalaceBrief[];
}) {
  return (
    <div className="interpretation-palace-group">
      <span>{label}</span>
      {palaces.length > 0 ? (
        palaces.map((palace) => (
          <button
            className="evidence-chip"
            key={palace.palaceName}
            title={palace.reason}
            type="button"
            onClick={() => onPalaceSelect?.(palace.palaceName)}
            onBlur={() => onPalaceHover?.(null)}
            onFocus={() => onPalaceHover?.(palace.palaceName)}
            onMouseEnter={() => onPalaceHover?.(palace.palaceName)}
            onMouseLeave={() => onPalaceHover?.(null)}
          >
            {palace.palaceName}
            <small>{palace.score}</small>
          </button>
        ))
      ) : (
        <b>暂无明显集中点</b>
      )}
    </div>
  );
}

function findPalaceName(text: string): string | undefined {
  return PALACE_NAMES.find((palaceName) => text.includes(palaceName));
}

function EvidenceItem({
  evidence,
  onPalaceHover,
  onPalaceSelect,
}: {
  evidence: string;
  onPalaceHover?: (palaceName: string | null) => void;
  onPalaceSelect?: (palaceName: string) => void;
}) {
  const palaceName = findPalaceName(evidence);

  return (
    <li>
      {palaceName ? (
        <button
          className="evidence-chip"
          type="button"
          onClick={() => onPalaceSelect?.(palaceName)}
          onBlur={() => onPalaceHover?.(null)}
          onFocus={() => onPalaceHover?.(palaceName)}
          onMouseEnter={() => onPalaceHover?.(palaceName)}
          onMouseLeave={() => onPalaceHover?.(null)}
        >
          {palaceName}
        </button>
      ) : null}
      <span>{evidence}</span>
    </li>
  );
}

function InterpretationContent({
  onPalaceHover,
  onPalaceSelect,
  section,
}: {
  onPalaceHover?: (palaceName: string | null) => void;
  onPalaceSelect?: (palaceName: string) => void;
  section: InterpretationSection;
}) {
  return (
    <>
      <div className="interpretation-card-block">
        <span>结论</span>
        <p>{section.conclusion}</p>
      </div>

      <div className="interpretation-card-block">
        <span>依据</span>
        <ol>
          {section.evidences.map((evidence) => (
            <EvidenceItem
              evidence={evidence}
              key={evidence}
              onPalaceHover={onPalaceHover}
              onPalaceSelect={onPalaceSelect}
            />
          ))}
        </ol>
      </div>

      <div className="interpretation-card-block">
        <span>建议</span>
        <ul>
          {section.suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

function InterpretationCard({
  section,
  sectionKey,
  onPalaceHover,
  onPalaceSelect,
  variant,
}: {
  onPalaceHover?: (palaceName: string | null) => void;
  onPalaceSelect?: (palaceName: string) => void;
  section: InterpretationSection;
  sectionKey: SectionKey;
  variant: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    const defaultOpen = sectionKey === "overview" || sectionKey === "advice";

    return (
      <details className="interpretation-card interpretation-accordion" open={defaultOpen}>
        <summary>{section.title}</summary>
        <InterpretationContent
          onPalaceHover={onPalaceHover}
          onPalaceSelect={onPalaceSelect}
          section={section}
        />
      </details>
    );
  }

  return (
    <article className="interpretation-card">
      <h3>{section.title}</h3>
      <InterpretationContent
        onPalaceHover={onPalaceHover}
        onPalaceSelect={onPalaceSelect}
        section={section}
      />
    </article>
  );
}

export function InterpretationPanel({
  astrolabe,
  onPalaceHover,
  onPalaceSelect,
  transitContext,
  targetDate,
  transitHour,
  selectedPalaceId,
  variant = "desktop",
}: InterpretationPanelProps) {
  const [activeTab, setActiveTab] = useState<InterpretationTab>("life");
  const interpretationData = useMemo(
    () =>
      interpretWithRuleResult({
        astrolabe,
        scope: resolveInterpretationScope(transitContext),
        targetDate,
        transitHour,
        selectedPalaceId,
        transitContext,
      }),
    [astrolabe, transitContext, targetDate, transitHour, selectedPalaceId],
  );
  const { result } = interpretationData;
  const visibleSections = TAB_SECTIONS[activeTab];
  const insightSections: SectionKey[] = ["career", "wealth", "relationship", "health", "risk", "advice"];

  return (
    <section className={`interpretation-panel is-${variant}`}>
      <div className="interpretation-header workspace-section-heading">
        <div>
          <p className="section-kicker">Interpretation</p>
          <h2 className="section-title">命盘解读</h2>
          <p className="section-helper">
            {result.title} · 基于本地规则引擎生成，仅作为传统命理参考。
          </p>
        </div>
        <span className="interpretation-level">{result.level}</span>
      </div>

      <div className="interpretation-tabs" role="tablist" aria-label="解读维度">
        {INTERPRETATION_TABS.map((tab) => (
          <button
            aria-selected={activeTab === tab.key}
            className={activeTab === tab.key ? "is-active" : ""}
            key={tab.key}
            role="tab"
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={variant === "mobile" ? "interpretation-workspace is-mobile" : "interpretation-workspace"}>
        <div className="interpretation-main-column">
          <p className="interpretation-disclaimer">{result.summary}</p>

          <div className="interpretation-palaces" aria-label="重点宫位">
            <PalaceGroup
              label="主线宫位"
              onPalaceHover={onPalaceHover}
              onPalaceSelect={onPalaceSelect}
              palaces={result.primaryPalaces}
            />
            <PalaceGroup
              label="辅助宫位"
              onPalaceHover={onPalaceHover}
              onPalaceSelect={onPalaceSelect}
              palaces={result.secondaryPalaces}
            />
          </div>

          <div className={variant === "mobile" ? "interpretation-grid is-accordion" : "interpretation-grid"}>
            {SECTION_LABELS.filter(({ key }) => visibleSections.includes(key)).map(({ key, title }) => (
              <InterpretationCard
                key={key}
                onPalaceHover={onPalaceHover}
                onPalaceSelect={onPalaceSelect}
                sectionKey={key}
                variant={variant}
                section={{
                  ...result.sections[key],
                  title,
                }}
              />
            ))}
          </div>

        </div>

        {variant === "desktop" ? (
          <aside className="key-insights-panel" aria-label="命盘要点提示">
            <div className="key-insights-heading">
              <p className="section-kicker">Key Insights</p>
              <h3>要点提示</h3>
            </div>
            {insightSections.map((key) => {
              const title = SECTION_LABELS.find((item) => item.key === key)?.title ?? key;
              return (
                <article className="key-insight-item" key={key}>
                  <span>{title}</span>
                  <p>{result.sections[key].conclusion}</p>
                </article>
              );
            })}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
