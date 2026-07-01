import { normalizePalaceName, PALACE_MEANING } from "./palaceMeaning";
import { normalizeStarName } from "./starMeaning";
import type {
  DisplayStar,
  InterpretationResult,
  InterpretationScope,
  InterpretationSection,
  PalaceBrief,
  PalaceSignal,
  RuleEngineResult,
} from "./types";

type SectionDomain =
  | "overview"
  | "career"
  | "wealth"
  | "relationship"
  | "health"
  | "risk"
  | "advice";

type InterpretationMessage = {
  id: string;
  basisKey: string;
  palaceName: string;
  domain: SectionDomain;
  source: string;
  reason: string;
  conclusion: string;
  advice?: string;
  priority: number;
};

const SECTION_TITLES: Record<SectionDomain, string> = {
  overview: "总体趋势",
  career: "事业",
  wealth: "财务",
  relationship: "感情 / 合作",
  health: "健康 / 压力",
  risk: "风险提醒",
  advice: "行动建议",
};

const DOMAIN_PALACES: Record<Exclude<SectionDomain, "overview" | "risk" | "advice">, string[]> = {
  career: ["官禄", "命宫", "迁移", "父母", "交友"],
  wealth: ["财帛", "田宅", "福德", "官禄", "迁移"],
  relationship: ["夫妻", "命宫", "福德", "交友", "子女"],
  health: ["疾厄", "命宫", "福德", "父母"],
};

const RISK_STARS = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫", "羊", "陀"]);
const IMPORTANT_STARS = new Set([
  ...RISK_STARS,
  "天马",
  "马",
  "文昌",
  "文曲",
  "昌",
  "曲",
  "左辅",
  "右弼",
  "天魁",
  "天钺",
  "魁",
  "钺",
  "红鸾",
  "天喜",
  "鸾",
  "喜",
  "禄存",
]);

const FORBIDDEN_WORDS: Record<string, string> = {
  必定: "容易",
  一定: "可能",
  绝对: "更倾向",
  注定: "倾向",
  大凶: "需谨慎",
  大灾: "波动较大",
  破产: "财务压力",
  离婚: "关系压力",
  必发财: "财务机会较明显",
};

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(cleanText).filter(Boolean)));
}

function cleanText(value: string): string {
  return Object.entries(FORBIDDEN_WORDS).reduce(
    (text, [word, replacement]) => text.replaceAll(word, replacement),
    value.trim(),
  );
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

  if (signal.source === "hour") {
    return "流时";
  }

  return "流年";
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

function palaceLabel(palaceName: string): string {
  return palaceName.endsWith("宫") ? palaceName : `${palaceName}宫`;
}

function starLabel(star: DisplayStar): string {
  const brightness = star.brightness ? `(${star.brightness})` : "";
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";

  return `${star.name}${brightness}${mutagen}`;
}

function signalStars(signal: PalaceSignal): string {
  return signal.stars.slice(0, 4).map(starLabel).join("、") || "少星或空宫";
}

function signalSignature(signal: PalaceSignal): string {
  const mutagens = signal.mutagens.map((mutagen) => `化${mutagen}`).join(",");
  const stars = signal.stars
    .slice(0, 4)
    .map((star) => normalizeStarName(star.name))
    .join(",");

  return mutagens || stars || "fallback";
}

function messagePriority(signal: PalaceSignal, signature: string): number {
  const relationBonus = signal.relation === "self" ? 8 : signal.relation === "triad" ? 5 : 3;
  const mutagenBonus = signature.startsWith("mutagen:") ? 12 : 0;
  const riskBonus =
    signature.includes("忌") || [...RISK_STARS].some((star) => signature.includes(star)) ? 10 : 0;

  return Math.round(Math.abs(signal.score) * 10 + relationBonus + mutagenBonus + riskBonus);
}

function evidenceLimit(scope: InterpretationScope, domain: SectionDomain): number {
  if (domain === "risk") {
    return scope === "day" || scope === "hour" ? 3 : 5;
  }

  if (scope === "day" || scope === "hour") {
    return 2;
  }

  if (scope === "month") {
    return 3;
  }

  return 4;
}

function suggestionLimit(scope: InterpretationScope, domain: SectionDomain): number {
  if (domain === "advice") {
    return 4;
  }

  if (scope === "day" || scope === "hour") {
    return 2;
  }

  return 3;
}

function isAllowedPalace(signal: PalaceSignal, palaces: string[]): boolean {
  const palaceName = normalizePalaceName(signal.palaceName);
  return palaces.includes(palaceName);
}

function isRiskSignal(signal: PalaceSignal): boolean {
  return (
    signal.score < 0 ||
    signal.mutagens.includes("忌") ||
    signal.stars.some((star) => RISK_STARS.has(normalizeStarName(star.name)))
  );
}

function keyForSignal(
  domain: SectionDomain,
  signal: PalaceSignal,
  signature: string,
): { id: string; basisKey: string } {
  const palaceName = normalizePalaceName(signal.palaceName);
  const basisKey = `${signal.source}:${palaceName}:${signature}`;

  return {
    id: `${domain}:${basisKey}`,
    basisKey,
  };
}

function getDomainText(
  domain: SectionDomain,
  palaceName: string,
  signature: string,
  signal: PalaceSignal,
): Pick<InterpretationMessage, "conclusion" | "advice"> {
  const hasRisk = signature.includes("忌") || signal.score < 0;
  const hasPower = signature.includes("权");
  const hasReputation = signature.includes("科");
  const hasResource = signature.includes("禄");
  const hasMovement = signature.includes("天马") || signature.includes("马");
  const hasTough = [...RISK_STARS].some((star) => signature.includes(star));

  if (domain === "risk") {
    if (hasTough) {
      return {
        conclusion: `${palaceLabel(palaceName)}见煞曜，相关事务容易有摩擦、催促或临时变化。`,
        advice: "建议先确认边界和时间表，重要事项保留记录，避免临场硬碰硬。",
      };
    }

    if (signature.includes("忌")) {
      return {
        conclusion: `${palaceLabel(palaceName)}见化忌，相关主题容易出现反复、拖延或信息不清。`,
        advice: "建议把承诺、金额、流程和责任人写清楚，给自己留出缓冲。",
      };
    }

    return {
      conclusion: `${palaceLabel(palaceName)}为负分信号，表示该领域需要降低冒进。`,
      advice: "建议先排查不确定因素，再决定是否推进。",
    };
  }

  if (domain === "career") {
    if (hasRisk) {
      return {
        conclusion: "事业事项容易卡在流程、沟通或责任边界上。",
        advice: "重要沟通留痕，项目推进前先确认边界、节点和交付标准。",
      };
    }

    if (hasPower) {
      return {
        conclusion: "事业推动力增强，责任、主导权或外部要求更容易被放大。",
        advice: "适合主动推进关键任务，但表达上留出协商空间。",
      };
    }

    if (hasReputation) {
      return {
        conclusion: "专业表达、汇报材料、评审和流程整理更容易成为重点。",
        advice: "适合整理方案、文档和证据链，让工作成果更容易被看见。",
      };
    }

    if (hasMovement) {
      return {
        conclusion: "外部事务、跨部门沟通或行程变动更容易带动工作节奏。",
        advice: "适合向外连接资源，同时给行程和沟通预留弹性。",
      };
    }

    if (hasResource) {
      return {
        conclusion: "事业相关资源、协作或支持感较容易出现。",
        advice: "适合主动汇报需求，把机会落到明确的事项和联系人上。",
      };
    }

    return {
      conclusion: `${palaceLabel(palaceName)}带动事业相关主题，工作事项容易被触发。`,
      advice: "建议把任务拆成可确认的小步骤，先处理最明确的环节。",
    };
  }

  if (domain === "wealth") {
    if (hasRisk) {
      return {
        conclusion: "财务事项需要注意支出、合同、回款或资源配置的不确定性。",
        advice: "不宜凭感觉做大额决定，先核对账目、条款和现金流。",
      };
    }

    if (hasReputation) {
      return {
        conclusion: "财务事项更适合走规范流程，利于账目、合同、报销、凭证整理。",
        advice: "适合核对收支、确认回款、整理票据，不宜冲动投资。",
      };
    }

    if (hasPower) {
      return {
        conclusion: "资源配置和支出安排更需要主动管理。",
        advice: "建议先定预算和优先级，再决定投入节奏。",
      };
    }

    if (hasResource) {
      return {
        conclusion: "财务资源、回款或收益线索较容易被看见。",
        advice: "适合整理收入结构，把机会落实到可执行的账目和合同。",
      };
    }

    return {
      conclusion: `${palaceLabel(palaceName)}牵动财务资源，适合做整理和盘点。`,
      advice: "建议保守评估收益与风险，先处理确定性高的财务事项。",
    };
  }

  if (domain === "relationship") {
    if (hasRisk) {
      return {
        conclusion: "关系或合作中容易出现误解、边界不清或旧问题反复。",
        advice: "建议减少试探，把需求、分工和期待说清楚。",
      };
    }

    if (hasPower) {
      return {
        conclusion: "关系中的主导权、责任分配和协作边界更容易被讨论。",
        advice: "适合先谈规则，再谈情绪，避免一方承担过多。",
      };
    }

    if (hasReputation) {
      return {
        conclusion: "沟通修复、体面表达和合作认可更容易成为重点。",
        advice: "适合用明确、克制的表达推进关系，不宜含糊带过。",
      };
    }

    if (hasResource) {
      return {
        conclusion: "互动意愿和合作温度较容易提升。",
        advice: "适合主动沟通、释放善意，也要把合作条件说清楚。",
      };
    }

    return {
      conclusion: `${palaceLabel(palaceName)}带动关系议题，互动和合作更容易被触发。`,
      advice: "建议用平实沟通推进，不急于用一次对话定调。",
    };
  }

  if (hasRisk || hasTough) {
    return {
      conclusion: "健康与压力主题更偏向作息、情绪和疲劳管理。",
      advice: "建议降低透支，关注睡眠、饮食和恢复节奏；现实健康问题以专业意见为准。",
    };
  }

  if (hasReputation || hasResource) {
    return {
      conclusion: "压力恢复条件相对温和，适合把状态调整放到日程里。",
      advice: "适合安排轻量运动、休息和规律饮食，减少无效消耗。",
    };
  }

  return {
    conclusion: `${palaceLabel(palaceName)}提示状态管理，重点在节奏、情绪和恢复。`,
    advice: "建议把事务排优先级，避免同时处理过多压力源。",
  };
}

function buildMessage(
  domain: SectionDomain,
  signal: PalaceSignal,
  signature: string,
  reason: string,
): InterpretationMessage {
  const palaceName = normalizePalaceName(signal.palaceName);
  const { id, basisKey } = keyForSignal(domain, signal, signature);
  const text = getDomainText(domain, palaceName, signature, signal);

  return {
    id,
    basisKey,
    palaceName,
    domain,
    source: sourceLabel(signal),
    reason: cleanText(reason),
    conclusion: cleanText(text.conclusion),
    advice: text.advice ? cleanText(text.advice) : undefined,
    priority: messagePriority(signal, signature),
  };
}

function buildSignalMessages(domain: SectionDomain, signal: PalaceSignal): InterpretationMessage[] {
  const palaceName = normalizePalaceName(signal.palaceName);
  const prefix = `${sourceLabel(signal)}${relationLabel(signal)}触发${palaceLabel(palaceName)}`;
  const mutagenMessages = signal.mutagens.map((mutagen) => {
    const mutagenStars = signal.stars.filter((star) => star.mutagen === mutagen);
    const starText =
      mutagenStars.length > 0
        ? mutagenStars.map((star) => starLabel(star)).join("、")
        : `化${mutagen}`;
    const starKey =
      mutagenStars.length > 0
        ? mutagenStars.map((star) => normalizeStarName(star.name)).join("+")
        : "unknown";

    return buildMessage(
      domain,
      signal,
      `mutagen:${mutagen}:${starKey}`,
      `${prefix}，见${starText}`,
    );
  });
  const starMessages = signal.stars
    .filter((star) => !star.mutagen && IMPORTANT_STARS.has(normalizeStarName(star.name)))
    .map((star) => {
      const starName = normalizeStarName(star.name);
      return buildMessage(
        domain,
        signal,
        `star:${starName}`,
        `${prefix}，星曜见${starLabel(star)}`,
      );
    });

  if (mutagenMessages.length > 0 || starMessages.length > 0) {
    return [...mutagenMessages, ...starMessages];
  }

  return [
    buildMessage(
      domain,
      signal,
      `fallback:${signalSignature(signal)}`,
      `${prefix}，星曜线索为${signalStars(signal)}`,
    ),
  ];
}

function dedupeMessages(messages: InterpretationMessage[]): InterpretationMessage[] {
  const seen = new Set<string>();
  const sorted = [...messages].sort((a, b) => b.priority - a.priority);

  return sorted.filter((message) => {
    const key = `${message.basisKey}:${message.reason}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function consumeUniqueMessages(
  messages: InterpretationMessage[],
  usedBasisKeys: Set<string>,
  limit: number,
): InterpretationMessage[] {
  const selected: InterpretationMessage[] = [];

  for (const message of dedupeMessages(messages)) {
    if (usedBasisKeys.has(message.basisKey)) {
      continue;
    }

    usedBasisKeys.add(message.basisKey);
    selected.push(message);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function domainSignals(
  result: RuleEngineResult,
  domain: Exclude<SectionDomain, "overview" | "risk" | "advice">,
): PalaceSignal[] {
  return result.signals.filter((signal) => isAllowedPalace(signal, DOMAIN_PALACES[domain]));
}

function domainScore(signals: PalaceSignal[]): number {
  return Number(signals.reduce((total, signal) => total + signal.score, 0).toFixed(2));
}

function fallbackSection(domain: SectionDomain, scope: InterpretationScope): InterpretationSection {
  const timeName = scopeName(scope);

  return {
    title: SECTION_TITLES[domain],
    conclusion: `${timeName}${SECTION_TITLES[domain]}线索不集中，适合先保持稳定节奏。`,
    evidences: ["当前周期未见明显集中触发。"],
    suggestions: ["建议先处理确定性高、成本低、可复核的事项。"],
  };
}

function sectionConclusion(
  domain: Exclude<SectionDomain, "overview" | "risk" | "advice">,
  messages: InterpretationMessage[],
  signals: PalaceSignal[],
  scope: InterpretationScope,
): string {
  const score = domainScore(signals);
  const timeName = scopeName(scope);
  const palaceText = unique(messages.map((message) => message.palaceName)).slice(0, 2).join("、");

  if (score < -0.8 || messages.some((message) => message.reason.includes("化忌"))) {
    if (domain === "career") {
      return `${timeName}事业推进需要注意流程确认，${palaceText || "相关宫位"}容易带来沟通或责任压力。`;
    }

    if (domain === "wealth") {
      return `${timeName}财务事项宜保守处理，${palaceText || "相关宫位"}提示账目、合同或现金流需要复核。`;
    }

    if (domain === "relationship") {
      return `${timeName}感情与合作不宜急于定调，${palaceText || "相关宫位"}提示边界和表达需要更清楚。`;
    }

    return `${timeName}健康与压力以管理节奏为主，${palaceText || "相关宫位"}提示恢复和作息需要优先。`;
  }

  if (score > 1.2) {
    if (domain === "career") {
      return `${timeName}事业适合主动推进，但仍需要把流程和责任边界确认清楚。`;
    }

    if (domain === "wealth") {
      return `${timeName}财务适合整理资源、账目和收益结构，先做确定性较高的安排。`;
    }

    if (domain === "relationship") {
      return `${timeName}感情与合作互动意愿较容易提升，适合用清楚表达推进关系。`;
    }

    return `${timeName}压力恢复条件较温和，适合主动调整作息和消耗节奏。`;
  }

  if (domain === "career") {
    return `${timeName}事业走势偏中性，关键在于把任务拆细并确认沟通边界。`;
  }

  if (domain === "wealth") {
    return `${timeName}财务走势偏中性，适合整理账目、预算和资源分配。`;
  }

  if (domain === "relationship") {
    return `${timeName}感情与合作适合平稳沟通，不宜把短期反应放大。`;
  }

  return `${timeName}健康与压力以稳定为主，适合关注休息、饮食和情绪恢复。`;
}

function buildDomainSection(
  domain: Exclude<SectionDomain, "overview" | "risk" | "advice">,
  result: RuleEngineResult,
  usedBasisKeys: Set<string>,
): InterpretationSection {
  const signals = domainSignals(result, domain);
  const messages = consumeUniqueMessages(
    signals.flatMap((signal) => buildSignalMessages(domain, signal)),
    usedBasisKeys,
    evidenceLimit(result.input.scope, domain),
  );

  if (messages.length === 0) {
    return fallbackSection(domain, result.input.scope);
  }

  return {
    title: SECTION_TITLES[domain],
    conclusion: cleanText(sectionConclusion(domain, messages, signals, result.input.scope)),
    evidences: unique(messages.map((message) => message.reason)).slice(
      0,
      evidenceLimit(result.input.scope, domain),
    ),
    suggestions: unique(messages.map((message) => message.advice || "")).slice(
      0,
      suggestionLimit(result.input.scope, domain),
    ),
  };
}

function buildRiskSection(
  result: RuleEngineResult,
  usedBasisKeys: Set<string>,
): InterpretationSection {
  const signals = result.signals.filter(isRiskSignal);
  const messages = consumeUniqueMessages(
    signals.flatMap((signal) => buildSignalMessages("risk", signal)),
    usedBasisKeys,
    evidenceLimit(result.input.scope, "risk"),
  );

  if (messages.length === 0) {
    return {
      title: SECTION_TITLES.risk,
      conclusion: signals.length > 0 ? "风险依据已在相关栏目提示，本栏不重复展开。" : "风险线索不集中。",
      evidences: signals.length > 0 ? ["相关风险宫位已在前文对应栏目说明。"] : ["当前周期未见明显集中触发。"],
      suggestions: ["涉及健康、法律、投资等现实问题时，请以专业意见和实际证据为准。"],
    };
  }

  return {
    title: SECTION_TITLES.risk,
    conclusion: `${scopeName(result.input.scope)}需要注意阻滞、冲突或计划变化，先处理最容易失控的细节。`,
    evidences: unique(messages.map((message) => message.reason)).slice(0, evidenceLimit(result.input.scope, "risk")),
    suggestions: unique([
      ...messages.map((message) => message.advice || ""),
      "涉及健康、法律、投资等现实问题时，请以专业意见和实际证据为准。",
    ]).slice(0, 3),
  };
}

function buildPalaceBriefs(signals: PalaceSignal[]): {
  primaryPalaces: PalaceBrief[];
  secondaryPalaces: PalaceBrief[];
} {
  const palaceMap = new Map<
    string,
    {
      palaceName: string;
      signedScore: number;
      strength: number;
      topSignal?: PalaceSignal;
    }
  >();

  signals.forEach((signal) => {
    const palaceName = normalizePalaceName(signal.palaceName);
    const current = palaceMap.get(palaceName) ?? {
      palaceName,
      signedScore: 0,
      strength: 0,
      topSignal: undefined,
    };

    current.signedScore += signal.score;
    current.strength += Math.abs(signal.score);

    if (!current.topSignal || Math.abs(signal.score) > Math.abs(current.topSignal.score)) {
      current.topSignal = signal;
    }

    palaceMap.set(palaceName, current);
  });

  const briefs = [...palaceMap.values()]
    .sort((a, b) => b.strength - a.strength)
    .map<PalaceBrief>((item) => {
      const meaning = PALACE_MEANING[item.palaceName];
      const topSignal = item.topSignal;
      const signalReason = topSignal
        ? `${sourceLabel(topSignal)}${relationLabel(topSignal)}带动，线索为${signalSignature(topSignal).replace("mutagen:", "化").replace("star:", "")}`
        : "当前周期被多层信号带动";

      return {
        palaceName: item.palaceName,
        reason: cleanText(`${meaning?.title ?? "相关主题"}：${signalReason}`),
        score: Number(item.signedScore.toFixed(2)),
      };
    });

  return {
    primaryPalaces: briefs.slice(0, 3),
    secondaryPalaces: briefs.slice(3, 5),
  };
}

function scopeIntro(
  scope: InterpretationScope,
  primaryPalaces: PalaceBrief[],
  level: string,
): string {
  const palaceText =
    primaryPalaces.length > 0
      ? primaryPalaces.map((palace) => palace.palaceName).join("、")
      : "命宫、官禄、财帛等核心宫位";

  if (scope === "natal") {
    return `综合命盘先看本命结构，主线落在${palaceText}，用于观察性格底色、行动方式和长期压力来源。`;
  }

  if (scope === "decade") {
    return `这步大限主线围绕${palaceText}展开，整体状态为${level}，适合看阶段重心和长期资源变化。`;
  }

  if (scope === "month") {
    return `这个月重点落在${palaceText}，整体状态为${level}，适合把年度目标拆成可执行事项。`;
  }

  if (scope === "day") {
    return `今天重点落在${palaceText}，适合作为短期节奏提示，先处理轻量沟通和确认事项。`;
  }

  if (scope === "hour") {
    return `这个时辰重点落在${palaceText}，更适合看临场节奏、沟通顺序和情绪缓冲。`;
  }

  return `这一年主线围绕${palaceText}展开，整体状态为${level}，适合从年度主轴安排资源和节奏。`;
}

function buildOverviewSection(
  result: RuleEngineResult,
  primaryPalaces: PalaceBrief[],
): InterpretationSection {
  const evidences =
    primaryPalaces.length > 0
      ? primaryPalaces.map((palace) => `${palace.palaceName}：${palace.reason}`)
      : ["当前周期未见明显集中触发。"];

  return {
    title: SECTION_TITLES.overview,
    conclusion: scopeIntro(result.input.scope, primaryPalaces, result.level),
    evidences: evidences.slice(0, evidenceLimit(result.input.scope, "overview")),
    suggestions: [
      result.input.scope === "day" || result.input.scope === "hour"
        ? "短周期以安排顺序和减少误会为主，不宜放大为长期判断。"
        : "先处理主线宫位对应事项，再观察辅助宫位带来的补充变化。",
    ],
  };
}

function palaceAdvice(palace: PalaceBrief): string {
  if (palace.palaceName === "官禄") {
    return "事业主线明显时，建议把目标、责任人和交付标准先写清楚。";
  }

  if (palace.palaceName === "财帛") {
    return "财务主线明显时，建议优先核对收支、合同、回款和预算。";
  }

  if (palace.palaceName === "迁移") {
    return "迁移主线明显时，外部沟通、出行和变动安排要预留弹性。";
  }

  if (palace.palaceName === "夫妻") {
    return "关系主线明显时，建议先讲清边界和期待，再推进合作或亲密议题。";
  }

  if (palace.palaceName === "疾厄") {
    return "压力主线明显时，建议把休息、饮食和恢复时间放进日程。";
  }

  if (palace.palaceName === "父母") {
    return "父母宫主线明显时，文书、证件、上级沟通和制度流程宜提前确认。";
  }

  return `${palace.palaceName}为主线时，建议先处理最明确、最可验证的事项。`;
}

function buildAdviceSection(
  result: RuleEngineResult,
  primaryPalaces: PalaceBrief[],
): InterpretationSection {
  const palaces = primaryPalaces.map((palace) => palace.palaceName).join("、") || "当前核心宫位";
  const suggestions = unique(primaryPalaces.map(palaceAdvice));

  return {
    title: SECTION_TITLES.advice,
    conclusion: `${scopeName(result.input.scope)}建议先围绕${palaces}安排行动，避免同时铺开过多主题。`,
    evidences:
      primaryPalaces.length > 0
        ? primaryPalaces
            .slice(0, 4)
            .map((palace) => `${palace.palaceName}分数 ${palace.score}：${palace.reason}`)
        : ["当前周期未见明显集中触发。"],
    suggestions: (suggestions.length > 0
      ? suggestions
      : ["建议先处理确定性高、可复核的小事项，再观察后续信号变化。"]
    ).slice(0, suggestionLimit(result.input.scope, "advice")),
  };
}

function buildSummary(result: RuleEngineResult, primaryPalaces: PalaceBrief[]): string {
  const topPalaces = primaryPalaces.map((palace) => palace.palaceName).join("、") || "核心宫位";

  if (result.input.scope === "natal") {
    return `${result.input.titleLabel}：主线宫位为${topPalaces}。以下内容基于本命宫位、星曜、四化与三方四正整理；点击上方大限、流年、流月、流日或流时后，会切换到对应周期解读。`;
  }

  return `${result.input.titleLabel}：主线宫位为${topPalaces}，整体状态为${result.level}。以下内容基于本地规则引擎、宫位、星曜、四化和运限层级生成，仅作传统命理参考。`;
}

export function renderInterpretation(result: RuleEngineResult): InterpretationResult {
  const usedBasisKeys = new Set<string>();
  const { primaryPalaces, secondaryPalaces } = buildPalaceBriefs(result.signals);

  return {
    scope: result.input.scope,
    title: result.input.titleLabel,
    score: result.score,
    level: result.level,
    summary: cleanText(buildSummary(result, primaryPalaces)),
    primaryPalaces,
    secondaryPalaces,
    sections: {
      overview: buildOverviewSection(result, primaryPalaces),
      career: buildDomainSection("career", result, usedBasisKeys),
      wealth: buildDomainSection("wealth", result, usedBasisKeys),
      relationship: buildDomainSection("relationship", result, usedBasisKeys),
      health: buildDomainSection("health", result, usedBasisKeys),
      risk: buildRiskSection(result, usedBasisKeys),
      advice: buildAdviceSection(result, primaryPalaces),
    },
  };
}
