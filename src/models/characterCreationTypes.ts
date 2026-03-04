// src/models/characterCreationTypes.ts
const stats = ["str", "con", "dex", "int", "pow", "cha"] as const;
export type FixedSkill = {
  key: string;
  proficiency: number;
  typed?: boolean;
  subtype?: string;
};
export type ChoiceSkillOption = {
  key: string;
  proficiency: number;
  typed?: boolean;
  label?: string;
};
export type ChoiceSkillGroup = {
  options: ChoiceSkillOption[];
  choose: number;
};
export type Profession = {
  name: string;
  description: string;
  bonds: number;
  fixedSkills: FixedSkill[];
  choiceSkills: ChoiceSkillGroup[];
  isCustom?: boolean;
};
export type StatKey = typeof stats[number];
export type ChoiceSelectionGroup = {
  selected: number[]; // indices of selected options
  subtypes: Record<number, string>; // optIdx -> subtype string
};
export type TypedSkill = {
  type: string;
  subtype: string;
};
export type AllocationSkill =
  | { key: string; label: string; isTyped: false }
  | { key: string; label: string; isTyped: true; type: string; subtype: string; idx: number };

export type BonusSkillPackageSkill = {
  key: string;
  typed?: boolean;
  subtype?: string;      // present when fixed in the text (e.g., "electrician")
  needsSubtype?: boolean; // true when the text says "choose one"
};

export type BonusSkillPackage = {
  name: string;
  skills: BonusSkillPackageSkill[];
};