import type { Mutagen } from "./types";
import { ZIWEI_MUTAGEN_RULES } from "./ziweiRules";

export type MutagenMeaning = {
  core: string[];
  description: string;
};

export const MUTAGEN_SEQUENCE: Mutagen[] = ["禄", "权", "科", "忌"];

export const MUTAGEN_MEANING: Record<Mutagen, MutagenMeaning> = Object.fromEntries(
  MUTAGEN_SEQUENCE.map((mutagen) => {
    const rule = ZIWEI_MUTAGEN_RULES[mutagen];

    return [
      mutagen,
      {
        core: rule.core,
        description: `${rule.mechanism}；${rule.audit}`,
      },
    ];
  }),
) as Record<Mutagen, MutagenMeaning>;

// 分数只用于排序信号强度，不能被解释为事件吉凶或概率。
export const MUTAGEN_SCORE: Record<Mutagen, number> = Object.fromEntries(
  MUTAGEN_SEQUENCE.map((mutagen) => [mutagen, ZIWEI_MUTAGEN_RULES[mutagen].score]),
) as Record<Mutagen, number>;
