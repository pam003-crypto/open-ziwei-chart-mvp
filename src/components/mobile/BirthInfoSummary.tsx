"use client";

import type { AstrolabeResult } from "@/lib/astrolabe";
import type { CalendarSummary } from "@/lib/calendar";
import type { BirthInfo } from "@/types/birth";

type BirthInfoSummaryProps = {
  birthInfo: BirthInfo;
  astrolabe: AstrolabeResult;
  calendar: CalendarSummary;
};

function SummaryItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "mobile-summary-item is-wide" : "mobile-summary-item"}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function BirthInfoSummary({
  birthInfo,
  astrolabe,
  calendar,
}: BirthInfoSummaryProps) {
  return (
    <details className="mobile-collapse-card">
      <summary>出生信息</summary>
      <div className="mobile-summary-grid">
        <SummaryItem label="姓名" value={birthInfo.name} />
        <SummaryItem label="性别" value={birthInfo.gender} />
        <SummaryItem label="公历" value={calendar.solarDate || astrolabe.solarDate} />
        <SummaryItem label="农历" value={calendar.lunarDate || astrolabe.lunarDate} />
        <SummaryItem label="时辰" value={`${birthInfo.birthHour}时`} />
        <SummaryItem label="生肖" value={calendar.zodiac || astrolabe.zodiac} />
        <SummaryItem
          label="干支"
          value={calendar.ganzhi || astrolabe.chineseDate}
          wide
        />
        <SummaryItem label="命宫" value={astrolabe.earthlyBranchOfSoulPalace} />
        <SummaryItem label="身宫" value={astrolabe.earthlyBranchOfBodyPalace} />
        <SummaryItem label="命主/身主" value={`${astrolabe.soul}/${astrolabe.body}`} wide />
      </div>
    </details>
  );
}
