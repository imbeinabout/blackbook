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
  // Timeline
  totalEvents: number;
  firstEventDate?: string;
  lastEventDate?: string;
  activitySpanDays?: number;
  activeDays?: number;

  categoryCounts: Record<string, number>;
  mostActiveCategory?: {
    category: string;
    count: number;
  };

  // Operational History
  campaigns: number;
  operations: number;
  sessions: number;
  latestCampaign?: string;
  latestOperation?: string;
  latestSession?: string;

  // Sanity
  sanityLossEvents: number;
  totalSanLost: number;
  totalSanRecovered: number;
  netSanChange: number;
  breakingPointsCrossed: number;
  temporaryInsanityEpisodes: number;
  adaptedtoViolence: boolean;
  adaptedtoHelplessness: boolean;
  sanLostByType: {
    helplessness: number;
    violence: number;
    unnatural: number;
  }

  // Physical History
  hpDamageTaken: number;
  hpRecovered: number;
  woundsAdded: number;
  woundsRemoved: number;
  firstAidApplications: number;

  // Willpower History
  wpDamageTaken: number;
  wpRecovered: number;

  // Bonds
  bondsCreated: number;
  bondsRemoved: number;
  bondScoreChanges: number;
  bondDamagedEvents: number;
  totalBondDamage: number;
  totalBondRecovery: number;
  projectionEvents: number;

  // Psycological Consequences
  disordersAdded: number;
  disordersCured: number;
  motivationsCrossedOut: number;
  motivationsRestored: number;

  // Development
  statValueChanges: number;
  skillValueChanges: number;
  skillUpgradeEvents: number;
  totalSkillPointsGained: number;
  totalSkillPointsReversed: number;
  specialTrainingAdded: number;
  specialTrainingRemoved: number;
  mostImprovedSkill?: {
    key: string;
    label: string;
    netChange: number;
  }

  // Conditions
  conditionsAdded: number;
  conditionsRemoved: number;

  // Downtime
  homeScenesCompleted: number;
  personalPursuits: number;
  bondsResolvedInHomeScenes: number;
}