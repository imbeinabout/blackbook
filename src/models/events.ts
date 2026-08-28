// src/models/events.ts
export type EventCategory =
    | "skill"
    | "sanity"
    | "bond"
    | "condition"
    | "equipment"
    | "home-scene"
    | "personal-pursuit"
    | "note"
    | "system";

export type EventSource =
    | "creation"
    | "play"
    | "advancement"
    | "manual"
    | "import"
    | "migration";

export interface AgentEvent {
  id: string;
  version: 1;

  timestamp: string;

  agentId: string;

  category: EventCategory;
  action: string;
  source: EventSource;

  summary: string;
  description?: string;

  relatedEntity?: string;

  before?: unknown;
  after?: unknown;

  metadata?: Record<string, unknown>;
}