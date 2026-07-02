"use client";

import {
  buildTransitRows,
  type TransitControlsProps,
  type TransitRowData,
} from "@/components/TransitControls";

function MobileTransitRow({ row }: { row: TransitRowData }) {
  return (
    <div className="mobile-time-row">
      <div className="mobile-time-row-label">{row.label}</div>
      <div className="mobile-time-chip-track">
        <div className="mobile-time-chip-list">
          {row.cells.map((cell) => (
            <button
              className={cell.active ? "mobile-time-chip is-active" : "mobile-time-chip"}
              key={cell.key}
              onClick={cell.onClick}
              type="button"
            >
              <span className="mobile-time-chip-primary">{cell.title}</span>
              {cell.subtitle ? (
                <span className="mobile-time-chip-secondary">{cell.subtitle}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MobileTimeNavigator(props: TransitControlsProps) {
  const rows = buildTransitRows(props);

  return (
    <section className="mobile-time-navigator" aria-label="移动端运限选择">
      {rows.map((row) => (
        <MobileTransitRow key={row.key} row={row} />
      ))}
    </section>
  );
}
