import {
  AUXILIARY_STAR_KEYWORDS,
  BRIGHTNESS_RULES,
  MAJOR_STAR_RULES,
  normalizeZiweiStarName,
  RISK_STAR_RULES,
  SUPPORT_PAIR_RULES,
} from "./ziweiRules";

export type StarMeaning = {
  positive: string[];
  negative: string[];
};

export const MAIN_STAR_MEANING = Object.fromEntries(
  Object.entries(MAJOR_STAR_RULES).map(([name, rule]) => [
    name,
    {
      positive: rule.axes,
      negative: [rule.audit],
    },
  ]),
) as Record<string, StarMeaning>;

export const MINOR_STAR_MEANING: Record<string, string[]> = {
  ...AUXILIARY_STAR_KEYWORDS,
  ...Object.fromEntries(
    Object.entries(RISK_STAR_RULES).map(([name, rule]) => [
      name,
      [rule.category, rule.audit],
    ]),
  ),
  天空: ["抽离", "想法变化", "实质承接"],
  咸池: ["社交情境", "吸引力", "关系边界"],
  天姚: ["社交情境", "表达吸引", "关系边界"],
  孤辰: ["独立倾向", "支持距离"],
  寡宿: ["独立倾向", "支持距离"],
  天刑: ["规则", "边界", "合规复核"],
  天哭: ["情绪压力", "支持需求"],
  天虚: ["预期落差", "支持需求"],
};

// 保留旧导出供现有组件兼容；规则引擎不再把单颗辅煞星直接当作吉凶裁决。
export const SUPPORT_STAR_SCORE: Record<string, number> = Object.fromEntries(
  SUPPORT_PAIR_RULES.flatMap((rule) => rule.names.map((name) => [name, rule.weight / 4])),
);

export const TOUGH_STAR_SCORE: Record<string, number> = Object.fromEntries(
  Object.entries(RISK_STAR_RULES).map(([name, rule]) => [name, rule.score]),
);

export const BRIGHTNESS_SCORE: Record<string, number> = Object.fromEntries(
  Object.keys(BRIGHTNESS_RULES).map((brightness) => [brightness, 0]),
);

export function normalizeStarName(name: string): string {
  return normalizeZiweiStarName(name);
}

export function getStarKeywords(name: string): string[] {
  const normalizedName = normalizeStarName(name);
  const mainMeaning = MAIN_STAR_MEANING[normalizedName];

  if (mainMeaning) {
    return [...mainMeaning.positive, ...mainMeaning.negative];
  }

  return MINOR_STAR_MEANING[normalizedName] ?? [];
}
