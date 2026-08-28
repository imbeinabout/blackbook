// src/lib/eventLogger.ts
import { DeltaGreenAgent } from "../models/DeltaGreenAgent";
import { AgentEvent } from "../models/events";

const DEBUG_EVENTS = true;

export function createAgentEvent(
  event: Omit<
    AgentEvent,
    "id" | "timestamp" | "version"
  >
): AgentEvent {
  return {
    ...event,
    id: crypto.randomUUID(),
    version: 1,
    timestamp: new Date().toISOString(),
  };
}

export function addAgentEvent(
  agent: DeltaGreenAgent,
  event: Omit<AgentEvent, "id" | "timestamp" | "version">
): AgentEvent {
  const newEvent = createAgentEvent(event);

  agent.events.unshift(newEvent);

  if (DEBUG_EVENTS) {
    console.group(
      `[EVENT] ${newEvent.category}:${newEvent.action}`
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