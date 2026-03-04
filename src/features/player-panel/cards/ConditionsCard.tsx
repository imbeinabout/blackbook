// src/features/player-panel/cards/ConditionsCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import type { ConditionTemplate } from "../../../models/conditions";
import { removeCondition } from "../conditions.logic";
import conditionsDataJson from "../../../data/conditions.json";

type ConditionsCardProps = {
  agent: DeltaGreenAgent;
  updateAgentViaMutator: (mutate: (copy: DeltaGreenAgent) => void) => void;
};

const CUSTOM_CONDITIONS_KEY = "dg-custom-conditions";

function loadCustomConditionTemplates(): ConditionTemplate[] {
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

export const ConditionsCard: React.FC<ConditionsCardProps> = ({
  agent,
  updateAgentViaMutator,
}) => {
  const conditions = agent.system.conditions ?? [];

  const templateById = React.useMemo(() => {
    const builtIns = conditionsDataJson as ConditionTemplate[];
    const customs = loadCustomConditionTemplates();
    const all = [...builtIns, ...customs];

    const map = new Map<string, ConditionTemplate>();
    for (const t of all) map.set(t.id, t);
    return map;
  }, []);

  const [openId, setOpenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="bb-card bb-card--conditions">
      <div className="bb-card__header">CONDITIONS</div>
      <div className="bb-card__body">
        {conditions.length === 0 ? (
          <p className="bb-text-muted" style={{ margin: 0 }}>
            No active conditions.
          </p>
        ) : (
          <div className="bb-conditions-list">
            {conditions.map((c) => {
              const tmpl = templateById.get(c.id);
              const popoverId = `bb-cond-popover-${c.id}`;
              const show = openId === c.id;

              return (
                <span
                  key={c.id}
                  className={`bb-condition-pill bb-condition-pill--${c.category}`}
                  onMouseEnter={() => setOpenId(c.id)}
                  onMouseLeave={() => setOpenId((prev) => (prev === c.id ? null : prev))}
                >
                  <button
                    type="button"
                    className="bb-condition-pill__labelBtn"
                    aria-haspopup="dialog"
                    aria-expanded={show}
                    aria-controls={popoverId}
                    onFocus={() => setOpenId(c.id)}
                    onBlur={() => setOpenId((prev) => (prev === c.id ? null : prev))}
                    onClick={() => setOpenId((prev) => (prev === c.id ? null : c.id))}
                    title="Show details"
                  >
                    {c.label}
                  </button>

                  <button
                    type="button"
                    className="bb-condition-pill__remove"
                    title="Remove condition"
                    onClick={() =>
                      updateAgentViaMutator((copy) => {
                        removeCondition(copy, c.id);
                      })
                    }
                  >
                    ✕
                  </button>

                  {show && (
                    <div
                      id={popoverId}
                      role="dialog"
                      aria-label={`${c.label} details`}
                      className="bb-condition-popover"
                    >
                      <div className="bb-condition-popover__title">
                        <span>{tmpl?.label ?? c.label}</span>
                        <span className="bb-condition-popover__cat">
                          {(tmpl?.category ?? c.category).toUpperCase()}
                        </span>
                      </div>

                      {tmpl?.description ? (
                        <div className="bb-condition-popover__desc">{tmpl.description}</div>
                      ) : (
                        <div className="bb-condition-popover__desc bb-text-muted">
                          No description available.
                        </div>
                      )}

                      {tmpl?.effects && tmpl.effects.length > 0 ? (
                        <ul className="bb-condition-popover__effects">
                          {tmpl.effects.map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="bb-text-muted" style={{ fontSize: "0.75rem" }}>
                          No effect lines available.
                        </div>
                      )}
                    </div>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionsCard;