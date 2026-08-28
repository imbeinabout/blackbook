// src/lib/agentMigration.ts
import { DeltaGreenAgent } from "../models/DeltaGreenAgent";

export function ensureAgentDefaults(
  agent: DeltaGreenAgent
): DeltaGreenAgent {

  if (!agent.events) {
    console.log(
      `[Migration] Added events to ${agent.name}`
    );
  }

  return {
    ...agent,
    events: agent.events ?? [],
  };
}