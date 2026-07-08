export type AIInterpretScope = "natal" | "decade" | "year" | "month" | "day" | "hour";

export type AIInterpretStyle = "professional" | "gentle" | "direct" | "classical";

export type AIEndpointType = "responses" | "chat_completions";

export type AIProviderConfig = {
  mode: "pure_api";
  baseUrl: string;
  apiKey: string;
  model: string;
  endpointType: AIEndpointType;
};

export type AIProviderErrorType =
  | "network"
  | "unauthorized"
  | "not_found"
  | "model_error"
  | "provider_error"
  | "timeout"
  | "unknown";

export type AIProviderErrorResponse = {
  ok: false;
  errorType: AIProviderErrorType;
  message: string;
  status?: number;
  endpoint?: string;
  endpointType?: AIEndpointType;
  detail?: string;
};

export type AITestConnectionResponse =
  | {
      ok: true;
      message: string;
      endpoint: string;
      endpointType: AIEndpointType;
    }
  | AIProviderErrorResponse;

export type AISignalDomain =
  | "overview"
  | "career"
  | "wealth"
  | "relationship"
  | "health"
  | "risk"
  | "advice";

export type AIInterpretRequest = {
  scope: AIInterpretScope;
  title: string;
  birthInfo: {
    gender?: string;
    solarDate?: string;
    lunarDate?: string;
    birthHour?: string;
    mingGong?: string;
    shenGong?: string;
    mingZhu?: string;
    shenZhu?: string;
  };
  selectedTime: {
    decade?: string | null;
    year?: string | null;
    month?: string | null;
    day?: string | null;
    hour?: string | null;
  };
  mainPalaces: Array<{
    palaceName: string;
    reason: string;
    score?: number;
  }>;
  signals: Array<{
    palaceName: string;
    domain: AISignalDomain;
    stars: string[];
    mutagens: string[];
    relation?: "self" | "triad" | "opposite" | "neighbor";
    ruleConclusion: string;
    evidence: string;
  }>;
  ruleInterpretation: {
    summary: string;
    sections: {
      overview?: string[];
      career?: string[];
      wealth?: string[];
      relationship?: string[];
      health?: string[];
      risk?: string[];
      advice?: string[];
    };
  };
  style?: AIInterpretStyle;
};

export type AIInterpretResponse = {
  title: string;
  summary: string;
  sections: {
    overview: string;
    career: string;
    wealth: string;
    relationship: string;
    health: string;
    risk: string;
    advice: string;
  };
  disclaimer: string;
};

export const AI_SECTION_KEYS: AISignalDomain[] = [
  "overview",
  "career",
  "wealth",
  "relationship",
  "health",
  "risk",
  "advice",
];
