// src/models/events.ts
export type EventCategory =
    | "attribute"
    | "bond" 
    | "character"   
    | "condition"
    | "disorder"
    | "equipment"
    | "home-scene"
    | "marker"
    | "motivation"
    | "note"
    | "sanity"
    | "skill"
    | "system"
    | "wound";

export type EventSource =
    | "advancement"
    | "creation"
    | "import"
    | "manual"
    | "migration"
    | "play";

export interface AgentEvent {
  id: string;
  version: 1;

  timestamp: string;

  category: EventCategory;
  action: string;
  source: EventSource;

  summary: string;
  description?: string;

  relatedEntity?: string | number;

  before?: any;
  after?: any;

  metadata?: Record<string, unknown>;
  storeEvent?: boolean;
}

export interface AgentStatistics {
  totalEvents: number;

  firstEventDate?: string;
  lastEventDate?: string;
  activeDays?: number;

  categoryCounts: Record<string, number>;
  mostActiveCategory?: {
    category: string;
    count: number;
  };

  skillChanges: number;
  attributeChanges: number;

  sanityEvents: number;
  totalSanLost: number;

  bondChanges: number;

  conditionsAdded: number;
  conditionsRemoved: number;

  disordersAdded: number;

  homeScenes: number;
}