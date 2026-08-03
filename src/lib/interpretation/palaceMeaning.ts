export type PalaceMeaning = {
  title: string;
  keywords: string[];
  description: string;
  relatedPalaces: string[];
  auditQuestions: string[];
};

export const PALACE_MEANING: Record<string, PalaceMeaning> = {
  命宫: {
    title: "行动与角色",
    keywords: ["行动方式", "角色承担", "主观优先级", "环境互动"],
    description: "命宫用于观察星系如何组织行动、角色与支持结构，不是单星性格标签。",
    relatedPalaces: ["身宫", "财帛", "官禄", "迁移", "福德"],
    auditQuestions: ["主星组合、三方四正与支持结构是否互相呼应？", "当前行动是否有资源、边界与现实反馈承接？"],
  },
  兄弟: {
    title: "同辈与合作",
    keywords: ["同辈", "伙伴", "互助", "权责", "合作网络"],
    description: "兄弟宫兼看手足、同侪与合作网络，重点是互助、主导权与关系对称性。",
    relatedPalaces: ["命宫", "交友", "官禄"],
    auditQuestions: ["现实对象是手足、朋友还是商业伙伴？", "支持是否完整，权责与资源是否对称？"],
  },
  夫妻: {
    title: "亲密与合作机制",
    keywords: ["亲密关系", "合作", "权力", "资源", "情绪", "边界"],
    description: "夫妻宫先读权力、资源、沟通与支持机制，不直接推定婚姻结果。",
    relatedPalaces: ["命宫", "福德", "官禄", "田宅"],
    auditQuestions: ["主导权、资源共享与责任分配是否清楚？", "辅佐是否完整，压力信号是否叠加并有现实证据？"],
  },
  子女: {
    title: "晚辈与传承",
    keywords: ["子女", "晚辈", "带教", "作品", "传承", "责任"],
    description: "子女宫用于观察下一代、晚辈、作品与传承网络中的支持、距离和责任。",
    relatedPalaces: ["命宫", "财帛", "田宅", "父母"],
    auditQuestions: ["当前讨论的是亲子、带教、作品还是传承？", "支持、距离、沟通和资源投入是否匹配？"],
  },
  财帛: {
    title: "资源治理",
    keywords: ["取得资源", "现金流", "波动", "留存", "配置", "契约"],
    description: "财帛宫应拆成资源取得、波动承受、财富留存和配置治理，不等同收入高低。",
    relatedPalaces: ["官禄", "福德", "夫妻", "田宅"],
    auditQuestions: ["收入、现金流、资产与支出是否被分别核对？", "职业路径、契约、伙伴和风险承受条件是否齐备？"],
  },
  疾厄: {
    title: "压力与照护",
    keywords: ["压力", "作息", "恢复", "照护", "现实健康资料"],
    description: "疾厄宫只用于传统压力结构的研究；现实健康问题必须依据症状、检查与专业医疗意见。",
    relatedPalaces: ["命宫", "福德", "父母"],
    auditQuestions: ["是否已有可观察的压力、作息或恢复问题？", "是否需要体检、就医或其他专业支持？"],
  },
  迁移: {
    title: "外部场域",
    keywords: ["外部环境", "移动", "异地", "出行", "合作", "风险预案"],
    description: "迁移宫观察外部场域、较长期移动与陌生环境中的机会和压力。",
    relatedPalaces: ["命宫", "官禄", "财帛"],
    auditQuestions: ["当前问题是长期外移还是短期出行？", "目的、技能、网络、资金、安全与合规条件是否匹配？"],
  },
  交友: {
    title: "团队与协作者",
    keywords: ["团队", "下属", "协作者", "客户", "权责", "治理"],
    description: "交友宫优先观察团队、下属、客户与协作者的权责、信任和治理结构。",
    relatedPalaces: ["兄弟", "官禄", "命宫"],
    auditQuestions: ["执行支持、应酬网络与长期信任是否被分开验证？", "授权、制衡、内控与沟通机制是否清楚？"],
  },
  仆役: {
    title: "团队与协作者",
    keywords: ["团队", "下属", "协作者", "客户", "权责", "治理"],
    description: "古称仆役宫，现代优先观察团队与协作者的权责、信任和治理结构。",
    relatedPalaces: ["兄弟", "官禄", "命宫"],
    auditQuestions: ["执行支持与长期信任是否有现实证据？", "授权、制衡、内控与沟通机制是否清楚？"],
  },
  官禄: {
    title: "职业与组织角色",
    keywords: ["职业角色", "组织位置", "工作方式", "专业路径", "授权", "转型"],
    description: "事业宫描述工作方式、组织角色与专业路径，必须与命宫、财帛及合作条件联读。",
    relatedPalaces: ["命宫", "财帛", "夫妻", "迁移"],
    auditQuestions: ["能力、环境、授权和交付标准是否匹配？", "变动是否具备承接资源、退出预案和现实分工？"],
  },
  事业: {
    title: "职业与组织角色",
    keywords: ["职业角色", "组织位置", "工作方式", "专业路径", "授权", "转型"],
    description: "事业宫描述工作方式、组织角色与专业路径，必须与命宫、财帛及合作条件联读。",
    relatedPalaces: ["命宫", "财帛", "夫妻", "迁移"],
    auditQuestions: ["能力、环境、授权和交付标准是否匹配？", "变动是否具备承接资源、退出预案和现实分工？"],
  },
  田宅: {
    title: "资产与空间基础",
    keywords: ["居所", "物业", "家庭资产", "办公环境", "权属", "现金流"],
    description: "田宅宫观察资产与空间基础，须结合权属、现金流、安全、保险、合规及关联宫。",
    relatedPalaces: ["财帛", "子女", "兄弟", "福德"],
    auditQuestions: ["当前讨论的是居住、商业物业还是机构空间？", "权属、现金流、维护、安全、保险与合规是否清楚？"],
  },
  福德: {
    title: "生活质量与恢复",
    keywords: ["生活质量", "压力", "休息", "意义感", "审美", "恢复"],
    description: "福德宫用于反思内在满足、压力承受与恢复节奏，不用于心理诊断。",
    relatedPalaces: ["财帛", "命宫", "疾厄"],
    auditQuestions: ["财富、职业与内在满足是否被分别评估？", "当前节奏、边界与恢复安排是否可持续？"],
  },
  父母: {
    title: "权威与支持系统",
    keywords: ["父母", "上司", "导师", "制度", "文书", "支持", "边界"],
    description: "父母宫兼看代际关系、上司、导师、制度支持与权威沟通，不预测亲属事件。",
    relatedPalaces: ["命宫", "官禄", "疾厄"],
    auditQuestions: ["当前对象是父母、长辈、上司还是制度流程？", "沟通、自主边界、文书与支持网络是否清楚？"],
  },
};

export const DOMAIN_PALACES = {
  career: ["官禄", "事业", "命宫", "迁移", "父母", "交友", "仆役"],
  wealth: ["财帛", "田宅", "福德", "官禄", "事业", "迁移"],
  relationship: ["夫妻", "福德", "命宫", "子女", "交友", "仆役"],
  health: ["疾厄", "命宫", "福德", "父母"],
  family: ["田宅", "父母", "财帛", "福德", "子女", "兄弟"],
} as const;

export function normalizePalaceName(name: string): string {
  if (name === "仆役") {
    return "交友";
  }

  if (name === "事业") {
    return "官禄";
  }

  return name;
}

export default PALACE_MEANING;
