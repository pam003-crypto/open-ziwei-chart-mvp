"use client";

import { Solar } from "lunar-javascript";
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

export function CurrentContextBar({ transitContext, targetDate }: CurrentContextBarProps) {
  const lunarContext = getLunarContext(targetDate);

  return (
    <div className="mobile-context-bar" aria-label="当前查看状态">
      <strong>{getContextTitle(transitContext, targetDate)}</strong>
      <span>{lunarContext.ganzhiYear}</span>
      <span>{lunarContext.lunarMonth}</span>
    </div>
  );
}
