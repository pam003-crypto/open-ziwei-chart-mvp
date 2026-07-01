import { collectInterpretationInput } from "./collectSignals";
import { renderInterpretation } from "./renderInterpretation";
import { runRuleEngine } from "./ruleEngine";
import type {
  InterpretOptions,
  InterpretationResult,
  InterpretationScope,
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

export function interpret(options: InterpretOptions): InterpretationResult {
  const input = collectInterpretationInput(options);
  const ruleResult = runRuleEngine(input);

  return renderInterpretation(ruleResult);
}
