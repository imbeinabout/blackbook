// src/models/conditions.ts
export type ConditionCategory =
  | "physical"
  | "combat"
  | "mental"
  | "sanity"
  | "chemical"
  | "social"
  | "status";

export interface ActiveCondition {
  id: string; 
  label: string;
  category: ConditionCategory;
  source?: string;
}

export type RollMods = {
  all?: number;

  /** Modifier applied to ALL stat x5 tests (STR/CON/DEX/INT/POW/CHA) */
  stats?: {
    all?: number;
    byStat?: Partial<Record<"str" | "con" | "dex" | "int" | "pow" | "cha", number>>;
  };

  /** Modifier applied to ALL skill tests */
  skills?: {
    all?: number;
    bySkill?: Partial<Record<string, number>>;
  };

  /** Modifier applied to SAN tests */
  san?: number;
};

export interface ConditionTemplate {
  id: string;
  label: string;
  category: ConditionCategory;
  description?: string;
  effects?: string[];
  rollMods?: RollMods;
}