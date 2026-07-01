import type { AstrolabeResult } from "@/lib/astrolabe";
import { MUTAGEN_SEQUENCE } from "./mutagenMeaning";
import { normalizePalaceName, PALACE_MEANING } from "./palaceMeaning";
import { getStarKeywords, normalizeStarName } from "./starMeaning";
import type {
  DisplayStar,
  InterpretOptions,
  InterpretationInput,
  InterpretationScope,
  Mutagen,
  PalaceRelation,
  PalaceSignal,
  SignalSource,
} from "./types";

type RawPalace = AstrolabeResult["palaces"][number];
type RawStar =
  | RawPalace["majorStars"][number]
  | RawPalace["minorStars"][number]
  | RawPalace["adjectiveStars"][number];

type HoroscopeStar = {
  name?: string;
  type?: string;
  brightness?: string;
  mutagen?: string;
};

type HoroscopeCycle = {
  index?: number;
  name?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  palaceNames?: string[];
  mutagen?: string[];
  stars?: HoroscopeStar[][];
};

type HoroscopeData = {
  decadal?: HoroscopeCycle;
  yearly?: HoroscopeCycle;
  monthly?: HoroscopeCycle;
  daily?: HoroscopeCycle;
  hourly?: HoroscopeCycle;
};

const RELATION_OFFSETS: Array<{ relation: PalaceRelation; offset: number }> = [
  { relation: "self", offset: 0 },
  { relation: "triad", offset: 4 },
  { relation: "triad", offset: -4 },
  { relation: "opposite", offset: 6 },
  { relation: "neighbor", offset: 1 },
  { relation: "neighbor", offset: -1 },
];

function normalizeIndex(index: number): number {
  return ((index % 12) + 12) % 12;
}

function isMutagen(value: string | undefined): value is Mutagen {
  return value === "禄" || value === "权" || value === "科" || value === "忌";
}

function formatTitleLabel(
  scope: InterpretationScope,
  targetDate: Date,
  context: InterpretOptions["transitContext"],
): string {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();

  if (scope === "natal") {
    return "综合命盘解读";
  }

  if (scope === "decade") {
    return `${context?.label ?? "当前"}大限解读`;
  }

  if (scope === "month") {
    return `${year}年${month}月流月解读`;
  }

  if (scope === "day") {
    return `${year}年${month}月${day}日流日解读`;
  }

  if (scope === "hour") {
    return `${year}年${month}月${day}日${context?.hourLabel ?? context?.label ?? ""}流时解读`;
  }

  return `${year}年流年解读`;
}

function toDisplayStar(
  star: RawStar,
  type: DisplayStar["type"],
  mutagenByStar: Map<string, Mutagen>,
): DisplayStar {
  const explicitMutagen = isMutagen(star.mutagen) ? star.mutagen : undefined;

  return {
    name: star.name,
    brightness: star.brightness,
    mutagen: explicitMutagen ?? mutagenByStar.get(star.name),
    type,
  };
}

function toFlowStar(star: HoroscopeStar): DisplayStar | null {
  if (!star.name) {
    return null;
  }

  return {
    name: star.name,
    brightness: star.brightness,
    mutagen: isMutagen(star.mutagen) ? star.mutagen : undefined,
    type: "flow",
  };
}

function buildMutagenMap(cycle?: HoroscopeCycle): Map<string, Mutagen> {
  const mutagenByStar = new Map<string, Mutagen>();

  cycle?.mutagen?.forEach((starName, index) => {
    const mutagen = MUTAGEN_SEQUENCE[index];

    if (mutagen && starName) {
      mutagenByStar.set(starName, mutagen);
    }
  });

  return mutagenByStar;
}

function collectStars(
  palace: RawPalace,
  cycle: HoroscopeCycle | undefined,
): DisplayStar[] {
  const mutagenByStar = buildMutagenMap(cycle);
  const natalStars: DisplayStar[] = [
    ...palace.majorStars.map((star) => toDisplayStar(star, "main", mutagenByStar)),
    ...palace.minorStars.map((star) => toDisplayStar(star, "minor", mutagenByStar)),
    ...palace.adjectiveStars.map((star) => toDisplayStar(star, "misc", mutagenByStar)),
  ];
  const flowStars =
    cycle?.stars?.[palace.index]?.map(toFlowStar).filter((star): star is DisplayStar => Boolean(star)) ?? [];

  return [...natalStars, ...flowStars];
}

function collectMutagens(stars: DisplayStar[]): Mutagen[] {
  return Array.from(
    new Set(stars.map((star) => star.mutagen).filter((mutagen): mutagen is Mutagen => Boolean(mutagen))),
  );
}

function collectTags(palaceName: string, source: SignalSource, stars: DisplayStar[], mutagens: Mutagen[]): string[] {
  const normalizedPalaceName = normalizePalaceName(palaceName);
  const palaceKeywords = PALACE_MEANING[palaceName]?.keywords ?? PALACE_MEANING[normalizedPalaceName]?.keywords ?? [];
  const starTags = stars.flatMap((star) => [
    star.name,
    normalizeStarName(star.name),
    ...getStarKeywords(star.name),
  ]);

  return Array.from(
    new Set([
      palaceName,
      normalizedPalaceName,
      source,
      ...palaceKeywords,
      ...starTags,
      ...mutagens.map((mutagen) => `化${mutagen}`),
    ].filter(Boolean)),
  );
}

function buildSignal(
  palace: RawPalace,
  source: SignalSource,
  relation: PalaceRelation,
  cycle?: HoroscopeCycle,
): PalaceSignal {
  const palaceName = cycle?.palaceNames?.[palace.index] ?? palace.name;
  const stars = collectStars(palace, cycle);
  const mutagens = collectMutagens(stars);

  return {
    palaceName,
    source,
    relation,
    stars,
    mutagens,
    score: 0,
    tags: collectTags(palaceName, source, stars, mutagens),
    messages: [],
  };
}

function getCycleBaseIndex(cycle: HoroscopeCycle | undefined, fallbackIndex: number): number {
  if (typeof cycle?.index === "number" && Number.isInteger(cycle.index)) {
    return normalizeIndex(cycle.index);
  }

  return normalizeIndex(fallbackIndex);
}

function findLifePalaceIndex(astrolabe: AstrolabeResult): number {
  const palace = astrolabe.palaces.find(
    (item) => item.earthlyBranch === astrolabe.earthlyBranchOfSoulPalace,
  );

  return palace?.index ?? 0;
}

function findSelectedPalace(
  astrolabe: AstrolabeResult,
  selectedPalaceId: number | string | null | undefined,
): RawPalace | undefined {
  if (selectedPalaceId === null || selectedPalaceId === undefined) {
    return undefined;
  }

  if (typeof selectedPalaceId === "number") {
    return astrolabe.palaces.find((palace) => palace.index === normalizeIndex(selectedPalaceId));
  }

  return astrolabe.palaces.find(
    (palace) => palace.name === selectedPalaceId || normalizePalaceName(palace.name) === selectedPalaceId,
  );
}

function collectLayerSignals(
  astrolabe: AstrolabeResult,
  source: SignalSource,
  cycle: HoroscopeCycle | undefined,
  fallbackIndex: number,
): PalaceSignal[] {
  const baseIndex = getCycleBaseIndex(cycle, fallbackIndex);
  const seen = new Set<string>();

  return RELATION_OFFSETS.flatMap(({ relation, offset }) => {
    const index = normalizeIndex(baseIndex + offset);
    const key = `${relation}:${index}`;
    const palace = astrolabe.palaces.find((item) => item.index === index);

    if (!palace || seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [buildSignal(palace, source, relation, cycle)];
  });
}

function collectNatalOverviewSignals(astrolabe: AstrolabeResult): PalaceSignal[] {
  return astrolabe.palaces.map((palace) => buildSignal(palace, "natal", "self"));
}

function getHoroscopeData(
  astrolabe: AstrolabeResult,
  targetDate: Date,
  transitHour: number,
): HoroscopeData {
  try {
    return astrolabe.horoscope(targetDate, transitHour) as unknown as HoroscopeData;
  } catch {
    return {};
  }
}

function getCurrentSource(scope: InterpretationScope): SignalSource {
  if (scope === "natal") {
    return "natal";
  }

  if (scope === "decade") {
    return "decade";
  }

  if (scope === "month") {
    return "month";
  }

  if (scope === "day") {
    return "day";
  }

  if (scope === "hour") {
    return "hour";
  }

  return "year";
}

export function collectInterpretationInput(options: InterpretOptions): InterpretationInput {
  const transitHour = options.transitHour ?? 0;
  const horoscope = getHoroscopeData(options.astrolabe, options.targetDate, transitHour);
  const lifeIndex = findLifePalaceIndex(options.astrolabe);
  const signals: PalaceSignal[] = [];

  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.log("[interpretation] astrolabe", options.astrolabe);
  }

  if (options.scope === "natal") {
    signals.push(...collectNatalOverviewSignals(options.astrolabe));
  } else {
    signals.push(...collectLayerSignals(options.astrolabe, "natal", undefined, lifeIndex));
  }

  if (
    options.scope === "decade" ||
    options.scope === "year" ||
    options.scope === "month"
  ) {
    signals.push(...collectLayerSignals(options.astrolabe, "decade", horoscope.decadal, lifeIndex));
  }

  if (
    options.scope === "year" ||
    options.scope === "month" ||
    options.scope === "day" ||
    options.scope === "hour"
  ) {
    signals.push(...collectLayerSignals(options.astrolabe, "year", horoscope.yearly, lifeIndex));
  }

  if (options.scope === "month" || options.scope === "day" || options.scope === "hour") {
    signals.push(...collectLayerSignals(options.astrolabe, "month", horoscope.monthly, lifeIndex));
  }

  if (options.scope === "day" || options.scope === "hour") {
    signals.push(...collectLayerSignals(options.astrolabe, "day", horoscope.daily, lifeIndex));
  }

  if (options.scope === "hour") {
    signals.push(...collectLayerSignals(options.astrolabe, "hour", horoscope.hourly, lifeIndex));
  }

  const selectedPalace = findSelectedPalace(options.astrolabe, options.selectedPalaceId);

  if (selectedPalace) {
    const currentCycle =
      options.scope === "natal"
        ? undefined
        : options.scope === "decade"
          ? horoscope.decadal
          : options.scope === "day"
        ? horoscope.daily
        : options.scope === "month"
          ? horoscope.monthly
          : options.scope === "hour"
            ? horoscope.hourly
            : horoscope.yearly;

    signals.push(buildSignal(selectedPalace, getCurrentSource(options.scope), "self", currentCycle));
  }

  return {
    astrolabe: options.astrolabe,
    scope: options.scope,
    targetDate: options.targetDate,
    transitHour,
    selectedPalaceId: options.selectedPalaceId,
    transitContext: options.transitContext,
    signals,
    titleLabel: formatTitleLabel(options.scope, options.targetDate, options.transitContext),
  };
}
