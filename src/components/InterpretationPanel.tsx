"use client";

import { useMemo } from "react";
import { interpret, resolveInterpretationScope } from "@/lib/interpretation/interpret";
import type { AstrolabeResult } from "@/lib/astrolabe";
import type { InterpretationResult, TransitContext } from "@/types/interpretation";

type InterpretationPanelProps = {
  astrolabe: AstrolabeResult;
  transitContext: TransitContext;
  targetDate: Date;
  transitHour: number;
  selectedPalaceId?: number | string | null;
};

type SectionKey = keyof InterpretationResult["sections"];

const SECTION_LABELS: Array<{ key: SectionKey; title: string }> = [
  { key: "overview", title: "总体趋势" },
  { key: "career", title: "事业" },
  { key: "wealth", title: "财务" },
  { key: "relationship", title: "感情 / 合作" },
  { key: "health", title: "健康 / 压力" },
  { key: "risk", title: "风险提醒" },
  { key: "advice", title: "行动建议" },
];

function InterpretationCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <article className="interpretation-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export function InterpretationPanel({
  astrolabe,
  transitContext,
  targetDate,
  transitHour,
  selectedPalaceId,
}: InterpretationPanelProps) {
  const result = useMemo(
    () =>
      interpret({
        astrolabe,
        scope: resolveInterpretationScope(transitContext),
        targetDate,
        transitHour,
        selectedPalaceId,
        transitContext,
      }),
    [astrolabe, transitContext, targetDate, transitHour, selectedPalaceId],
  );

  return (
    <section className="interpretation-panel">
      <div className="interpretation-header">
        <div>
          <p className="section-kicker">Interpretation</p>
          <h2 className="section-title mt-2">{result.title}</h2>
          <p className="mt-2 text-sm text-stone-400">
            基于本地规则引擎生成，仅作为传统命理参考。
          </p>
        </div>
        <span className="interpretation-level">{result.level}</span>
      </div>

      <p className="interpretation-disclaimer">{result.summary}</p>

      <div className="interpretation-palaces" aria-label="重点宫位">
        <span>重点宫位</span>
        {result.activatedPalaces.length > 0 ? (
          result.activatedPalaces.map((palace) => <b key={palace}>{palace}</b>)
        ) : (
          <b>暂无明显集中点</b>
        )}
      </div>

      <div className="interpretation-grid">
        {SECTION_LABELS.map(({ key, title }) => (
          <InterpretationCard key={key} title={title} items={result.sections[key]} />
        ))}
      </div>
    </section>
  );
}
