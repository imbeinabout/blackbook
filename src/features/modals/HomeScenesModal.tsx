// src/features/modals/HomeScenesModal.tsx
import React from "react";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../models/DeltaGreenAgent";
import NumberSpinner from "../../components/ui/NumberSpinner";
import personalPursuitsData from "../../data/personalPursuits.json";
import {
  applyPursuitTotals,
  getEffectMaps,
  pursuitNeedsSelectedBond,
  pursuitShowsTestRoll,
  pursuitUsesOutcome,
  shouldCreateBond,
  type OutcomeKey,
  type PursuitContext,
  type PursuitDef,
} from "../homeScenes/pursuitEngine";

const PERSONAL_PURSUITS = personalPursuitsData as PursuitDef[];

type HomeScenesModalProps = {
  agent: DeltaGreenAgent;
  updateAgentViaMutator: (mutate: (copy: DeltaGreenAgent) => void) => void;

  openGenericRoll: (label: string, formula: string) => void;
  openSkillRoll?: (label: string, chance: number) => void;
  openStatRoll?: (label: string, x5: number) => void;
  openSanityTest?: () => void;
  openLuckTest?: () => void;

  onClose: () => void;
};

type PursuitEffectMap = Record<string, string>;

type EffectLine = {
  id: string;
  key: string;
  expr: string;
  phase: "pre" | "result" | "post";
  isDice: boolean;
  sign: 1 | -1;
  rollFormula?: string;
  constant: number;
};

function isDiceExpr(expr: string) {
  return /d\d+/i.test(expr);
}

function parseEffectLine(key: string, exprRaw: string, phase: EffectLine["phase"], idx: number): EffectLine {
  const expr = (exprRaw ?? "").trim();
  const isDice = isDiceExpr(expr);

  let sign: 1 | -1 = 1;
  let rollFormula: string | undefined = undefined;

  if (isDice) {
    if (expr.startsWith("-")) {
      sign = -1;
      rollFormula = expr.slice(1).trim();
    } else if (expr.startsWith("+")) {
      rollFormula = expr.slice(1).trim();
    } else {
      rollFormula = expr;
    }
  }

  const constant = !isDice && /^[+-]?\d+$/.test(expr) ? Number(expr) : 0;

  return {
    id: `${phase}:${key}:${idx}`,
    key,
    expr,
    phase,
    isDice,
    sign,
    rollFormula,
    constant,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getBondName(b: DeltaGreenItem) {
  return b.system?.name ?? b.name ?? "Bond";
}

function getBondScore(b: DeltaGreenItem) {
  return Number(b.system?.score ?? 0) || 0;
}

function getStatX5(agent: DeltaGreenAgent, statKey: string): number {
  const k = statKey.toLowerCase();
  const stats: any = agent.system.statistics as any;
  if (!stats[k]) return 0;
  return Number(stats[k].x5 ?? (Number(stats[k].value ?? 0) * 5)) || 0;
}

export default function HomeScenesModal({
  agent,
  updateAgentViaMutator,
  openGenericRoll,
  openSkillRoll,
  openStatRoll,
  openSanityTest,
  openLuckTest,
  onClose,
}: HomeScenesModalProps) {
  const bonds: DeltaGreenItem[] = agent.items?.filter((it) => it.type === "bond") ?? [];
  const damagedBonds = bonds.filter((b) => !!b.system?.hasBeenDamagedSinceLastHomeScene);

  const [selectedPursuit, setSelectedPursuit] = React.useState<PursuitDef | null>(null);

  const [selectedOutcome, setSelectedOutcome] = React.useState<OutcomeKey | null>(null);

  const [selectedBondId, setSelectedBondId] = React.useState<string>("");

  const [diceInputs, setDiceInputs] = React.useState<Record<string, string>>({});

  const [therapyChoice, setTherapyChoice] = React.useState<"truth" | "lie">("truth");

  const [improveKind, setImproveKind] = React.useState<"stat" | "skill">("skill");
  const [selectedSkillKey, setSelectedSkillKey] = React.useState<string>("");
  const [selectedStatKey, setSelectedStatKey] = React.useState<string>("");

  const [newBondName, setNewBondName] = React.useState<string>("");

  const [trainingName, setTrainingName] = React.useState<string>("");
  const [trainingTargetType, setTrainingTargetType] = React.useState<"stat" | "skill" | "typedSkill">("skill");
  const [trainingTargetKey, setTrainingTargetKey] = React.useState<string>("");

  React.useEffect(() => {
    setSelectedOutcome(null);
    setDiceInputs({});
    setSelectedBondId("");

    setTherapyChoice("truth");
    setImproveKind("skill");
    setSelectedSkillKey("");
    setSelectedStatKey("");

    setNewBondName("");

    setTrainingName("");
    setTrainingTargetType("skill");
    setTrainingTargetKey("");
  }, [selectedPursuit]);

  React.useEffect(() => {
    if (!selectedPursuit) return;
    const needsBond = pursuitNeedsSelectedBond(selectedPursuit);
    if (!needsBond) return;
    if (bonds.length === 0) return;
    setSelectedBondId((prev) => (prev ? prev : bonds[0]._id));
  }, [selectedPursuit, bonds]);

  React.useEffect(() => {
    if (!selectedPursuit) return;
    if (!pursuitUsesOutcome(selectedPursuit)) {
      setSelectedOutcome("success");
    }
  }, [selectedPursuit]);

  const ctx: PursuitContext = React.useMemo(() => {
    return {
      selectedBondId,
      therapyChoice,
      improveKind,
      selectedSkillKey,
      selectedStatKey,
      newBondName,
      training: {
        name: trainingName,
        targetType: trainingTargetType,
        targetKey: trainingTargetKey,
      },
    };
  }, [
    selectedBondId,
    therapyChoice,
    improveKind,
    selectedSkillKey,
    selectedStatKey,
    newBondName,
    trainingName,
    trainingTargetType,
    trainingTargetKey,
  ]);

  const needsBond = React.useMemo(() => {
    if (!selectedPursuit) return false;
    return pursuitNeedsSelectedBond(selectedPursuit);
  }, [selectedPursuit]);

  // Improve Skills/Stats selection must come before test + outcomes
  const improveSelectionReady = React.useMemo(() => {
    if (!selectedPursuit) return true;
    if (selectedPursuit.id !== "improve_skills_stats") return true;
    if (improveKind === "skill") return !!selectedSkillKey;
    return !!selectedStatKey;
  }, [selectedPursuit, improveKind, selectedSkillKey, selectedStatKey]);

  // Special Training has no roll/outcome; requires training info
  const trainingReady = React.useMemo(() => {
    if (!selectedPursuit) return true;
    if (selectedPursuit.id !== "special_training") return true;
    return !!trainingName.trim() && !!trainingTargetKey.trim();
  }, [selectedPursuit, trainingName, trainingTargetKey]);

  const specialMissing = React.useMemo(() => {
    if (!selectedPursuit) return false;

    if (selectedPursuit.id === "improve_skills_stats") return !improveSelectionReady;
    if (selectedPursuit.id === "special_training") return !trainingReady;

    // Therapy choice always has a default (truth)
    return false;
  }, [selectedPursuit, improveSelectionReady, trainingReady]);

  // Effect lines come from engine maps
  const effectLines: EffectLine[] = React.useMemo(() => {
    if (!selectedPursuit || !selectedOutcome) return [];

    const { pre, result, post } = getEffectMaps(selectedPursuit, selectedOutcome, ctx);

    const lines: EffectLine[] = [];
    let i = 0;

    for (const [k, v] of Object.entries(pre as PursuitEffectMap)) lines.push(parseEffectLine(k, v, "pre", i++));
    for (const [k, v] of Object.entries(result as PursuitEffectMap)) lines.push(parseEffectLine(k, v, "result", i++));
    for (const [k, v] of Object.entries(post as PursuitEffectMap)) lines.push(parseEffectLine(k, v, "post", i++));

    return lines;
  }, [selectedPursuit, selectedOutcome, ctx]);

  const diceLinesMissing = React.useMemo(() => {
    for (const line of effectLines) {
      if (!line.isDice) continue;
      const raw = diceInputs[line.id];
      if (raw == null || raw === "" || !Number.isFinite(Number(raw))) return true;
    }
    return false;
  }, [effectLines, diceInputs]);

  const summaryTotals = React.useMemo(() => {
    const totals: Record<string, number> = {};
    for (const line of effectLines) {
      totals[line.key] = totals[line.key] ?? 0;

      if (line.isDice) {
        const raw = diceInputs[line.id];
        const n = Number(raw);
        if (Number.isFinite(n)) totals[line.key] += n;
      } else {
        totals[line.key] += line.constant;
      }
    }
    return totals;
  }, [effectLines, diceInputs]);

  const summaryExtras = React.useMemo(() => {
    if (!selectedPursuit) return [];

    const extras: string[] = [];

    if (
      selectedPursuit.id === "establish_new_bond" &&
      selectedOutcome &&
      shouldCreateBond(selectedPursuit, selectedOutcome)
    ) {
      const cha = agent.system.statistics.cha.value ?? 0;
      const score = Math.ceil(cha / 2);
      const name = newBondName.trim() || "New Bond";
      extras.push(`NEW BOND: ${name} (${score})`);
    }

    if (selectedPursuit.id === "special_training") {
      if (trainingName.trim() && trainingTargetKey.trim()) {
        extras.push(`SPECIAL TRAINING: ${trainingName.trim()} → ${trainingTargetType}:${trainingTargetKey.trim()}`);
      }
    }

    return extras;
  }, [selectedPursuit, selectedOutcome, agent, newBondName, trainingName, trainingTargetType, trainingTargetKey]);

  const closePursuit = () => {
    setSelectedPursuit(null);
    setSelectedOutcome(null);
    setDiceInputs({});
    setSelectedBondId("");
  };

  const completeHomeScene = () => {
    updateAgentViaMutator((copy) => {
      copy.items = copy.items.map((it: DeltaGreenItem) => {
        if (it.type !== "bond") return it;
        return {
          ...it,
          system: { ...(it.system ?? {}), hasBeenDamagedSinceLastHomeScene: false },
        };
      });
    });
    onClose();
  };

  const applyPursuit = () => {
    if (!selectedPursuit || !selectedOutcome) return;
    if (diceLinesMissing) return;
    if (needsBond && !selectedBondId) return;
    if (specialMissing) return;

    updateAgentViaMutator((copy) => {
      applyPursuitTotals(copy, selectedPursuit, selectedOutcome, ctx, summaryTotals);
      copy.system.sanity.value = clamp(copy.system.sanity.value, 0, copy.system.sanity.max ?? 99);
    });

    closePursuit();
  };

  const allowDiceRollButtons = React.useMemo(() => {
    if (!selectedPursuit) return true;
    if (selectedPursuit.id === "stay_on_case") return false;
    return true;
  }, [selectedPursuit]);

  const showOutcomeButtons = !!selectedPursuit && pursuitUsesOutcome(selectedPursuit);

  const showTestRollButtons = !!selectedPursuit && pursuitShowsTestRoll(selectedPursuit);

  return (
    <div className="bb-modal" onClick={onClose}>
      <div className="bb-modal__dialog bb-home-scenes-modal__dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="bb-modal__title">Home Scenes</h2>

        <div className="bb-modal__body bb-home-scenes-modal__body">
          {/* Damaged Bonds */}
          <section style={{ marginBottom: "1rem" }}>
            <h3 className="bb-section-title">Damaged Bonds</h3>
            {damagedBonds.length === 0 ? (
              <p className="bb-text-muted" style={{ margin: 0 }}>
                No damaged bonds.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {damagedBonds.map((b) => (
                  <li key={b._id} style={{ marginBottom: "0.25rem" }}>
                    <label className="bb-checkbox bb-checkbox--small">
                      <input type="checkbox" className="bb-checkbox__input" checked readOnly />
                      <span className="bb-checkbox__box" />
                      <span className="bb-checkbox__label">
                        {getBondName(b)} ({getBondScore(b)})
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Handler Updates */}
          <section style={{ marginBottom: "1rem" }}>
            <h3 className="bb-section-title">Talk about any updates with your handler</h3>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }} className="bb-text-muted">
              <li>Injuries, permanent injuries</li>
              <li>Diseases</li>
              <li>Disorders</li>
              <li>Work: Did they get fired or have work consequences?</li>
              <li>Prosecution: Did the agent end up in jail?</li>
            </ul>
          </section>

          {/* Personal Pursuits */}
          <section>
            <h3 className="bb-section-title">Personal Pursuits</h3>

            {!selectedPursuit ? (
              <>
                <p className="bb-text-muted" style={{ marginTop: 0 }}>
                  Choose one pursuit. Some pursuits require an outcome; others just apply effects.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.35rem" }}>
                  {PERSONAL_PURSUITS.map((p) => (
                    <button
                      key={p.id ?? p.name}
                      type="button"
                      className="bb-button bb-button--small"
                      onClick={() => setSelectedPursuit(p)}
                      title={p.description ?? ""}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--bb-border-soft)", paddingTop: "0.75rem" }}>
                <h4 style={{ margin: "0 0 0.25rem 0" }}>{selectedPursuit.name}</h4>

                {selectedPursuit.description && (
                  <p className="bb-text-muted" style={{ marginTop: 0 }}>
                    {selectedPursuit.description}
                  </p>
                )}

                {selectedPursuit.id === "improve_skills_stats" && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Choose what you’re improving (required before rolling):
                    </div>

                    <div className="bb-radio-row" style={{ marginBottom: "0.35rem" }}>
                      <label className="bb-radio-option">
                        <input type="radio" checked={improveKind === "skill"} onChange={() => setImproveKind("skill")} />
                        Skill
                      </label>
                      <label className="bb-radio-option">
                        <input type="radio" checked={improveKind === "stat"} onChange={() => setImproveKind("stat")} />
                        Stat
                      </label>
                    </div>

                    {improveKind === "skill" ? (
                      <select value={selectedSkillKey} onChange={(e) => setSelectedSkillKey(e.target.value)}>
                        <option value="">Select skill…</option>
                        {Object.keys(agent.system.skills)
                          .filter((k) => k !== "unnatural") // 2) exclude unnatural
                          .sort()
                          .map((k) => (
                            <option key={k} value={k}>
                              {agent.system.skills[k].label ?? k}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <select value={selectedStatKey} onChange={(e) => setSelectedStatKey(e.target.value)}>
                        <option value="">Select stat…</option>
                        {["str", "con", "dex", "int", "pow", "cha"].map((k) => (
                          <option key={k} value={k}>
                            {k.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    )}

                    {!improveSelectionReady && (
                      <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
                        Select a {improveKind} to enable the roll and outcome buttons.
                      </div>
                    )}
                  </div>
                )}

                {selectedPursuit.id === "establish_new_bond" && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Name the new bond (created on success/critical success):
                    </div>
                    <input
                      value={newBondName}
                      onChange={(e) => setNewBondName(e.target.value)}
                      placeholder="e.g. Partner, Kid, Best Friend…"
                    />
                  </div>
                )}

                {selectedPursuit.id === "special_training" && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Add a Special Training entry:
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.35rem" }}>
                      <input
                        value={trainingName}
                        onChange={(e) => setTrainingName(e.target.value)}
                        placeholder="Training name (e.g. Breaching, Trauma Surgery, Surveillance Tradecraft)"
                      />

                      <div className="bb-radio-row" style={{ marginBottom: 0 }}>
                        <label className="bb-radio-option">
                          <input type="radio" checked={trainingTargetType === "skill"} onChange={() => setTrainingTargetType("skill")} />
                          Skill
                        </label>
                        <label className="bb-radio-option">
                          <input type="radio" checked={trainingTargetType === "stat"} onChange={() => setTrainingTargetType("stat")} />
                          Stat
                        </label>
                        <label className="bb-radio-option">
                          <input type="radio" checked={trainingTargetType === "typedSkill"} onChange={() => setTrainingTargetType("typedSkill")} />
                          Typed Skill
                        </label>
                      </div>

                      {trainingTargetType === "skill" && (
                        <select value={trainingTargetKey} onChange={(e) => setTrainingTargetKey(e.target.value)}>
                          <option value="">Select skill…</option>
                          {Object.keys(agent.system.skills)
                            .filter((k) => k !== "unnatural")
                            .sort()
                            .map((k) => (
                              <option key={k} value={k}>
                                {agent.system.skills[k].label ?? k}
                              </option>
                            ))}
                        </select>
                      )}

                      {trainingTargetType === "stat" && (
                        <select value={trainingTargetKey} onChange={(e) => setTrainingTargetKey(e.target.value)}>
                          <option value="">Select stat…</option>
                          {["str", "con", "dex", "int", "pow", "cha"].map((k) => (
                            <option key={k} value={k}>
                              {k.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      )}

                      {trainingTargetType === "typedSkill" && (
                        <select value={trainingTargetKey} onChange={(e) => setTrainingTargetKey(e.target.value)}>
                          <option value="">Select typed skill…</option>
                          {Object.keys(agent.system.typedSkills ?? {})
                            .sort()
                            .map((k) => (
                              <option key={k} value={k}>
                                {agent.system.typedSkills[k].label ?? k}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>

                    {!trainingReady && (
                      <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
                        Enter a training name and select a target to enable Apply.
                      </div>
                    )}
                  </div>
                )}

                {showTestRollButtons && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    {renderTestRollButtons({
                      pursuit: selectedPursuit,
                      agent,
                      openGenericRoll,
                      openSkillRoll,
                      openStatRoll,
                      openSanityTest,
                      openLuckTest,
                      ctx,
                      disabled: selectedPursuit.id === "improve_skills_stats" && !improveSelectionReady,
                    })}
                  </div>
                )}

                {showOutcomeButtons && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    {(["critical_failure", "failure", "success", "critical_success"] as OutcomeKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={"bb-button bb-button--small" + (selectedOutcome === k ? " bb-button--primary" : "")}
                        onClick={() => setSelectedOutcome(k)}
                        disabled={selectedPursuit.id === "improve_skills_stats" && !improveSelectionReady}
                        title={
                          selectedPursuit.id === "improve_skills_stats" && !improveSelectionReady
                            ? "Select a skill/stat first"
                            : undefined
                        }
                      >
                        {k.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                )}

                {selectedPursuit.id === "therapy" && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Therapy choice:
                    </div>
                    <div className="bb-radio-row">
                      <label className="bb-radio-option">
                        <input type="radio" checked={therapyChoice === "truth"} onChange={() => setTherapyChoice("truth")} />
                        Tell the truth
                      </label>
                      <label className="bb-radio-option">
                        <input type="radio" checked={therapyChoice === "lie"} onChange={() => setTherapyChoice("lie")} />
                        Lie
                      </label>
                    </div>
                  </div>
                )}

                {needsBond && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Select the Bond affected by this pursuit:
                    </div>

                    {bonds.length === 0 ? (
                      <div className="bb-alert bb-alert--error">No bonds exist to apply bond effects.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {bonds.map((b) => (
                          <label key={b._id} className="bb-radio-grid">
                            <input type="radio" checked={selectedBondId === b._id} onChange={() => setSelectedBondId(b._id)} />
                            <span>
                              {getBondName(b)} <span className="bb-text-muted">({getBondScore(b)})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedOutcome ? (
                  <>
                    <h4 className="bb-section-title" style={{ marginTop: "0.75rem" }}>
                      Effects
                    </h4>

                    {effectLines.length === 0 ? (
                      <p className="bb-text-muted">No effects defined for this pursuit.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {effectLines.map((line) => {
                          const label = `${line.phase.toUpperCase()}: ${line.key.replace(/_/g, " ")}`;

                          if (!line.isDice) {
                            return (
                              <div key={line.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                                <div>
                                  <strong>{label}</strong>
                                  <div className="bb-text-muted" style={{ fontSize: "0.8rem" }}>
                                    {line.expr}
                                  </div>
                                </div>
                                <div style={{ minWidth: "120px", textAlign: "right" }}>
                                  <strong>
                                    {line.constant >= 0 ? "+" : ""}
                                    {line.constant}
                                  </strong>
                                </div>
                              </div>
                            );
                          }

                          const currentVal = diceInputs[line.id] ?? "";
                          const rollFormula = line.rollFormula ?? line.expr;

                          return (
                            <div
                              key={line.id}
                              style={{
                                display: "grid",
                                gridTemplateColumns: allowDiceRollButtons ? "1fr auto auto" : "1fr auto",
                                gap: "0.5rem",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <strong>{label}</strong>
                                <div className="bb-text-muted" style={{ fontSize: "0.8rem" }}>
                                  {line.expr}
                                </div>
                              </div>

                              {allowDiceRollButtons && (
                                <button
                                  type="button"
                                  className="bb-button bb-button--small"
                                  onClick={() => openGenericRoll(`${selectedPursuit.name}: ${line.key}`, rollFormula)}
                                  title="Roll in dice tray, then enter the result"
                                >
                                  Roll {rollFormula}
                                </button>
                              )}

                              <NumberSpinner
                                label=""
                                min={-999}
                                max={999}
                                value={currentVal}
                                onChange={(v) => {
                                  const raw = v.trim();
                                  if (raw === "") {
                                    setDiceInputs((prev) => {
                                      const next = { ...prev };
                                      delete next[line.id];
                                      return next;
                                    });
                                    return;
                                  }
                                  const n = Number(raw);
                                  if (!Number.isFinite(n)) return;
                                  const signed = line.sign === -1 ? -Math.abs(n) : Math.abs(n);
                                  setDiceInputs((prev) => ({ ...prev, [line.id]: String(signed) }));
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary + Apply/Close */}
                    <div style={{ marginTop: "0.9rem", borderTop: "1px solid var(--bb-border-soft)", paddingTop: "0.75rem" }}>
                      <h4 className="bb-section-title">Summary</h4>

                      {Object.keys(summaryTotals).length === 0 && summaryExtras.length === 0 ? (
                        <p className="bb-text-muted">No changes.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: "1.1rem" }} className="bb-text-muted">
                          {Object.entries(summaryTotals).map(([k, v]) => (
                            <li key={k}>
                              {k.replace(/_/g, " ")}: {v >= 0 ? "+" : ""}
                              {v}
                            </li>
                          ))}
                          {summaryExtras.map((s, idx) => (
                            <li key={`extra-${idx}`}>{s}</li>
                          ))}
                        </ul>
                      )}

                      {diceLinesMissing && (
                        <div className="bb-alert bb-alert--error" style={{ marginTop: "0.5rem" }}>
                          Enter all dice results before applying.
                        </div>
                      )}

                      {needsBond && !selectedBondId && (
                        <div className="bb-alert bb-alert--error" style={{ marginTop: "0.5rem" }}>
                          Select a bond before applying.
                        </div>
                      )}

                      {specialMissing && (
                        <div className="bb-alert bb-alert--error" style={{ marginTop: "0.5rem" }}>
                          Complete the required selections for this pursuit before applying.
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.75rem" }}>
                        <button type="button" className="bb-button bb-button--ghost" onClick={closePursuit}>
                          Close
                        </button>

                        <button
                          type="button"
                          className="bb-button bb-button--primary"
                          disabled={!selectedOutcome || diceLinesMissing || (needsBond && !selectedBondId) || specialMissing}
                          onClick={applyPursuit}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="bb-text-muted" style={{ marginTop: "0.75rem" }}>
                    {showOutcomeButtons ? "Select an outcome to see effects." : "Preparing effects…"}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Main modal footer */}
        <div className="bb-modal__footer" style={{ justifyContent: "space-between" }}>
          <button type="button" className="bb-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="bb-button bb-button--primary" onClick={completeHomeScene}>
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}

function renderTestRollButtons(args: {
  pursuit: PursuitDef;
  agent: DeltaGreenAgent;
  openGenericRoll: (label: string, formula: string) => void;
  openSkillRoll?: (label: string, chance: number) => void;
  openStatRoll?: (label: string, x5: number) => void;
  openSanityTest?: () => void;
  openLuckTest?: () => void;
  ctx: PursuitContext;
  disabled?: boolean;
}) {
  const { pursuit, agent, openGenericRoll, openSkillRoll, openStatRoll, openSanityTest, openLuckTest, ctx, disabled } = args;
  const test = (pursuit.test ?? "").trim();

  const buttons: React.ReactNode[] = [];

  if (test.toUpperCase() === "SAN") {
    buttons.push(
      <button
        key="san"
        type="button"
        className="bb-button bb-button--small"
        onClick={() => openSanityTest?.()}
        disabled={!openSanityTest || disabled}
        title={!openSanityTest ? "Wire openSanityTest from MainPage" : "Roll SAN test"}
      >
        Roll SAN Test
      </button>
    );
  }

  if (test.toUpperCase() === "LUCK") {
    buttons.push(
      <button
        key="luck"
        type="button"
        className="bb-button bb-button--small"
        onClick={() => openLuckTest?.()}
        disabled={!openLuckTest || disabled}
        title={!openLuckTest ? "Wire openLuckTest from MainPage" : "Roll Luck test"}
      >
        Roll Luck Test
      </button>
    );
  }

  const statMatch = test.match(/^([A-Z]{3})\s*[×x]\s*5$/);
  if (statMatch) {
    const stat = statMatch[1].toUpperCase();
    const x5 = getStatX5(agent, stat);
    buttons.push(
      <button
        key={`stat-${stat}`}
        type="button"
        className="bb-button bb-button--small"
        onClick={() => openStatRoll?.(stat, x5)}
        disabled={!openStatRoll || disabled}
        title={!openStatRoll ? "Wire openStatRoll from MainPage" : `Roll ${stat}×5`}
      >
        Roll {stat}×5
      </button>
    );
  }

  if (test === "STAT×5_OR_SKILL") {
    if (ctx.improveKind === "stat") {
      const k = (ctx.selectedStatKey ?? "").toUpperCase();
      if (k) {
        const x5 = getStatX5(agent, k);
        buttons.push(
          <button
            key={`improve-stat-${k}`}
            type="button"
            className="bb-button bb-button--small"
            onClick={() => openStatRoll?.(k, x5)}
            disabled={!openStatRoll || disabled}
            title={!openStatRoll ? "Wire openStatRoll from MainPage" : `Roll ${k}×5`}
          >
            Roll {k}×5
          </button>
        );
      }
    } else {
      const skillKey = ctx.selectedSkillKey ?? "";
      const skill = agent.system.skills?.[skillKey];
      const chance = skill?.proficiency ?? 0;
      if (skillKey && skill && openSkillRoll) {
        buttons.push(
          <button
            key={`improve-skill-${skillKey}`}
            type="button"
            className="bb-button bb-button--small"
            onClick={() => openSkillRoll(`${skill.label} Test`, chance)}
            disabled={disabled}
            title={`Roll ${skill.label} ${chance}%`}
          >
            Roll {skill.label}
          </button>
        );
      }
    }
  }

  if (buttons.length === 0 && test) {
    buttons.push(
      <button
        key="generic"
        type="button"
        className="bb-button bb-button--small"
        onClick={() => openGenericRoll(`${pursuit.name} Test`, test)}
        disabled={disabled}
        title={`Roll: ${test}`}
      >
        Roll Test
      </button>
    );
  }

  return <>{buttons}</>;
}