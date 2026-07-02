"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { AstrolabeResult } from "@/lib/astrolabe";
import type { CalendarSummary } from "@/lib/calendar";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import type { BirthInfo } from "@/types/birth";
import type { TransitContext } from "@/types/interpretation";
import {
  buildPalaceViewModel,
  getHoroscope,
  type PalaceViewModel,
} from "./palaceViewModel";
import { PalaceZoomModal } from "./PalaceZoomModal";

type MobileChartLayoutProps = {
  astrolabe: AstrolabeResult;
  birthInfo: BirthInfo;
  calendar: CalendarSummary;
  selectedPalaceIndex: number | null;
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

function listText(items: string[]): string {
  return items.length > 0 ? items.join(" ") : "";
}

function MobilePalaceCell({
  onOpen,
  onSelect,
  palace,
  relation,
}: {
  palace: PalaceViewModel;
  relation: PalaceRelation;
  onOpen: (palace: PalaceViewModel) => void;
  onSelect: (index: number) => void;
}) {
  const doubleTapHandlers = useDoubleTap(() => onOpen(palace));
  const className = [
    "mobile-palace-cell",
    relation === "selected" ? "is-selected" : "",
    relation === "opposite" ? "is-opposite" : "",
    relation === "surrounded" ? "is-surrounded" : "",
    palace.isLifePalace ? "is-life-palace" : "",
    palace.isBodyPalace ? "is-body-palace" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-label={`${palace.palaceName}宫，双击放大查看`}
      className={className}
      onClick={() => onSelect(palace.index)}
      onDoubleClick={(event) => {
        event.preventDefault();
        onOpen(palace);
      }}
      style={PALACE_POSITIONS[palace.index]}
      type="button"
      {...doubleTapHandlers}
    >
      <span className="mobile-palace-head">
        <b>{palace.palaceName}</b>
        <em>{palace.stemBranch}</em>
      </span>
      <span className="mobile-palace-stars is-major">{listText(palace.majorStars)}</span>
      <span className="mobile-palace-stars">{listText(palace.minorStars)}</span>
      <span className="mobile-palace-stars is-muted">{listText(palace.miscStars)}</span>
      <span className="mobile-palace-stars is-flow">{listText(palace.flowStars)}</span>
      <span className="mobile-palace-footer">
        <b>{palace.decadalAgeRange}</b>
        <em>{palace.triggerLabel}</em>
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
  return (
    <div className="mobile-center-panel">
      <div className="mobile-center-panel-inner">
        <b>基本信息</b>
        <span>{birthInfo.name || "未命名"} / {birthInfo.gender}</span>
        <span>公历：{calendar.solarDate || astrolabe.solarDate}</span>
        <span>农历：{calendar.lunarDate || astrolabe.lunarDate}</span>
        <span>
          命宫：{astrolabe.earthlyBranchOfSoulPalace} / 身宫：
          {astrolabe.earthlyBranchOfBodyPalace}
        </span>
        <span>命主 / 身主：{astrolabe.soul} / {astrolabe.body}</span>
        <strong>{transitContext.label || "综合命盘"}</strong>
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
      astrolabe.palaces.map((palace) =>
        buildPalaceViewModel(palace, horoscope, transitContext),
      ),
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
        {palaces.map((palace) => (
          <MobilePalaceCell
            key={palace.index}
            onOpen={handleOpen}
            onSelect={onPalaceSelect}
            palace={palace}
            relation={getRelation(palace.index, selectedPalaceIndex)}
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
