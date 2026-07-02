import type { AstrolabeResult } from "@/lib/astrolabe";
import type { Mutagen, TransitContext } from "@/types/interpretation";

type RawPalace = AstrolabeResult["palaces"][number];
type RawStar =
  | RawPalace["majorStars"][number]
  | RawPalace["minorStars"][number]
  | RawPalace["adjectiveStars"][number]
  | HoroscopeStar;

type HoroscopeStar = {
  name?: string;
  brightness?: string;
  mutagen?: string;
};

type HoroscopeCycle = {
  index?: number;
  name?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  stars?: HoroscopeStar[][];
};

type HoroscopeData = {
  decadal?: HoroscopeCycle;
  yearly?: HoroscopeCycle;
  monthly?: HoroscopeCycle;
  daily?: HoroscopeCycle;
  hourly?: HoroscopeCycle;
};

export type DisplayStar = {
  name: string;
  brightness?: string;
  mutagen?: "禄" | "权" | "科" | "忌";
  type?: "main" | "minor" | "misc" | "flow";
};

export type CompactPalaceViewModel = {
  index: number;
  palaceName: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  stemBranch?: string;
  ageRange?: string;
  yearlyAges?: number[];
  minorAges?: number[];
  mainStars: DisplayStar[];
  minorStars: DisplayStar[];
  miscStars: DisplayStar[];
  flowStars: DisplayStar[];
  changsheng?: string;
  boshi?: string;
  jiangqian?: string;
  suiqian?: string;
  triggerLabel?: string;
  isLifePalace?: boolean;
  isBodyPalace?: boolean;
};

const SCOPE_LABELS: Record<TransitContext["scope"], string> = {
  natal: "本命",
  decadal: "大限",
  yearly: "流年",
  monthly: "流月",
  daily: "流日",
  hourly: "流时",
};

function isMutagen(value: string | undefined): value is Mutagen {
  return value === "禄" || value === "权" || value === "科" || value === "忌";
}

function toDisplayStar(star: RawStar, type: DisplayStar["type"]): DisplayStar | null {
  const name = star.name?.trim();

  if (!name) {
    return null;
  }

  return {
    name,
    brightness: star.brightness || undefined,
    mutagen: isMutagen(star.mutagen) ? star.mutagen : undefined,
    type,
  };
}

function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter((item): item is T => item != null);
}

export function getHoroscopeData(
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

function getCycle(
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

function getFlowStars(
  horoscope: HoroscopeData | undefined,
  palaceIndex: number,
): DisplayStar[] {
  const cycles: Array<{ label: string; cycle?: HoroscopeCycle }> = [
    { label: "限", cycle: horoscope?.decadal },
    { label: "年", cycle: horoscope?.yearly },
    { label: "月", cycle: horoscope?.monthly },
    { label: "日", cycle: horoscope?.daily },
    { label: "时", cycle: horoscope?.hourly },
  ];

  return cycles.flatMap(({ label, cycle }) =>
    compact(
      (cycle?.stars?.[palaceIndex] ?? []).map((star) => {
        const displayStar = toDisplayStar(star, "flow");

        return displayStar
          ? {
              ...displayStar,
              name: `${label}${displayStar.name}`,
            }
          : null;
      }),
    ),
  );
}

function getTriggerLabel(
  palace: RawPalace,
  transitContext: TransitContext,
  horoscope: HoroscopeData | undefined,
): string {
  const cycle = getCycle(horoscope, transitContext.scope);

  if (!cycle || cycle.index !== palace.index) {
    return "";
  }

  const stemBranch = [cycle.heavenlyStem, cycle.earthlyBranch].filter(Boolean).join("");
  const name = stemBranch || cycle.name || transitContext.label;

  return `${SCOPE_LABELS[transitContext.scope]}·${name}`;
}

export function adaptPalace(
  palace: RawPalace,
  horoscope: HoroscopeData | undefined,
  transitContext: TransitContext,
): CompactPalaceViewModel {
  return {
    index: palace.index,
    palaceName: palace.name,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    stemBranch: `${palace.heavenlyStem}${palace.earthlyBranch}`,
    ageRange: palace.decadal.range.join("~"),
    yearlyAges: palace.ages,
    // iztro 的常规宫位数据未直接暴露“小限年龄数组”，MVP 先留空，避免猜字段。
    minorAges: [],
    mainStars: compact(palace.majorStars.map((star) => toDisplayStar(star, "main"))),
    minorStars: compact(palace.minorStars.map((star) => toDisplayStar(star, "minor"))),
    miscStars: compact(palace.adjectiveStars.map((star) => toDisplayStar(star, "misc"))),
    flowStars: getFlowStars(horoscope, palace.index),
    changsheng: palace.changsheng12 || undefined,
    boshi: palace.boshi12 || undefined,
    jiangqian: palace.jiangqian12 || undefined,
    suiqian: palace.suiqian12 || undefined,
    triggerLabel: getTriggerLabel(palace, transitContext, horoscope),
    isLifePalace: palace.isOriginalPalace,
    isBodyPalace: palace.isBodyPalace,
  };
}

export function adaptPalaces(
  astrolabe: AstrolabeResult,
  targetDate: Date,
  transitHour: number,
  transitContext: TransitContext,
): CompactPalaceViewModel[] {
  const horoscope = getHoroscopeData(astrolabe, targetDate, transitHour);

  return astrolabe.palaces
    .map((palace) => adaptPalace(palace, horoscope, transitContext))
    .sort((left, right) => left.index - right.index);
}

export function formatDisplayStar(star: DisplayStar): string {
  const brightness = star.brightness ? `(${star.brightness})` : "";
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";

  return `${star.name}${brightness}${mutagen}`;
}
