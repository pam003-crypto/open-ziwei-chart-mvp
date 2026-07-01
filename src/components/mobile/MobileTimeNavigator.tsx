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
        {row.cells.map((cell) => (
          <button
            className={cell.active ? "mobile-time-chip is-active" : "mobile-time-chip"}
            key={cell.key}
            onClick={cell.onClick}
            type="button"
          >
            <span>{cell.title}</span>
            {cell.subtitle ? <small>{cell.subtitle}</small> : null}
          </button>
        ))}
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
