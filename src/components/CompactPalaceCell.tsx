"use client";

import { useDoubleTap } from "@/hooks/useDoubleTap";
import {
  formatDisplayStar,
  type CompactPalaceViewModel,
  type DisplayStar,
} from "@/lib/palaceAdapter";

type CompactPalaceCellProps = {
  palace: CompactPalaceViewModel;
  isSelected?: boolean;
  isOpposite?: boolean;
  isSurrounded?: boolean;
  mode?: "simple" | "full" | "debug";
  onSelect?: (index: number) => void;
  onOpenDetail?: (index: number) => void;
};

const MUTAGEN_CLASS: Record<NonNullable<DisplayStar["mutagen"]>, string> = {
  禄: "is-lu",
  权: "is-quan",
  科: "is-ke",
  忌: "is-ji",
};

function StarItem({ star, emphasis = false }: { star: DisplayStar; emphasis?: boolean }) {
  return (
    <span className={`compact-star ${emphasis ? "is-emphasis" : ""}`}>
      <span className="compact-star-name">{star.name}</span>
      {star.brightness ? (
        <small className="compact-star-brightness">{star.brightness}</small>
      ) : null}
      {star.mutagen ? (
        <b className={`compact-mutagen ${MUTAGEN_CLASS[star.mutagen]}`}>
          {star.mutagen}
        </b>
      ) : null}
    </span>
  );
}

function StarList({
  stars,
  emptyText,
  emphasis = false,
}: {
  stars: DisplayStar[];
  emptyText?: string;
  emphasis?: boolean;
}) {
  if (stars.length === 0) {
    return emptyText ? <span className="compact-empty">{emptyText}</span> : null;
  }

  return (
    <>
      {stars.map((star, index) => (
        <StarItem
          emphasis={emphasis}
          key={`${star.type || "star"}-${star.name}-${star.mutagen || ""}-${index}`}
          star={star}
        />
      ))}
    </>
  );
}

function formatAges(ages: number[] | undefined): string {
  return ages && ages.length > 0 ? ages.join(",") : "";
}

function getAriaLabel(palace: CompactPalaceViewModel): string {
  const stars = [
    ...palace.mainStars,
    ...palace.minorStars,
    ...palace.miscStars,
    ...palace.flowStars,
  ]
    .map(formatDisplayStar)
    .join("、");

  return `${palace.palaceName} ${palace.stemBranch || ""} ${stars}`;
}

export function CompactPalaceCell({
  palace,
  isSelected = false,
  isOpposite = false,
  isSurrounded = false,
  mode = "full",
  onSelect,
  onOpenDetail,
}: CompactPalaceCellProps) {
  const doubleTapHandlers = useDoubleTap(() => {
    onOpenDetail?.(palace.index);
  });
  const sideStars =
    mode === "simple"
      ? palace.miscStars
      : [...palace.miscStars, ...palace.flowStars];
  const bottomLeftItems = [
    palace.boshi ? `博 ${palace.boshi}` : "",
    palace.jiangqian ? `将 ${palace.jiangqian}` : "",
    palace.suiqian ? `岁 ${palace.suiqian}` : "",
  ].filter(Boolean);
  const cellClassName = [
    "palace-cell",
    isSelected ? "is-selected" : "",
    isOpposite ? "is-opposite" : "",
    isSurrounded ? "is-surrounded" : "",
    palace.isLifePalace ? "is-life-palace" : "",
    palace.isBodyPalace ? "is-body-palace" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-label={getAriaLabel(palace)}
      aria-pressed={isSelected}
      className={cellClassName}
      onClick={() => onSelect?.(palace.index)}
      onDoubleClick={(event) => {
        event.preventDefault();
        onOpenDetail?.(palace.index);
      }}
      style={{ gridArea: `g${palace.index}` }}
      title={getAriaLabel(palace)}
      type="button"
      {...doubleTapHandlers}
    >
      <span className="palace-main-stars" aria-label="主星区">
        <StarList emphasis stars={palace.mainStars} emptyText="无主星" />
        {palace.minorStars.length > 0 ? (
          <span className="compact-minor-line">
            <StarList stars={palace.minorStars} />
          </span>
        ) : null}
      </span>

      <span className="palace-side-stars" aria-label="辅助星曜区">
        <StarList stars={sideStars} />
      </span>

      <span className="palace-flow-ages" aria-label="流年小限区">
        {palace.triggerLabel ? <b>{palace.triggerLabel}</b> : null}
        {formatAges(palace.yearlyAges) ? (
          <span>流年：{formatAges(palace.yearlyAges)}</span>
        ) : null}
        {formatAges(palace.minorAges) ? (
          <span>小限：{formatAges(palace.minorAges)}</span>
        ) : null}
      </span>

      <span className="palace-bottom-left" aria-label="神煞区">
        {bottomLeftItems.length > 0
          ? bottomLeftItems.map((item) => <span key={item}>{item}</span>)
          : null}
      </span>

      <span className="palace-age-range">{palace.ageRange || ""}</span>
      <span className="palace-name">
        {palace.palaceName}
        {palace.isBodyPalace ? <small>身</small> : null}
        {palace.isLifePalace ? <small>命</small> : null}
      </span>

      <span className="palace-branch">
        {palace.changsheng ? <span>{palace.changsheng}</span> : null}
        <b>{palace.stemBranch || palace.earthlyBranch || ""}</b>
      </span>
    </button>
  );
}
