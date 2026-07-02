import type { AstrolabeResult } from "@/lib/astrolabe";
import { normalizePalaceName, PALACE_MEANING } from "@/lib/interpretation/palaceMeaning";
import type { TransitContext } from "@/types/interpretation";

type Palace = AstrolabeResult["palaces"][number];
type PalaceStar =
  | Palace["majorStars"][number]
  | Palace["minorStars"][number]
  | Palace["adjectiveStars"][number];

export type HoroscopeStar = {
  name?: string;
  brightness?: string;
  mutagen?: string;
};

export type HoroscopeCycle = {
  index?: number;
  name?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  stars?: HoroscopeStar[][];
};

export type HoroscopeData = {
  decadal?: HoroscopeCycle;
  yearly?: HoroscopeCycle;
  monthly?: HoroscopeCycle;
  daily?: HoroscopeCycle;
  hourly?: HoroscopeCycle;
};

export type PalaceViewModel = {
  index: number;
  palaceName: string;
  heavenlyStem: string;
  earthlyBranch: string;
  stemBranch: string;
  decadalAgeRange: string;
  yearlyAges: number[];
  majorStars: string[];
  minorStars: string[];
  miscStars: string[];
  flowStars: string[];
  mutagens: string[];
  gods: string[];
  keyword: string;
  triggerLabel: string;
  isLifePalace: boolean;
  isBodyPalace: boolean;
};

const SCOPE_LABELS: Record<TransitContext["scope"], string> = {
  natal: "本命",
  decadal: "大限",
  yearly: "流年",
  monthly: "流月",
  daily: "流日",
  hourly: "流时",
};

function formatStar(star: PalaceStar | HoroscopeStar): string {
  const brightness = star.brightness ? `(${star.brightness})` : "";
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";

  return `${star.name ?? ""}${brightness}${mutagen}`;
}

function getKeyword(palace: Palace): string {
  const meaning = PALACE_MEANING[normalizePalaceName(palace.name)];
  return meaning?.keywords.slice(0, 3).join(" / ") || "点击查看宫位详情";
}

export function getHoroscope(
  astrolabe: AstrolabeResult,
  targetDate: Date,
  transitHour: number,
): HoroscopeData | undefined {
  try {
    return astrolabe.horoscope(targetDate, transitHour) as unknown as HoroscopeData;
  } catch {
    return undefined;
  }
}

export function getCycle(
  horoscope: HoroscopeData | undefined,
  scope: TransitContext["scope"],
): HoroscopeCycle | undefined {
  if (scope === "decadal") {
    return horoscope?.decadal;
  }

  if (scope === "yearly") {
    return horoscope?.yearly;
  }

  if (scope === "monthly") {
    return horoscope?.monthly;
  }

  if (scope === "daily") {
    return horoscope?.daily;
  }

  if (scope === "hourly") {
    return horoscope?.hourly;
  }

  return undefined;
}

function getTriggerLabel(
  palace: Palace,
  transitContext: TransitContext,
  horoscope: HoroscopeData | undefined,
): string {
  const cycle = getCycle(horoscope, transitContext.scope);

  if (cycle?.index !== palace.index) {
    return "";
  }

  const stem = cycle.heavenlyStem || cycle.earthlyBranch || cycle.name || transitContext.label;
  return `${SCOPE_LABELS[transitContext.scope]}·${stem}`;
}

function getFlowStars(
  horoscope: HoroscopeData | undefined,
  palaceIndex: number,
): string[] {
  const cycles: Array<{ label: string; cycle?: HoroscopeCycle }> = [
    { label: "大限", cycle: horoscope?.decadal },
    { label: "流年", cycle: horoscope?.yearly },
    { label: "流月", cycle: horoscope?.monthly },
    { label: "流日", cycle: horoscope?.daily },
    { label: "流时", cycle: horoscope?.hourly },
  ];

  return cycles.flatMap(({ label, cycle }) =>
    (cycle?.stars?.[palaceIndex] ?? [])
      .map(formatStar)
      .filter(Boolean)
      .map((star) => `${label}:${star}`),
  );
}

function getMutagens(palace: Palace): string[] {
  return [
    ...palace.majorStars,
    ...palace.minorStars,
    ...palace.adjectiveStars,
  ]
    .flatMap((star) => (star.mutagen ? [`${star.name}化${star.mutagen}`] : []))
    .filter((mutagen, index, list) => list.indexOf(mutagen) === index);
}

function getGods(palace: Palace): string[] {
  return [
    palace.changsheng12 ? `长生:${palace.changsheng12}` : "",
    palace.boshi12 ? `博士:${palace.boshi12}` : "",
    palace.jiangqian12 ? `将前:${palace.jiangqian12}` : "",
    palace.suiqian12 ? `岁前:${palace.suiqian12}` : "",
  ].filter(Boolean);
}

export function buildPalaceViewModel(
  palace: Palace,
  horoscope: HoroscopeData | undefined,
  transitContext: TransitContext,
): PalaceViewModel {
  return {
    index: palace.index,
    palaceName: palace.name,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    stemBranch: `${palace.heavenlyStem}${palace.earthlyBranch}`,
    decadalAgeRange: palace.decadal.range.join("~"),
    yearlyAges: palace.ages,
    majorStars: palace.majorStars.map(formatStar).filter(Boolean),
    minorStars: palace.minorStars.map(formatStar).filter(Boolean),
    miscStars: palace.adjectiveStars.map(formatStar).filter(Boolean),
    flowStars: getFlowStars(horoscope, palace.index),
    mutagens: getMutagens(palace),
    gods: getGods(palace),
    keyword: getKeyword(palace),
    triggerLabel: getTriggerLabel(palace, transitContext, horoscope),
    isLifePalace: palace.isOriginalPalace,
    isBodyPalace: palace.isBodyPalace,
  };
}
