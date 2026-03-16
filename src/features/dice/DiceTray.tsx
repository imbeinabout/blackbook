// src/features/dice/DiceTray.tsx
import React from "react";
import { nanoid } from "nanoid";

export type DiceTrayProps = {
  isOpen: boolean;
  onClose: () => void;
  rollName?: string | null;
  rollFormula?: string | null;
};

type RollOutcome = "none" | "success" | "failure" | "critSuccess" | "critFailure";
type RollKind = "generic" | "skill" | "damage" | "lethality";

type RollLogEntry = {
  id: string;
  timestamp: number;
  label: string;
  formula: string;
  dieSize: number;
  result: number;
  /** Running total *after* this roll */
  runningTotal: number;
  target: number | null;
  outcome: RollOutcome;
  kind: RollKind;
  damage: number | null;
  critDamage: number | null;
  isLethal: boolean | null;
};

const DICE_SIZES = [4, 6, 8, 10, 12, 20, 100];

const DiceTray: React.FC<DiceTrayProps> = ({
  isOpen,
  onClose,
  rollName,
  rollFormula,
}) => {
  const [currentDie, setCurrentDie] = React.useState<number | null>(null);
  const [currentResult, setCurrentResult] = React.useState<number | null>(null);
  const [total, setTotal] = React.useState(0);
  const [log, setLog] = React.useState<RollLogEntry[]>([]);

  const [currentOutcome, setCurrentOutcome] = React.useState<RollOutcome>("none");
  const [currentTarget, setCurrentTarget] = React.useState<number | null>(null);

  const [currentKind, setCurrentKind] = React.useState<RollKind>("generic");
  const [currentDamage, setCurrentDamage] = React.useState<number | null>(null);
  const [currentCritDamage, setCurrentCritDamage] = React.useState<number | null>(null);

  const [isFreeRoll, setIsFreeRoll] = React.useState(false);

  const trayRef = React.useRef<HTMLElement | null>(null);

  const autoRollStateRef = React.useRef<{
    isOpen: boolean;
    rollFormula: string | null;
  }>({ isOpen: false, rollFormula: null });

  const totalRef = React.useRef(0);

  const startX = React.useRef<number | null>(null);
  const currentX = React.useRef<number>(0);
  const [dragX, setDragX] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) {
        totalRef.current = 0;
        setTotal(0);
        setCurrentOutcome("none");
        setCurrentTarget(null);
        setCurrentKind("generic");
        setCurrentDamage(null);
        setCurrentCritDamage(null);
        setIsFreeRoll(false);
    }
  }, [isOpen]);

  // Close when clicking anywhere outside the tray
  React.useEffect(() => {
    if (!isOpen) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!trayRef.current || !target) return;
      if (!trayRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isOpen, onClose]);

  const handleResetTotal = () => {
    setCurrentDie(null);
    setCurrentResult(null);
    setCurrentOutcome("none");
    setCurrentTarget(null);
    setTotal(0);
    totalRef.current = 0;
  };

  const handleClearLog = () => {
    setLog([]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;

    const delta = e.touches[0].clientX - startX.current;

    if (delta > 0) {
      currentX.current = delta;
      setDragX(delta);
    }
  };

  const handleTouchEnd = () => {
    if (currentX.current > 80) {
      onClose(); // ✅ dismiss
    }

    // reset
    setDragX(0);
    startX.current = null;
    currentX.current = 0;
  };

  // Basic free roll (no success logic)
  const rollDie = (sides: number) => {
    const result = 1 + Math.floor(Math.random() * sides);
    const formula = `1d${sides}`;
    const nextTotal = totalRef.current + result;
    totalRef.current = nextTotal;

    setIsFreeRoll(true);
    setCurrentDie(sides);
    setCurrentResult(result);
    setCurrentTarget(null);
    setCurrentOutcome("none");
    setCurrentKind("generic");
    setCurrentDamage(null);
    setCurrentCritDamage(null);
    setTotal(nextTotal);

    const entry: RollLogEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        label: "Free Roll",
        formula,
        dieSize: sides,
        result,
        runningTotal: nextTotal,
        target: null,
        outcome: "none",
        kind: "generic",
        damage: null,
        critDamage: null,
        isLethal: null,
    };

    setLog((prevLog) => [entry, ...prevLog]);
  };

  // Percentile skill roll: 1d100 vs target, with criticals
  const rollPercentileSkill = (target: number) => {
    const sides = 100;
    const result = 1 + Math.floor(Math.random() * sides);

    let outcome: RollOutcome = "failure";

    if (result === 1) {
        outcome = "critSuccess";
    } else if (result === 100) {
        outcome = "critFailure";
    } else if (result % 11 === 0) {
        outcome = result <= target ? "critSuccess" : "critFailure";
    } else if (result <= target) {
        outcome = "success";
    } else {
        outcome = "failure";
    }

    const nextTotal = totalRef.current + result;
    totalRef.current = nextTotal;

    setCurrentDie(100);
    setCurrentResult(result);
    setCurrentTarget(target);
    setCurrentOutcome(outcome);
    setCurrentKind("skill");
    setCurrentDamage(null);
    setCurrentCritDamage(null);
    setTotal(nextTotal);

    const entry: RollLogEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        label: rollName ?? "Dice Roll",
        formula: `1d100<=${target}`,
        dieSize: 100,
        result,
        runningTotal: nextTotal,
        target,
        outcome,
        kind: "skill",
        damage: null,
        critDamage: null,
        isLethal: null,
    };

    setLog((prevLog) => [entry, ...prevLog]);
  };
  
  const rollDamageFormula = (count: number, sides: number, mod: number) => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
        sum += 1 + Math.floor(Math.random() * sides);
    }
    const damage = sum + mod;
    const critDamage = damage * 2;

    const result = damage;
    const nextTotal = totalRef.current + result;
    totalRef.current = nextTotal;

    setCurrentDie(sides);
    setCurrentResult(result);
    setCurrentTarget(null);
    setCurrentOutcome("none");
    setCurrentKind("damage");
    setCurrentDamage(damage);
    setCurrentCritDamage(critDamage);
    setTotal(nextTotal);

    const formula =
        mod === 0
        ? `${count}d${sides}`
        : `${count}d${sides}${mod > 0 ? `+${mod}` : mod}`;

    const entry: RollLogEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        label: rollName ?? "Dice Roll",
        formula,
        dieSize: sides,
        result,
        runningTotal: nextTotal,
        target: null,
        outcome: "none",
        kind: "damage",
        damage,
        critDamage,
        isLethal: null,
    };

    setLog((prevLog) => [entry, ...prevLog]);
  };

  const rollLethality = (target: number) => {
    const sides = 100;
    const roll = 1 + Math.floor(Math.random() * sides);
    const isLethal = roll <= target;

    // Damage from tens + ones (DG lethality rule)
    const tens = Math.floor(roll / 10);
    const ones = roll % 10;
    const damage = tens + ones;
    const critDamage = damage * 2;

    const result = roll;
    const nextTotal = totalRef.current + result;
    totalRef.current = nextTotal;

    const outcome: RollOutcome = isLethal ? "success" : "failure";

    setCurrentDie(100);
    setCurrentResult(result);
    setCurrentTarget(target);
    setCurrentOutcome(outcome);
    setCurrentKind("lethality");
    setCurrentDamage(damage);
    setCurrentCritDamage(critDamage);
    setTotal(nextTotal);

    const entry: RollLogEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        label: rollName ?? "Dice Roll",
        formula: `1d100<=${target}`,
        dieSize: 100,
        result,
        runningTotal: nextTotal,
        target,
        outcome,
        kind: "lethality",
        damage,
        critDamage,
        isLethal,
    };

    setLog((prevLog) => [entry, ...prevLog]);
  };

  // Parse and auto-roll a simple "1d100<=X" or generic "XdY" style formula
  const performRollFromFormula = (formula: string) => {
    const normalized = formula.trim().toLowerCase();

    // 1) Lethality / skill style: 1d100<=X
    const skillMatch = normalized.match(/^(\d*)d(\d+)\s*<=\s*(\d+)$/);
    if (skillMatch) {
        const targetStr = skillMatch[3];
        const target = parseInt(targetStr, 10);
        if (!Number.isFinite(target) || target < 0 || target > 100) return;

        const isLethalityName =
        (rollName ?? "").toLowerCase().includes("lethality");

        if (isLethalityName) {
        rollLethality(target);
        } else {
        rollPercentileSkill(target);
        }
        return;
    }

    // 2) Damage style: XdY or XdY+Z / XdY-Z
    const dmgMatch = normalized.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (dmgMatch) {
        const count = parseInt(dmgMatch[1], 10);
        const sides = parseInt(dmgMatch[2], 10);
        const modStr = dmgMatch[3] ?? "0";
        const mod = parseInt(modStr, 10);

        if (
        !Number.isFinite(count) ||
        !Number.isFinite(sides) ||
        count <= 0 ||
        sides <= 0
        ) {
        return;
        }

        rollDamageFormula(count, sides, mod);
        return;
    }

    // 3) Fallback: simple XdY (no <=, no +/-)
    const simpleMatch = normalized.match(/^(\d*)d(\d+)$/);
    if (simpleMatch) {
        const sides = parseInt(simpleMatch[2], 10);
        if (!Number.isFinite(sides) || sides <= 0) return;
        rollDie(sides);
        return;
    }
  };

  // Auto-roll when rollFormula is provided and the tray opens / formula changes.
  React.useEffect(() => {
    const prev = autoRollStateRef.current;
    const currentFormula = rollFormula ?? null;

    if (isOpen && currentFormula) {
      const isNewCombo =
        prev.isOpen !== isOpen || prev.rollFormula !== currentFormula;

      if (isNewCombo) {
        performRollFromFormula(currentFormula);
        autoRollStateRef.current = { isOpen, rollFormula: currentFormula };
      }
    } else {
      autoRollStateRef.current = { isOpen, rollFormula: currentFormula };
    }
  }, [isOpen, rollFormula]);

  const headerLabel = isFreeRoll ? "Free Roll" : rollName ?? "Dice Tray";
  const displayedFormula =
    rollFormula ?? (currentDie ? `1d${currentDie}` : "Free Roll");

  const outcomeClass =
    currentOutcome === "critSuccess"
      ? "bb-dice-tray__current-value--crit-success"
      : currentOutcome === "success"
      ? "bb-dice-tray__current-value--success"
      : currentOutcome === "critFailure"
      ? "bb-dice-tray__current-value--crit-failure"
      : currentOutcome === "failure"
      ? "bb-dice-tray__current-value--failure"
      : "";

  const outcomeLabel =
    currentOutcome === "critSuccess"
      ? "CRITICAL SUCCESS"
      : currentOutcome === "success"
      ? "SUCCESS"
      : currentOutcome === "critFailure"
      ? "CRITICAL FAILURE"
      : currentOutcome === "failure"
      ? "FAILURE"
      : "";

  return (
    <>
      {isOpen && <div className="bb-dice-tray-overlay" />}

      <aside
        ref={trayRef}
        className={
          "bb-dice-tray" + (isOpen ? " bb-dice-tray--open" : "")
        }
        aria-hidden={!isOpen}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isOpen
            ? `translateX(${dragX}px)`
            : undefined
        }}
      >
        {/* HEADER */}
        <div className="bb-dice-tray__header">
          <div className="bb-dice-tray__title">{headerLabel}</div>
          <div className="bb-dice-tray__header-actions">        
            <button
              type="button"
              className="bb-button bb-button--small bb-dice-tray__clear-log bb-only-mobile"
              onClick={handleClearLog}
              disabled={log.length === 0}
              aria-label="Clear roll log"
              title="Clear roll log"
            >
              Clear Log
            </button>
            <button
              type="button"
              className="bb-dice-tray__close"
              onClick={onClose}
              aria-label="Close dice tray"
            >
              ×
            </button>
          </div>
        </div>

        {/* RESET + DICE BUTTONS */}
        <div className="bb-dice-tray__controls">
          <button
            type="button"
            className="bb-button bb-button--ghost bb-dice-tray__reset"
            onClick={handleResetTotal}
          >
            RESET TOTAL
          </button>

          <div className="bb-dice-tray__dice-row">
            {DICE_SIZES.map((sides) => (
              <button
                key={sides}
                type="button"
                className="bb-button bb-button--small bb-dice-tray__die-btn"
                onClick={() => rollDie(sides)}
              >
                d{sides}
              </button>
            ))}
          </div>
        </div>

        {/* CURRENT RESULT AREA */}
        <div className="bb-dice-tray__current">
          <div className="bb-dice-tray__current-meta">
            <div className="bb-dice-tray__current-formula">
              {displayedFormula}
            </div>
            <div className="bb-dice-tray__current-total">
              Total: {total}
            </div>
          </div>
          <div className={`bb-dice-tray__current-value ${outcomeClass}`}>
            {currentResult !== null ? currentResult : "Roll to begin"}
            {currentTarget !== null && outcomeLabel && (
              <div className="bb-dice-tray__current-outcome">
                {outcomeLabel} vs {currentTarget}%
              </div>
            )}
            {currentKind === "damage" && currentDamage !== null && (
                <div className="bb-dice-tray__current-outcome">
                    Damage: {currentDamage} (Crit: {currentCritDamage})
                </div>
            )}
            {currentKind === "lethality" && currentDamage !== null && (
                <div className="bb-dice-tray__current-outcome">
                    {currentOutcome === "success" ? "LETHAL" : "NON-LETHAL"} — Damage{" "}
                    {currentDamage} (Crit: {currentCritDamage})
                </div>
            )}
          </div>
        </div>

        {/* LOG */}
        <div className="bb-dice-tray__log">
          <div className="bb-dice-tray__log-header">ROLL LOG</div>
          <div className="bb-dice-tray__log-body">
            {log.length === 0 ? (
              <p className="bb-dice-tray__log-empty">
                No rolls yet. Click a die above to start.
              </p>
            ) : (
              <ul className="bb-dice-tray__log-list">
                {log.map((entry) => {
                  const entryOutcomeLabel =
                    entry.outcome === "critSuccess"
                      ? "CRITICAL SUCCESS"
                      : entry.outcome === "success"
                      ? "SUCCESS"
                      : entry.outcome === "critFailure"
                      ? "CRITICAL FAILURE"
                      : entry.outcome === "failure"
                      ? "FAILURE"
                      : "";

                  return (
                    <li key={entry.id} className="bb-dice-tray__log-item">
                      <div className="bb-dice-tray__log-line">
                        <span className="bb-dice-tray__log-label">
                          {entry.label}
                        </span>
                        <span className="bb-dice-tray__log-result">
                          {entry.result}{" "}
                          <span
                            style={{ opacity: 0.8, fontSize: "0.8em" }}
                          >
                            (Total {entry.runningTotal})
                          </span>
                        </span>
                      </div>
                      <div className="bb-dice-tray__log-sub">
                        <span>{entry.formula}</span>

                        {entry.kind === "skill" &&
                            entry.target !== null &&
                            entry.outcome !== "none" && (
                            <span className="bb-dice-tray__log-outcome">
                                {" "}
                                — {entry.outcome === "critSuccess"
                                ? "CRITICAL SUCCESS"
                                : entry.outcome === "critFailure"
                                ? "CRITICAL FAILURE"
                                : entry.outcome === "success"
                                ? "SUCCESS"
                                : "FAILURE"}{" "}
                                vs {entry.target}%
                            </span>
                            )}

                        {entry.kind === "damage" && entry.damage !== null && (
                            <span className="bb-dice-tray__log-outcome">
                            {" "}
                            — Damage {entry.damage} (Crit: {entry.critDamage})
                            </span>
                        )}

                        {entry.kind === "lethality" && entry.damage !== null && (
                            <span className="bb-dice-tray__log-outcome">
                            {" "}
                            — {entry.isLethal ? "LETHAL" : "NON-LETHAL"}; Damage {entry.damage} (Crit:{" "}
                            {entry.critDamage})
                            </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bb-dice-tray__log-footer">
            <button
              type="button"
              className="bb-button bb-button--ghost bb-dice-tray__clear-log"
              onClick={handleClearLog}
              disabled={log.length === 0}
            >
              CLEAR LOG
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DiceTray;