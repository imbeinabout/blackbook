// src/models/baseSkills.ts
import type { SkillBlock } from "./DeltaGreenAgent";

export const skillBaseValues: Record<string, number> = {
  accounting: 10,
  alertness: 20,
  athletics: 30,
  bureaucracy: 10,
  criminology: 10,
  disguise: 10,
  dodge: 30,
  drive: 20,
  firearms: 20,
  first_aid: 10,
  heavy_machinery: 10,
  history: 10,
  humint: 10,
  melee_weapons: 30,
  navigate: 10,
  occult: 10,
  persuade: 20,
  psychotherapy: 10,
  ride: 10,
  search: 20,
  stealth: 10,
  survival: 10,
  swim: 20,
  unarmed_combat: 40,
  // Other skills default to 0
};

export const skillList = [
  "Accounting", "Alertness", "Anthropology", "Archeology", "Artillery", "Athletics",
  "Bureaucracy", "Computer Science", "Criminology", "Demolitions", "Disguise", "Dodge",
  "Drive", "Firearms", "First Aid", "Forensics", "Heavy Machinery", "Heavy Weapons",
  "History", "HUMINT", "Law", "Medicine", "Melee Weapons", "Navigate", "Occult",
  "Persuade", "Pharmacy", "Psychotherapy", "Ride", "Search", "SIGINT", "Stealth",
  "Surgery", "Survival", "Swim", "Unarmed Combat", "Unnatural"
] as const;

export function buildBaseSkills(): Record<string, SkillBlock> {
  return skillList.reduce((acc, skill) => {
    const key = skill.toLowerCase().replace(/ /g, "_");
    acc[key] = {
      key,
      label: skill,
      sortLabel: skill,
      tooltip: "",
      proficiency: skillBaseValues[key] ?? 0,
      failure: false,
      cannotBeImprovedByFailure: false,
      isCalculatedValue: false,
      targetProficiency: 0,
    };
    return acc;
  }, {} as Record<string, SkillBlock>);
}