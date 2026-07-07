import { collectInterpretationInput } from "./collectSignals";
import { renderInterpretation } from "./renderInterpretation";
import { runRuleEngine } from "./ruleEngine";
import type {
  InterpretOptions,
  InterpretationResult,
  InterpretationScope,
  RuleEngineResult,
  TransitContext,
} from "./types";

export function resolveInterpretationScope(context?: TransitContext): InterpretationScope {
  if (!context || context.scope === "natal") {
    return "natal";
  }

  if (context.scope === "decadal") {
    return "decade";
  }

  if (context.scope === "yearly") {
    return "year";
  }

  if (context?.scope === "monthly") {
    return "month";
  }

  if (context?.scope === "daily") {
    return "day";
  }

  return "hour";
}

export function interpretWithRuleResult(options: InterpretOptions): {
  result: InterpretationResult;
  ruleResult: RuleEngineResult;
} {
  const input = collectInterpretationInput(options);
  const ruleResult = runRuleEngine(input);

  return {
    result: renderInterpretation(ruleResult),
    ruleResult,
  };
}

export function interpret(options: InterpretOptions): InterpretationResult {
  return interpretWithRuleResult(options).result;
}
