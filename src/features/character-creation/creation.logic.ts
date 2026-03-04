// src/features/character-creation/creation.logic.ts
import type { CreationMeta, DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import type { CreationSectionKey, SectionLock } from "./creation.types";

export function getCreationMeta(agent: DeltaGreenAgent | null): CreationMeta {
  if (agent?.system.creation) return agent.system.creation;

  return {
    bonusSkillPointsByKey: {},
    veteranSkillPointsByKey: {},
    selectedProfessionId: null,
    selectedBonusPackageId: null,
    damagedVeteranTemplateId: null,
    professionLockedByBonus: false,
    damagedVeteranTemplateApplied: false,
    playMode: {
      isPlaying: false,
      baselineAgentJson: undefined,
    },
  };
}

export function getSectionLock(
  section: CreationSectionKey,
  agent: DeltaGreenAgent | null
): SectionLock {
  if (!agent) return { locked: false };

  const creation = getCreationMeta(agent);

  if (creation.playMode?.isPlaying && section !== "IDENTITY") {
    return {
      locked: true,
      reason:
        "Section locked while in PLAY mode. Exit PLAY mode to edit this section.",
    };
  }

  if (
    creation.damagedVeteranTemplateApplied &&
    (section === "STATS" ||
      section === "PROFESSION" ||
      section === "SKILLS")
  ) {
    return {
      locked: true,
      reason:
        "Locked because the Damaged Veteran template is applied. Reset Damaged Veteran to edit.",
    };
  }

  if (creation.professionLockedByBonus && section === "PROFESSION") {
    return {
      locked: true,
      reason:
        "Profession locked because bonus skills have been applied. Reset SKILLS to change profession.",
    };
  }

  return { locked: false };
}