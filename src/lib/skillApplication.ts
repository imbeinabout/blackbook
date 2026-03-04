// src/lib/skillApplication.ts
import { DeltaGreenAgent, SkillBlock, TypedSkillBlock } from "../models/DeltaGreenAgent";
import {
  Profession,
  ChoiceSelectionGroup,
  TypedSkill
} from "../models/characterCreationTypes";

export type SkillBreakdown = {
  base: number; 
  profession: number; 
  bonus: number;
  veteran: number;
  advancement: number;
  total: number;
  breakdownText: string; 
};

/**
 * Compute breakdown for either a standard or typed skill.
 */
export function getSkillBreakdown(
  key: string,
  isTyped: boolean,
  agent: DeltaGreenAgent,
  baseSkills: Record<string, SkillBlock>,
  bonusSkillPoints: Record<string, number>,
  veteranSkillPoints: Record<string, number>
): SkillBreakdown {
  const bonus = bonusSkillPoints[key] ?? 0;
  const veteran = veteranSkillPoints[key] ?? 0;
  const advancement = agent.system.creation?.advancementPointsByKey?.[key] ?? 0;

  if (!isTyped) {
    // ----- Standard skills -----
    const base0 = baseSkills[key]?.proficiency ?? 0;

    const totalFromAgent =
      agent.system.skills[key]?.proficiency ?? (base0 + bonus + veteran + advancement);

    const baselineSaved = Math.max(totalFromAgent - bonus - veteran - advancement, 0);

    let base = 0;
    let profession = 0;

    // - If baseline <= base0, treat all as "Base".
    // - If baseline > base0, treat it all as "Profession".
    if (baselineSaved <= base0) {
      base = baselineSaved;
      profession = 0;
    } else {
      base = 0;
      profession = baselineSaved;
    }

    const total = totalFromAgent;

    const parts: string[] = [];
    if (base > 0) parts.push(`${base} Base`);
    if (profession > 0) parts.push(`${profession} Profession`);
    if (bonus > 0) parts.push(`${bonus} Bonus`);
    if (veteran > 0) parts.push(`${veteran} Veteran`);
    if (advancement > 0) parts.push(`${advancement} Advancement`);

    const breakdownText = parts.length ? ` (${parts.join(" + ")})` : "";

    return { base, profession, bonus, veteran, advancement, total, breakdownText };
  } else {
    // ----- Typed skills -----
    const totalFromAgent =
      agent.system.typedSkills[key]?.proficiency ?? (0 + bonus + veteran + advancement);

    const baselineSaved = Math.max(totalFromAgent - bonus - veteran - advancement, 0);

    const base = 0;
    const profession = baselineSaved;
    const total = totalFromAgent;

    const parts: string[] = [];
    if (profession > 0) parts.push(`${profession} Profession`);
    if (bonus > 0) parts.push(`${bonus} Bonus`);
    if (veteran > 0) parts.push(`${veteran} Veteran`);
    if (advancement > 0) parts.push(`${advancement} Advancement`);

    const breakdownText = parts.length ? ` (${parts.join(" + ")})` : "";

    return { base, profession, bonus, veteran, advancement, total, breakdownText };
  }
}

export function buildSkillsForCustomProfession(
  blankSkills: Record<string, SkillBlock>,
  customProfessionSkills: string[],
  customProfessionTypedSkills: TypedSkill[],
  customProfessionSkillPoints: Record<string, number>
): {
  skills: Record<string, SkillBlock>;
  typedSkills: Record<string, TypedSkillBlock>;
} {
  // Standard skills
  const newSkills: Record<string, SkillBlock> = {};
  customProfessionSkills.forEach(skillKey => {
    const skillTemplate = blankSkills[skillKey];
    newSkills[skillKey] = {
      ...skillTemplate,
      proficiency: customProfessionSkillPoints[skillKey] ?? 0
    };
  });

  Object.keys(blankSkills).forEach(skillKey => {
    if (!newSkills[skillKey]) {
      newSkills[skillKey] = { ...blankSkills[skillKey] };
    }
  });

  // Typed skills
  const newTypedSkills: Record<string, TypedSkillBlock> = {};
  customProfessionTypedSkills.forEach((ts, idx) => {
    const key = `${ts.type}_${ts.subtype}_${idx}`;
    newTypedSkills[key] = {
      type: "typeSkill",
      key,
      actorType: "agent",
      label:
        ts.type.charAt(0).toUpperCase() +
        ts.type.slice(1).replace("_", " ") +
        ` [${ts.subtype}]`,
      sortLabel:
        ts.type.charAt(0).toUpperCase() +
        ts.type.slice(1).replace("_", " ") +
        ` [${ts.subtype}]`,
      group: ts.type.charAt(0).toUpperCase() + ts.type.slice(1),
      proficiency: customProfessionSkillPoints[key] ?? 0,
      failure: false
    };
  });

  return { skills: newSkills, typedSkills: newTypedSkills };
}

export function buildSkillsForStandardProfession(
  blankSkills: Record<string, SkillBlock>,
  profession: Profession,
  choiceSelections: Record<number, ChoiceSelectionGroup>,
  fixedSkillSubtypes: Record<number, string>
): {
  skills: Record<string, SkillBlock>;
  typedSkills: Record<string, TypedSkillBlock>;
} {
  const newSkills: Record<string, SkillBlock> = JSON.parse(
    JSON.stringify(blankSkills)
  );
  const newTypedSkills: Record<string, TypedSkillBlock> = {};

  profession.fixedSkills.forEach((skill, idx) => {
    if (skill.typed) {
      const subtype =
        skill.subtype ||
        fixedSkillSubtypes[idx] ||
        "";
      if (!subtype) return;

      const key = `${skill.key}_${subtype}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      newTypedSkills[key] = {
        type: "typeSkill",
        key,
        actorType: "agent",
        label:
          skill.key.charAt(0).toUpperCase() +
          skill.key.slice(1) +
          ` [${subtype}]`,
        sortLabel:
          skill.key.charAt(0).toUpperCase() +
          skill.key.slice(1) +
          ` [${subtype}]`,
        group: skill.key.charAt(0).toUpperCase() + skill.key.slice(1),
        proficiency: skill.proficiency,
        failure: false
      };
    } else {
      if (newSkills[skill.key]) {
        newSkills[skill.key].proficiency = skill.proficiency;
      }
    }
  });

  profession.choiceSkills.forEach((choiceGroup, groupIdx) => {
    const selection = choiceSelections[groupIdx]?.selected ?? [];

    selection.forEach(optIdx => {
      const opt = choiceGroup.options[optIdx];
      if (!opt) return;

      if (opt.typed) {
        const subtype =
          choiceSelections[groupIdx]?.subtypes?.[optIdx] ?? "";
        if (!subtype) return;

        const key = `${opt.key}_${subtype}`
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "");

        newTypedSkills[key] = {
          type: "typeSkill",
          key,
          actorType: "agent",
          label:
            opt.key.charAt(0).toUpperCase() +
            opt.key.slice(1) +
            ` [${subtype}]`,
          sortLabel:
            opt.key.charAt(0).toUpperCase() +
            opt.key.slice(1) +
            ` [${subtype}]`,
          group: opt.key.charAt(0).toUpperCase() + opt.key.slice(1),
          proficiency: opt.proficiency,
          failure: false
        };
      } else {
        if (newSkills[opt.key]) {
          newSkills[opt.key].proficiency = opt.proficiency;
        }
      }
    });
  });

  return { skills: newSkills, typedSkills: newTypedSkills };
}