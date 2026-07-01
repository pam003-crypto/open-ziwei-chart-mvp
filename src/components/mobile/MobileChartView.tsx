"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { AstrolabeResult } from "@/lib/astrolabe";
import { normalizePalaceName, PALACE_MEANING } from "@/lib/interpretation/palaceMeaning";
import type { TransitContext } from "@/types/interpretation";

type MobileChartMode = "cards" | "full";
type ChartDisplayMode = "simple" | "full" | "debug";
type Palace = AstrolabeResult["palaces"][number];
type PalaceStar =
  | Palace["majorStars"][number]
  | Palace["minorStars"][number]
  | Palace["adjectiveStars"][number];

type MobileChartViewProps = {
  astrolabe: AstrolabeResult;
  chartMode: ChartDisplayMode;
  mobileChartMode: MobileChartMode;
  selectedPalaceIndex: number | null;
  transitContext: TransitContext;
  fullChart: ReactNode;
  onMobileChartModeChange: (mode: MobileChartMode) => void;
  onPalaceSelect: (index: number) => void;
};

const MUTAGEN_LABELS: Record<string, string> = {
  禄: "禄",
  权: "权",
  科: "科",
  忌: "忌",
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

function formatStar(star: PalaceStar): string {
  return star.brightness ? `${star.name}${star.brightness}` : star.name;
}

function getMutagens(palace: Palace): string[] {
  return [
    ...palace.majorStars,
    ...palace.minorStars,
    ...palace.adjectiveStars,
  ]
    .flatMap((star) => (star.mutagen ? [String(star.mutagen)] : []))
    .map((mutagen) => MUTAGEN_LABELS[mutagen] ?? mutagen);
}

function getKeyword(palace: Palace): string {
  const meaning = PALACE_MEANING[normalizePalaceName(palace.name)];
  return meaning?.keywords.slice(0, 3).join(" / ") || "点击查看宫位详情";
}

function getTriggerLabel(
  palace: Palace,
  selectedPalaceIndex: number | null,
  transitContext: TransitContext,
): string {
  if (palace.index === selectedPalaceIndex) {
    return transitContext.scope === "natal"
      ? "三方四正选中"
      : `${transitContext.label}触发`;
  }

  if (isRelatedPalace(palace.index, selectedPalaceIndex)) {
    return "三方四正关联";
  }

  return "点击查看";
}

function PalaceCard({
  palace,
  selectedPalaceIndex,
  transitContext,
  onClick,
}: {
  palace: Palace;
  selectedPalaceIndex: number | null;
  transitContext: TransitContext;
  onClick: () => void;
}) {
  const mutagens = getMutagens(palace);
  const isSelected = palace.index === selectedPalaceIndex;
  const isRelated = isRelatedPalace(palace.index, selectedPalaceIndex);

  return (
    <button
      className={[
        "mobile-palace-card",
        isSelected ? "is-selected" : "",
        !isSelected && isRelated ? "is-related" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      type="button"
    >
      <div className="mobile-palace-card-head">
        <strong>
          {palace.name}
          <span>｜{palace.earthlyBranch}</span>
        </strong>
        <small>
          {palace.heavenlyStem}
          {palace.earthlyBranch}
        </small>
      </div>
      <div className="mobile-palace-card-line">
        <span>大限</span>
        <b>{palace.decadal.range.join("~")}</b>
      </div>
      <div className="mobile-palace-card-line">
        <span>主星</span>
        <b>
          {palace.majorStars.length > 0
            ? palace.majorStars.map(formatStar).join("、")
            : "无主星"}
        </b>
      </div>
      <div className="mobile-palace-card-tags">
        {mutagens.length > 0 ? (
          mutagens.map((mutagen) => (
            <i className={`mutagen-tag mutagen-${mutagen}`} key={mutagen}>
              {mutagen}
            </i>
          ))
        ) : (
          <span>无四化</span>
        )}
      </div>
      <div className="mobile-palace-card-foot">
        <em>{getTriggerLabel(palace, selectedPalaceIndex, transitContext)}</em>
        <span>{getKeyword(palace)}</span>
      </div>
    </button>
  );
}

function StarBlock({ label, stars }: { label: string; stars: PalaceStar[] }) {
  return (
    <div className="mobile-palace-detail-block">
      <span>{label}</span>
      <p>{stars.length > 0 ? stars.map(formatStar).join("、") : "暂无"}</p>
    </div>
  );
}

function PalaceDetailSheet({
  palace,
  onClose,
}: {
  palace: Palace | null;
  onClose: () => void;
}) {
  if (!palace) {
    return null;
  }

  const mutagens = getMutagens(palace);

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
            <span>大限</span>
            <p>{palace.decadal.range.join("~")}</p>
          </div>
          <div className="mobile-palace-detail-block">
            <span>四化</span>
            <p>{mutagens.length > 0 ? mutagens.join("、") : "暂无"}</p>
          </div>
          <StarBlock label="主星" stars={palace.majorStars} />
          <StarBlock label="辅星" stars={palace.minorStars} />
          <StarBlock label="杂曜" stars={palace.adjectiveStars} />
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
            <span>解读依据</span>
            <p>{getKeyword(palace)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function MobileChartView({
  astrolabe,
  chartMode,
  mobileChartMode,
  selectedPalaceIndex,
  transitContext,
  fullChart,
  onMobileChartModeChange,
  onPalaceSelect,
}: MobileChartViewProps) {
  const [detailPalaceIndex, setDetailPalaceIndex] = useState<number | null>(null);
  const palaces = useMemo(
    () => [...astrolabe.palaces].sort((a, b) => a.index - b.index),
    [astrolabe.palaces],
  );
  const detailPalace =
    detailPalaceIndex === null
      ? null
      : palaces.find((palace) => palace.index === detailPalaceIndex) ?? null;

  return (
    <section className="mobile-chart-view">
      <div className="mobile-chart-view-head">
        <div>
          <p className="section-kicker">Chart</p>
          <h2>命盘</h2>
        </div>
        <div className="mobile-chart-mode-switch" aria-label="移动端命盘模式">
          <button
            className={mobileChartMode === "cards" ? "is-active" : ""}
            onClick={() => onMobileChartModeChange("cards")}
            type="button"
          >
            宫位卡片
          </button>
          <button
            className={mobileChartMode === "full" ? "is-active" : ""}
            onClick={() => onMobileChartModeChange("full")}
            type="button"
          >
            完整盘
          </button>
        </div>
      </div>

      {mobileChartMode === "full" ? (
        <div className="mobile-full-chart">
          <p>完整盘可左右滑动查看</p>
          <div className="mobile-chart-scroll">
            <div className={`mobile-chart-inner chart-mode-${chartMode}`}>{fullChart}</div>
          </div>
        </div>
      ) : (
        <div className="mobile-palace-card-list">
          {palaces.map((palace) => (
            <PalaceCard
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
        </div>
      )}

      <PalaceDetailSheet palace={detailPalace} onClose={() => setDetailPalaceIndex(null)} />
    </section>
  );
}
