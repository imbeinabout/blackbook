// src/features/player-panel/conditions.logic.ts
import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import type { ActiveCondition, ConditionCategory } from "../../models/conditions";

export function ensureConditions(agent: DeltaGreenAgent) {
  if (!agent.system.conditions) agent.system.conditions = [];
}

export function addCondition(
  agent: DeltaGreenAgent,
  condition: { id: string; label: string; category: ConditionCategory }
) {
  if (!agent.system.conditions) agent.system.conditions = [];

  // --- RULE: Stimulated requires Exhausted --------------------
  if (condition.id === "stimulated") {
    const hasExhausted = agent.system.conditions.some(
      (c) => c.id === "exhausted"
    );

    if (!hasExhausted) {
      // silently block OR throw — your choice
      console.warn(
        "Cannot apply 'stimulated' unless 'exhausted' is already present."
      );
      return;
    }
  }

  if (agent.system.conditions.some((c) => c.id === condition.id)) return;

  agent.system.conditions.push(condition);
}

export function removeCondition(agent: DeltaGreenAgent, id: string) {
  if (!agent.system.conditions) return;

  // --- RULE: Removing Exhausted also removes Stimulated -----------
  if (id === "exhausted") {
    agent.system.conditions = agent.system.conditions.filter(
      (c) => c.id !== "exhausted" && c.id !== "stimulated"
    );
    return;
  }

  agent.system.conditions = agent.system.conditions.filter(
    (c) => c.id !== id
  );
}