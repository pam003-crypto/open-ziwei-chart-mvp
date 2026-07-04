"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import type { AstrolabeResult } from "@/lib/astrolabe";
import type { CalendarSummary } from "@/lib/calendar";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import type { BirthInfo } from "@/types/birth";
import type { TransitContext } from "@/types/interpretation";
import type { TimeSelection, TimeSelectionItem } from "@/components/TransitControls";
import {
  buildPalaceViewModel,
  getCycle,
  getHoroscope,
  type HoroscopeData,
  type PalaceViewModel,
} from "./palaceViewModel";
import { PalaceZoomModal } from "./PalaceZoomModal";
import { hapticLight } from "@/lib/haptics";

type RawPalace = AstrolabeResult["palaces"][number];
type RawStar =
  | RawPalace["majorStars"][number]
  | RawPalace["minorStars"][number]
  | RawPalace["adjectiveStars"][number];

type MobileChartLayoutProps = {
  astrolabe: AstrolabeResult;
  birthInfo: BirthInfo;
  calendar: CalendarSummary;
  selectedPalaceIndex: number | null;
  timeSelection?: TimeSelection;
  transitContext: TransitContext;
  targetDate: Date;
  transitHour: number;
  onPalaceSelect: (index: number) => void;
};

type PalaceRelation = "selected" | "opposite" | "surrounded" | null;

const PALACE_POSITIONS: Record<number, CSSProperties> = {
  3: { top: "0%", left: "0%", width: "25%", height: "22%" },
  4: { top: "0%", left: "25%", width: "25%", height: "22%" },
  5: { top: "0%", left: "50%", width: "25%", height: "22%" },
  6: { top: "0%", left: "75%", width: "25%", height: "22%" },
  2: { top: "22%", left: "0%", width: "27%", height: "28%" },
  1: { top: "50%", left: "0%", width: "27%", height: "28%" },
  0: { bottom: "0%", left: "0%", width: "25%", height: "22%" },
  11: { bottom: "0%", left: "25%", width: "25%", height: "22%" },
  10: { bottom: "0%", left: "50%", width: "25%", height: "22%" },
  9: { bottom: "0%", left: "75%", width: "25%", height: "22%" },
  7: { top: "22%", right: "0%", width: "27%", height: "28%" },
  8: { top: "50%", right: "0%", width: "27%", height: "28%" },
};

function normalizeIndex(index: number): number {
  return ((index % 12) + 12) % 12;
}

function getRelation(index: number, selectedPalaceIndex: number | null): PalaceRelation {
  if (selectedPalaceIndex === null) {
    return null;
  }

  if (index === selectedPalaceIndex) {
    return "selected";
  }

  if (index === normalizeIndex(selectedPalaceIndex + 6)) {
    return "opposite";
  }

  if (
    index === normalizeIndex(selectedPalaceIndex + 4) ||
    index === normalizeIndex(selectedPalaceIndex - 4)
  ) {
    return "surrounded";
  }

  return null;
}

const MUTAGEN_CLASS: Record<string, string> = {
  禄: "lu",
  权: "quan",
  科: "ke",
  忌: "ji",
};

const POSITIVE_MINOR_STARS = new Set([
  "左辅",
  "右弼",
  "文昌",
  "文曲",
  "天魁",
  "天钺",
  "禄存",
  "天马",
]);

const NEGATIVE_MINOR_STARS = new Set([
  "擎羊",
  "陀罗",
  "火星",
  "铃星",
  "地空",
  "地劫",
]);

const FLOW_SCOPE_META: Array<{
  key: keyof TimeSelection;
  label: string;
  className: string;
}> = [
  { key: "decadal", label: "大限", className: "decade" },
  { key: "yearly", label: "流年", className: "year" },
  { key: "monthly", label: "流月", className: "month" },
  { key: "daily", label: "流日", className: "day" },
  { key: "hourly", label: "流时", className: "hour" },
];

const MOBILE_MISC_STAR_LIMIT = 5;

function getMinorStarTone(starName: string): string {
  if (POSITIVE_MINOR_STARS.has(starName)) {
    return "positive";
  }

  if (NEGATIVE_MINOR_STARS.has(starName)) {
    return "negative";
  }

  return "";
}

function StarToken({
  className,
  star,
}: {
  className: string;
  star: RawStar;
}) {
  return (
    <span className={className}>
      {star.name}
      {star.brightness ? <em className="palace-brightness">{star.brightness}</em> : null}
      {star.mutagen ? (
        <b className={`palace-mutagen ${MUTAGEN_CLASS[star.mutagen] || ""}`}>
          {star.mutagen}
        </b>
      ) : null}
    </span>
  );
}

function getFlowLabel(
  item: TimeSelectionItem,
  scope: keyof TimeSelection,
  horoscope: HoroscopeData | undefined,
): string {
  const cycle = getCycle(horoscope, item.context.scope);
  const cycleStem = [cycle?.heavenlyStem, cycle?.earthlyBranch].filter(Boolean).join("");

  if (cycleStem) {
    return cycleStem;
  }

  if (scope === "hourly") {
    return item.label.replace("时", "");
  }

  return item.label.split(" ")[0] || item.context.label;
}

function getFlowTags({
  horoscope,
  palaceIndex,
  timeSelection,
}: {
  horoscope: HoroscopeData | undefined;
  palaceIndex: number;
  timeSelection?: TimeSelection;
}) {
  return FLOW_SCOPE_META.flatMap(({ className, key, label }) => {
    const item = timeSelection?.[key];
    const cycle = item ? getCycle(horoscope, item.context.scope) : undefined;

    if (!item || cycle?.index !== palaceIndex) {
      return [];
    }

    return [
      {
        className,
        key,
        label: `${label}·${getFlowLabel(item, key, horoscope)}`,
      },
    ];
  });
}

function MobilePalaceCell({
  horoscope,
  onOpen,
  onSelect,
  rawPalace,
  palace,
  relation,
  timeSelection,
}: {
  rawPalace: RawPalace;
  palace: PalaceViewModel;
  relation: PalaceRelation;
  horoscope: HoroscopeData | undefined;
  timeSelection?: TimeSelection;
  onOpen: (palace: PalaceViewModel) => void;
  onSelect: (index: number) => void;
}) {
  const longPressTimerRef = useRef<number | null>(null);
  const flowTags = getFlowTags({
    horoscope,
    palaceIndex: palace.index,
    timeSelection,
  });
  const className = [
    "palace-cell",
    "mobile-palace-cell",
    relation === "selected" ? "is-selected" : "",
    relation === "opposite" ? "is-opposite" : "",
    relation === "surrounded" ? "is-surrounded" : "",
    palace.isLifePalace ? "is-life-palace" : "",
    palace.isBodyPalace ? "is-body-palace" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  const openZoom = () => {
    hapticLight();
    onOpen(palace);
  };
  const doubleTapHandlers = useDoubleTap(openZoom);

  return (
    <button
      aria-label={`${palace.palaceName}宫，双击放大查看`}
      className={className}
      onClick={() => onSelect(palace.index)}
      onContextMenu={(event) => event.preventDefault()}
      onDoubleClick={(event) => {
        event.preventDefault();
        openZoom();
      }}
      onPointerCancel={clearLongPress}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") {
          return;
        }

        clearLongPress();
        longPressTimerRef.current = window.setTimeout(openZoom, 520);
      }}
      onPointerLeave={clearLongPress}
      onPointerUp={() => {
        clearLongPress();
      }}
      style={PALACE_POSITIONS[palace.index]}
      type="button"
      {...doubleTapHandlers}
    >
      <span className="palace-main-stars">
        {rawPalace.majorStars.map((star) => (
          <StarToken className="palace-main-star" key={`${star.name}-${star.mutagen || ""}`} star={star} />
        ))}
      </span>

      <span className="palace-branch">{palace.stemBranch}</span>

      <span className="palace-minor-stars">
        {rawPalace.minorStars.slice(0, 8).map((star) => (
          <StarToken
            className={`palace-minor-star ${getMinorStarTone(star.name)}`}
            key={`${star.name}-${star.mutagen || ""}`}
            star={star}
          />
        ))}
      </span>

      <span className="palace-misc-stars">
        {rawPalace.adjectiveStars.slice(0, MOBILE_MISC_STAR_LIMIT).map((star) => (
          <StarToken className="palace-misc-star" key={`${star.name}-${star.mutagen || ""}`} star={star} />
        ))}
      </span>

      <span className="palace-flow-tags">
        {flowTags.map((tag) => (
          <b className={`palace-flow-tag ${tag.className}`} key={tag.key}>
            {tag.label}
          </b>
        ))}
        {flowTags.length === 0 && palace.triggerLabel ? (
          <b className="palace-flow-tag">{palace.triggerLabel}</b>
        ) : null}
      </span>

      <span className="palace-age-sequence">
        {palace.yearlyAges.slice(0, 8).map((age) => (
          <span className="palace-age-num" key={age}>
            {age}
          </span>
        ))}
      </span>

      <span className="palace-age-range">{palace.decadalAgeRange}</span>
      <span className="palace-name">{palace.palaceName}</span>

      <span className="palace-side-meta">
        {palace.gods.slice(0, 4).map((god) => (
          <span className="palace-side-meta-line" key={god}>
            {god.replace("长生:", "").replace("博士:", "").replace("将前:", "").replace("岁前:", "")}
          </span>
        ))}
      </span>
    </button>
  );
}

function CenterPanel({
  astrolabe,
  birthInfo,
  calendar,
  transitContext,
}: {
  astrolabe: AstrolabeResult;
  birthInfo: BirthInfo;
  calendar: CalendarSummary;
  transitContext: TransitContext;
}) {
  const statusLabel = transitContext.label || "综合命盘";

  return (
    <div className="mobile-center-panel">
      <div className="center-info-card">
        <div className="center-info-title">基本信息</div>
        <div className="center-info-grid">
          <div className="center-info-item">
            <span className="label">姓名</span>
            <span className="value">{birthInfo.name || "未命名"} / {birthInfo.gender}</span>
          </div>
          <div className="center-info-item">
            <span className="label">公历</span>
            <span className="value">{calendar.solarDate || astrolabe.solarDate}</span>
          </div>
          <div className="center-info-item">
            <span className="label">农历</span>
            <span className="value">{calendar.lunarDate || astrolabe.lunarDate}</span>
          </div>
          <div className="center-info-item">
            <span className="label">命身</span>
            <span className="value">
              {astrolabe.earthlyBranchOfSoulPalace} / {astrolabe.earthlyBranchOfBodyPalace}
            </span>
          </div>
          <div className="center-info-item">
            <span className="label">命主</span>
            <span className="value">{astrolabe.soul} / {astrolabe.body}</span>
          </div>
        </div>
        <div className="center-info-footer">{statusLabel}</div>
      </div>
    </div>
  );
}

export function MobileChartLayout({
  astrolabe,
  birthInfo,
  calendar,
  onPalaceSelect,
  selectedPalaceIndex,
  timeSelection,
  targetDate,
  transitContext,
  transitHour,
}: MobileChartLayoutProps) {
  const [zoomPalace, setZoomPalace] = useState<PalaceViewModel | null>(null);
  const horoscope = useMemo(
    () => getHoroscope(astrolabe, targetDate, transitHour),
    [astrolabe, targetDate, transitHour],
  );
  const palaces = useMemo(
    () =>
      astrolabe.palaces.map((palace) => ({
        rawPalace: palace,
        viewModel: buildPalaceViewModel(palace, horoscope, transitContext),
      })),
    [astrolabe.palaces, horoscope, transitContext],
  );
  const handleOpen = useCallback((palace: PalaceViewModel) => {
    setZoomPalace(palace);
  }, []);

  return (
    <section className="mobile-chart-view">
      <div className="mobile-chart-view-head">
        <div>
          <p className="section-kicker">Chart</p>
          <h2>命盘</h2>
          <p className="mobile-chart-hint">点击宫位显示三方四正，双击任意宫位可放大查看</p>
        </div>
      </div>

      <div className="mobile-chart-board" aria-label="移动端紫微斗数命盘">
        {palaces.map(({ rawPalace, viewModel }) => (
          <MobilePalaceCell
            horoscope={horoscope}
            key={viewModel.index}
            onOpen={handleOpen}
            onSelect={onPalaceSelect}
            palace={viewModel}
            rawPalace={rawPalace}
            relation={getRelation(viewModel.index, selectedPalaceIndex)}
            timeSelection={timeSelection}
          />
        ))}

        <CenterPanel
          astrolabe={astrolabe}
          birthInfo={birthInfo}
          calendar={calendar}
          transitContext={transitContext}
        />
      </div>

      <PalaceZoomModal
        open={zoomPalace !== null}
        palace={zoomPalace}
        onClose={() => setZoomPalace(null)}
      />
    </section>
  );
}
