import { astro } from "iztro";
import type FunctionalAstrolabe from "iztro/lib/astro/FunctionalAstrolabe";
import type { Language } from "iztro/lib/data/types";
import type { GenderName } from "iztro/lib/i18n";
import { BIRTH_HOURS, isBirthHour, type BirthInfo } from "@/types/birth";
import { normalizeDateForIztro } from "./calendar";

export type AstrolabeResult = FunctionalAstrolabe;

export type IztrolabeChartProps = {
  birthday: string;
  birthTime: number;
  birthdayType: "solar" | "lunar";
  gender: GenderName;
  isLeapMonth?: boolean;
  fixLeap: boolean;
  lang: Language;
  horoscopeDate: Date;
  horoscopeHour: number;
  centerPalaceAlign: boolean;
};

export function toBirthTimeIndex(birthHour: string): number {
  if (!isBirthHour(birthHour)) {
    throw new Error("请选择有效的出生时辰");
  }

  // iztro/react-iztro 使用 birthTime 数字索引；MVP 按十二时辰映射为 0-11，暂不拆分早晚子时。
  return BIRTH_HOURS.indexOf(birthHour);
}

export function toIztroGender(gender: BirthInfo["gender"]): GenderName {
  return gender === "男" ? "male" : "female";
}

export function createAstrolabe(birthInfo: BirthInfo): AstrolabeResult {
  const birthday = normalizeDateForIztro(birthInfo.birthday);
  const birthTime = toBirthTimeIndex(birthInfo.birthHour);
  const gender = toIztroGender(birthInfo.gender);

  if (birthInfo.calendarType === "lunar") {
    return astro.byLunar(
      birthday,
      birthTime,
      gender,
      birthInfo.isLeapMonth,
      true,
      "zh-CN",
    );
  }

  return astro.bySolar(birthday, birthTime, gender, true, "zh-CN");
}

export function getIztrolabeChartProps(birthInfo: BirthInfo): IztrolabeChartProps {
  const birthday = normalizeDateForIztro(birthInfo.birthday);
  const birthTime = toBirthTimeIndex(birthInfo.birthHour);

  return {
    birthday,
    birthTime,
    birthdayType: birthInfo.calendarType,
    gender: toIztroGender(birthInfo.gender),
    isLeapMonth:
      birthInfo.calendarType === "lunar" ? birthInfo.isLeapMonth : undefined,
    fixLeap: true,
    lang: "zh-CN",
    horoscopeDate: new Date(),
    horoscopeHour: birthTime,
    centerPalaceAlign: true,
  };
}
