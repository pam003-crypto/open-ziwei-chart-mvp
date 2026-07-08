"use client";

import {
  buildTransitRows,
  type TimeSelection,
  type TransitCell,
  type TransitControlsProps,
} from "./TransitControls";
import { hapticLight } from "@/lib/haptics";

function getSelectionTitle(timeSelection?: TimeSelection): string {
  const selectionLabels = [
    timeSelection?.decadal?.label,
    timeSelection?.yearly?.label,
    timeSelection?.monthly?.label,
    timeSelection?.daily?.label,
    timeSelection?.hourly?.label,
  ].filter(Boolean);

  return selectionLabels.length > 0 ? selectionLabels.join(" ｜ ") : "综合命盘";
}

function DesktopTimeOption({ cell }: { cell: TransitCell }) {
  return (
    <button
      className={cell.active ? "desktop-time-option is-active" : "desktop-time-option"}
      type="button"
      onClick={() => {
        hapticLight();
        cell.onClick?.();
      }}
    >
      <span className="primary">{cell.title}</span>
      {cell.subtitle ? <span className="secondary">{cell.subtitle}</span> : null}
    </button>
  );
}

export function DesktopHorizontalTimeNavigator(props: TransitControlsProps) {
  const rows = buildTransitRows(props);

  return (
    <section className="desktop-time-panel" aria-label="流年流月流日流时横向选择">
      <div className="current-time-bar">
        <span>当前查看</span>
        <strong>{getSelectionTitle(props.timeSelection)}</strong>
      </div>

      <div className="desktop-time-block">
        {rows.map((row) => (
          <div className="desktop-time-row" key={row.key}>
            <div className="desktop-time-label">{row.label}</div>
            <div className="desktop-time-options">
              {row.cells.map((cell) => (
                <DesktopTimeOption cell={cell} key={cell.key} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
