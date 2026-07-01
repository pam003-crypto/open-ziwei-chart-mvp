export type StarMeaning = {
  positive: string[];
  negative: string[];
};

export const MAIN_STAR_MEANING: Record<string, StarMeaning> = {
  紫微: {
    positive: ["领导", "统筹", "权威", "资源整合"],
    negative: ["压力", "架子", "掌控欲", "责任重"],
  },
  天机: {
    positive: ["变化", "思考", "策划", "技术", "学习"],
    negative: ["多虑", "反复", "计划变动", "心神不定"],
  },
  太阳: {
    positive: ["曝光", "名声", "贵人", "男性长辈", "公开表达"],
    negative: ["消耗", "忙碌", "过度付出", "面子压力"],
  },
  武曲: {
    positive: ["财务", "执行", "纪律", "管理", "结果"],
    negative: ["强硬", "孤独", "压力", "金钱焦虑"],
  },
  天同: {
    positive: ["缓和", "享受", "人缘", "舒适", "贵人照顾"],
    negative: ["懒散", "拖延", "依赖", "抗压不足"],
  },
  廉贞: {
    positive: ["规则", "魅力", "边界", "管理", "感情吸引"],
    negative: ["纠纷", "桃花复杂", "规则压力", "执念"],
  },
  天府: {
    positive: ["稳定", "资源", "储蓄", "管理", "包容"],
    negative: ["保守", "迟缓", "享乐", "缺少突破"],
  },
  太阴: {
    positive: ["财富", "细腻", "内在", "女性贵人", "房产"],
    negative: ["敏感", "隐藏", "犹豫", "情绪化"],
  },
  贪狼: {
    positive: ["欲望", "社交", "才艺", "机会", "娱乐"],
    negative: ["贪多", "桃花", "应酬", "冲动消费"],
  },
  巨门: {
    positive: ["口才", "分析", "研究", "谈判", "表达"],
    negative: ["口舌", "误会", "争辩", "暗中不满"],
  },
  天相: {
    positive: ["制度", "协助", "贵人", "协调", "公正"],
    negative: ["被动", "受制", "看人脸色", "责任牵制"],
  },
  天梁: {
    positive: ["保护", "长辈", "名望", "化解", "原则"],
    negative: ["老成", "压力", "说教", "慢性问题"],
  },
  七杀: {
    positive: ["突破", "决断", "竞争", "改革", "行动力"],
    negative: ["冲突", "压力", "风险", "孤军奋战"],
  },
  破军: {
    positive: ["破旧立新", "改革", "转型", "开创"],
    negative: ["损耗", "变动", "分离", "先破后立"],
  },
};

export const MINOR_STAR_MEANING: Record<string, string[]> = {
  左辅: ["帮手", "协助", "团队支持", "贵人"],
  右弼: ["帮手", "协助", "团队支持", "贵人"],
  文昌: ["学习", "文书", "表达", "考试", "合同", "创作"],
  文曲: ["学习", "文书", "表达", "考试", "合同", "创作"],
  天魁: ["贵人", "机会", "被提携", "遇到帮助"],
  天钺: ["贵人", "机会", "被提携", "遇到帮助"],
  禄存: ["资源", "稳定财", "存量收益", "保守积累"],
  天马: ["变动", "奔波", "出差", "迁移", "行动"],
  擎羊: ["冲突", "刀锋", "急躁", "硬碰硬", "破损"],
  陀罗: ["拖延", "纠缠", "阻滞", "慢性压力"],
  火星: ["突发", "急躁", "爆发", "意外变化"],
  铃星: ["突发", "急躁", "爆发", "意外变化"],
  地空: ["落空", "损耗", "计划变化", "虚耗"],
  地劫: ["落空", "损耗", "计划变化", "虚耗"],
  天空: ["想法多", "虚浮", "变化", "精神性"],
  红鸾: ["感情", "人缘", "喜事", "关系升温"],
  天喜: ["感情", "人缘", "喜事", "关系升温"],
  咸池: ["桃花", "吸引力", "暧昧", "娱乐应酬"],
  天姚: ["桃花", "吸引力", "暧昧", "娱乐应酬"],
};

export const SUPPORT_STAR_SCORE: Record<string, number> = {
  左辅: 1,
  右弼: 1,
  文昌: 0.8,
  文曲: 0.8,
  天魁: 1.2,
  天钺: 1.2,
  禄存: 1.5,
  天马: 0.5,
  红鸾: 1,
  天喜: 1,
};

export const TOUGH_STAR_SCORE: Record<string, number> = {
  擎羊: -1.2,
  陀罗: -1.2,
  火星: -1,
  铃星: -1,
  地空: -1.3,
  地劫: -1.3,
};

export const BRIGHTNESS_SCORE: Record<string, number> = {
  庙: 0.8,
  旺: 0.6,
  得: 0.4,
  利: 0.2,
  平: 0,
  不: -0.3,
  陷: -0.8,
};

export function normalizeStarName(name: string): string {
  return name.replace(/^[运流年月日时]/, "");
}

export function getStarKeywords(name: string): string[] {
  const normalizedName = normalizeStarName(name);
  const mainMeaning = MAIN_STAR_MEANING[normalizedName];

  if (mainMeaning) {
    return [...mainMeaning.positive, ...mainMeaning.negative];
  }

  return MINOR_STAR_MEANING[normalizedName] ?? [];
}
