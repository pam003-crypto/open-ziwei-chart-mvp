"use client";

import type { TimeSelection } from "@/components/TransitControls";

type CurrentContextBarProps = {
  timeSelection?: TimeSelection;
};

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

export function CurrentContextBar({ timeSelection }: CurrentContextBarProps) {
  return (
    <div className="mobile-context-bar" aria-label="当前查看状态">
      <strong>{getSelectionTitle(timeSelection)}</strong>
    </div>
  );
}
