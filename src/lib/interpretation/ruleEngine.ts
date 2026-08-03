import { DOMAIN_PALACES, normalizePalaceName, PALACE_MEANING } from "./palaceMeaning";
import { getStarKeywords, normalizeStarName } from "./starMeaning";
import {
  BRIGHTNESS_RULES,
  getMainStarSystem,
  getRiskFactors,
  getSupportStructure,
  SOURCE_LAYER_RULES,
  ZIWEI_MUTAGEN_RULES,
} from "./ziweiRules";
import type {
  DomainKey,
  InterpretationInput,
  InterpretationLevel,
  InterpretationScope,
  Mutagen,
  PalaceRelation,
  PalaceSignal,
  RuleEngineResult,
  SignalSource,
} from "./types";

const RELATION_WEIGHT: Record<PalaceRelation, number> = {
  self: 1,
  triad: 0.7,
  opposite: 0.6,
  neighbor: 0.4,
};

const TIME_WEIGHT: Record<InterpretationScope, Record<SignalSource, number>> = {
  natal: {
    natal: 1,
    decade: 0,
    year: 0,
    month: 0,
    day: 0,
    hour: 0,
  },
  decade: {
    natal: 0.3,
    decade: 0.7,
    year: 0,
    month: 0,
    day: 0,
    hour: 0,
  },
  year: {
    natal: 0.25,
    decade: 0.35,
    year: 0.4,
    month: 0,
    day: 0,
    hour: 0,
  },
  month: {
    natal: 0.15,
    decade: 0.25,
    year: 0.3,
    month: 0.3,
    day: 0,
    hour: 0,
  },
  day: {
    natal: 0.1,
    decade: 0,
    year: 0.25,
    month: 0.3,
    day: 0.35,
    hour: 0,
  },
  hour: {
    natal: 0.05,
    decade: 0,
    year: 0.2,
    month: 0.25,
    day: 0.25,
    hour: 0.25,
  },
};

const SOURCE_LABEL: Record<SignalSource, string> = {
  natal: "本命",
  decade: "大限",
  year: "流年",
  month: "流月",
  day: "流日",
  hour: "流时",
};

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function getLevel(score: number, scope: InterpretationScope): InterpretationLevel {
  if (scope === "natal") {
    return "综合";
  }

  if (score >= 1.2) {
    return "偏顺";
  }

  if (score >= -0.35) {
    return "中性";
  }

  if (score > -1.4) {
    return "需谨慎";
  }

  return "波动较大";
}

function hasToughStar(signal: PalaceSignal): boolean {
  return getRiskFactors(signal.stars).length > 0;
}

function hasMutagen(signal: PalaceSignal, mutagen: Mutagen): boolean {
  return signal.mutagens.includes(mutagen);
}

function buildPalaceMutagenMessage(signal: PalaceSignal, mutagen: Mutagen): string {
  const palaceName = normalizePalaceName(signal.palaceName);
  const palace = PALACE_MEANING[palaceName];
  const rule = ZIWEI_MUTAGEN_RULES[mutagen];
  const transformedStars = signal.stars
    .filter((star) => star.mutagen === mutagen)
    .map((star) => normalizeStarName(star.name));
  const subject = transformedStars.length > 0 ? transformedStars.join("、") : "相关星曜";
  const palaceAudit = palace?.auditQuestions[0] ?? "相关现实条件是否有独立证据承接？";

  return `${SOURCE_LABEL[signal.source]}${palaceName}中${subject}化${mutagen}，先按“${rule.mechanism}”处理；落在${palace?.title ?? "相关议题"}，需核对${palaceAudit}；${rule.audit}`;
}

function buildStarMessages(signal: PalaceSignal): string[] {
  const palaceName = normalizePalaceName(signal.palaceName);
  const palace = PALACE_MEANING[palaceName];
  const system = getMainStarSystem(signal.stars);
  const support = getSupportStructure(signal.stars);
  const riskFactors = getRiskFactors(signal.stars);
  const messages: string[] = [];

  if (system.names.length > 0) {
    messages.push(
      `${SOURCE_LABEL[signal.source]}${palaceName}以${system.label}为星系观察单位，性质轴为${system.axes.slice(0, 5).join("、")}；先核对${system.audits[0]}`,
    );
  }

  support.complete.forEach((rule) => {
    messages.push(`${palaceName}见${rule.names.join("、")}成对会照，${rule.complete}；仍需由主星星系、宫位和现实条件承接。`);
  });

  support.incomplete.slice(0, 2).forEach(({ rule, present }) => {
    messages.push(`${palaceName}单见${present}，${rule.incomplete}，不能据单星直接判断结果。`);
  });

  riskFactors.slice(0, 3).forEach(({ name, rule }) => {
    messages.push(`${palaceName}见${name}，将其作为${rule.category}的复核项：${rule.audit}`);
  });

  const brightness = signal.stars
    .filter((star) => star.type === "main" && star.brightness && BRIGHTNESS_RULES[star.brightness])
    .slice(0, 2)
    .map((star) => `${normalizeStarName(star.name)}${star.brightness}`);

  if (brightness.length > 0) {
    messages.push(`${brightness.join("、")}仅作环境适配修饰，不越过星系、宫位与辅煞四化单独裁决。`);
  }

  if (hasMutagen(signal, "忌") && hasToughStar(signal)) {
    messages.push("化忌与煞曜同见只表示复核等级提高，先检查现金、合同、权限、沟通、休息与安全条件，不推成确定事件。");
  }

  if (signal.source !== "natal" && signal.stars.some((star) => star.type === "flow")) {
    messages.push(`${SOURCE_LAYER_RULES[signal.source]}只用于观察${palace?.title ?? "该宫议题"}是否被触发，不能替代原局结构或现实证据。`);
  }

  return messages;
}

function buildFallbackMessage(signal: PalaceSignal): string {
  const palaceMeaning =
    PALACE_MEANING[signal.palaceName] ?? PALACE_MEANING[normalizePalaceName(signal.palaceName)];
  const starNames = signal.stars
    .slice(0, 5)
    .map((star) => {
      const brightness = star.brightness ? `(${star.brightness})` : "";
      const mutagen = star.mutagen ? `化${star.mutagen}` : "";
      return `${star.name}${brightness}${mutagen}`;
    })
    .join("、");

  return `${SOURCE_LABEL[signal.source]}触发${signal.palaceName}，主题落在${palaceMeaning?.title ?? "相关领域"}；星曜见${starNames || "空宫或少星"}，宜结合三方四正观察。`;
}

function buildMessages(signal: PalaceSignal): string[] {
  const mutagenMessages = signal.mutagens.map((mutagen) =>
    buildPalaceMutagenMessage(signal, mutagen),
  );
  const starMessages = buildStarMessages(signal);
  const fallback = mutagenMessages.length === 0 && starMessages.length === 0 ? [buildFallbackMessage(signal)] : [];

  return unique([...mutagenMessages, ...starMessages, ...fallback]);
}

function scoreSignal(signal: PalaceSignal, scope: InterpretationScope): PalaceSignal {
  const relationWeight = RELATION_WEIGHT[signal.relation];
  const timeWeight = TIME_WEIGHT[scope][signal.source];
  const system = getMainStarSystem(signal.stars);
  const support = getSupportStructure(signal.stars);
  const riskFactors = getRiskFactors(signal.stars);
  const structureScore = Math.min(system.names.length, 2) * 0.06;
  const supportScore =
    support.complete.reduce((score, rule) => score + rule.weight, 0) +
    support.incomplete.length * 0.03;
  const riskScore = riskFactors.reduce((score, factor) => score + factor.rule.score, 0);
  const mutagenScore = signal.mutagens.reduce(
    (score, mutagen) => score + ZIWEI_MUTAGEN_RULES[mutagen].score,
    0,
  );
  const triggerScore = signal.source !== "natal" && signal.stars.some((star) => star.type === "flow") ? 0.04 : 0;
  const rawScore = structureScore + supportScore + riskScore + mutagenScore + triggerScore;
  const adjustedScore = rawScore * relationWeight * timeWeight;
  const messages = buildMessages(signal);

  return {
    ...signal,
    score: Number(adjustedScore.toFixed(2)),
    tags: unique([
      ...signal.tags,
      ...signal.stars.flatMap((star) => getStarKeywords(star.name)),
      ...messages,
    ]),
    messages,
  };
}

function sortSignals(signals: PalaceSignal[]): PalaceSignal[] {
  return [...signals].sort((a, b) => Math.abs(b.score) - Math.abs(a.score) || b.messages.length - a.messages.length);
}

function groupDomains(signals: PalaceSignal[]): Record<DomainKey, PalaceSignal[]> {
  const domainEntries = Object.entries(DOMAIN_PALACES).map(([domain, palaces]) => {
    const domainSignals = signals.filter((signal) => {
      const palaceName = normalizePalaceName(signal.palaceName);
      return palaces.includes(signal.palaceName as never) || palaces.includes(palaceName as never);
    });

    return [domain, sortSignals(domainSignals)] as const;
  });

  return Object.fromEntries(domainEntries) as Record<DomainKey, PalaceSignal[]>;
}

function getActivatedPalaces(signals: PalaceSignal[]): string[] {
  return unique(
    sortSignals(signals)
      .filter((signal) => Math.abs(signal.score) >= 0.15 || signal.relation === "self")
      .map((signal) => normalizePalaceName(signal.palaceName)),
  ).slice(0, 5);
}

export function runRuleEngine(input: InterpretationInput): RuleEngineResult {
  const scoredSignals = input.signals
    .map((signal) => scoreSignal(signal, input.scope))
    .filter((signal) => TIME_WEIGHT[input.scope][signal.source] > 0);
  const score = Number(scoredSignals.reduce((total, signal) => total + signal.score, 0).toFixed(2));
  const sortedSignals = sortSignals(scoredSignals);

  return {
    input,
    signals: sortedSignals,
    score,
    level: getLevel(score, input.scope),
    activatedPalaces: getActivatedPalaces(sortedSignals),
    domains: groupDomains(sortedSignals),
  };
}
