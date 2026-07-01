export type PalaceMeaning = {
  title: string;
  keywords: string[];
  description: string;
};

export const PALACE_MEANING: Record<string, PalaceMeaning> = {
  命宫: {
    title: "个人状态",
    keywords: ["自我", "状态", "判断力", "行动方式", "精神面貌"],
    description: "代表个人状态、性格表现、当下判断力与整体气场。",
  },
  兄弟: {
    title: "同辈关系",
    keywords: ["兄弟姐妹", "朋友", "同辈", "合作关系"],
    description: "代表兄弟姐妹、同辈朋友、平级合作与人际支持。",
  },
  夫妻: {
    title: "感情合作",
    keywords: ["感情", "伴侣", "合作", "亲密关系"],
    description: "代表感情、婚恋、伴侣互动，也可看重要合作关系。",
  },
  子女: {
    title: "子女创作",
    keywords: ["子女", "创作", "表达", "下属", "作品"],
    description: "代表子女、创作成果、表达欲、下属晚辈与作品输出。",
  },
  财帛: {
    title: "财务收入",
    keywords: ["收入", "现金流", "投资", "消费", "资源"],
    description: "代表收入、现金流、理财、消费习惯与财务机会。",
  },
  疾厄: {
    title: "健康压力",
    keywords: ["健康", "压力", "身体", "情绪", "隐患"],
    description: "代表身体状态、压力来源、情绪消耗与健康管理。",
  },
  迁移: {
    title: "外部环境",
    keywords: ["外出", "变动", "远方", "出差", "外界机会"],
    description: "代表外部环境、出行、变动、异地机会与对外发展。",
  },
  交友: {
    title: "社交人脉",
    keywords: ["朋友", "客户", "团队", "社群", "人脉"],
    description: "代表朋友、客户、团队、社群关系与人脉资源。",
  },
  仆役: {
    title: "社交人脉",
    keywords: ["朋友", "客户", "团队", "社群", "人脉"],
    description: "代表朋友、客户、团队、社群关系与人脉资源。",
  },
  官禄: {
    title: "事业工作",
    keywords: ["工作", "职位", "事业", "责任", "名声"],
    description: "代表事业、工作表现、职位责任、职业发展与社会评价。",
  },
  事业: {
    title: "事业工作",
    keywords: ["工作", "职位", "事业", "责任", "名声"],
    description: "代表事业、工作表现、职位责任、职业发展与社会评价。",
  },
  田宅: {
    title: "家庭资产",
    keywords: ["房产", "家庭", "居住", "资产", "稳定性"],
    description: "代表家庭、房产、不动产、居住环境与长期积累。",
  },
  福德: {
    title: "精神享受",
    keywords: ["情绪", "享受", "精神", "休息", "内在满足"],
    description: "代表精神状态、情绪恢复、兴趣享受与内在满足。",
  },
  父母: {
    title: "长辈文书",
    keywords: ["父母", "长辈", "上级", "文书", "制度"],
    description: "代表父母、长辈、上级、制度、证件、合同与文书事务。",
  },
};

export const DOMAIN_PALACES = {
  career: ["官禄", "事业", "命宫", "迁移", "父母", "交友", "仆役"],
  wealth: ["财帛", "田宅", "福德", "官禄", "事业", "迁移"],
  relationship: ["夫妻", "福德", "命宫", "子女", "交友", "仆役"],
  health: ["疾厄", "命宫", "福德", "父母"],
  family: ["田宅", "父母", "财帛", "福德"],
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
