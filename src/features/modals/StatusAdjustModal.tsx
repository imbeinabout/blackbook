// src/features/modals/StatusAdjustModal.tsx
import React from "react";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../models/DeltaGreenAgent";
import NumberSpinner from "../../components/ui/NumberSpinner";

export type TrackType = "HP" | "WP" | "SAN";
type SanDamageType = "helplessness" | "violence" | "unnatural";
type AdaptationKind = "helplessness" | "violence";

type StatusAdjustModalProps = {
  track: TrackType | null;
  agent: DeltaGreenAgent | null;
  onClose: () => void;
  updateAgent: (updated: DeltaGreenAgent) => void;
  onGenericRoll?: (label: string, formula: string) => void;
};

const STATUS_IDS = {
  lowWill: "low_willpower",
  noWill: "no_will",
  unconscious: "unconscious",
  dead: "dead",
  tempInsanity: "temporary_insanity",
  permInsanity: "permanent_insanity",
};

const STATUS_LABELS: Record<string, { label: string; category: any }> = {
  [STATUS_IDS.lowWill]: { label: "Low Willpower", category: "status" },
  [STATUS_IDS.noWill]: { label: "No Will", category: "status" },
  [STATUS_IDS.unconscious]: { label: "Unconscious", category: "status" },
  [STATUS_IDS.dead]: { label: "Dead", category: "status" },
  [STATUS_IDS.tempInsanity]: { label: "Temporary Insanity", category: "sanity" },
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function ensureConditions(a: DeltaGreenAgent) {
  if (!a.system.conditions) a.system.conditions = [];
}
function hasCondition(a: DeltaGreenAgent, id: string) {
  return (a.system.conditions ?? []).some((c) => c.id === id);
}
function addCondition(a: DeltaGreenAgent, id: string) {
  ensureConditions(a);
  if (hasCondition(a, id)) return;
  const meta = STATUS_LABELS[id] ?? { label: id.replace(/_/g, " "), category: "status" };
  a.system.conditions!.push({ id, label: meta.label, category: meta.category });
}
function removeCondition(a: DeltaGreenAgent, id: string) {
  ensureConditions(a);
  a.system.conditions = (a.system.conditions ?? []).filter((c) => c.id !== id);
}

export default function StatusAdjustModal({
  track,
  agent,
  onClose,
  updateAgent,
  onGenericRoll,
}: StatusAdjustModalProps) {
  const [mode, setMode] = React.useState<"damage" | "heal">("damage");
  const [amount, setAmount] = React.useState<string>("");

  const [sanType, setSanType] = React.useState<SanDamageType>("unnatural");
  const [projectToBond, setProjectToBond] = React.useState(false);
  const [projectAmt, setProjectAmt] = React.useState<string>("1");
  const [selectedBondId, setSelectedBondId] = React.useState<string>("");

  const [pendingAdaptation, setPendingAdaptation] = React.useState<AdaptationKind | null>(null);
  const [pendingDie, setPendingDie] = React.useState<number | null>(null);
  const [lastTriggeredIncident, setLastTriggeredIncident] = React.useState<{ kind: AdaptationKind; idx: 1 | 2 | 3 } | null>(null);

  React.useEffect(() => {
    setMode("damage");
    setAmount("");
    setSanType("unnatural");
    setProjectToBond(false);
    setProjectAmt("1");
    setSelectedBondId("");

    setPendingAdaptation(null);
    setPendingDie(null);
    setLastTriggeredIncident(null);
  }, [track]);

  const bonds: DeltaGreenItem[] = React.useMemo(() => {
    const items = agent?.items ?? [];
    return items.filter((it: any) => it.type === "bond");
  }, [agent]);

  React.useEffect(() => {
    if (!projectToBond) return;
    if (!bonds.length) return;
    setSelectedBondId((prev) => (prev ? prev : bonds[0]._id));
  }, [projectToBond, bonds]);

  if (!track || !agent) return null;

  const hp = agent.system.health;
  const wp = agent.system.wp;
  const san = agent.system.sanity;

  const delta = Number(amount);
  const validDelta = Number.isFinite(delta) && delta > 0 ? delta : 0;

  const previewHp =
    track === "HP" && hp
      ? clamp(mode === "damage" ? hp.value - validDelta : hp.value + validDelta, hp.min ?? 0, hp.max)
      : null;

  const previewWp =
    track === "WP" && wp
      ? clamp(mode === "damage" ? wp.value - validDelta : wp.value + validDelta, wp.min ?? 0, wp.max)
      : null;

  const sanLossRaw = track === "SAN" && mode === "damage" ? validDelta : 0;
  const proj = track === "SAN" && mode === "damage" && projectToBond ? clamp(Number(projectAmt) || 0, 0, 4) : 0;
  const sanLossToSan = track === "SAN" && mode === "damage" ? Math.max(0, sanLossRaw - proj) : 0;

  const previewNewSan =
    track === "SAN" && san
      ? mode === "heal"
        ? clamp(san.value + validDelta, 0, san.max)
        : clamp(san.value - sanLossToSan, 0, san.max)
      : null;

  const hpWarn =
    track === "HP" && mode === "damage" && hp && validDelta > 0 && previewHp != null
      ? previewHp === 0
        ? "Warning: This will reduce HP to 0 (Dead)."
        : previewHp <= 2
        ? "Warning: This will reduce HP to 2 or less (Unconscious)."
        : null
      : null;

  const wpWarn =
    track === "WP" && mode === "damage" && wp && validDelta > 0 && previewWp != null
      ? previewWp === 0
        ? "Warning: This will reduce WP to 0 (No Will)."
        : previewWp <= 2
        ? "Warning: This will reduce WP to 2 or less (Low Willpower)."
        : null
      : null;

  const crossesBP =
    track === "SAN" && mode === "damage" && san && previewNewSan != null
      ? previewNewSan < san.currentBreakingPoint
      : false;

  const hitsZeroSan =
    track === "SAN" && mode === "damage" && previewNewSan != null ? previewNewSan === 0 : false;

  const tempInsanityWarn =
    track === "SAN" && mode === "damage" ? sanLossToSan >= 5 : false;

  const adaptation =
    sanType === "violence"
      ? san?.adaptations?.violence
      : sanType === "helplessness"
      ? san?.adaptations?.helplessness
      : undefined;

  const isAdapted = !!adaptation?.isAdapted;

  const nextAdaptationSlot = (() => {
    if (!adaptation || adaptation.isAdapted) return null;
    if (!adaptation.incident1) return 1;
    if (!adaptation.incident2) return 2;
    if (!adaptation.incident3) return 3;
    return null;
  })();

  const applyAutoStatusConditions = (copy: DeltaGreenAgent) => {
    const wpVal = copy.system.wp?.value ?? 0;
    if (wpVal === 0) {
      addCondition(copy, STATUS_IDS.noWill);
      removeCondition(copy, STATUS_IDS.lowWill);
    } else if (wpVal <= 2) {
      addCondition(copy, STATUS_IDS.lowWill);
      removeCondition(copy, STATUS_IDS.noWill);
    } else {
      removeCondition(copy, STATUS_IDS.lowWill);
      removeCondition(copy, STATUS_IDS.noWill);
    }

    const hpVal = copy.system.health?.value ?? 0;
    if (hpVal === 0) {
      addCondition(copy, STATUS_IDS.dead);
      removeCondition(copy, STATUS_IDS.unconscious);
    } else if (hpVal <= 2) {
      addCondition(copy, STATUS_IDS.unconscious);
      removeCondition(copy, STATUS_IDS.dead);
    } else {
      removeCondition(copy, STATUS_IDS.unconscious);
      removeCondition(copy, STATUS_IDS.dead);
    }

    const sanVal = copy.system.sanity?.value ?? 0;
    if (sanVal === 0) {
      addCondition(copy, STATUS_IDS.permInsanity);
    } else {
      removeCondition(copy, STATUS_IDS.permInsanity);
    }
  };

  const cancelAdaptationApply = () => {
    if (!agent || !lastTriggeredIncident) {
      setPendingAdaptation(null);
      setPendingDie(null);
      setLastTriggeredIncident(null);
      return;
    }

    // revert the incident checkbox that triggered the adaptation modal
    const { kind, idx } = lastTriggeredIncident;
    const updated: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));
    const ad = updated.system.sanity.adaptations[kind];
    if (idx === 1) ad.incident1 = false;
    if (idx === 2) ad.incident2 = false;
    if (idx === 3) ad.incident3 = false;

    updateAgent(updated);

    setPendingAdaptation(null);
    setPendingDie(null);
    setLastTriggeredIncident(null);
  };

  const applyAdaptationNow = () => {
    if (!agent || !pendingAdaptation || pendingDie == null) return;

    const loss = pendingDie;
    const updated: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));

    const sanity = updated.system.sanity;
    const stats = updated.system.statistics;

    const sysAny: any = updated.system as any;
    sysAny.undoMeta = sysAny.undoMeta ?? {};
    sysAny.undoMeta.adaptations = sysAny.undoMeta.adaptations ?? {};
    const undoAdapt = sysAny.undoMeta.adaptations as Record<AdaptationKind, number>;

    if (pendingAdaptation === "helplessness") {
      const newPow = clamp(stats.pow.value - loss, 0, 99);
      stats.pow.value = newPow;
      stats.pow.x5 = newPow * 5;
      sanity.adaptations.helplessness.isAdapted = true;
      undoAdapt.helplessness = loss;
    } else {
      const newCha = clamp(stats.cha.value - loss, 0, 99);
      stats.cha.value = newCha;
      stats.cha.x5 = newCha * 5;

      updated.items = (updated.items as DeltaGreenItem[]).map((it) => {
        if (it.type !== "bond") return it;
        const sys = it.system ?? {};
        const score = (sys.score as number) ?? 0;
        const newScore = clamp(score - loss, 0, 99);
        return { ...it, system: { ...sys, score: newScore } };
      });

      sanity.adaptations.violence.isAdapted = true;
      undoAdapt.violence = loss;
    }

    updateAgent(updated);

    setPendingAdaptation(null);
    setPendingDie(null);
    setLastTriggeredIncident(null);

    onClose();
  };

  const handleRecalculateBP = () => {
    if (!agent) {
      onClose();
      return;
    }

    const updated: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));

    const sanVal = updated.system.sanity.value ?? 0;
    const powVal = updated.system.statistics.pow.value ?? 0;

    updated.system.sanity.currentBreakingPoint = Math.max(0, sanVal - powVal);

    updateAgent(updated);
    onClose();
  };

  const handleApply = () => {
    if (!validDelta) {
      onClose();
      return;
    }

    const updated: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));

    if (track === "HP" && updated.system.health) {
      const current = updated.system.health.value;
      updated.system.health.value = clamp(
        mode === "damage" ? current - validDelta : current + validDelta,
        updated.system.health.min ?? 0,
        updated.system.health.max
      );
      applyAutoStatusConditions(updated);
      updateAgent(updated);
      onClose();
      return;
    }

    if (track === "WP" && updated.system.wp) {
      const current = updated.system.wp.value;
      updated.system.wp.value = clamp(
        mode === "damage" ? current - validDelta : current + validDelta,
        updated.system.wp.min ?? 0,
        updated.system.wp.max
      );
      applyAutoStatusConditions(updated);
      updateAgent(updated);
      onClose();
      return;
    }

    if (track === "SAN" && updated.system.sanity) {
      const currentSan = updated.system.sanity.value;
      const maxSan = updated.system.sanity.max;

      if (mode === "heal") {
        updated.system.sanity.value = clamp(currentSan + validDelta, 0, maxSan);
        updateAgent(updated);
        onClose();
        return;
      }

      if (projectToBond && proj > 0 && selectedBondId) {
        if (updated.system.wp) {
          updated.system.wp.value = clamp(
            updated.system.wp.value - proj,
            updated.system.wp.min ?? 0,
            updated.system.wp.max
          );
        }

        updated.items = (updated.items as DeltaGreenItem[]).map((it) => {
          if (it.type !== "bond" || it._id !== selectedBondId) return it;
          const currentScore = it.system?.score ?? 0;
          return {
            ...it,
            system: {
              ...(it.system ?? {}),
              score: Math.max(0, currentScore - proj),
              hasBeenDamagedSinceLastHomeScene: true,
            },
          };
        });
      }

      const newSan = clamp(currentSan - sanLossToSan, 0, maxSan);
      updated.system.sanity.value = newSan;

      if (newSan < updated.system.sanity.currentBreakingPoint) {
        const pow = updated.system.statistics.pow.value ?? 0;
        updated.system.sanity.currentBreakingPoint = Math.max(0, newSan - pow);
      }

      if (sanLossToSan >= 5) addCondition(updated, STATUS_IDS.tempInsanity);

      applyAutoStatusConditions(updated);

      if ((sanType === "helplessness" || sanType === "violence") && !updated.system.sanity.adaptations[sanType].isAdapted) {
        const ad = updated.system.sanity.adaptations[sanType];
        let checkedIdx: 1 | 2 | 3 | null = null;

        if (!ad.incident1) { ad.incident1 = true; checkedIdx = 1; }
        else if (!ad.incident2) { ad.incident2 = true; checkedIdx = 2; }
        else if (!ad.incident3) { ad.incident3 = true; checkedIdx = 3; }

        const nowComplete = ad.incident1 && ad.incident2 && ad.incident3;

        updateAgent(updated);

        if (nowComplete && checkedIdx) {
          setPendingAdaptation(sanType);
          setPendingDie(null);
          setLastTriggeredIncident({ kind: sanType, idx: checkedIdx });
          return;
        }

        onClose();
        return;
      }

      updateAgent(updated);
      onClose();
      return;
    }

    updateAgent(updated);
    onClose();
  };

  const showSanControls = track === "SAN";
  const showProjectionControls = showSanControls && mode === "damage";
  const hasBonds = bonds.length > 0;

  return (
    <>
      <div className="bb-modal">
        <div className="bb-modal__dialog bb-status-adjust-modal__dialog">
          <div className="bb-modal__header">
            <h3 className="bb-modal__title">Adjust {track}</h3>
          </div>

          <div className="bb-modal__body bb-status-adjust-modal__body">
            <div className="bb-radio-row" style={{ marginBottom: "0.5rem" }}>
              <label className="bb-radio-option">
                <input type="radio" checked={mode === "damage"} onChange={() => setMode("damage")} /> Damage
              </label>
              <label className="bb-radio-option">
                <input type="radio" checked={mode === "heal"} onChange={() => setMode("heal")} /> Heal
              </label>
            </div>

            <NumberSpinner label="Amount" value={amount} onChange={setAmount} min={1} />

            {(hpWarn || wpWarn) && (
              <div className="bb-alert bb-alert--error" style={{ marginTop: "0.5rem" }}>
                {hpWarn || wpWarn}
              </div>
            )}

            {showSanControls && (
              <div className="bb-status-adjust-san">
                <h4 className="bb-section-title" style={{ marginBottom: "0.35rem" }}>SAN Damage Type</h4>

                <div className="bb-radio-row" style={{ marginBottom: "0.35rem" }}>
                  <label className="bb-radio-option">
                    <input type="radio" checked={sanType === "helplessness"} onChange={() => setSanType("helplessness")} disabled={mode === "heal"} />
                    Helplessness
                  </label>
                  <label className="bb-radio-option">
                    <input type="radio" checked={sanType === "violence"} onChange={() => setSanType("violence")} disabled={mode === "heal"} />
                    Violence
                  </label>
                  <label className="bb-radio-option">
                    <input type="radio" checked={sanType === "unnatural"} onChange={() => setSanType("unnatural")} disabled={mode === "heal"} />
                    Unnatural
                  </label>
                </div>

                {(sanType === "helplessness" || sanType === "violence") && (
                  <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.35rem" }}>
                    {isAdapted
                      ? `Reminder: Agent is already adapted to ${sanType.toUpperCase()}.`
                      : `This will add an adaptation check for ${sanType.toUpperCase()} (next incident: ${nextAdaptationSlot ?? "—"}).`}
                  </div>
                )}

                {showProjectionControls && (
                  <div className="bb-status-adjust-projection">
                    <h4 className="bb-section-title" style={{ marginBottom: "0.35rem" }}>Project SAN to a Bond</h4>

                    {!hasBonds ? (
                      <div className="bb-text-muted" style={{ fontSize: "0.8rem" }}>
                        No bonds available to project SAN damage.
                      </div>
                    ) : (
                      <>
                        <label className="bb-checkbox bb-checkbox--small" style={{ marginBottom: "0.35rem" }}>
                          <input type="checkbox" className="bb-checkbox__input" checked={projectToBond} onChange={(e) => setProjectToBond(e.target.checked)} />
                          <span className="bb-checkbox__box" />
                          <span className="bb-checkbox__label">Yes, project some SAN damage to a bond</span>
                        </label>

                        {projectToBond && (
                          <>
                            <div className="bb-status-adjust-projection__row">
                              <button
                                type="button"
                                className="bb-button bb-button--small"
                                onClick={() => onGenericRoll?.("Bond Projection (1d4)", "1d4")}
                                disabled={!onGenericRoll}
                                title={onGenericRoll ? "Roll 1d4 (use the result in the spinner)" : "Wire onGenericRoll to enable d4 launcher"}
                              >
                                d4
                              </button>

                              <NumberSpinner label="Projected" min={0} max={4} value={projectAmt} onChange={setProjectAmt} />
                            </div>

                            <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                              Choose bond to damage:
                            </div>

                            <div className="bb-status-adjust-bonds">
                              {bonds.map((b) => {
                                const score = b.system?.score ?? 0;
                                const label = b.system?.name ?? b.name;
                                return (
                                  <label key={b._id} className="bb-radio-grid">
                                    <input type="radio" checked={selectedBondId === b._id} onChange={() => setSelectedBondId(b._id)} />
                                    <span>
                                      {label} <span className="bb-text-muted">({score})</span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>

                            <div className="bb-text-muted" style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
                              SAN loss: {sanLossRaw} — Projected: {proj} = <strong>{sanLossToSan}</strong> to SAN
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {(crossesBP || hitsZeroSan || tempInsanityWarn) && (
                      <div style={{ marginTop: "0.5rem" }}>
                        {crossesBP && (
                          <div className="bb-alert bb-alert--error">
                            Warning: This would drop below Breaking Point. BP will be recalculated (New BP = New SAN − POW).
                          </div>
                        )}
                        {hitsZeroSan && (
                          <div className="bb-alert bb-alert--error" style={{ marginTop: "0.35rem" }}>
                            Warning: This would reduce SAN to 0 (Permanent Insanity).
                          </div>
                        )}
                        {tempInsanityWarn && (
                          <div className="bb-alert bb-alert--error" style={{ marginTop: "0.35rem" }}>
                            Warning: SAN loss to SAN is ≥ 5 (Temporary Insanity).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="bb-modal__footer"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {track === "SAN" && (
              <button
                type="button"
                className="bb-button bb-button--small bb-button--ghost"
                title="Recalculate Breaking Point from current SAN and POW"
                onClick={handleRecalculateBP}
              >
                Recalculate BP
              </button>
            )}

            <button
              type="button"
              className="bb-button bb-button--small"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="bb-button bb-button--small bb-button--primary"
              onClick={handleApply}
              disabled={!validDelta}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {pendingAdaptation && (
        <div className="bb-modal">
          <div className="bb-modal__dialog bb-status-adjust-modal__dialog">
            <div className="bb-modal__header">
              <h3 className="bb-modal__title">
                {pendingAdaptation === "helplessness" ? "Apply Adaptation: Helplessness" : "Apply Adaptation: Violence"}
              </h3>
            </div>

            <div className="bb-modal__body bb-status-adjust-modal__body">
              {pendingAdaptation === "helplessness" ? (
                <p style={{ marginTop: 0 }}>
                  This Agent has suffered three incidents of SAN loss from <strong>Helplessness</strong>.
                  Applying adaptation causes a permanent loss of <strong>1D6 POW</strong>.
                </p>
              ) : (
                <p style={{ marginTop: 0 }}>
                  This Agent has suffered three incidents of SAN loss from <strong>Violence</strong>.
                  Applying adaptation causes a permanent loss of <strong>1D6 CHA</strong>, and <strong>each Bond</strong> loses the same amount.
                </p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  className="bb-button bb-button--small"
                  onClick={() =>
                    onGenericRoll?.(
                      pendingAdaptation === "helplessness"
                        ? "Adaptation – Helplessness (1d6)"
                        : "Adaptation – Violence (1d6)",
                      "1d6"
                    )
                  }
                  disabled={!onGenericRoll}
                  title={onGenericRoll ? "Roll 1d6 (use the result in the spinner)" : "Wire onGenericRoll to enable d6 launcher"}
                >
                  d6
                </button>

                <NumberSpinner
                  label="Result (1–6)"
                  min={1}
                  max={6}
                  value={pendingDie != null ? String(pendingDie) : ""}
                  onChange={(val) => {
                    if (!val) return setPendingDie(null);
                    const n = Number(val);
                    if (Number.isNaN(n)) return setPendingDie(null);
                    setPendingDie(clamp(n, 1, 6));
                  }}
                />
              </div>

              <p className="bb-text-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                Enter the final 1D6 result above before applying.
              </p>
            </div>

            <div className="bb-modal__footer">
              <button type="button" className="bb-button" onClick={cancelAdaptationApply}>
                Cancel
              </button>
              <button type="button" className="bb-button bb-button--primary" disabled={pendingDie == null} onClick={applyAdaptationNow}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}