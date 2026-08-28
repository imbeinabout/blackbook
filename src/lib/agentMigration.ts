// src/lib/agentMigration.ts
import { DeltaGreenAgent } from "../models/DeltaGreenAgent";
import { nanoid } from "nanoid";

export function ensureAgentDefaults(
  agent: DeltaGreenAgent
): DeltaGreenAgent {

  const DEBUG_MIGRATIONS = true;

  if (DEBUG_MIGRATIONS && !agent.id) {
    console.info(
      `[Migration] Added ID to ${agent.name}`
    );
  }

  return {
    ...agent,
    events: agent.events ?? [],
    id: agent.id ?? nanoid()
  };
}