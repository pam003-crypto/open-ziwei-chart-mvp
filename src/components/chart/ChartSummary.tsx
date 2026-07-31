import Image from "next/image";
import paperArtwork from "../../../public/assets/paper-bamboo-mountain.webp";
import type { AstrolabeResult } from "@/lib/astrolabe";
import type { CalendarSummary } from "@/lib/calendar";
import type { BirthInfo } from "@/types/birth";

type ChartSummaryProps = {
  astrolabe: AstrolabeResult;
  birthInfo: BirthInfo;
  calendar: CalendarSummary;
};

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ChartSummary({ astrolabe, birthInfo, calendar }: ChartSummaryProps) {
  return (
    <section className="chart-summary-section">
      <div className="workspace-section-heading">
        <div>
          <p className="section-kicker">Ziwei Chart</p>
          <h1 className="page-title">排盘结果</h1>
        </div>
        <span className="summary-status">本命盘</span>
      </div>

      <div className="chart-summary-card">
        <Image
          alt=""
          aria-hidden="true"
          className="summary-paper-art"
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          src={paperArtwork}
        />
        <dl className="chart-summary-grid">
          <div className="summary-column">
            <SummaryField label="姓名" value={birthInfo.name || "未命名"} />
            <SummaryField label="性别" value={birthInfo.gender} />
            <SummaryField label="出生时辰" value={`${birthInfo.birthHour}时`} />
            <SummaryField label="当前历法" value={birthInfo.calendarType === "solar" ? "公历" : "农历"} />
          </div>
          <div className="summary-column">
            <SummaryField label="公历日期" value={calendar.solarDate || astrolabe.solarDate} />
            <SummaryField label="农历日期" value={calendar.lunarDate || astrolabe.lunarDate} />
            <SummaryField label="是否闰月" value={birthInfo.calendarType === "lunar" && birthInfo.isLeapMonth ? "是" : "否"} />
            <SummaryField label="生肖" value={calendar.zodiac || astrolabe.zodiac} />
          </div>
          <div className="summary-column">
            <SummaryField label="命宫" value={astrolabe.earthlyBranchOfSoulPalace} />
            <SummaryField label="身宫" value={astrolabe.earthlyBranchOfBodyPalace} />
            <SummaryField label="命主 / 身主" value={`${astrolabe.soul} / ${astrolabe.body}`} />
            <SummaryField label="五行局" value={astrolabe.fiveElementsClass} />
          </div>
          <div className="summary-column is-wide">
            <SummaryField label="干支" value={calendar.ganzhi || astrolabe.chineseDate} />
            <SummaryField label="四柱" value={astrolabe.chineseDate} />
            <SummaryField label="当前命例" value={birthInfo.name || "未命名命例"} />
          </div>
        </dl>
      </div>
    </section>
  );
}
