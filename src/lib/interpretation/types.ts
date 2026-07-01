import type { AstrolabeResult } from "@/lib/astrolabe";

export type Mutagen = "禄" | "权" | "科" | "忌";

export type TransitScope =
  | "natal"
  | "decadal"
  | "yearly"
  | "monthly"
  | "daily"
  | "hourly";

export type TransitContext = {
  scope: TransitScope;
  label: string;
  dateLabel?: string;
  hourLabel?: string;
  palaceName?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  keywords?: string[];
};

export type InterpretationScope =
  | "natal"
  | "decade"
  | "year"
  | "month"
  | "day"
  | "hour";

export type InterpretationLevel = "综合" | "偏顺" | "中性" | "需谨慎" | "波动较大";

export type PalaceRelation = "self" | "triad" | "opposite" | "neighbor";

export type SignalSource = "natal" | "decade" | "year" | "month" | "day" | "hour";

export type DisplayStar = {
  name: string;
  brightness?: string;
  mutagen?: Mutagen;
  type?: "main" | "minor" | "misc" | "flow";
};

export type CompactPalaceViewModel = {
  palaceName: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  ageRange?: string;
  yearlyAges?: number[];
  minorAges?: number[];
  mainStars: DisplayStar[];
  minorStars: DisplayStar[];
  miscStars: DisplayStar[];
  flowStars: DisplayStar[];
  changsheng?: string;
  boshi?: string;
  jiangqian?: string;
  suiqian?: string;
  isLifePalace?: boolean;
  isBodyPalace?: boolean;
};

export type PalaceSignal = {
  palaceName: string;
  source: SignalSource;
  relation: PalaceRelation;
  stars: DisplayStar[];
  mutagens: Mutagen[];
  score: number;
  tags: string[];
  messages: string[];
};

export type PalaceBrief = {
  palaceName: string;
  reason: string;
  score: number;
};

export type InterpretationSection = {
  title: string;
  conclusion: string;
  evidences: string[];
  suggestions: string[];
};

export type InterpretationSections = {
  overview: InterpretationSection;
  career: InterpretationSection;
  wealth: InterpretationSection;
  relationship: InterpretationSection;
  health: InterpretationSection;
  risk: InterpretationSection;
  advice: InterpretationSection;
};

export type InterpretationResult = {
  scope: InterpretationScope;
  title: string;
  score: number;
  level: InterpretationLevel;
  summary: string;
  primaryPalaces: PalaceBrief[];
  secondaryPalaces: PalaceBrief[];
  sections: InterpretationSections;
};

export type KnowledgeChunk = {
  id: string;
  sourceTitle: string;
  headingPath: string[];
  text: string;
  keywords: string[];
};

export type KnowledgeMatch = {
  chunk: KnowledgeChunk;
  score: number;
};

export type InterpretationInput = {
  astrolabe: AstrolabeResult;
  scope: InterpretationScope;
  targetDate: Date;
  transitHour: number;
  selectedPalaceId?: number | string | null;
  transitContext?: TransitContext;
  signals: PalaceSignal[];
  titleLabel: string;
};

export type DomainKey =
  | "career"
  | "wealth"
  | "relationship"
  | "health"
  | "family";

export type RuleEngineResult = {
  input: InterpretationInput;
  signals: PalaceSignal[];
  score: number;
  level: InterpretationLevel;
  activatedPalaces: string[];
  domains: Record<DomainKey, PalaceSignal[]>;
};

export type InterpretOptions = {
  astrolabe: AstrolabeResult;
  scope: InterpretationScope;
  targetDate: Date;
  transitHour?: number;
  selectedPalaceId?: number | string | null;
  transitContext?: TransitContext;
};
