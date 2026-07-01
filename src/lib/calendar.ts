import { Lunar, Solar } from "lunar-javascript";
import type { BirthInfo } from "@/types/birth";

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type CalendarSummary = {
  solarDate: string;
  lunarDate: string;
  lunarText: string;
  ganzhi: string;
  zodiac: string;
};

const DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatSolarDate(solar: Solar): string {
  return `${solar.getYear()}-${padDatePart(solar.getMonth())}-${padDatePart(solar.getDay())}`;
}

export function parseDateParts(value: string): DateParts {
  const match = DATE_PATTERN.exec(value.trim());

  if (!match) {
    throw new Error("日期格式需要为 YYYY-MM-DD");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function assertSolarDate(parts: DateParts): void {
  const date = new Date(parts.year, parts.month - 1, parts.day);
  const valid =
    date.getFullYear() === parts.year &&
    date.getMonth() === parts.month - 1 &&
    date.getDate() === parts.day;

  if (!valid) {
    throw new Error("公历日期不存在");
  }
}

function assertLunarDate(parts: DateParts): void {
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 30) {
    throw new Error("农历日期需要使用 1-12 月、1-30 日");
  }
}

function lunarDateLabel(lunar: Lunar): string {
  const lunarMonth = lunar.getMonth();
  const month = Math.abs(lunarMonth);
  const leap = lunarMonth < 0 ? "闰" : "";
  return `${lunar.getYear()}年${leap}${month}月${lunar.getDay()}日`;
}

function calendarSummaryFromSolar(solar: Solar): CalendarSummary {
  const lunar = solar.getLunar();

  return {
    solarDate: formatSolarDate(solar),
    lunarDate: lunarDateLabel(lunar),
    lunarText: lunar.toString(),
    ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    zodiac: lunar.getYearShengXiao(),
  };
}

export function getCalendarSummary(birthInfo: BirthInfo): CalendarSummary {
  const parts = parseDateParts(birthInfo.birthday);

  if (birthInfo.calendarType === "solar") {
    assertSolarDate(parts);
    return calendarSummaryFromSolar(Solar.fromYmd(parts.year, parts.month, parts.day));
  }

  assertLunarDate(parts);
  const lunarMonth = birthInfo.isLeapMonth ? -parts.month : parts.month;
  const lunar = Lunar.fromYmd(parts.year, lunarMonth, parts.day);

  return calendarSummaryFromSolar(lunar.getSolar());
}

export function normalizeDateForIztro(dateString: string): string {
  const parts = parseDateParts(dateString);
  return `${parts.year}-${parts.month}-${parts.day}`;
}
