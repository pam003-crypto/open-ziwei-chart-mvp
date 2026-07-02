"use client";

import { useMemo, useState } from "react";
import type { AstrolabeResult } from "@/lib/astrolabe";
import { normalizePalaceName, PALACE_MEANING } from "@/lib/interpretation/palaceMeaning";
import type { TransitContext } from "@/types/interpretation";

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

type MobileFullChartProps = {
  astrolabe: AstrolabeResult;
  chartMode: ChartDisplayMode;
  selectedPalaceIndex: number | null;
  transitContext: TransitContext;
  targetDate: Date;
  transitHour: number;
  onPalaceSelect: (index: number) => void;
};

const MUTAGEN_LABELS: Record<string, string> = {
  禄: "禄",
  权: "权",
  科: "科",
  忌: "忌",
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
  const brightness = star.brightness ? star.brightness : "";
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";

  return `${star.name ?? ""}${brightness}${mutagen}`;
}

function getMutagens(palace: Palace): string[] {
  const mutagens = [
    ...palace.majorStars,
    ...palace.minorStars,
    ...palace.adjectiveStars,
  ].flatMap((star) => (star.mutagen ? [String(star.mutagen)] : []));

  return Array.from(new Set(mutagens)).map((mutagen) => MUTAGEN_LABELS[mutagen] ?? mutagen);
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
  selectedPalaceIndex: number | null,
  transitContext: TransitContext,
  horoscope: HoroscopeData | undefined,
): string {
  const cycle = getCycle(horoscope, transitContext.scope);

  if (cycle?.index === palace.index) {
    const stem = cycle.heavenlyStem || cycle.name || transitContext.label;
    return `${SCOPE_LABELS[transitContext.scope]}·${stem}`;
  }

  if (palace.index === selectedPalaceIndex) {
    return "已选中";
  }

  if (isRelatedPalace(palace.index, selectedPalaceIndex)) {
    return "三方四正";
  }

  return "";
}

function getFlowStars(
  horoscope: HoroscopeData | undefined,
  palaceIndex: number,
): HoroscopeStar[] {
  return [
    ...(horoscope?.decadal?.stars?.[palaceIndex] ?? []),
    ...(horoscope?.yearly?.stars?.[palaceIndex] ?? []),
    ...(horoscope?.monthly?.stars?.[palaceIndex] ?? []),
    ...(horoscope?.daily?.stars?.[palaceIndex] ?? []),
    ...(horoscope?.hourly?.stars?.[palaceIndex] ?? []),
  ];
}

function StarBlock({ label, stars }: { label: string; stars: Array<PalaceStar | HoroscopeStar> }) {
  return (
    <div className="mobile-palace-detail-block">
      <span>{label}</span>
      <p>{stars.length > 0 ? stars.map(formatStar).filter(Boolean).join("、") : "暂无"}</p>
    </div>
  );
}

function PalaceCell({
  palace,
  chartMode,
  selectedPalaceIndex,
  transitContext,
  horoscope,
  onClick,
}: {
  palace: Palace;
  chartMode: ChartDisplayMode;
  selectedPalaceIndex: number | null;
  transitContext: TransitContext;
  horoscope: HoroscopeData | undefined;
  onClick: () => void;
}) {
  const mutagens = getMutagens(palace);
  const triggerLabel = getTriggerLabel(
    palace,
    selectedPalaceIndex,
    transitContext,
    horoscope,
  );
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
      onClick={onClick}
      type="button"
    >
      {chartMode === "debug" ? <span className="mobile-palace-debug">#{palace.index}</span> : null}
      <div className="mobile-palace-stars">
        {palace.majorStars.slice(0, 2).map((star) => (
          <b key={star.name}>{formatStar(star)}</b>
        ))}
        {palace.majorStars.length === 0 ? <b>无主星</b> : null}
      </div>
      <div className="mobile-palace-mutagens">
        {mutagens.slice(0, 4).map((mutagen) => (
          <i className={`mutagen-tag mutagen-${mutagen}`} key={mutagen}>
            {mutagen}
          </i>
        ))}
      </div>
      <div className="mobile-palace-branch">
        <span>{palace.earthlyBranch}</span>
        <small>
          {palace.heavenlyStem}
          {palace.earthlyBranch}
        </small>
      </div>
      {triggerLabel ? <em className="mobile-palace-trigger">{triggerLabel}</em> : null}
      <div className="mobile-palace-decade">{palace.decadal.range.join("~")}</div>
      <div className="mobile-palace-name">{palace.name}</div>
    </button>
  );
}

function PalaceDetailSheet({
  palace,
  horoscope,
  onClose,
}: {
  palace: Palace | null;
  horoscope: HoroscopeData | undefined;
  onClose: () => void;
}) {
  if (!palace) {
    return null;
  }

  const mutagens = getMutagens(palace);
  const flowStars = getFlowStars(horoscope, palace.index);

  return (
    <div className="mobile-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-label={`${palace.name}详情`}
        className="mobile-palace-sheet mobile-safe-bottom"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mobile-sheet-handle" />
        <div className="mobile-palace-sheet-head">
          <div>
            <p className="section-kicker">Palace Detail</p>
            <h3>
              {palace.name}｜{palace.heavenlyStem}
              {palace.earthlyBranch}
            </h3>
          </div>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="mobile-palace-detail-grid">
          <div className="mobile-palace-detail-block">
            <span>地支 / 干支</span>
            <p>
              {palace.earthlyBranch} / {palace.heavenlyStem}
              {palace.earthlyBranch}
            </p>
          </div>
          <div className="mobile-palace-detail-block">
            <span>大限</span>
            <p>{palace.decadal.range.join("~")}</p>
          </div>
          <div className="mobile-palace-detail-block">
            <span>四化</span>
            <p>{mutagens.length > 0 ? mutagens.join("、") : "暂无"}</p>
          </div>
          <div className="mobile-palace-detail-block">
            <span>小限 / 流年数字</span>
            <p>{palace.ages.length > 0 ? palace.ages.join("、") : "暂无"}</p>
          </div>
          <StarBlock label="主星" stars={palace.majorStars} />
          <StarBlock label="辅星" stars={palace.minorStars} />
          <StarBlock label="杂曜" stars={palace.adjectiveStars} />
          <StarBlock label="流曜" stars={flowStars} />
          <div className="mobile-palace-detail-block is-wide">
            <span>神煞 / 十二神</span>
            <p>
              {[
                palace.changsheng12 ? `长生：${palace.changsheng12}` : "",
                palace.boshi12 ? `博士：${palace.boshi12}` : "",
                palace.jiangqian12 ? `将前：${palace.jiangqian12}` : "",
                palace.suiqian12 ? `岁前：${palace.suiqian12}` : "",
              ]
                .filter(Boolean)
                .join(" / ") || "暂无"}
            </p>
          </div>
          <div className="mobile-palace-detail-block is-wide">
            <span>该宫解读依据</span>
            <p>{getKeyword(palace)}</p>
          </div>
        </div>
      </section>
    </div>
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
  const [detailPalaceIndex, setDetailPalaceIndex] = useState<number | null>(null);
  const horoscope = useMemo(
    () => getHoroscope(astrolabe, targetDate, transitHour),
    [astrolabe, targetDate, transitHour],
  );
  const palaces = useMemo(
    () => [...astrolabe.palaces].sort((a, b) => a.index - b.index),
    [astrolabe.palaces],
  );
  const detailPalace =
    detailPalaceIndex === null
      ? null
      : palaces.find((palace) => palace.index === detailPalaceIndex) ?? null;

  return (
    <section className={`mobile-chart-view mobile-chart-mode-${chartMode}`}>
      <div className="mobile-chart-view-head">
        <div>
          <p className="section-kicker">Chart</p>
          <h2>命盘</h2>
        </div>
      </div>

      <div className="mobile-chart-wrap">
        <div className="mobile-chart-grid" aria-label="移动端完整命盘">
          {palaces.map((palace) => (
            <PalaceCell
              chartMode={chartMode}
              horoscope={horoscope}
              key={palace.index}
              palace={palace}
              selectedPalaceIndex={selectedPalaceIndex}
              transitContext={transitContext}
              onClick={() => {
                onPalaceSelect(palace.index);
                setDetailPalaceIndex(palace.index);
              }}
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

      <PalaceDetailSheet
        horoscope={horoscope}
        palace={detailPalace}
        onClose={() => setDetailPalaceIndex(null)}
      />
    </section>
  );
}
