// src/features/player-panel/conditionRolls.ts
import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import type { ConditionTemplate, RollMods } from "../../models/conditions";
import conditionsDataJson from "../../data/conditions.json";

const CUSTOM_CONDITIONS_KEY = "dg-custom-conditions";

function loadCustomTemplates(): ConditionTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CONDITIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConditionTemplate[]) : [];
  } catch {
    return [];
  }
}

function clampChance(n: number) {
  return Math.max(0, Math.min(100, Math.floor(n)));
}

export type RollAdjustment = {
  delta: number;
  sources: string[]; 
};

export function buildConditionTemplateMap(): Map<string, ConditionTemplate> {
  const builtIns = conditionsDataJson as ConditionTemplate[];
  const customs = loadCustomTemplates();
  const map = new Map<string, ConditionTemplate>();
  for (const t of [...builtIns, ...customs]) map.set(t.id, t);
  return map;
}

function accumulateMods(
  agent: DeltaGreenAgent,
  getDelta: (mods: RollMods) => number
): RollAdjustment {
  const conditions = agent.system.conditions ?? [];
  const tmplMap = buildConditionTemplateMap();

  let delta = 0;
  const sources: string[] = [];

  for (const c of conditions) {
    const tmpl = tmplMap.get(c.id);
    const mods = tmpl?.rollMods;
    if (!mods) continue;

    const d = getDelta(mods);
    if (d !== 0) {
      delta += d;
      sources.push(c.label);
    }
  }

  return { delta, sources };
}

export function getEffectiveSkillChance(
  agent: DeltaGreenAgent,
  base: number,
  skillKey: string
): { chance: number; adj: RollAdjustment } {
  const adj = accumulateMods(agent, (mods) => (mods.all ?? 0) + (mods.skills?.all ?? 0) + (mods.skills?.bySkill?.[skillKey] ?? 0));
  return { chance: clampChance(base + adj.delta), adj };
}

export function getEffectiveStatChance(
  agent: DeltaGreenAgent,
  baseX5: number,
  statKey: "str" | "con" | "dex" | "int" | "pow" | "cha"
): { chance: number; adj: RollAdjustment } {
  const adj = accumulateMods(agent, (mods) => (mods.all ?? 0) + (mods.stats?.all ?? 0) + (mods.stats?.byStat?.[statKey] ?? 0));
  return { chance: clampChance(baseX5 + adj.delta), adj };
}

export function getEffectiveSanTestChance(
  agent: DeltaGreenAgent,
  baseSan: number
): { chance: number; adj: RollAdjustment } {
  const adj = accumulateMods(agent, (mods) => {
    return (mods.all ?? 0) + (mods.san ?? 0);
  });
  return { chance: clampChance(baseSan + adj.delta), adj };
}