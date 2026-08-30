// src/models/events.ts
export type EventCategory =
    | "attribute"    
    | "skill"
    | "sanity"
    | "bond"
    | "motivation"
    | "disorder"
    | "condition"
    | "equipment"
    | "home-scene"
    | "wound"
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

  category: EventCategory;
  action: string;
  source: EventSource;

  summary: string;
  description?: string;

  relatedEntity?: string;

  before?: Record<string, unknown> | number | string | boolean;
  after?: Record<string, unknown> | number | string | boolean;

  metadata?: Record<string, unknown>;
  storeEvent?: boolean;
}