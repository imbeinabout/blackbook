// src/features/homeScenes/pursuitEngine.ts
import type { DeltaGreenAgent, DeltaGreenItem } from "../../models/DeltaGreenAgent";
import type { PersonalPursuit as ModelPersonalPursuit } from "../../models/personalPursuits";

export type OutcomeKey = "critical_failure" | "failure" | "success" | "critical_success";

export type PursuitDef = ModelPersonalPursuit & {
  hidden_test?: string;
  san?: string; // e.g. "1d6-3"
  on_failure?: { skill?: string; stat?: string };
  result?: Record<string, Record<string, string> | undefined>;
};

export type PursuitContext = {
  selectedBondId?: string;

  // therapy
  therapyChoice?: "truth" | "lie";

  // improve_skills_stats
  improveKind?: "stat" | "skill";
  selectedSkillKey?: string;
  selectedStatKey?: string; // "str" | "con" | etc

  // establish_new_bond
  newBondName?: string;

  // special_training
  training?: {
    name: string;
    targetType: "stat" | "skill" | "typedSkill";
    targetKey: string;
  };
};

export type EffectMaps = {
  pre: Record<string, string>;
  result: Record<string, string>;
  post: Record<string, string>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function uuid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `id_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export function pursuitUsesOutcome(p: PursuitDef): boolean {
  return !(
    p.id === "special_training" ||
    p.id === "stay_on_case" ||
    p.id === "study_unnatural"
  );
}

export function pursuitShowsTestRoll(p: PursuitDef): boolean {
  if (p.id === "stay_on_case") return false;

  if (p.id === "special_training" || p.id === "study_unnatural") return false;

  return true;
}

export function resolveResultKey(p: PursuitDef, outcome: OutcomeKey, ctx: PursuitContext): string {
  if (p.id === "therapy") {
    const choice = ctx.therapyChoice ?? "truth";
    const group = outcome === "success" || outcome === "critical_success" ? "success" : "failure";
    return `${choice}_${group}`; // truth_success / lie_failure etc
  }
  return outcome;
}

export function shouldCreateBond(p: PursuitDef, outcome: OutcomeKey): boolean {
  if (p.id !== "establish_new_bond") return false;
  return outcome === "success" || outcome === "critical_success";
}

export function getEffectMaps(p: PursuitDef, outcome: OutcomeKey, ctx: PursuitContext): EffectMaps {
  const pre = (p.pre_effect ?? {}) as Record<string, string>;
  const post = (p.post_effect ?? {}) as Record<string, string>;

  let result: Record<string, string> = {};

  const key = resolveResultKey(p, outcome, ctx);
  if (p.result && p.result[key]) {
    result = (p.result[key] ?? {}) as Record<string, string>;
  } else if (p.result && (p.result as any)[outcome]) {
    result = ((p.result as any)[outcome] ?? {}) as Record<string, string>;
  }

  if (p.id === "improve_skills_stats") {
    const failed = outcome === "failure" || outcome === "critical_failure";
    if (failed) {
      const kind = ctx.improveKind ?? "skill";
      if (kind === "skill" && p.on_failure?.skill) result = { ...result, skill: p.on_failure.skill };
      if (kind === "stat" && p.on_failure?.stat) result = { ...result, stat: p.on_failure.stat };
    }
  }

  if (p.id === "stay_on_case" && p.san) {
    result = { ...result, san: p.san };
  }

  return { pre, result, post };
}

export function pursuitNeedsSelectedBond(p: PursuitDef): boolean {
  const hasKey = (m?: Record<string, string>) =>
    !!m && Object.prototype.hasOwnProperty.call(m, "selected_bond");

  if (hasKey(p.pre_effect as any)) return true;
  if (hasKey(p.post_effect as any)) return true;

  if (p.result) {
    for (const k of Object.keys(p.result)) {
      if (hasKey(p.result[k] as any)) return true;
    }
  }

  if (p.id === "improve_skills_stats") return true;
  if (p.id === "special_training") return true;
  if (p.id === "establish_new_bond") return true;
  if (p.id === "stay_on_case") return true;
  if (p.id === "study_unnatural") return true;

  return false;
}

export function applyPursuitTotals(
  agent: DeltaGreenAgent,
  p: PursuitDef,
  outcome: OutcomeKey,
  ctx: PursuitContext,
  totals: Record<string, number>
) {
  // 1) Apply numeric totals by key
  for (const [key, delta] of Object.entries(totals)) {
    if (!delta) continue;

    if (key === "san") {
      const s = agent.system.sanity;
      s.value = clamp((s.value ?? 0) + delta, 0, s.max ?? 99);
      continue;
    }

    if (key === "selected_bond" && ctx.selectedBondId) {
      const bond = agent.items.find((it) => it.type === "bond" && it._id === ctx.selectedBondId) as DeltaGreenItem | undefined;
      if (bond) {
        const cur = Number(bond.system?.score ?? 0) || 0;
        bond.system = { ...(bond.system ?? {}), score: clamp(cur + delta, 0, 99) };
      }
      continue;
    }

    if (key === "unnatural") {
      const skill = agent.system.skills?.unnatural;
      if (skill) {
        const cur = Number(skill.proficiency ?? 0) || 0;
        skill.proficiency = clamp(cur + delta, 0, 99);
      }
      continue;
    }

    if (key === "skill") {
      const k = ctx.selectedSkillKey;
      if (k && agent.system.skills?.[k]) {
        const cur = Number(agent.system.skills[k].proficiency ?? 0) || 0;
        agent.system.skills[k].proficiency = clamp(cur + delta, 0, 99);
      }
      continue;
    }

    if (key === "stat") {
      const k = (ctx.selectedStatKey ?? "").toLowerCase();
      const stat = (agent.system.statistics as any)?.[k];
      if (stat) {
        const cur = Number(stat.value ?? 0) || 0;
        const next = clamp(cur + delta, 0, 99);
        stat.value = next;
        stat.x5 = next * 5;
      }
      continue;
    }
  }

  // 2) Special non-numeric effects

  if (shouldCreateBond(p, outcome)) {
    const cha = agent.system.statistics.cha.value ?? 0;
    const score = Math.ceil(cha / 2);
    const name = (ctx.newBondName ?? "").trim() || "New Bond";

    const newBond: DeltaGreenItem = {
      _id: uuid(),
      type: "bond",
      name,
      system: {
        name,
        score: clamp(score, 0, 99),
        hasBeenDamagedSinceLastHomeScene: false,
      },
    };

    agent.items.push(newBond);
  }

  if (p.id === "special_training") {
    const t = ctx.training;
    if (t && t.name.trim() && t.targetKey.trim()) {
      agent.system.specialTraining = agent.system.specialTraining ?? [];
      agent.system.specialTraining.push({
        id: uuid(),
        name: t.name.trim(),
        targetType: t.targetType,
        targetKey: t.targetKey.trim(),
      });
    }
  }
}