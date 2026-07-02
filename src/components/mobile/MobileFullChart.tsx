"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AstrolabeResult } from "@/lib/astrolabe";
import { normalizePalaceName, PALACE_MEANING } from "@/lib/interpretation/palaceMeaning";
import type { TransitContext } from "@/types/interpretation";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import { PalaceZoomModal } from "./PalaceZoomModal";

type ChartDisplayMode = "simple" | "full" | "debug";
type Palace = AstrolabeResult["palaces"][number];
type PalaceStar =
  | Palace["majorStars"][number]
  | Palace["minorStars"][number]
  | Palace["adjectiveStars"][number];

type HoroscopeStar = {
  name?: string;
  brightness?: string;
  mutagen?: string;
};

type HoroscopeCycle = {
  index?: number;
  name?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  stars?: HoroscopeStar[][];
};

type HoroscopeData = {
  decadal?: HoroscopeCycle;
  yearly?: HoroscopeCycle;
  monthly?: HoroscopeCycle;
  daily?: HoroscopeCycle;
  hourly?: HoroscopeCycle;
};

export type PalaceViewModel = {
  index: number;
  palaceName: string;
  heavenlyStem: string;
  earthlyBranch: string;
  stemBranch: string;
  decadalAgeRange: string;
  yearlyAges: number[];
  majorStars: string[];
  minorStars: string[];
  miscStars: string[];
  flowStars: string[];
  mutagens: string[];
  gods: string[];
  keyword: string;
  triggerLabel: string;
  isLifePalace: boolean;
  isBodyPalace: boolean;
};

type MobileFullChartProps = {
  astrolabe: AstrolabeResult;
  chartMode: ChartDisplayMode;
  selectedPalaceIndex: number | null;
  transitContext: TransitContext;
  targetDate: Date;
  transitHour: number;
  onPalaceSelect: (index: number) => void;
};

const SCOPE_LABELS: Record<TransitContext["scope"], string> = {
  natal: "本命",
  decadal: "大限",
  yearly: "流年",
  monthly: "流月",
  daily: "流日",
  hourly: "流时",
};

function normalizeIndex(index: number): number {
  return ((index % 12) + 12) % 12;
}

function isRelatedPalace(index: number, selectedIndex: number | null): boolean {
  if (selectedIndex === null) {
    return false;
  }

  return [
    selectedIndex,
    normalizeIndex(selectedIndex + 6),
    normalizeIndex(selectedIndex + 4),
    normalizeIndex(selectedIndex - 4),
  ].includes(index);
}

function formatStar(star: PalaceStar | HoroscopeStar): string {
  const brightness = star.brightness ? `(${star.brightness})` : "";
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";

  return `${star.name ?? ""}${brightness}${mutagen}`;
}

function getKeyword(palace: Palace): string {
  const meaning = PALACE_MEANING[normalizePalaceName(palace.name)];
  return meaning?.keywords.slice(0, 3).join(" / ") || "点击查看宫位详情";
}

function getHoroscope(
  astrolabe: AstrolabeResult,
  targetDate: Date,
  transitHour: number,
): HoroscopeData | undefined {
  try {
    return astrolabe.horoscope(targetDate, transitHour) as unknown as HoroscopeData;
  } catch {
    return undefined;
  }
}

function getCycle(
  horoscope: HoroscopeData | undefined,
  scope: TransitContext["scope"],
): HoroscopeCycle | undefined {
  if (scope === "decadal") {
    return horoscope?.decadal;
  }

  if (scope === "yearly") {
    return horoscope?.yearly;
  }

  if (scope === "monthly") {
    return horoscope?.monthly;
  }

  if (scope === "daily") {
    return horoscope?.daily;
  }

  if (scope === "hourly") {
    return horoscope?.hourly;
  }

  return undefined;
}

function getTriggerLabel(
  palace: Palace,
  transitContext: TransitContext,
  horoscope: HoroscopeData | undefined,
): string {
  const cycle = getCycle(horoscope, transitContext.scope);

  if (cycle?.index !== palace.index) {
    return "";
  }

  const stem = cycle.heavenlyStem || cycle.earthlyBranch || cycle.name || transitContext.label;
  return `${SCOPE_LABELS[transitContext.scope]}·${stem}`;
}

function getFlowStars(
  horoscope: HoroscopeData | undefined,
  palaceIndex: number,
): string[] {
  const cycles: Array<{ label: string; cycle?: HoroscopeCycle }> = [
    { label: "大限", cycle: horoscope?.decadal },
    { label: "流年", cycle: horoscope?.yearly },
    { label: "流月", cycle: horoscope?.monthly },
    { label: "流日", cycle: horoscope?.daily },
    { label: "流时", cycle: horoscope?.hourly },
  ];

  return cycles.flatMap(({ label, cycle }) =>
    (cycle?.stars?.[palaceIndex] ?? [])
      .map(formatStar)
      .filter(Boolean)
      .map((star) => `${label}:${star}`),
  );
}

function getMutagens(palace: Palace): string[] {
  return [
    ...palace.majorStars,
    ...palace.minorStars,
    ...palace.adjectiveStars,
  ]
    .flatMap((star) => (star.mutagen ? [`${star.name}化${star.mutagen}`] : []))
    .filter((mutagen, index, list) => list.indexOf(mutagen) === index);
}

function getGods(palace: Palace): string[] {
  return [
    palace.changsheng12 ? `长生:${palace.changsheng12}` : "",
    palace.boshi12 ? `博士:${palace.boshi12}` : "",
    palace.jiangqian12 ? `将前:${palace.jiangqian12}` : "",
    palace.suiqian12 ? `岁前:${palace.suiqian12}` : "",
  ].filter(Boolean);
}

function buildPalaceViewModel(
  palace: Palace,
  horoscope: HoroscopeData | undefined,
  transitContext: TransitContext,
): PalaceViewModel {
  return {
    index: palace.index,
    palaceName: palace.name,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    stemBranch: `${palace.heavenlyStem}${palace.earthlyBranch}`,
    decadalAgeRange: palace.decadal.range.join("~"),
    yearlyAges: palace.ages,
    majorStars: palace.majorStars.map(formatStar).filter(Boolean),
    minorStars: palace.minorStars.map(formatStar).filter(Boolean),
    miscStars: palace.adjectiveStars.map(formatStar).filter(Boolean),
    flowStars: getFlowStars(horoscope, palace.index),
    mutagens: getMutagens(palace),
    gods: getGods(palace),
    keyword: getKeyword(palace),
    triggerLabel: getTriggerLabel(palace, transitContext, horoscope),
    isLifePalace: palace.isOriginalPalace,
    isBodyPalace: palace.isBodyPalace,
  };
}

function CompactLine({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="mobile-palace-line">
      <span>{label}</span>
      <p>{items.length > 0 ? items.join(" ") : "无"}</p>
    </div>
  );
}

function PalaceCell({
  palace,
  chartMode,
  selectedPalaceIndex,
  onSelect,
  onZoom,
}: {
  palace: PalaceViewModel;
  chartMode: ChartDisplayMode;
  selectedPalaceIndex: number | null;
  onSelect: (index: number) => void;
  onZoom: (index: number) => void;
}) {
  const doubleTapHandlers = useDoubleTap(() => onZoom(palace.index));
  const isSelected = palace.index === selectedPalaceIndex;
  const isRelated = isRelatedPalace(palace.index, selectedPalaceIndex);

  return (
    <button
      className={[
        "mobile-palace-cell",
        isSelected ? "is-selected" : "",
        !isSelected && isRelated ? "is-related" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ gridArea: `g${palace.index}` }}
      type="button"
      onClick={() => onSelect(palace.index)}
      onDoubleClick={(event) => {
        event.preventDefault();
        onZoom(palace.index);
      }}
      {...doubleTapHandlers}
    >
      <div className="mobile-palace-title">
        <b>{palace.palaceName}</b>
        <span>
          {palace.earthlyBranch}/{palace.stemBranch}
        </span>
      </div>

      <div className="mobile-palace-flags">
        {chartMode === "debug" ? <i>#{palace.index}</i> : null}
        {palace.isLifePalace ? <i>命</i> : null}
        {palace.isBodyPalace ? <i>身</i> : null}
        {palace.triggerLabel ? <i>{palace.triggerLabel}</i> : null}
      </div>

      <CompactLine label="主" items={palace.majorStars} />
      <CompactLine label="辅" items={palace.minorStars} />
      <CompactLine label="杂" items={palace.miscStars} />
      <CompactLine label="流" items={palace.flowStars} />
      <CompactLine label="化" items={palace.mutagens} />
      <CompactLine label="神" items={palace.gods} />

      <div className="mobile-palace-foot">
        <span>限 {palace.decadalAgeRange}</span>
        <span>年 {palace.yearlyAges.join(" ")}</span>
      </div>
    </button>
  );
}

export function MobileFullChart({
  astrolabe,
  chartMode,
  selectedPalaceIndex,
  transitContext,
  targetDate,
  transitHour,
  onPalaceSelect,
}: MobileFullChartProps) {
  const [zoomPalaceIndex, setZoomPalaceIndex] = useState<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const suppressClickUntilRef = useRef(0);
  const horoscope = useMemo(
    () => getHoroscope(astrolabe, targetDate, transitHour),
    [astrolabe, targetDate, transitHour],
  );
  const palaces = useMemo(
    () =>
      [...astrolabe.palaces]
        .sort((a, b) => a.index - b.index)
        .map((palace) => buildPalaceViewModel(palace, horoscope, transitContext)),
    [astrolabe.palaces, horoscope, transitContext],
  );
  const zoomPalace =
    zoomPalaceIndex === null
      ? null
      : palaces.find((palace) => palace.index === zoomPalaceIndex) ?? null;

  useEffect(
    () => () => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
      }
    },
    [],
  );

  const clearClickTimer = useCallback(() => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }, []);

  const queuePalaceSelect = useCallback(
    (index: number) => {
      if (Date.now() < suppressClickUntilRef.current) {
        return;
      }

      clearClickTimer();
      clickTimerRef.current = window.setTimeout(() => {
        onPalaceSelect(index);
        clickTimerRef.current = null;
      }, 320);
    },
    [clearClickTimer, onPalaceSelect],
  );

  const openPalaceZoom = useCallback(
    (index: number) => {
      suppressClickUntilRef.current = Date.now() + 380;
      clearClickTimer();
      setZoomPalaceIndex(index);
    },
    [clearClickTimer],
  );

  return (
    <section className={`mobile-chart-view mobile-chart-mode-${chartMode}`}>
      <div className="mobile-chart-view-head">
        <div>
          <p className="section-kicker">Chart</p>
          <h2>命盘</h2>
          <p className="mobile-chart-hint">双击任意宫位可放大查看</p>
        </div>
      </div>

      <div className="mobile-chart-wrap">
        <div className="mobile-chart-grid" aria-label="移动端完整命盘">
          {palaces.map((palace) => (
            <PalaceCell
              chartMode={chartMode}
              key={palace.index}
              palace={palace}
              selectedPalaceIndex={selectedPalaceIndex}
              onSelect={queuePalaceSelect}
              onZoom={openPalaceZoom}
            />
          ))}

          <div className="mobile-center-cell">
            <strong>基本信息</strong>
            <span>阳历：{astrolabe.solarDate}</span>
            <span>农历：{astrolabe.lunarDate}</span>
            <span>命宫：{astrolabe.earthlyBranchOfSoulPalace}</span>
            <span>身宫：{astrolabe.earthlyBranchOfBodyPalace}</span>
            <span>命主 / 身主：{astrolabe.soul} / {astrolabe.body}</span>
            <b>{transitContext.scope === "natal" ? "综合命盘" : transitContext.label}</b>
          </div>
        </div>
      </div>

      <PalaceZoomModal
        open={zoomPalace !== null}
        palace={zoomPalace}
        onClose={() => setZoomPalaceIndex(null)}
      />
    </section>
  );
}
