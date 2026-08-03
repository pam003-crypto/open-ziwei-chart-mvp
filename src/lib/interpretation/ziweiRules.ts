import type { DisplayStar, Mutagen, SignalSource } from "./types";

export const ZIWEI_RULESET = {
  id: "ziwei-skill-2026-08-03",
  label: "中州派星系条件矩阵",
  order: ["原局星系", "目标宫位", "三方四正", "辅煞四化", "庙旺修饰", "大限流年", "现实复核"],
  disclaimer:
    "规则用于学习传统文本的内部推理，不作医疗、法律、投资、关系或人生事件的确定预测。",
} as const;

export type MajorStarRule = {
  axes: string[];
  audit: string;
};

export const MAJOR_STAR_RULES: Record<string, MajorStarRule> = {
  紫微: { axes: ["统摄", "领导", "决断", "资源中心"], audit: "领导是否具备支持、授权与制衡，而非形成孤立决断？" },
  天机: { axes: ["策划", "机动", "思考", "变通"], audit: "计划能否落地并持续，变化是主动调整还是反复消耗？" },
  太阳: { axes: ["外显", "声望", "承担", "公共表达"], audit: "可见度与责任是否有支持，是否出现过度承担或声誉成本？" },
  武曲: { axes: ["执行", "财务", "决断", "规则"], audit: "收入、现金流、资产、成本和协作是否被分别管理？" },
  天同: { axes: ["调和", "舒缓", "享受", "顺应"], audit: "当前舒缓是在恢复能力，还是形成拖延、依赖或目标松散？" },
  廉贞: { axes: ["规范", "敏感", "关系", "取舍"], audit: "权力、欲望、利益与制度边界是否清楚？" },
  天府: { axes: ["储备", "治理", "稳定", "信誉"], audit: "储备和信誉是否真实，是否缺少行动、增长或流动性？" },
  太阴: { axes: ["内在资源", "细节", "感受", "经营"], audit: "信息、情绪和资源是在稳妥筹划，还是停留在封闭与犹豫？" },
  贪狼: { axes: ["动机", "社交", "才艺", "变化"], audit: "多元动机是否受目标、预算与边界约束，还是被冲动放大？" },
  巨门: { axes: ["辨析", "表达", "研究", "信息竞争"], audit: "沟通是否专业、可记录并可澄清，还是增加口舌与信息成本？" },
  天相: { axes: ["协调", "制度", "辅弼", "公私边界"], audit: "协调角色是否有清楚授权、主导者和完整支持网络？" },
  天梁: { axes: ["原则", "监察", "调停", "庇护"], audit: "原则是否形成可信制度，还是增加负担、人际距离或过度说教？" },
  七杀: { axes: ["开创", "高压", "权威", "执行锋芒"], audit: "行动是否具备授权、资源、安全边界、耐力和停止条件？" },
  破军: { axes: ["变革", "重组", "开创", "额外负担"], audit: "退出旧结构与承接新结构的资源、节奏和回退方案是否齐备？" },
};

export const STAR_ALIASES: Record<string, string> = {
  昌: "文昌",
  曲: "文曲",
  魁: "天魁",
  钺: "天钺",
  禄: "禄存",
  马: "天马",
  羊: "擎羊",
  陀: "陀罗",
  鸾: "红鸾",
  喜: "天喜",
};

export const AUXILIARY_STAR_KEYWORDS: Record<string, string[]> = {
  左辅: ["协作", "执行支持", "团队配合"],
  右弼: ["协作", "执行支持", "团队配合"],
  天魁: ["制度机会", "资格窗口", "上级支持"],
  天钺: ["制度机会", "资格窗口", "上级支持"],
  文昌: ["学习", "文书", "表达", "可验证成果"],
  文曲: ["学习", "策划", "表达", "可验证成果"],
  禄存: ["资源来源", "持有能力", "稳定积累", "关系成本"],
  天马: ["移动", "迁动", "执行节奏", "外部连接"],
  三台: ["组织认可", "职位可见度"],
  八座: ["组织认可", "职位可见度"],
  龙池: ["设计", "才艺", "文明表达"],
  凤阁: ["设计", "才艺", "文明表达"],
  恩光: ["奖励", "专业认可", "资格"],
  天贵: ["奖励", "专业认可", "资格"],
  台辅: ["声望", "荣誉", "商誉"],
  封诰: ["声望", "荣誉", "商誉"],
  红鸾: ["互动意愿", "关系温度", "社交连接"],
  天喜: ["互动意愿", "关系温度", "社交连接"],
};

export type SupportPairRule = {
  names: [string, string];
  complete: string;
  incomplete: string;
  weight: number;
};

export const SUPPORT_PAIR_RULES: SupportPairRule[] = [
  { names: ["左辅", "右弼"], complete: "协作与执行支持较完整", incomplete: "协作支持偏单侧，需核对分工是否对称", weight: 0.35 },
  { names: ["天魁", "天钺"], complete: "制度、资格与提携路径较完整", incomplete: "制度机会存在，但实际授权或承接条件仍需核对", weight: 0.35 },
  { names: ["文昌", "文曲"], complete: "学习、表达与文书能力较完整", incomplete: "表达或策划偏一侧，需核对成果能否落地", weight: 0.3 },
  { names: ["三台", "八座"], complete: "组织认可与职位可见度形成呼应", incomplete: "认可线索偏单侧，不宜直接推成职位结果", weight: 0.12 },
  { names: ["龙池", "凤阁"], complete: "才艺、设计与表达形成呼应", incomplete: "才艺线索偏单侧，仍需作品与现实反馈验证", weight: 0.12 },
  { names: ["恩光", "天贵"], complete: "奖励、资格与专业认可形成呼应", incomplete: "认可线索偏单侧，仍需资格与成果验证", weight: 0.12 },
  { names: ["台辅", "封诰"], complete: "声望与组织认可形成呼应", incomplete: "声誉线索偏单侧，仍需实际职责与成果承接", weight: 0.1 },
];

export type RiskStarRule = {
  category: "直接冲突" | "长期消耗" | "急性变化" | "反复压力" | "资源缺口";
  audit: string;
  score: number;
};

export const RISK_STAR_RULES: Record<string, RiskStarRule> = {
  擎羊: { category: "直接冲突", audit: "核对竞争、急迫执行、尖锐沟通与合规边界。", score: -0.35 },
  陀罗: { category: "长期消耗", audit: "核对拖延、隐性阻力、长期成本与未披露利益冲突。", score: -0.35 },
  火星: { category: "急性变化", audit: "核对仓促决策、临时成本、激烈对抗与安全预案。", score: -0.3 },
  铃星: { category: "反复压力", audit: "核对长期积怨、反复压力、沟通后遗与恢复条件。", score: -0.3 },
  地空: { category: "资源缺口", audit: "核对计划、资产、支持或预期是否缺乏实质承接。", score: -0.4 },
  地劫: { category: "资源缺口", audit: "核对现金、时间、人员与支持是否存在耗损或落空。", score: -0.4 },
};

export type ZiweiMutagenRule = {
  core: string[];
  mechanism: string;
  audit: string;
  score: number;
};

export const ZIWEI_MUTAGEN_RULES: Record<Mutagen, ZiweiMutagenRule> = {
  禄: { core: ["资源", "机会", "便利", "动机"], mechanism: "资源与动机被加强", audit: "资源从何而来、能否留存、附带什么成本？", score: 0.55 },
  权: { core: ["主动", "主导", "执行", "影响力"], mechanism: "权责与推动力被加强", audit: "是正式授权、实际能力，还是过度控制与责任集中？", score: 0.2 },
  科: { core: ["认可", "条理", "专业", "信誉"], mechanism: "专业表达与认可被加强", audit: "是否有作品、证照、流程或可验证成果承接？", score: 0.4 },
  忌: { core: ["波折", "延误", "损耗", "复核"], mechanism: "阻力与复核需求被加强", audit: "阻力落在资源、计划、表达还是关系，能否通过现实证据复核？", score: -0.65 },
};

export const BRIGHTNESS_RULES: Record<string, string> = {
  庙: "环境适配度较高，星系作用较容易发挥",
  旺: "环境适配度较高，作用表现较明显",
  得: "环境适配度尚可，仍需组合与现实条件承接",
  利: "环境条件略有支持，不构成单独结论",
  平: "环境修饰相对中性",
  闲: "环境适配度偏弱，需更多支持条件",
  不: "环境适配度偏弱，需更多支持条件",
  陷: "环境适配度较低，压力或限制更值得复核",
};

export const SOURCE_LAYER_RULES: Record<SignalSource, string> = {
  natal: "原局底色",
  decade: "阶段条件",
  year: "年度触发",
  month: "月度补充",
  day: "短期观察",
  hour: "临场提示",
};

export function normalizeZiweiStarName(name: string): string {
  const stripped = name
    .trim()
    .replace(/^(?:运|流年|流月|流日|流时|流)+/, "");

  return STAR_ALIASES[stripped] ?? stripped;
}

export function getMainStarSystem(stars: DisplayStar[]): {
  names: string[];
  label: string;
  axes: string[];
  audits: string[];
} {
  const names = Array.from(
    new Set(
      stars
        .filter((star) => star.type === "main")
        .map((star) => normalizeZiweiStarName(star.name))
        .filter((name) => Boolean(MAJOR_STAR_RULES[name])),
    ),
  );

  return {
    names,
    label: names.join("、"),
    axes: Array.from(new Set(names.flatMap((name) => MAJOR_STAR_RULES[name].axes))),
    audits: names.map((name) => MAJOR_STAR_RULES[name].audit),
  };
}

export function getSupportStructure(stars: DisplayStar[]): {
  complete: SupportPairRule[];
  incomplete: Array<{ rule: SupportPairRule; present: string }>;
} {
  const names = new Set(stars.map((star) => normalizeZiweiStarName(star.name)));
  const complete: SupportPairRule[] = [];
  const incomplete: Array<{ rule: SupportPairRule; present: string }> = [];

  SUPPORT_PAIR_RULES.forEach((rule) => {
    const present = rule.names.filter((name) => names.has(name));

    if (present.length === 2) {
      complete.push(rule);
    } else if (present.length === 1) {
      incomplete.push({ rule, present: present[0] });
    }
  });

  return { complete, incomplete };
}

export function getRiskFactors(stars: DisplayStar[]): Array<{ name: string; rule: RiskStarRule }> {
  const seen = new Set<string>();

  return stars.flatMap((star) => {
    const name = normalizeZiweiStarName(star.name);
    const rule = RISK_STAR_RULES[name];

    if (!rule || seen.has(name)) {
      return [];
    }

    seen.add(name);
    return [{ name, rule }];
  });
}
