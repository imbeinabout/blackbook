// src/features/player-panel/cards/SanityAdaptationCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import NumberSpinner from "../../../components/ui/NumberSpinner";

type AdaptationKind = "helplessness" | "violence";

interface SanityAdaptationCardProps {
  agent: DeltaGreenAgent | null;
  onMutateAgent: (mutator: (copy: DeltaGreenAgent) => void) => void;
  onRollD6: (label: string, formula: string) => void;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const SanityAdaptationCard: React.FC<SanityAdaptationCardProps> = ({
  agent,
  onMutateAgent,
  onRollD6,
}) => {
  const [pendingAdaptation, setPendingAdaptation] =
    React.useState<AdaptationKind | null>(null);
  const [pendingDie, setPendingDie] = React.useState<number | null>(null);

  const [lastTriggeredIncident, setLastTriggeredIncident] = React.useState<{
    kind: AdaptationKind;
    idx: 1 | 2 | 3;
  } | null>(null);

  const [pendingResetKind, setPendingResetKind] =
    React.useState<AdaptationKind | null>(null);

  const openAdaptationModal = (kind: AdaptationKind, idx: 1 | 2 | 3) => {
    setPendingAdaptation(kind);
    setPendingDie(null);
    setLastTriggeredIncident({ kind, idx });
  };

  const handleToggleIncident = (
    kind: AdaptationKind,
    idx: 1 | 2 | 3,
    checked: boolean
  ) => {
    if (!agent) return;

    onMutateAgent((copy) => {
      const adap = copy.system.sanity.adaptations[kind];
      if (!adap) return;

      if (idx === 1) adap.incident1 = checked;
      if (idx === 2) adap.incident2 = checked;
      if (idx === 3) adap.incident3 = checked;

      if (adap.incident1 && adap.incident2 && adap.incident3 && !adap.isAdapted) {
        // All three incidents checked, not yet adapted -> prompt for adaptation.
        openAdaptationModal(kind, idx);
      }
    });
  };

  const handleCancelApplyModal = () => {
    // On Cancel: uncheck the last checkbox that triggered the modal.
    if (lastTriggeredIncident && agent) {
      const { kind, idx } = lastTriggeredIncident;
      onMutateAgent((copy) => {
        const adap = copy.system.sanity.adaptations[kind];
        if (!adap) return;
        if (idx === 1) adap.incident1 = false;
        if (idx === 2) adap.incident2 = false;
        if (idx === 3) adap.incident3 = false;
      });
    }

    setPendingAdaptation(null);
    setPendingDie(null);
    setLastTriggeredIncident(null);
  };

  const handleApplyAdaptation = () => {
    if (!agent || pendingAdaptation == null || pendingDie == null) return;
    const loss = pendingDie;

    onMutateAgent((copy) => {
      const sanity = copy.system.sanity;
      const stats = copy.system.statistics;

      const sys: any = copy.system as any;
      sys.undoMeta = sys.undoMeta ?? {};
      sys.undoMeta.adaptations = sys.undoMeta.adaptations ?? {};
      const undoAdapt = sys.undoMeta.adaptations as Record<
        AdaptationKind,
        number
      >;

      if (pendingAdaptation === "helplessness") {
        // Helplessness: POW - 1D6. (WP is NOT adjusted.)
        const newPow = clamp(stats.pow.value - loss, 0, 99);
        stats.pow.value = newPow;
        stats.pow.x5 = newPow * 5;

        sanity.adaptations.helplessness.isAdapted = true;
        undoAdapt.helplessness = loss;
      } else if (pendingAdaptation === "violence") {
        // Violence: CHA - 1D6, all Bonds - same 1D6.
        const newCha = clamp(stats.cha.value - loss, 0, 99);
        stats.cha.value = newCha;
        stats.cha.x5 = newCha * 5;

        copy.items = copy.items.map((it) => {
          if (it.type !== "bond") return it;
          const sys = it.system ?? {};
          const score = (sys.score as number) ?? 0;
          const newScore = clamp(score - loss, 0, 99);
          return {
            ...it,
            system: {
              ...sys,
              score: newScore,
            },
          };
        });

        sanity.adaptations.violence.isAdapted = true;
        undoAdapt.violence = loss;
      }
    });

    setPendingAdaptation(null);
    setPendingDie(null);
    setLastTriggeredIncident(null);
  };

  const handleOpenResetModal = (kind: AdaptationKind) => {
    setPendingResetKind(kind);
  };

  const handleCancelResetModal = () => {
    setPendingResetKind(null);
  };

  const handleResetAdaptation = () => {
    if (!agent || !pendingResetKind) return;

    const sys: any = agent.system as any;
    const undoAdapt: Record<AdaptationKind, number> | undefined =
      sys.undoMeta?.adaptations;

    const storedLoss = undoAdapt?.[pendingResetKind] ?? 0;

    onMutateAgent((copy) => {
      const sanity = copy.system.sanity;
      const stats = copy.system.statistics;
      const sysCopy: any = copy.system as any;
      sysCopy.undoMeta = sysCopy.undoMeta ?? {};
      sysCopy.undoMeta.adaptations = sysCopy.undoMeta.adaptations ?? {};
      const ua: Record<AdaptationKind, number> = sysCopy.undoMeta.adaptations;

      if (pendingResetKind === "helplessness") {
        if (storedLoss > 0) {
          const newPow = clamp(stats.pow.value + storedLoss, 0, 99);
          stats.pow.value = newPow;
          stats.pow.x5 = newPow * 5;
        }
        // Clear adaptation and last checkbox.
        sanity.adaptations.helplessness.isAdapted = false;
        sanity.adaptations.helplessness.incident3 = false;
        ua.helplessness = 0;
      } else {
        if (storedLoss > 0) {
          const newCha = clamp(stats.cha.value + storedLoss, 0, 99);
          stats.cha.value = newCha;
          stats.cha.x5 = newCha * 5;

          copy.items = copy.items.map((it) => {
            if (it.type !== "bond") return it;
            const sys = it.system ?? {};
            const score = (sys.score as number) ?? 0;
            const newScore = clamp(score + storedLoss, 0, 99);
            return {
              ...it,
              system: {
                ...sys,
                score: newScore,
              },
            };
          });
        }
        sanity.adaptations.violence.isAdapted = false;
        sanity.adaptations.violence.incident3 = false;
        ua.violence = 0;
      }
    });

    setPendingResetKind(null);
  };

  const renderRow = (kind: AdaptationKind) => {
    if (!agent) {
      return (
        <div className="bb-adaptation-row" key={kind}>
          <div className="bb-adaptation-row__label">
            {kind === "helplessness" ? "Helplessness" : "Violence"}
          </div>
        </div>
      );
    }

    const a = agent.system.sanity.adaptations[kind];
    const label = kind === "helplessness" ? "Helplessness" : "Violence";
    const disabled = a.isAdapted;

    const onToggle =
    (idx: 1 | 2 | 3) => (e: React.ChangeEvent<HTMLInputElement>) =>
        handleToggleIncident(kind, idx, e.target.checked);

    return (
    <div className="bb-adaptation-row" key={kind}>
        <div className="bb-adaptation-row__label">{label}</div>
        <div className="bb-adaptation-row__checks">
        <label className="bb-checkbox bb-checkbox--tiny">
            <input
            type="checkbox"
            className="bb-checkbox__input"
            checked={a.incident1}
            disabled={disabled}
            onChange={(e) => {
              onToggle(1);
              e.currentTarget.blur();
            }}
            />
            <span className="bb-checkbox__box" />
        </label>
        <label className="bb-checkbox bb-checkbox--tiny">
            <input
            type="checkbox"
            className="bb-checkbox__input"
            checked={a.incident2}
            disabled={disabled}  
            onChange={(e) => {
              onToggle(2);
              e.currentTarget.blur();
            }}
            />
            <span className="bb-checkbox__box" />
        </label>
        <label className="bb-checkbox bb-checkbox--tiny">
            <input
            type="checkbox"
            className="bb-checkbox__input"
            checked={a.incident3}
            disabled={disabled}
            onChange={(e) => {
              onToggle(3);
              e.currentTarget.blur();
            }}
            />
            <span className="bb-checkbox__box" />
        </label>
        </div>
        <div className="bb-adaptation-row__status">
        {a.isAdapted && (
            <button
            type="button"
            className="bb-button bb-adaptation-row__adapted-btn"
            onClick={() => handleOpenResetModal(kind)}
            >
            ADAPTED
            </button>
        )}
        </div>
    </div>
    );
  };

  const currentResetLoss =
    agent && pendingResetKind
      ? ((agent.system as any).undoMeta?.adaptations?.[
          pendingResetKind
        ] as number | undefined) ?? 0
      : 0;

  return (
    <>
      <div className="bb-card bb-card--adaptations">
        <div className="bb-card__header">ADAPTATIONS TO SANITY</div>
        <div className="bb-card__body bb-adaptations">
          <div className="bb-adaptations-inline">
            {renderRow("helplessness")}
            {renderRow("violence")}
          </div>
        </div>
      </div>

      {/* Apply adaptation modal */}
      {agent && pendingAdaptation && (
        <div className="bb-modal">
          <div className="bb-modal__dialog">
            <div className="bb-modal__header">
              {pendingAdaptation === "helplessness"
                ? "Apply Adaptation: Helplessness"
                : "Apply Adaptation: Violence"}
            </div>

            <div className="bb-modal__body">
              {pendingAdaptation === "helplessness" ? (
                <p style={{ marginTop: 0 }}>
                  This Agent has suffered three incidents of SAN loss from{" "}
                  <strong>Helplessness</strong>. Applying adaptation causes a
                  permanent loss of <strong>1D6 POW</strong>.
                </p>
              ) : (
                <p style={{ marginTop: 0 }}>
                  This Agent has suffered three incidents of SAN loss from{" "}
                  <strong>Violence</strong>. Applying adaptation causes a
                  permanent loss of <strong>1D6 CHA</strong>, and{" "}
                  <strong>each Bond</strong> loses the same amount.
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  marginTop: "0.75rem",
                }}
              >
                <NumberSpinner
                  label="Result (1–6)"
                  min={1}
                  max={6}
                  value={pendingDie !== null ? String(pendingDie) : ""}
                  onChange={(val: string) => {
                    if (!val) {
                      setPendingDie(null);
                      return;
                    }
                    const n = Number(val);
                    if (Number.isNaN(n)) {
                      setPendingDie(null);
                      return;
                    }
                    setPendingDie(clamp(n, 1, 6));
                  }}
                />

                <button
                  type="button"
                  className="bb-button bb-button--small bb-adaptation-modal__d6-btn"
                  onClick={() =>
                    onRollD6(
                      pendingAdaptation === "helplessness"
                        ? "Adaptation – Helplessness (1D6)"
                        : "Adaptation – Violence (1D6)",
                      "1d6"
                    )
                  }
                  title="Roll 1D6 in dice tray"
                >
                  D6
                </button>
              </div>

              <p style={{ fontSize: "0.8rem", color: "var(--bb-text-muted)" }}>
                You can either roll in the dice tray or with physical dice.
                Enter the final 1D6 result above before applying.
              </p>
            </div>

            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button"
                onClick={handleCancelApplyModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bb-button bb-button--primary"
                disabled={pendingDie == null}
                onClick={handleApplyAdaptation}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset adaptation modal */}
      {agent && pendingResetKind && (
        <div className="bb-modal">
          <div className="bb-modal__dialog">
            <div className="bb-modal__header">
              {pendingResetKind === "helplessness"
                ? "Reset Helplessness Adaptation"
                : "Reset Violence Adaptation"}
            </div>
            <div className="bb-modal__body">
              {pendingResetKind === "helplessness" ? (
                <p style={{ marginTop: 0 }}>
                  When this Agent adapted to <strong>Helplessness</strong>, they
                  lost{" "}
                  {currentResetLoss > 0 ? (
                    <strong>{currentResetLoss} POW</strong>
                  ) : (
                    <strong>POW</strong>
                  )}
                  . Resetting the adaptation will restore those points and clear
                  the last checkbox.
                </p>
              ) : (
                <p style={{ marginTop: 0 }}>
                  When this Agent adapted to <strong>Violence</strong>, they
                  lost{" "}
                  {currentResetLoss > 0 ? (
                    <>
                      <strong>{currentResetLoss} CHA</strong> and{" "}
                      <strong>{currentResetLoss}</strong> from each Bond
                    </>
                  ) : (
                    <>
                      <strong>CHA</strong> and some points from each Bond
                    </>
                  )}
                  . Resetting the adaptation will restore those points and clear
                  the last checkbox.
                </p>
              )}
            </div>
            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button"
                onClick={handleCancelResetModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bb-button bb-button--primary"
                onClick={handleResetAdaptation}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SanityAdaptationCard;