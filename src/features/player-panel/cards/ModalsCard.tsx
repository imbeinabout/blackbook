// src/features/player-panel/cards/ModalsCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import type { ActiveCondition, ConditionCategory } from "../../../models/conditions";
import NumberSpinner from "../../../components/ui/NumberSpinner";

import { addCondition } from "../conditions.logic";
import AddConditionModal from "../../modals/AddConditionModal";
import HomeScenesModal from "../../modals/HomeScenesModal";
import { nanoid } from "nanoid";

type ConditionTemplate = Omit<ActiveCondition, "source">;

type ModalsCardProps = {
  agent: DeltaGreenAgent;
  updateAgentViaMutator: (mutate: (copy: DeltaGreenAgent) => void) => void;
  onGenericRoll: (label: string, formula: string) => void;
  openSkillRoll: (label: string, chance: number) => void;
  openStatRoll: (label: string, x5: number) => void;
  openSanityTest: () => void;
  openLuckTest: () => void;
};

type RowState = {
  key: string;
  label: string;
  isTyped: boolean;
  value: number; // 1-4
};

const ModalsCard: React.FC<ModalsCardProps> = ({
  agent,
  updateAgentViaMutator,
  onGenericRoll,
  openSkillRoll,
  openStatRoll,
  openSanityTest,
  openLuckTest,
}) => {
  // -------------------------
  // Upgrade modal
  // -------------------------
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false);

  const checkedRows = React.useMemo<RowState[]>(() => {
    const rows: RowState[] = [];

    Object.entries(agent.system.skills).forEach(([key, s]) => {
      if (s.failure) {
        rows.push({ key, label: s.label, isTyped: false, value: 1 });
      }
    });

    Object.entries(agent.system.typedSkills).forEach(([key, s]) => {
      if (s.failure) {
        rows.push({ key, label: s.label, isTyped: true, value: 1 });
      }
    });

    rows.sort((a, b) => a.label.localeCompare(b.label));
    return rows;
  }, [agent]);

  const [rowValues, setRowValues] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (!isUpgradeOpen) return;
    setRowValues((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const r of checkedRows) {
        if (next[r.key] == null) next[r.key] = 1;
      }
      for (const k of Object.keys(next)) {
        if (!checkedRows.some((r) => r.key === k)) delete next[k];
      }
      return next;
    });
  }, [isUpgradeOpen, checkedRows]);

  const closeUpgrade = () => setIsUpgradeOpen(false);

  const applyUpgrades = () => {
    const deltas: Record<string, number> = {};
    for (const r of checkedRows) {
      const amt = Math.max(1, Math.min(4, rowValues[r.key] ?? 1));
      deltas[r.key] = amt;
    }

    if (Object.keys(deltas).length === 0) {
      closeUpgrade();
      return;
    }

    updateAgentViaMutator((copy) => {
      const creation =
        copy.system.creation ??
        ({
          bonusSkillPointsByKey: {},
          veteranSkillPointsByKey: {},
          playMode: { isPlaying: false },
          advancementPointsByKey: {},
        } as any);

      copy.system.creation = creation;

      const advMap: Record<string, number> =
        (creation.advancementPointsByKey ?? {}) as Record<string, number>;

      for (const [skillKey, amt] of Object.entries(deltas)) {
        if (copy.system.skills[skillKey]) {
          copy.system.skills[skillKey].proficiency =
            (copy.system.skills[skillKey].proficiency ?? 0) + amt;
          copy.system.skills[skillKey].failure = false;
        } else if (copy.system.typedSkills[skillKey]) {
          copy.system.typedSkills[skillKey].proficiency =
            (copy.system.typedSkills[skillKey].proficiency ?? 0) + amt;
          copy.system.typedSkills[skillKey].failure = false;
        }

        advMap[skillKey] = (advMap[skillKey] ?? 0) + amt;
      }

      creation.advancementPointsByKey = advMap;

      copy.system.undoMeta = copy.system.undoMeta ?? {};
      const stack = copy.system.undoMeta.advancementUndoStack ?? [];
      stack.push({ at: Date.now(), deltas });
      copy.system.undoMeta.advancementUndoStack = stack;
    });

    closeUpgrade();
  };

  const undoLast = () => {
    updateAgentViaMutator((copy) => {
      const stack = copy.system.undoMeta?.advancementUndoStack ?? [];
      if (stack.length === 0) return;

      const last = stack.pop()!;
      const advMap = copy.system.creation?.advancementPointsByKey ?? {};

      for (const [skillKey, amt] of Object.entries(last.deltas)) {
        if (copy.system.skills[skillKey]) {
          copy.system.skills[skillKey].proficiency =
            (copy.system.skills[skillKey].proficiency ?? 0) - amt;
        } else if (copy.system.typedSkills[skillKey]) {
          copy.system.typedSkills[skillKey].proficiency =
            (copy.system.typedSkills[skillKey].proficiency ?? 0) - amt;
        }

        advMap[skillKey] = (advMap[skillKey] ?? 0) - amt;
        if (advMap[skillKey] <= 0) delete advMap[skillKey];
      }

      if (copy.system.creation) {
        copy.system.creation.advancementPointsByKey = advMap;
      }
      if (copy.system.undoMeta) {
        copy.system.undoMeta.advancementUndoStack = stack;
      }
    });
  };

  const canUndo =
    (agent.system.undoMeta?.advancementUndoStack?.length ?? 0) > 0;

  // -------------------------
  // Rest modal
  // -------------------------
  const [isRestOpen, setIsRestOpen] = React.useState(false);
  const [wpApplied, setWpApplied] = React.useState(false);
  const [hpApplied, setHpApplied] = React.useState(false);
  const closeRest = () => setIsRestOpen(false);

  const wp = agent.system.wp;
  const hp = agent.system.health;

  const canRecoverWP = wp && wp.value < wp.max;
  const canRecoverHP = hp && hp.value < hp.max;

  const [wpRecover, setWpRecover] = React.useState("1");
  const [hpRecover, setHpRecover] = React.useState("1");

  React.useEffect(() => {
    if (!isRestOpen) return;
    // reset defaults when modal opens
    setWpRecover("1");
    setHpRecover("1");
    setWpApplied(false);
    setHpApplied(false);
  }, [isRestOpen]);

  const applyRecoverWP = () => {
    const amt = Math.max(1, Math.min(6, Number(wpRecover) || 1));
    updateAgentViaMutator((copy) => {
      const block = copy.system.wp;
      if (!block) return;
      block.value = Math.min(block.max, Math.max(block.min ?? 0, block.value + amt));
    });
    setWpApplied(true);
  };

  const applyRecoverHP = () => {
    const amt = Math.max(1, Math.min(4, Number(hpRecover) || 1));
    updateAgentViaMutator((copy) => {
      const block = copy.system.health;
      if (!block) return;
      block.value = Math.min(block.max, Math.max(block.min ?? 0, block.value + amt));
    });
    setHpApplied(true);
  };

  // -----------------
  // Condition Modal
  // -----------------
  const [isAddConditionOpen, setIsAddConditionOpen] = React.useState(false);
  const AVAILABLE_CONDITIONS = [
    { id: "exhausted", label: "Exhausted", category: "physical" },
    { id: "stunned", label: "Stunned", category: "physical" },
    { id: "suppressed", label: "Suppressed", category: "combat" },
    { id: "panic", label: "Panic Attack", category: "sanity" },
  ] satisfies {
    id: string;
    label: string;
    category: ConditionCategory;
  }[];

  
  function handleAddCondition(conditionTemplate: ConditionTemplate) {
    updateAgentViaMutator(agent => {
      addCondition(agent, {
        ...conditionTemplate,
        // id stays canonical; nanoid not needed unless duplicates allowed
      });
    });
  }

  // ------------------
  // Home Scenes Modal
  // ------------------
  const [isHomeScenesOpen, setIsHomeScenesOpen] = React.useState(false);

  return (
    <>
      <div className="bb-card bb-card--modals">
        <div className="bb-card__body bb-modals__buttons">          
          <button
            type="button"
            className="bb-button bb-button--small"
            onClick={() => setIsAddConditionOpen(true)}
          >
            Add Condition
          </button>
          <button
            type="button"
            className="bb-button bb-button--small"
            onClick={() => setIsRestOpen(true)}
          >
            Rest
          </button>

          <button
            type="button"
            className="bb-button bb-button--small"
            onClick={() => setIsUpgradeOpen(true)}
          >
            Upgrade
          </button>

          <button
            type="button"
            className="bb-button bb-button--small"
            onClick={() => setIsHomeScenesOpen(true)}
          >
            Home Scenes
          </button>
        </div>
      </div>

      {/* ---------------- Upgrade Modal ---------------- */}
      {isUpgradeOpen && (
        <div className="bb-modal">
          <div className="bb-modal__dialog bb-upgrade-modal__dialog">
            <h3 className="bb-modal__title">Upgrade Skills</h3>

            <div className="bb-modal__body">
              {checkedRows.length === 0 ? (
                <p className="bb-text-muted">
                  No skills are checked for advancement. Check the small boxes beside skills first.
                </p>
              ) : (
                <div className="bb-upgrade-table__wrap">
                  <table className="bb-weapons-table bb-upgrade-table">
                    <thead>
                      <tr>
                        <th>Skill</th>
                        <th style={{ width: "110px" }}>+%</th>
                        <th style={{ width: "70px" }}>d4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkedRows.map((r) => {
                        const val = rowValues[r.key] ?? 1;
                        return (
                          <tr key={r.key}>
                            <td>{r.label}</td>
                            <td>
                              <NumberSpinner
                                min={1}
                                max={4}
                                value={String(val)}
                                onChange={(v) => {
                                  const n = Math.max(1, Math.min(4, Number(v) || 1));
                                  setRowValues((prev) => ({ ...prev, [r.key]: n }));
                                }}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="bb-button bb-button--small"
                                onClick={() => onGenericRoll("Advancement Roll (1d4)", "1d4")}
                              >
                                d4
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bb-modal__footer bb-upgrade-modal__footer">
              <button
                type="button"
                className="bb-button bb-button--apply"
                onClick={applyUpgrades}
                disabled={checkedRows.length === 0}
              >
                Apply
              </button>

              <button
                type="button"
                className="bb-button bb-button--small"
                onClick={undoLast}
                disabled={!canUndo}
                title={!canUndo ? "No advancement to undo." : "Undo last advancement."}
              >
                Undo
              </button>

              <button
                type="button"
                className="bb-button bb-button--small bb-button--ghost"
                onClick={closeUpgrade}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Rest Modal ---------------- */}
      {isRestOpen && (
        <div className="bb-modal">
          <div className="bb-modal__dialog bb-rest-modal__dialog">
            <h3 className="bb-modal__title">Rest</h3>

            <div className="bb-modal__body">
              {!canRecoverWP && !canRecoverHP ? (
                <p className="bb-text-muted">Your agent made it through the day.</p>
              ) : (
                <>
                  {/* Recover WP */}
                  {canRecoverWP && (
                    <section style={{ marginBottom: "0.75rem" }}>
                      <h4 className="bb-section-title" style={{ marginBottom: "0.35rem" }}>
                        Recover WP
                      </h4>

                      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px", gap: "0.5rem", alignItems: "center" }}>
                        <button
                          type="button"
                          className="bb-button bb-button--small"
                          onClick={() => onGenericRoll("Recover WP (1d6)", "1d6")}
                          title="Roll 1d6 (use the result in the spinner)"
                        >
                          d6
                        </button>

                        <NumberSpinner
                          label="Points"
                          min={1}
                          max={6}
                          value={wpRecover}
                          onChange={setWpRecover}
                          disabled={wpApplied}
                        />

                        <button
                          type="button"
                          className="bb-button bb-button--apply"
                          onClick={applyRecoverWP}
                          disabled={wpApplied || !canRecoverWP}
                        >
                          Apply
                        </button>
                      </div>

                      <div className="bb-text-muted" style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>
                        Current WP: {wp.value}/{wp.max}
                      </div>
                    </section>
                  )}

                  {/* Recover HP */}
                  {canRecoverHP && (
                    <section>
                      <h4 className="bb-section-title" style={{ marginBottom: "0.35rem" }}>
                        Recover HP
                      </h4>

                      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px", gap: "0.5rem", alignItems: "center" }}>
                        <button
                          type="button"
                          className="bb-button bb-button--small"
                          onClick={() => onGenericRoll("Recover HP (1d4)", "1d4")}
                          title="Roll 1d4 (use the result in the spinner)"
                        >
                          d4
                        </button>

                        <NumberSpinner
                          label="Points"
                          min={1}
                          max={4}
                          value={hpRecover}
                          onChange={setHpRecover}
                          disabled={hpApplied}
                        />

                        <button
                          type="button"
                          className="bb-button bb-button--apply"
                          onClick={applyRecoverHP}
                          disabled={hpApplied || !canRecoverHP}
                        >
                          Apply
                        </button>
                      </div>

                      <div className="bb-text-muted" style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>
                        Current HP: {hp.value}/{hp.max}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button bb-button--small"
                onClick={closeRest}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      <AddConditionModal
        isOpen={isAddConditionOpen}
        agent={agent}
        onClose={() => setIsAddConditionOpen(false)}
        updateAgentViaMutator={updateAgentViaMutator}
      />
      {isHomeScenesOpen && (
        <HomeScenesModal
          agent={agent}
          updateAgentViaMutator={updateAgentViaMutator}
          openGenericRoll={onGenericRoll}
          openLuckTest={openLuckTest}
          openSanityTest={openSanityTest}
          openSkillRoll={openSkillRoll}
          openStatRoll={openStatRoll}
          onClose={() => setIsHomeScenesOpen(false)}
        />
      )}
    </>
  );
};

export default ModalsCard;