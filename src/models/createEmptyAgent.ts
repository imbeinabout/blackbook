// src/models/createEmptyAgent.ts
import type {
  DeltaGreenAgent,
  DeltaGreenSystem,
  StatBlock,
  SanityBlock,
  ValueBlock,
  AdaptationBlock,
  CreationMeta
} from "./DeltaGreenAgent";
import { buildBaseSkills } from "./baseSkills";

function createStat(value: number): StatBlock {
  return {
    value,
    distinguishing_feature: "",
    x5: value * 5,
  };
}

function createAdaptation(): AdaptationBlock {
  return {
    incident1: false,
    incident2: false,
    incident3: false,
    isAdapted: false,
  };
}

const emptyCreationMeta: CreationMeta = {
  bonusSkillPointsByKey: {},
  veteranSkillPointsByKey: {},
  advancementPointsByKey: {},
  professionLockedByBonus: false,
  damagedVeteranTemplateApplied: false,
  playMode: {
    isPlaying: false,
    baselineAgentJson: undefined,
  }
};

export function createEmptyAgent(name = "New Agent"): DeltaGreenAgent {
  const health: ValueBlock = {
    value: 10,
    max: 10,
    min: 0,
    protection: 0,
  };

  const wp: ValueBlock = {
    value: 10,
    max: 10,
    min: 0,
  };

  const sanity: SanityBlock = {
    value: 50,
    max: 99,
    currentBreakingPoint: 40,
    adaptations: {
      violence: createAdaptation(),
      helplessness: createAdaptation(),
    },
  };

  const system: DeltaGreenSystem = {
    schemaVersion: 1,
    biography: {
      profession: "",
      rankOrTitle: "",
      employer: "",
      nationality: "",
      age: "",
      education: "",
      sex: "",
    },
    physical: {
      description: "",
      wounds: "",
      firstAidAttempted: false,
      exhausted: false,
      exhaustedPenalty: 0,
    },
    physicalDescription: "",
    statistics: {
      str: createStat(10),
      con: createStat(10),
      dex: createStat(10),
      int: createStat(10),
      pow: createStat(10),
      cha: createStat(10),
    },
    health,
    wp,
    sanity,
    skills: buildBaseSkills(),
    typedSkills: {},
    specialTraining: [],
    creation: emptyCreationMeta,
    conditions: []
  };

  return {
    type: "agent",
    name,
    prototypeToken: { name },
    items: [],
    system,
  };
}