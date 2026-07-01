import type { Mutagen } from "./types";

export type MutagenMeaning = {
  core: string[];
  description: string;
};

export const MUTAGEN_SEQUENCE: Mutagen[] = ["禄", "权", "科", "忌"];

export const MUTAGEN_MEANING: Record<Mutagen, MutagenMeaning> = {
  禄: {
    core: ["资源", "机会", "收益", "人缘", "顺畅"],
    description: "事情较容易获得资源或好处，但也可能带来欲望增加。",
  },
  权: {
    core: ["权力", "推动", "责任", "掌控", "竞争"],
    description: "事情需要主动推动，责任变重，容易有竞争或主导需求。",
  },
  科: {
    core: ["名声", "文书", "贵人", "缓解", "体面"],
    description: "有利名誉、学习、文书、考试、专业表现，也有缓解问题的作用。",
  },
  忌: {
    core: ["阻碍", "执念", "亏欠", "压力", "卡点"],
    description: "代表容易卡住、反复、误会、损耗或心理压力，需要谨慎处理。",
  },
};

export const MUTAGEN_SCORE: Record<Mutagen, number> = {
  禄: 2.5,
  权: 1.5,
  科: 1.2,
  忌: -2.5,
};
