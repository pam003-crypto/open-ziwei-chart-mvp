"use client";

import { useEffect, useMemo, useState } from "react";
import { interpretWithRuleResult, resolveInterpretationScope } from "@/lib/interpretation/interpret";
import type { TimeSelection, TimeSelectionItem } from "@/components/TransitControls";
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
  targetDate: Date;
  transitHour: number;
  selectedPalaceId?: number | string | null;
  timeSelection?: TimeSelection;
  variant?: "desktop" | "mobile";
};

type SectionKey = keyof InterpretationResult["sections"];
type InterpretationTab = "natal" | "pattern" | "decade" | "year" | "month" | "day" | "hour";

const SECTION_LABELS: Array<{ key: SectionKey; title: string }> = [
  { key: "overview", title: "总体趋势" },
  { key: "career", title: "事业" },
  { key: "wealth", title: "财务" },
  { key: "relationship", title: "感情 / 合作" },
  { key: "health", title: "健康 / 压力" },
  { key: "risk", title: "风险提醒" },
  { key: "advice", title: "行动建议" },
];

const TAB_SECTIONS: Record<InterpretationTab, SectionKey[]> = {
  natal: ["overview", "career", "wealth", "relationship", "health", "advice"],
  pattern: ["career", "wealth", "relationship", "health"],
  decade: ["overview", "career", "wealth", "relationship", "health", "risk", "advice"],
  year: ["overview", "career", "wealth", "relationship", "health", "risk", "advice"],
  month: ["overview", "career", "wealth", "relationship", "health", "risk", "advice"],
  day: ["overview", "career", "wealth", "relationship", "health", "risk", "advice"],
  hour: ["overview", "career", "wealth", "relationship", "health", "risk", "advice"],
};

type TabDefinition = {
  key: InterpretationTab;
  label: string;
  selectionKey?: keyof TimeSelection;
};

const BASE_TABS: TabDefinition[] = [
  { key: "natal", label: "命宫解读" },
  { key: "pattern", label: "格局分析" },
];

const PERIOD_TABS: Array<Required<TabDefinition>> = [
  { key: "decade", label: "大运解读", selectionKey: "decadal" },
  { key: "year", label: "流年解读", selectionKey: "yearly" },
  { key: "month", label: "流月解读", selectionKey: "monthly" },
  { key: "day", label: "流日解读", selectionKey: "daily" },
  { key: "hour", label: "流时解读", selectionKey: "hourly" },
];

const NATAL_CONTEXT: TransitContext = {
  scope: "natal",
  label: "本命",
  keywords: ["本命", "命宫", "身宫", "三方四正", "四化"],
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

function getAvailableTabs(timeSelection?: TimeSelection): TabDefinition[] {
  return [
    ...BASE_TABS,
    ...PERIOD_TABS.filter(({ selectionKey }) => Boolean(timeSelection?.[selectionKey])),
  ];
}

function getSelectedTimeItem(
  tab: InterpretationTab,
  timeSelection?: TimeSelection,
): TimeSelectionItem | undefined {
  const config = PERIOD_TABS.find((item) => item.key === tab);

  return config ? timeSelection?.[config.selectionKey] ?? undefined : undefined;
}

function getSectionTitle(tab: InterpretationTab, key: SectionKey): string {
  if (tab === "natal") {
    const natalTitles: Partial<Record<SectionKey, string>> = {
      overview: "本命综合分析",
      career: "事业基础",
      wealth: "财务基础",
      relationship: "感情基础",
      health: "健康 / 压力",
    };

    return natalTitles[key] ?? SECTION_LABELS.find((item) => item.key === key)?.title ?? key;
  }

  if (tab === "pattern" && key === "overview") {
    return "格局主线";
  }

  return SECTION_LABELS.find((item) => item.key === key)?.title ?? key;
}

function getTabCopy(
  tab: InterpretationTab,
  result: InterpretationResult,
  selectedItem?: TimeSelectionItem,
): { helper: string; summary: string; insightTitle: string } {
  if (tab === "natal") {
    return {
      helper: "本命摘要：从命宫、身宫与三方四正等原局结构展开。",
      summary: result.summary,
      insightTitle: "本命要点",
    };
  }

  if (tab === "pattern") {
    return {
      helper: "格局分析：以主星星系、宫位关系、三方四正、辅煞与四化的交叉条件为依据。",
      summary: `格局分析：${result.summary.replace(/^综合命盘解读：/, "")}`,
      insightTitle: "格局要点",
    };
  }

  const scopeLabel =
    tab === "decade"
      ? "当前大运"
      : tab === "year"
        ? "当前流年"
        : tab === "month"
          ? "当前流月"
          : tab === "day"
            ? "当前流日"
            : "当前流时";
  const selectedLabel = selectedItem?.label ?? "未选择";

  return {
    helper: `${scopeLabel}：${selectedLabel}`,
    summary: result.summary,
    insightTitle: `${scopeLabel}要点`,
  };
}

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
  targetDate,
  timeSelection,
  transitHour,
  selectedPalaceId,
  variant = "desktop",
}: InterpretationPanelProps) {
  const [activeTab, setActiveTab] = useState<InterpretationTab>("natal");
  const availableTabs = useMemo(
    () => getAvailableTabs(timeSelection),
    [
      timeSelection?.decadal,
      timeSelection?.yearly,
      timeSelection?.monthly,
      timeSelection?.daily,
      timeSelection?.hourly,
    ],
  );
  const effectiveTab = availableTabs.some((tab) => tab.key === activeTab) ? activeTab : "natal";
  const selectedTimeItem = getSelectedTimeItem(effectiveTab, timeSelection);
  const activeContext = selectedTimeItem?.context ?? NATAL_CONTEXT;
  const activeScope =
    effectiveTab === "natal" || effectiveTab === "pattern"
      ? "natal"
      : resolveInterpretationScope(activeContext);

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab("natal");
    }
  }, [activeTab, availableTabs]);

  const interpretationData = useMemo(
    () =>
      interpretWithRuleResult({
        astrolabe,
        scope: activeScope,
        targetDate,
        transitHour,
        selectedPalaceId,
        transitContext: activeContext,
      }),
    [astrolabe, activeContext, activeScope, targetDate, transitHour, selectedPalaceId],
  );
  const { result } = interpretationData;
  const visibleSections = TAB_SECTIONS[effectiveTab];
  const tabCopy = getTabCopy(effectiveTab, result, selectedTimeItem);
  const insightSections = visibleSections.filter((key) => key !== "overview");

  return (
    <section className={`interpretation-panel is-${variant}`}>
      <div className="interpretation-header workspace-section-heading">
        <div>
          <p className="section-kicker">Interpretation</p>
          <h2 className="section-title">命盘解读</h2>
          <p className="section-helper">
            {tabCopy.helper}
          </p>
        </div>
        <span className="interpretation-level">{result.level}</span>
      </div>

      <div className="interpretation-tabs" role="tablist" aria-label="解读维度">
        {availableTabs.map((tab) => (
          <button
            aria-selected={effectiveTab === tab.key}
            className={effectiveTab === tab.key ? "is-active" : ""}
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
          <p className="interpretation-disclaimer">{tabCopy.summary}</p>

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
            {visibleSections.map((key) => (
              <InterpretationCard
                key={key}
                onPalaceHover={onPalaceHover}
                onPalaceSelect={onPalaceSelect}
                sectionKey={key}
                variant={variant}
                section={{
                  ...result.sections[key],
                  title: getSectionTitle(effectiveTab, key),
                }}
              />
            ))}
          </div>

        </div>

        {variant === "desktop" ? (
          <aside className="key-insights-panel" aria-label="命盘要点提示">
            <div className="key-insights-heading">
              <p className="section-kicker">Key Insights</p>
              <h3>{tabCopy.insightTitle}</h3>
            </div>
            {insightSections.map((key) => {
              const title = getSectionTitle(effectiveTab, key);
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
