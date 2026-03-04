// src/features/character-creation/sections/StatsSection.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import type { StatKey } from "../../../models/characterCreationTypes";

type StatsSectionProps = {
  agent: DeltaGreenAgent;
  stats: readonly StatKey[];
  statMode: "Assigned" | "Rolled";
  setStatMode: (mode: "Assigned" | "Rolled") => void;
  updateField: (path: string[], value: any) => void;
};

const StatsSection: React.FC<StatsSectionProps> = ({
  agent,
  stats,
  statMode,
  setStatMode,
  updateField,
}) => {
  console.log("Rendering StatsSection with agent:", agent.system.statistics);
  const statSum = stats.reduce(
    (sum, stat) => sum + agent.system.statistics[stat].value,
    0
  );

  // Derived stats (same formulas as your previous logic)
  const hp = Math.floor(
    (agent.system.statistics.con.value + agent.system.statistics.str.value) / 2
  );
  const san = agent.system.statistics.pow.value * 5;
  const wp = agent.system.statistics.pow.value;
  const bp = san - agent.system.statistics.pow.value;
  
  const handleStatChange = (stat: StatKey, newValue: number) => {
    // Build a temporary copy of statistics reflecting this change
    const newStats = {
      ...agent.system.statistics,
      [stat]: {
        ...agent.system.statistics[stat],
        value: newValue,
        x5: newValue * 5,
      },
    };

    if (newValue >= 9 && newValue <= 12) {
      if (newStats[stat].distinguishing_feature) {
        newStats[stat] = {
          ...newStats[stat],
          distinguishing_feature: "",
        };
        updateField(
          ["system", "statistics", stat, "distinguishing_feature"],
          ""
        );
      }
    }

    const newHp = Math.floor(
      (newStats.con.value + newStats.str.value) / 2
    );
    const newSan = newStats.pow.value * 5;
    const newWp = newStats.pow.value;
    const newBp = newSan - newStats.pow.value;

    // 1) Update base stat + x5
    updateField(["system", "statistics", stat, "value"], newValue);
    updateField(["system", "statistics", stat, "x5"], newValue * 5);

    // 2) Update derived stats in the agent
    updateField(["system", "health", "value"], newHp);
    updateField(["system", "health", "max"], newHp);
    updateField(["system", "wp", "value"], newWp);
    updateField(["system", "wp", "max"], newWp);
    updateField(["system", "sanity", "value"], newSan);
    updateField(
      ["system", "sanity", "currentBreakingPoint"],
      newBp
    );
  };

  return (
    <section className="bb-stats-section">
      <h3 className="bb-section-title">Statistics</h3>

      {/* Stat mode selection */}
      <div className="bb-toggle-group">
        <label className="bb-toggle">
          <input
            type="radio"
            className="bb-toggle__input"
            checked={statMode === "Assigned"}
            onChange={() => setStatMode("Assigned")}
          />
          <span className="bb-toggle__pill">
            <span className="bb-toggle__label">Assigned</span>
          </span>
        </label>

        <label className="bb-toggle">
          <input
            type="radio"
            className="bb-toggle__input"
            checked={statMode === "Rolled"}
            onChange={() => setStatMode("Rolled")}
          />
          <span className="bb-toggle__pill">
            <span className="bb-toggle__label">Rolled</span>
          </span>
        </label>
      </div>

      {/* Stat inputs */}
      <div className="bb-form-grid">
        {stats.map((stat) => {
          const value = agent.system.statistics[stat].value;
          const canEditDistinguishing = value < 9 || value > 12;
          return (
            <div key={stat} className="bb-form-row bb-form-row--stat">
              <label className="bb-form-label">
                <span className="bb-form-label__text">{stat.toUpperCase()}</span>
                <select
                  className="bb-select bb-select--stat"
                  value={value}
                  onChange={(e) =>
                    handleStatChange(stat, Number(e.target.value))
                  }
                >
                  {Array.from({ length: 16 }, (_, i) => i + 3).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bb-form-label bb-form-label--df">
                <span className="bb-form-label__text">Distinguishing Feature</span>
                <input
                  className="bb-input bb-input--df"
                  type="text"
                  value={agent.system.statistics[stat].distinguishing_feature}
                  onChange={(e) =>
                    updateField(
                      ["system", "statistics", stat, "distinguishing_feature"],
                      e.target.value
                    )
                  }
                  disabled={!canEditDistinguishing}
                />
              </label>
            </div>
          );
        })}
      </div>

      {/* Too many assigned stat points */}
      {statMode === "Assigned" && statSum > 72 && (
        <div className="bb-alert bb-alert--error">
          ⚠️ STAT TOTAL TOO HIGH ({statSum}/72). Reduce your assigned stats before
          continuing.
        </div>
      )}

      {/* Derived Stats */}
      <div className="bb-derived-stats">
        <h4 className="bb-derived-stats__title">Derived Stats</h4>
        <p className="bb-derived-stats__line">Hit Points (HP): {hp}</p>
        <p className="bb-derived-stats__line">Willpower (WP): {wp}</p>
        <p className="bb-derived-stats__line">Sanity (SAN): {san}</p>
        <p className="bb-derived-stats__line">Breaking Point (BP): {bp}</p>
      </div>
    </section>
  );
};

export default StatsSection;