// src/lib/eventLogger.ts
import { DeltaGreenAgent } from "../models/DeltaGreenAgent";
import { AgentEvent } from "../models/events";
import { nanoid } from "nanoid";

const DEBUG_EVENTS = true;

export interface SanEventMetadata {
  actualSanLoss: number;
  projectedLoss: number;
  actualSan: number;
  bondName?: string;
  crossedBreakingPoint: boolean;
  temporaryInsanity: boolean;
  adapted: boolean;
  sanType: "helplessness" | "violence" | "unnatural";
}

export function createAgentEvent(
  event: Omit<
    AgentEvent,
    "id" | "timestamp" | "version"
  >
): AgentEvent {
  return {
    ...event,
    showInTimeline: event.showInTimeline ?? true,
    id: nanoid(),
    version: 1,
    timestamp: new Date().toISOString(),
  };
}

export function addAgentEvent(
  agent: DeltaGreenAgent,
  event: Omit<AgentEvent, "id" | "timestamp" | "version">
): AgentEvent {
  const newEvent = createAgentEvent(event);

  if(event.showInTimeline) {
    agent.events.unshift(newEvent);
  }

  if (DEBUG_EVENTS) {
    console.group(
      `[EVENT] ${agent.name} - ${newEvent.category}:${newEvent.action}`
    );

    console.log("Summary:", newEvent.summary);
    console.log("Before:", newEvent.before);
    console.log("After:", newEvent.after);
    console.log("Metadata:", newEvent.metadata);

    console.groupEnd();
  }

  return newEvent;
}

export function updateEventDescription(
  agent: DeltaGreenAgent,
  eventId: string,
  description: string
) {
  const event = agent.events.find(
    e => e.id === eventId
  );

  if (!event) return;

  event.description = description;
}

export function buildSanEventSummary(
  metadata: SanEventMetadata
): string {
  const parts: string[] = [];

  parts.push(
    `Lost ${metadata.actualSanLoss} SAN due to ${metadata.sanType}`
  );

  if (metadata.actualSan <= 0) {
    parts.push("and became permanently insane");
    return parts.join(", ");
  }

  if (metadata.projectedLoss > 0 && metadata.bondName) {
    parts.push(
      `projected ${metadata.projectedLoss} points to bond ${metadata.bondName}`
    );
  }

  if (metadata.crossedBreakingPoint) {
    parts.push("pushed through their Breaking Point");
  }

  if (metadata.temporaryInsanity) {
    parts.push("became temporarily insane");
  }

  if (metadata.adapted) {
    parts.push(`became adapted to ${metadata.sanType}`);
  }

  return parts.join(", ");
}