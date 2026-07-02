"use client";

import { Solar } from "lunar-javascript";
import type { TimeSelection } from "@/components/TransitControls";
import type { TransitContext } from "@/types/interpretation";

const LUNAR_MONTHS = [
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "冬月",
  "腊月",
] as const;

type CurrentContextBarProps = {
  transitContext: TransitContext;
  targetDate: Date;
  timeSelection?: TimeSelection;
};

function getLunarContext(date: Date): { ganzhiYear: string; lunarMonth: string } {
  const lunar = Solar.fromYmd(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ).getLunar();
  const monthIndex = Math.abs(lunar.getMonth()) - 1;

  return {
    ganzhiYear: `${lunar.getYearInGanZhi()}年`,
    lunarMonth: LUNAR_MONTHS[monthIndex] ?? `${Math.abs(lunar.getMonth())}月`,
  };
}

function getContextTitle(context: TransitContext, date: Date): string {
  if (context.scope === "natal") {
    return "综合命盘";
  }

  if (context.scope === "monthly") {
    return `${date.getFullYear()}年${context.label}流月`;
  }

  if (context.scope === "daily") {
    return `${date.getFullYear()}年${context.label}流日`;
  }

  if (context.scope === "hourly") {
    return `${date.getFullYear()}年${context.label}流时`;
  }

  return context.label;
}

function getSelectionTitle(
  transitContext: TransitContext,
  targetDate: Date,
  timeSelection?: TimeSelection,
): string {
  const selectionLabels = [
    timeSelection?.decadal?.label,
    timeSelection?.yearly?.label,
    timeSelection?.monthly?.label,
    timeSelection?.daily?.label,
    timeSelection?.hourly?.label,
  ].filter(Boolean);

  if (selectionLabels.length > 0) {
    return selectionLabels.join(" ｜ ");
  }

  return getContextTitle(transitContext, targetDate);
}

export function CurrentContextBar({
  timeSelection,
  transitContext,
  targetDate,
}: CurrentContextBarProps) {
  const lunarContext = getLunarContext(targetDate);
  const title = getSelectionTitle(transitContext, targetDate, timeSelection);
  const hasTimeSelection = Boolean(timeSelection);

  return (
    <div className="mobile-context-bar" aria-label="当前查看状态">
      <strong>{title}</strong>
      {!hasTimeSelection ? <span>{lunarContext.ganzhiYear}</span> : null}
      {!hasTimeSelection ? <span>{lunarContext.lunarMonth}</span> : null}
    </div>
  );
}
