import type { AstrolabeResult } from "@/lib/astrolabe";
import type { CalendarSummary } from "@/lib/calendar";
import { DOMAIN_PALACES, normalizePalaceName } from "@/lib/interpretation/palaceMeaning";
import type {
  DisplayStar,
  InterpretationResult,
  InterpretationSection,
  Mutagen,
  PalaceBrief,
  PalaceRelation,
  PalaceSignal,
  RuleEngineResult,
} from "@/lib/interpretation/types";
import type { TimeSelection } from "@/components/TransitControls";
import type { BirthInfo } from "@/types/birth";
import type {
  AIInterpretRequest,
  AIInterpretScope,
  AIInterpretStyle,
  AISignalDomain,
} from "./types";

const RISK_STARS = new Set(["擎羊", "羊", "陀罗", "陀", "火星", "铃星", "地空", "地劫"]);

const SCOPE_MAP: Record<InterpretationResult["scope"], AIInterpretScope> = {
  natal: "natal",
  decade: "decade",
  year: "year",
  month: "month",
  day: "day",
  hour: "hour",
};

const SECTION_KEYS = [
  "overview",
  "career",
  "wealth",
  "relationship",
  "health",
  "risk",
  "advice",
] as const;

function compactText(text: string, maxLength = 180): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function formatStar(star: DisplayStar): string {
  const brightness = star.brightness ? `(${star.brightness})` : "";
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";

  return `${star.name}${brightness}${mutagen}`;
}

function normalizeMutagen(mutagen: Mutagen): string {
  return `化${mutagen}`;
}

function isRiskSignal(signal: PalaceSignal): boolean {
  return (
    signal.score < 0 ||
    signal.mutagens.includes("忌") ||
    signal.stars.some((star) => RISK_STARS.has(star.name))
  );
}

function palaceInDomain(palaceName: string, domain: keyof typeof DOMAIN_PALACES): boolean {
  const normalized = normalizePalaceName(palaceName);
  const palaces = DOMAIN_PALACES[domain] as readonly string[];

  return palaces.includes(palaceName) || palaces.includes(normalized);
}

function getSignalDomain(signal: PalaceSignal): AISignalDomain {
  if (isRiskSignal(signal)) {
    return "risk";
  }

  if (palaceInDomain(signal.palaceName, "career")) {
    return "career";
  }

  if (palaceInDomain(signal.palaceName, "wealth")) {
    return "wealth";
  }

  if (palaceInDomain(signal.palaceName, "relationship")) {
    return "relationship";
  }

  if (palaceInDomain(signal.palaceName, "health")) {
    return "health";
  }

  return "overview";
}

function relationLabel(relation: PalaceRelation): string {
  const labels: Record<PalaceRelation, string> = {
    self: "本宫",
    triad: "三方",
    opposite: "对宫",
    neighbor: "邻宫",
  };

  return labels[relation];
}

function buildSignalEvidence(signal: PalaceSignal): string {
  const stars = signal.stars.slice(0, 6).map(formatStar).join("、");
  const mutagens = signal.mutagens.map(normalizeMutagen).join("、");
  const parts = [
    `${relationLabel(signal.relation)}触发${normalizePalaceName(signal.palaceName)}`,
    stars ? `星曜：${stars}` : "",
    mutagens ? `四化：${mutagens}` : "",
    `分数：${signal.score}`,
  ].filter(Boolean);

  return compactText(parts.join("；"), 220);
}

function buildSignalConclusion(signal: PalaceSignal): string {
  return compactText(signal.messages[0] ?? buildSignalEvidence(signal), 180);
}

function sectionToLines(section: InterpretationSection): string[] {
  return [
    `结论：${section.conclusion}`,
    ...section.evidences.slice(0, 4).map((evidence) => `依据：${evidence}`),
    ...section.suggestions.slice(0, 3).map((suggestion) => `建议：${suggestion}`),
  ].map((line) => compactText(line, 220));
}

function palaceBriefToAI(palace: PalaceBrief): AIInterpretRequest["mainPalaces"][number] {
  return {
    palaceName: normalizePalaceName(palace.palaceName),
    reason: compactText(palace.reason, 160),
    score: palace.score,
  };
}

export type BuildAIInterpretInputOptions = {
  astrolabe: AstrolabeResult;
  birthInfo?: BirthInfo;
  calendar?: CalendarSummary;
  interpretation: InterpretationResult;
  ruleResult: RuleEngineResult;
  selectedTime?: TimeSelection;
  style?: AIInterpretStyle;
};

export function buildAIInterpretInput({
  astrolabe,
  birthInfo,
  calendar,
  interpretation,
  ruleResult,
  selectedTime,
  style = "professional",
}: BuildAIInterpretInputOptions): AIInterpretRequest {
  const mainPalaces = [
    ...interpretation.primaryPalaces,
    ...interpretation.secondaryPalaces,
  ]
    .slice(0, 8)
    .map(palaceBriefToAI);
  const sections = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, sectionToLines(interpretation.sections[key])]),
  ) as AIInterpretRequest["ruleInterpretation"]["sections"];

  return {
    scope: SCOPE_MAP[interpretation.scope],
    title: interpretation.title,
    birthInfo: {
      gender: birthInfo?.gender,
      solarDate: calendar?.solarDate || astrolabe.solarDate,
      lunarDate: calendar?.lunarDate || astrolabe.lunarDate,
      birthHour: birthInfo?.birthHour ? `${birthInfo.birthHour}时` : undefined,
      mingGong: astrolabe.earthlyBranchOfSoulPalace,
      shenGong: astrolabe.earthlyBranchOfBodyPalace,
      mingZhu: astrolabe.soul,
      shenZhu: astrolabe.body,
    },
    selectedTime: {
      decade: selectedTime?.decadal?.label ?? null,
      year: selectedTime?.yearly?.label ?? null,
      month: selectedTime?.monthly?.label ?? null,
      day: selectedTime?.daily?.label ?? null,
      hour: selectedTime?.hourly?.label ?? null,
    },
    mainPalaces,
    signals: ruleResult.signals.slice(0, 60).map((signal) => ({
      palaceName: normalizePalaceName(signal.palaceName),
      domain: getSignalDomain(signal),
      stars: signal.stars.slice(0, 8).map(formatStar),
      mutagens: signal.mutagens.map(normalizeMutagen),
      relation: signal.relation,
      ruleConclusion: buildSignalConclusion(signal),
      evidence: buildSignalEvidence(signal),
    })),
    ruleInterpretation: {
      summary: compactText(interpretation.summary, 260),
      sections,
    },
    style,
  };
}
