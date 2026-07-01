import { MUTAGEN_MEANING, MUTAGEN_SCORE } from "./mutagenMeaning";
import { DOMAIN_PALACES, normalizePalaceName, PALACE_MEANING } from "./palaceMeaning";
import {
  BRIGHTNESS_SCORE,
  getStarKeywords,
  normalizeStarName,
  SUPPORT_STAR_SCORE,
  TOUGH_STAR_SCORE,
} from "./starMeaning";
import type {
  DisplayStar,
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

  if (score >= 6) {
    return "偏顺";
  }

  if (score >= 1) {
    return "中性";
  }

  if (score > -4) {
    return "需谨慎";
  }

  return "波动较大";
}

function starScore(star: DisplayStar): number {
  const starName = normalizeStarName(star.name);
  const brightnessScore = star.brightness ? BRIGHTNESS_SCORE[star.brightness] ?? 0 : 0;
  const mutagenScore = star.mutagen ? MUTAGEN_SCORE[star.mutagen] : 0;
  const supportScore = SUPPORT_STAR_SCORE[starName] ?? 0;
  const toughScore = TOUGH_STAR_SCORE[starName] ?? 0;

  if (starName === "禄") {
    return 1.5 + brightnessScore + mutagenScore;
  }

  if (starName === "马") {
    return 0.5 + brightnessScore + mutagenScore;
  }

  if (starName === "喜" || starName === "鸾") {
    return 1 + brightnessScore + mutagenScore;
  }

  if (starName === "昌" || starName === "曲") {
    return 0.8 + brightnessScore + mutagenScore;
  }

  if (starName === "魁" || starName === "钺") {
    return 1.2 + brightnessScore + mutagenScore;
  }

  if (starName === "羊" || starName === "陀") {
    return -1.2 + brightnessScore + mutagenScore;
  }

  return supportScore + toughScore + brightnessScore + mutagenScore;
}

function hasStar(signal: PalaceSignal, names: string[]): boolean {
  return signal.stars.some((star) => names.includes(normalizeStarName(star.name)));
}

function hasToughStar(signal: PalaceSignal): boolean {
  return signal.stars.some((star) => {
    const name = normalizeStarName(star.name);
    return Boolean(TOUGH_STAR_SCORE[name] || name === "羊" || name === "陀");
  });
}

function hasMutagen(signal: PalaceSignal, mutagen: Mutagen): boolean {
  return signal.mutagens.includes(mutagen);
}

function buildPalaceMutagenMessage(palaceName: string, mutagen: Mutagen): string {
  const normalizedPalace = normalizePalaceName(palaceName);
  const mutagenText = MUTAGEN_MEANING[mutagen].description;

  if (normalizedPalace === "官禄") {
    if (mutagen === "禄") {
      return "官禄见化禄，工作机会和资源支持感增强，适合主动汇报、推进项目或争取协作。";
    }

    if (mutagen === "权") {
      return "官禄见化权，工作责任和推动压力会更明显，适合承担关键任务，也要避免过度强硬。";
    }

    if (mutagen === "科") {
      return "官禄见化科，有利汇报、评审、考试、文书和专业形象，适合把流程整理清楚。";
    }

    return "官禄见化忌，工作上容易有流程卡顿、沟通误会或责任牵制，重要事项建议留痕确认。";
  }

  if (normalizedPalace === "财帛") {
    if (mutagen === "禄") {
      return "财帛见化禄，财务方面较容易出现资源流入、回款或收益线索，适合整理收入结构。";
    }

    if (mutagen === "权") {
      return "财帛见化权，财务决策、支出安排和资源配置压力增加，需要主动管理现金流。";
    }

    if (mutagen === "科") {
      return "财帛见化科，适合处理账目、合同、报销、凭证和稳定收益相关事务。";
    }

    return "财帛见化忌，财务上要谨慎冲动消费、借贷、人情开销和不确定投入。";
  }

  if (normalizedPalace === "夫妻") {
    if (mutagen === "禄") {
      return "夫妻见化禄，感情或合作互动更容易有温度，适合主动沟通和释放善意。";
    }

    if (mutagen === "权") {
      return "夫妻见化权，关系中主导权和责任分配更突出，合作事务需要先说清边界。";
    }

    if (mutagen === "科") {
      return "夫妻见化科，有利体面表达、沟通修复和合作关系的公开认可。";
    }

    return "夫妻见化忌，关系里容易有误解或旧问题反复，建议少试探，多把重点说清楚。";
  }

  if (normalizedPalace === "疾厄" && mutagen === "忌") {
    return "疾厄见化忌，重点不是疾病判断，而是压力管理，建议关注睡眠、饮食、情绪和疲劳积累。";
  }

  if (normalizedPalace === "迁移") {
    if (mutagen === "忌") {
      return "迁移见化忌，外部环境、交通行程或对外沟通容易有压力，出行和合同细节宜提前确认。";
    }

    if (mutagen === "禄") {
      return "迁移见化禄，外部机会、人脉连接和异地资源较容易被触发，适合向外拓展。";
    }
  }

  if (normalizedPalace === "父母") {
    if (mutagen === "科") {
      return "父母见化科，有利文书、证件、考试、制度流程，也较容易得到长辈或上级帮助。";
    }

    if (mutagen === "忌") {
      return "父母见化忌，文书、审批、上级沟通或制度流程可能较费心，建议预留时间。";
    }
  }

  return `${palaceName}见化${mutagen}，${mutagenText}`;
}

function buildStarMessages(signal: PalaceSignal): string[] {
  const palaceName = normalizePalaceName(signal.palaceName);
  const messages: string[] = [];

  if (palaceName === "迁移" && hasStar(signal, ["天马", "马"])) {
    messages.push("迁移宫见天马或流马，出行、搬动、外部机会和奔波感会增加，行程安排宜留弹性。");
  }

  if (palaceName === "疾厄" && hasToughStar(signal)) {
    messages.push("疾厄宫见煞曜，健康层面更适合看压力、作息和情绪管理，不作疾病结论。");
  }

  if (hasMutagen(signal, "忌") && hasToughStar(signal)) {
    messages.push("本周期同时见化忌与煞曜，容易出现阻滞、冲突或计划变化，重要事情建议提前确认细节。");
  }

  if (palaceName === "夫妻" && hasStar(signal, ["红鸾", "天喜", "鸾", "喜"])) {
    messages.push("关系宫位见喜庆或人缘星，互动意愿提升，适合安排沟通、见面或合作推进。");
  }

  if (palaceName === "官禄" && hasStar(signal, ["文昌", "文曲", "昌", "曲"])) {
    messages.push("事业宫位见昌曲，文书、汇报、学习、考试、表达和材料整理更值得重视。");
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
    buildPalaceMutagenMessage(signal.palaceName, mutagen),
  );
  const starMessages = buildStarMessages(signal);
  const fallback = mutagenMessages.length === 0 && starMessages.length === 0 ? [buildFallbackMessage(signal)] : [];

  return unique([...mutagenMessages, ...starMessages, ...fallback]);
}

function scoreSignal(signal: PalaceSignal, scope: InterpretationScope): PalaceSignal {
  const relationWeight = RELATION_WEIGHT[signal.relation];
  const timeWeight = TIME_WEIGHT[scope][signal.source];
  const rawScore = signal.stars.reduce((score, star) => score + starScore(star), 0);
  const adjustedScore = rawScore * relationWeight * timeWeight;

  return {
    ...signal,
    score: Number(adjustedScore.toFixed(2)),
    tags: unique([
      ...signal.tags,
      ...signal.stars.flatMap((star) => getStarKeywords(star.name)),
      ...signal.messages,
    ]),
    messages: buildMessages(signal),
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
  ).slice(0, 6);
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
