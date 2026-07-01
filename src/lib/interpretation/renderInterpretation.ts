import { normalizePalaceName, PALACE_MEANING } from "./palaceMeaning";
import type {
  DomainKey,
  InterpretationResult,
  InterpretationScope,
  PalaceSignal,
  RuleEngineResult,
} from "./types";

const DOMAIN_TITLE: Record<DomainKey, string> = {
  career: "事业",
  wealth: "财务",
  relationship: "感情与合作",
  health: "健康与压力",
  family: "家庭资产",
};

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function scopeName(scope: InterpretationScope): string {
  if (scope === "natal") {
    return "本命结构";
  }

  if (scope === "decade") {
    return "这步大限";
  }

  if (scope === "month") {
    return "这个月";
  }

  if (scope === "day") {
    return "今天";
  }

  if (scope === "hour") {
    return "这个时辰";
  }

  return "这一年";
}

function scopeIntro(scope: InterpretationScope, activatedPalaces: string[], level: string): string {
  const palaces = activatedPalaces.length > 0 ? activatedPalaces.join("、") : "命宫、官禄、财帛等核心宫位";

  if (scope === "natal") {
    return `综合命盘先看本命结构，重点落在${palaces}。此处用于观察性格底色、行动方式、事业财务、关系互动与压力来源，不对应某一个具体年份。`;
  }

  if (scope === "decade") {
    return `这步大限主要围绕${palaces}展开。整体状态为${level}，适合看阶段主轴、资源变化和长期重心，不宜直接当作单一年份事件。`;
  }

  if (scope === "month") {
    return `这个月是年度主题中的一个触发阶段，重点落在${palaces}。整体状态为${level}，适合观察具体事务如何推进，尤其注意沟通、节奏和资源分配。`;
  }

  if (scope === "day") {
    return `今天更适合看作短期状态提示，不宜用来判断长期结果。当天重点在${palaces}，适合处理轻量事务、沟通安排和节奏调整。`;
  }

  if (scope === "hour") {
    return `这个时辰更适合看临场状态和短时节奏，重点落在${palaces}。它只能作为当下安排参考，不宜放大为长期结论。`;
  }

  return `这一年主要围绕${palaces}展开。整体来看为${level}，若能顺势处理相关领域，会比被动等待更有利。`;
}

function topMessages(signals: PalaceSignal[], limit: number): string[] {
  return unique(signals.flatMap((signal) => signal.messages)).slice(0, limit);
}

function domainScore(signals: PalaceSignal[]): number {
  return signals.reduce((total, signal) => total + signal.score, 0);
}

function relationLabel(signal: PalaceSignal): string {
  if (signal.relation === "self") {
    return "本宫";
  }

  if (signal.relation === "triad") {
    return "三方";
  }

  if (signal.relation === "opposite") {
    return "对宫";
  }

  return "邻宫";
}

function sourceLabel(signal: PalaceSignal): string {
  if (signal.source === "natal") {
    return "本命";
  }

  if (signal.source === "decade") {
    return "大限";
  }

  if (signal.source === "month") {
    return "流月";
  }

  if (signal.source === "day") {
    return "流日";
  }

  return "流年";
}

function describeActivatedPalaces(signals: PalaceSignal[]): string[] {
  const rows = signals.slice(0, 8).map((signal) => {
    const palaceName = normalizePalaceName(signal.palaceName);
    const meaning = PALACE_MEANING[signal.palaceName] ?? PALACE_MEANING[palaceName];
    const starText = signal.stars
      .slice(0, 4)
      .map((star) => `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? `化${star.mutagen}` : ""}`)
      .join("、");

    return `${sourceLabel(signal)}${relationLabel(signal)}触发${palaceName}，对应${meaning?.title ?? "相关领域"}；星曜线索为${starText || "少星或空宫"}。`;
  });

  return unique(rows);
}

function fallbackByDomain(domain: DomainKey, scope: InterpretationScope): string {
  const timeName = scopeName(scope);

  if (domain === "career") {
    return `${timeName}事业信息不算特别集中，适合先处理已有工作、汇报和协作节奏。`;
  }

  if (domain === "wealth") {
    return `${timeName}财务线索偏平稳，适合做账目整理、预算控制和资源盘点。`;
  }

  if (domain === "relationship") {
    return `${timeName}关系线索不算强，适合用平实沟通维持合作和亲密互动。`;
  }

  if (domain === "health") {
    return `${timeName}健康层面以压力管理为主，建议关注作息、饮食、情绪和疲劳恢复。`;
  }

  return `${timeName}家庭与资产议题可先保持稳定，重要事务以确认细节为宜。`;
}

function domainOpening(domain: DomainKey, signals: PalaceSignal[], scope: InterpretationScope): string {
  const score = domainScore(signals);
  const timeName = scopeName(scope);

  if (signals.length === 0) {
    return fallbackByDomain(domain, scope);
  }

  if (score >= 1.5) {
    if (domain === "career") {
      return `${timeName}事业方面有推进机会，适合主动汇报、争取资源、推进项目或处理重要工作。`;
    }

    if (domain === "wealth") {
      return `${timeName}财务方面较容易出现资源、回款或整理收益结构的机会。`;
    }

    if (domain === "relationship") {
      return `${timeName}感情和合作关系较容易升温，适合主动沟通、表达善意或推进合作。`;
    }

    if (domain === "health") {
      return `${timeName}压力恢复条件较好，适合调整作息、运动节奏和情绪出口。`;
    }
  }

  if (score <= -1) {
    if (domain === "career") {
      return `${timeName}工作上容易遇到流程卡顿、沟通误会或责任压力，重要事项建议留痕确认。`;
    }

    if (domain === "wealth") {
      return `${timeName}财务方面需要谨慎，尤其注意冲动消费、借贷、人情开销和不确定投入。`;
    }

    if (domain === "relationship") {
      return `${timeName}关系中容易有误解或旧问题反复，建议减少试探，重要话题说清楚。`;
    }

    if (domain === "health") {
      return `${timeName}健康方面重点不在疾病判断，而在压力管理，建议关注睡眠、情绪、饮食和疲劳积累。`;
    }
  }

  return `${timeName}${DOMAIN_TITLE[domain]}走势偏中性，关键在于把相关事项拆细处理，不宜用单一事件放大判断。`;
}

function buildDomainSection(domain: DomainKey, signals: PalaceSignal[], scope: InterpretationScope): string[] {
  return unique([
    domainOpening(domain, signals, scope),
    ...topMessages(signals, 4),
  ]).slice(0, 5);
}

function buildRiskSection(result: RuleEngineResult): string[] {
  const riskSignals = result.signals.filter(
    (signal) =>
      signal.score < -0.3 ||
      signal.mutagens.includes("忌") ||
      signal.tags.some((tag) => ["擎羊", "陀罗", "火星", "铃星", "地空", "地劫", "羊", "陀"].includes(tag)),
  );
  const messages = topMessages(riskSignals, 5);
  const scopeText = result.input.scope === "natal" ? "本命结构" : "本周期";

  return unique([
    ...messages,
    riskSignals.length > 0
      ? `${scopeText}里容易出现阻滞、冲突或计划变化，重要事情建议提前确认细节，避免临时决定。`
      : "风险线索不算集中，但仍建议对合同、账目、行程和沟通记录保持清楚。",
    "涉及健康、法律、投资等现实问题时，请以专业意见和实际证据为准。",
  ]).slice(0, 6);
}

function buildAdvice(result: RuleEngineResult): string[] {
  const timeName = scopeName(result.input.scope);
  const hasRisk = result.signals.some((signal) => signal.score < -0.5 || signal.mutagens.includes("忌"));
  const hasSupport = result.signals.some((signal) => signal.score > 0.8 || signal.mutagens.includes("禄") || signal.mutagens.includes("科"));
  const advice = [
    `${timeName}先抓最明确的宫位主题：${result.activatedPalaces.join("、") || "命宫与当前运限宫位"}。`,
  ];

  if (hasSupport) {
    advice.push("有禄、科或贵人星时，适合把资源、文书、汇报和协作机会具体化。");
  }

  if (hasRisk) {
    advice.push("见忌或煞曜时，建议降低情绪化反应，重要决定多做确认和备选方案。");
  }

  if (result.input.scope === "natal") {
    advice.push("综合命盘适合先看长期结构，后续再通过大限、流年、流月、流日观察具体触发。");
  } else if (result.input.scope === "day") {
    advice.push("流日只作为短期节奏提示，适合安排沟通、整理、确认和轻量执行。");
  } else if (result.input.scope === "month") {
    advice.push("流月适合看阶段推进，把年度目标拆成当月可执行的事项会更稳。");
  } else if (result.input.scope === "decade") {
    advice.push("大限适合看阶段重心，重要规划宜放在长期资源、身份变化和持续投入上观察。");
  } else if (result.input.scope === "hour") {
    advice.push("流时适合看临场节奏，可用于安排沟通顺序、短时执行和情绪缓冲。");
  } else {
    advice.push("流年适合看年度主轴，重要规划宜结合大限背景和现实条件慢慢推进。");
  }

  return unique(advice).slice(0, 5);
}

function buildSummary(result: RuleEngineResult): string {
  const topPalaces = result.activatedPalaces.join("、") || "核心宫位";

  if (result.input.scope === "natal") {
    return `${result.input.titleLabel}：重点宫位为${topPalaces}。以下内容基于本命宫位、星曜、四化与三方四正整理，用来观察长期结构；点击上方大限、流年、流月、流日或流时后，才会切换到对应周期解读。`;
  }

  return `${result.input.titleLabel}：重点宫位为${topPalaces}，整体状态为${result.level}。以下内容基于本地规则引擎、宫位、星曜、四化和运限层级生成，仅作传统命理参考。`;
}

export function renderInterpretation(result: RuleEngineResult): InterpretationResult {
  const overview = unique([
    scopeIntro(result.input.scope, result.activatedPalaces, result.level),
    ...topMessages(result.signals, 4),
  ]).slice(0, 6);

  return {
    scope: result.input.scope,
    title: result.input.titleLabel,
    score: result.score,
    level: result.level,
    summary: buildSummary(result),
    activatedPalaces: result.activatedPalaces,
    sections: {
      overview,
      career: buildDomainSection("career", result.domains.career, result.input.scope),
      wealth: buildDomainSection("wealth", result.domains.wealth, result.input.scope),
      relationship: buildDomainSection("relationship", result.domains.relationship, result.input.scope),
      health: buildDomainSection("health", result.domains.health, result.input.scope),
      risk: buildRiskSection(result),
      advice: buildAdvice(result),
    },
  };
}
