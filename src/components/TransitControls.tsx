"use client";

import { Lunar, Solar } from "lunar-javascript";
import type { AstrolabeResult } from "@/lib/astrolabe";
import { BIRTH_HOURS } from "@/types/birth";
import type { TransitContext } from "@/types/interpretation";

export type TransitControlsProps = {
  astrolabe: AstrolabeResult;
  transitDate: Date;
  transitHour: number;
  activeScope: TransitContext["scope"];
  timeSelection?: TimeSelection;
  onTransitDateChange: (date: Date) => void;
  onTransitHourChange: (hour: number) => void;
  onTransitContextChange?: (context: TransitContext) => void;
  onTimeSelectionChange?: (selection: TimeSelection) => void;
};

export type TimeSelectionItem = {
  key: string;
  label: string;
};

export type TimeSelection = {
  decadal?: TimeSelectionItem;
  yearly?: TimeSelectionItem;
  monthly?: TimeSelectionItem;
  daily?: TimeSelectionItem;
  hourly?: TimeSelectionItem;
};

export type TransitCell = {
  key: string;
  title: string;
  subtitle?: string;
  active?: boolean;
  onClick?: () => void;
};

export type TransitRowData = {
  key: "decadal" | "yearly" | "monthly" | "daily" | "hourly";
  label: string;
  cells: TransitCell[];
  compact?: boolean;
};

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

const LUNAR_DAYS = [
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
] as const;

function getBirthYear(astrolabe: AstrolabeResult): number {
  const match = /^(\d{4})/.exec(astrolabe.solarDate);
  return match ? Number(match[1]) : new Date().getFullYear();
}

function getLunarParts(date: Date): { year: number; month: number; day: number } {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const lunar = solar.getLunar();

  return {
    year: lunar.getYear(),
    month: Math.abs(lunar.getMonth()),
    day: lunar.getDay(),
  };
}

function getGanzhiYear(year: number): string {
  return Solar.fromYmd(year, 7, 1).getLunar().getYearInGanZhi();
}

function lunarToDate(year: number, month: number, day: number): Date {
  for (let nextDay = Math.min(day, 30); nextDay >= 1; nextDay -= 1) {
    try {
      const solar = Lunar.fromYmd(year, month, nextDay).getSolar();
      return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
    } catch {
      // Some lunar months do not have day 30. Step down to the nearest valid day.
    }
  }

  return new Date(year, 0, 1);
}

function setSolarYear(date: Date, year: number): Date {
  const nextDate = new Date(date);
  nextDate.setFullYear(year);
  return nextDate;
}

function formatDateLabel(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSelectionLabel(title: string, subtitle?: string): string {
  return subtitle ? `${title} ${subtitle}` : title;
}

function getSelectedDecadal(
  astrolabe: AstrolabeResult,
  age: number,
): TimeSelectionItem | undefined {
  const palace = astrolabe.palaces
    .map((item) => ({
      palace: item,
      startAge: item.decadal.range[0],
      endAge: item.decadal.range[1],
    }))
    .sort((a, b) => a.startAge - b.startAge)
    .find(({ startAge, endAge }) => age >= startAge && age <= endAge);

  if (!palace) {
    return undefined;
  }

  const key = `${palace.palace.heavenlyStem}${palace.palace.earthlyBranch}-${palace.startAge}`;
  const title = `${palace.startAge}~${palace.endAge}`;
  const subtitle = `${palace.palace.heavenlyStem}${palace.palace.earthlyBranch}限`;

  return {
    key,
    label: formatSelectionLabel(title, subtitle),
  };
}

export function getResolvedTimeSelection(
  astrolabe: AstrolabeResult,
  transitDate: Date,
  transitHour: number,
  timeSelection: TimeSelection = {},
): TimeSelection {
  const birthYear = getBirthYear(astrolabe);
  const lunarParts = getLunarParts(transitDate);
  const selectedYear = transitDate.getFullYear();
  const selectedAge = selectedYear - birthYear + 1;
  const month = LUNAR_MONTHS[lunarParts.month - 1];
  const day = LUNAR_DAYS[lunarParts.day - 1];
  const hour = BIRTH_HOURS[transitHour];
  const defaults: TimeSelection = {
    decadal: getSelectedDecadal(astrolabe, selectedAge),
    yearly: {
      key: String(selectedYear),
      label: `${selectedYear}年 ${getGanzhiYear(selectedYear)}`,
    },
    monthly: month ? { key: month, label: month } : undefined,
    daily: day ? { key: day, label: day } : undefined,
    hourly: hour ? { key: hour, label: `${hour}时` } : undefined,
  };
  const manualSelection = Object.fromEntries(
    Object.entries(timeSelection).filter(([, value]) => value !== undefined),
  ) as TimeSelection;

  return {
    ...defaults,
    ...manualSelection,
  };
}

function TransitRow({
  label,
  cells,
  compact = false,
}: {
  label: string;
  cells: TransitCell[];
  compact?: boolean;
}) {
  return (
    <div className="transit-row">
      <div className="transit-row-label">{label}</div>
      <div className={`transit-row-cells ${compact ? "is-compact" : ""}`}>
        {cells.map((cell) => (
          <button
            className={cell.active ? "transit-cell is-active" : "transit-cell"}
            key={cell.key}
            type="button"
            onClick={cell.onClick}
          >
            <span>{cell.title}</span>
            {cell.subtitle ? <small>{cell.subtitle}</small> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function buildTransitRows({
  astrolabe,
  transitDate,
  transitHour,
  timeSelection,
  onTransitDateChange,
  onTransitHourChange,
  onTransitContextChange,
  onTimeSelectionChange,
}: TransitControlsProps): TransitRowData[] {
  const birthYear = getBirthYear(astrolabe);
  const lunarParts = getLunarParts(transitDate);
  const selectedYear = transitDate.getFullYear();
  const currentYear = new Date().getFullYear();
  const selectedAge = selectedYear - birthYear + 1;
  const resolvedSelection = getResolvedTimeSelection(
    astrolabe,
    transitDate,
    transitHour,
    timeSelection,
  );
  const decadalCells = astrolabe.palaces
    .map((palace) => ({
      palace,
      startAge: palace.decadal.range[0],
      endAge: palace.decadal.range[1],
    }))
    .sort((a, b) => a.startAge - b.startAge)
    .slice(0, 10)
    .map<TransitCell>(({ palace, startAge, endAge }) => {
      const startYear = birthYear + startAge - 1;

      return {
        key: `${palace.heavenlyStem}${palace.earthlyBranch}-${startAge}`,
        title: `${startAge}~${endAge}`,
        subtitle: `${palace.heavenlyStem}${palace.earthlyBranch}限`,
        active:
          resolvedSelection.decadal?.key ===
          `${palace.heavenlyStem}${palace.earthlyBranch}-${startAge}`,
        onClick: () => {
          const nextDate = setSolarYear(transitDate, startYear);
          const key = `${palace.heavenlyStem}${palace.earthlyBranch}-${startAge}`;
          const label = formatSelectionLabel(
            `${startAge}~${endAge}`,
            `${palace.heavenlyStem}${palace.earthlyBranch}限`,
          );
          onTransitDateChange(nextDate);
          onTimeSelectionChange?.({
            decadal: { key, label },
          });
          onTransitContextChange?.({
            scope: "decadal",
            label: `${startAge}~${endAge} ${palace.heavenlyStem}${palace.earthlyBranch}限`,
            dateLabel: formatDateLabel(nextDate),
            palaceName: palace.name,
            heavenlyStem: palace.heavenlyStem,
            earthlyBranch: palace.earthlyBranch,
            keywords: [
              "大限",
              palace.name,
              palace.heavenlyStem,
              palace.earthlyBranch,
              ...palace.majorStars.map((star) => star.name),
              ...palace.minorStars.map((star) => star.name),
            ],
          });
        },
      };
    });

  const yearCells = Array.from({ length: 10 }, (_, index) => {
    const year = currentYear + index;

    return {
      key: String(year),
      title: `${year}年`,
      subtitle: `${getGanzhiYear(year)} ${year - birthYear + 1}岁`,
      active: resolvedSelection.yearly?.key === String(year),
      onClick: () => {
        const nextDate = setSolarYear(transitDate, year);
        const ganzhiYear = getGanzhiYear(year);
        onTransitDateChange(nextDate);
        onTimeSelectionChange?.({
          decadal: timeSelection?.decadal,
          yearly: {
            key: String(year),
            label: `${year}年 ${ganzhiYear}`,
          },
        });
        onTransitContextChange?.({
          scope: "yearly",
          label: `${year}年`,
          dateLabel: formatDateLabel(nextDate),
          heavenlyStem: ganzhiYear.slice(0, 1),
          earthlyBranch: ganzhiYear.slice(1),
          keywords: ["流年", `${year}年`, ganzhiYear, "四化"],
        });
      },
    };
  });

  const monthCells = LUNAR_MONTHS.map<TransitCell>((month, index) => ({
    key: month,
    title: month,
    active: resolvedSelection.monthly?.key === month,
    onClick: () => {
      const nextDate = lunarToDate(lunarParts.year, index + 1, lunarParts.day);
      onTransitDateChange(nextDate);
      onTimeSelectionChange?.({
        decadal: timeSelection?.decadal,
        yearly: timeSelection?.yearly,
        monthly: { key: month, label: month },
      });
      onTransitContextChange?.({
        scope: "monthly",
        label: month,
        dateLabel: formatDateLabel(nextDate),
        keywords: ["流月", month, "月限", "四化"],
      });
    },
  }));

  const dayCells = LUNAR_DAYS.map<TransitCell>((day, index) => ({
    key: day,
    title: day,
    active: resolvedSelection.daily?.key === day,
    onClick: () => {
      const nextDate = lunarToDate(lunarParts.year, lunarParts.month, index + 1);
      onTransitDateChange(nextDate);
      onTimeSelectionChange?.({
        decadal: timeSelection?.decadal,
        yearly: timeSelection?.yearly,
        monthly: timeSelection?.monthly,
        daily: { key: day, label: day },
      });
      onTransitContextChange?.({
        scope: "daily",
        label: day,
        dateLabel: formatDateLabel(nextDate),
        keywords: ["流日", day, "日限", "四化"],
      });
    },
  }));

  const hourCells = BIRTH_HOURS.map<TransitCell>((hour, index) => ({
    key: hour,
    title: `${hour}时`,
    active: resolvedSelection.hourly?.key === hour,
    onClick: () => {
      onTransitHourChange(index);
      onTimeSelectionChange?.({
        decadal: timeSelection?.decadal,
        yearly: timeSelection?.yearly,
        monthly: timeSelection?.monthly,
        daily: timeSelection?.daily,
        hourly: { key: hour, label: `${hour}时` },
      });
      onTransitContextChange?.({
        scope: "hourly",
        label: `${hour}时`,
        dateLabel: formatDateLabel(transitDate),
        hourLabel: `${hour}时`,
        keywords: ["流时", `${hour}时`, "时限", "四化"],
      });
    },
  }));

  return [
    { key: "decadal", label: "大限", cells: decadalCells },
    { key: "yearly", label: "流年", cells: yearCells },
    { key: "monthly", label: "流月", cells: monthCells, compact: true },
    { key: "daily", label: "流日", cells: dayCells, compact: true },
    { key: "hourly", label: "流时", cells: hourCells, compact: true },
  ];
}

export function TransitControls(props: TransitControlsProps) {
  const rows = buildTransitRows(props);

  return (
    <div className="transit-panel" aria-label="流年流月流日流时选择">
      {rows.map((row) => (
        <TransitRow
          cells={row.cells}
          compact={row.compact}
          key={row.key}
          label={row.label}
        />
      ))}
    </div>
  );
}
