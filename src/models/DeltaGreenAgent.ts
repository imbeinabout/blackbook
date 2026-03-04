// src/models/DeltaGreenAgent.ts
import type { ActiveCondition } from "./conditions";

// Core character interface
export interface DeltaGreenAgent {
  type: "agent";
  name: string;
  prototypeToken?: { name: string };
  items: DeltaGreenItem[];
  system: DeltaGreenSystem;
}

// Items: weapons, gear, bonds, motivations, etc.
export interface DeltaGreenItem {
  type: string;
  _id: string;
  name: string;
  img?: string;
  system: any; 
}

// Main system block
export interface DeltaGreenSystem {
  schemaVersion: number;
  biography: {
    profession: string;
    rankOrTitle: string;
    employer: string;
    nationality: string;
    age: string;
    education: string;
    sex: string;
  };
  physical: {
    description: string;
    wounds: string;
    firstAidAttempted: boolean;
    exhausted: boolean;
    exhaustedPenalty: number;
  };
  physicalDescription?: string;
  statistics: {
    str: StatBlock;
    con: StatBlock;
    dex: StatBlock;
    int: StatBlock;
    pow: StatBlock;
    cha: StatBlock;
  };
  health: ValueBlock;
  wp: ValueBlock;
  sanity: SanityBlock;
  skills: Record<string, SkillBlock>;
  typedSkills: Record<string, TypedSkillBlock>;
  specialTraining: SpecialTrainingEntry[];

  /* BLACKBOOK specifics */
  creation?: CreationMeta;
  undoMeta?: UndoMeta;
  details?: Details;
  notes?: AgentNote[];
  conditions?: ActiveCondition[];
}

export interface StatBlock {
  value: number;
  distinguishing_feature: string;
  x5: number;
}

export interface ValueBlock {
  value: number;
  max: number;
  min: number;
  protection?: number;
}

export interface SanityBlock {
  value: number;
  max: number;
  currentBreakingPoint: number;
  adaptations: {
    violence: AdaptationBlock;
    helplessness: AdaptationBlock;
  };
}

export interface AdaptationBlock {
  incident1: boolean;
  incident2: boolean;
  incident3: boolean;
  isAdapted: boolean;
}

export interface SkillBlock {
  key: string;
  label: string;
  sortLabel: string;
  tooltip: string;
  proficiency: number;
  failure: boolean;
  cannotBeImprovedByFailure: boolean;
  isCalculatedValue: boolean;
  targetProficiency: number;
}

export interface TypedSkillBlock {
  type: "typeSkill";
  key: string;
  actorType: "agent";
  label: string;
  sortLabel: string;
  group: string;
  proficiency: number;
  failure: boolean;
}

export interface SpecialTrainingEntry {
  id: string;
  name: string;
  targetType: "stat" | "skill" | "typedSkill";
  targetKey: string; // StatKey or skill key
}

export interface CreationMeta {
  /** How many “bonus skill points” have been allocated into each skill. */
  bonusSkillPointsByKey: Record<string, number>;

  /** How many “damaged veteran” points have been allocated into each skill. */
  veteranSkillPointsByKey: Record<string, number>;

  selectedProfessionId?: string | null;
  selectedBonusPackageId?: string | null;
  damagedVeteranTemplateId?: string | null;

  professionLockedByBonus?: boolean;       
  damagedVeteranTemplateApplied?: boolean; 
  damagedVeteranRemovedBond?: DeltaGreenItem | null; 
  playMode?: {
    isPlaying: boolean;
    // Snapshot of the agent *before* entering play mode.
    baselineAgentJson?: string;
  };

  advancementPointsByKey?: Record<string, number>;

}

interface AdaptationUndoMeta {
  helplessness?: number;
  violence?: number;
}

interface UndoMeta {
  adaptations?: AdaptationUndoMeta;
  advancementUndoStack?: Array<{
      at: number;
      deltas: Record<string, number>; 
    }>;
}
interface Details {
  physicalDescription: string;
  personalDetails: string;
  homeFamilyDevelopments: string;
  photoDataUrl?: string;
  aliases?: AgentAlias[];
}

interface AgentAlias {
  active: boolean;
  name: string;
  description?: string;
  credentials?: string;
}

export interface AgentNote {
  id: string;
  title: string;
  content: string; //HTML string
  updatedAt: number;
}