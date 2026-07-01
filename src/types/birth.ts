export const BIRTH_HOURS = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;

export type BirthHour = (typeof BIRTH_HOURS)[number];

export type BirthInfo = {
  name: string;
  gender: "男" | "女";
  calendarType: "solar" | "lunar";
  birthday: string;
  birthHour: string;
  isLeapMonth: boolean;
  note?: string;
};

export function isBirthHour(value: string): value is BirthHour {
  return BIRTH_HOURS.includes(value as BirthHour);
}
