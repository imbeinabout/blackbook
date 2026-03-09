// src/features/player-panel/cards/PersonalDataCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import NumberSpinner from "../../../components/ui/NumberSpinner";
import { renderStatButton } from "../playerPanel.helpers";
import { getEffectiveStatChance } from "../conditionRolls";
import { useAgentStore } from "../../../store/agentStore";

type PersonalDataCardProps = {
    agent: DeltaGreenAgent;
    openStatRoll: (label: string, x5: number) => void;
}

const PersonalDataCard: React.FC<PersonalDataCardProps> = ({
    agent,
    openStatRoll
}) => {
    const { activeAgentId, updateAgent } = useAgentStore();
    const name = agent.name ?? "Unnamed Agent";
    const profession = agent.system.biography.profession ?? "Unknown Profession";
    
    const [isEditOpen, setIsEditOpen] = React.useState(false);

    const [draftStats, setDraftStats] = React.useState(() => ({
      str: agent.system.statistics.str.value,
      con: agent.system.statistics.con.value,
      dex: agent.system.statistics.dex.value,
      int: agent.system.statistics.int.value,
      pow: agent.system.statistics.pow.value,
      cha: agent.system.statistics.cha.value,
    }));

    const [recalcHP, setRecalcHP] = React.useState(true);
    const [recalcWP, setRecalcWP] = React.useState(true);

    React.useEffect(() => {
      setDraftStats({
        str: agent.system.statistics.str.value,
        con: agent.system.statistics.con.value,
        dex: agent.system.statistics.dex.value,
        int: agent.system.statistics.int.value,
        pow: agent.system.statistics.pow.value,
        cha: agent.system.statistics.cha.value,
      });
    }, [agent]);
    
    return (
        <div className="bb-card bb-card--personal">
          <div className="bb-card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>PERSONAL DATA</span>
            <button
              type="button"
              className="bb-button bb-button--small"
              title="Edit permanent stats"
              onClick={() => setIsEditOpen(true)}
            >
              ⚙
            </button>
          </div>
          <div className="bb-card__body">
            <table className="bb-personal-table">
              <tbody>
                <tr>
                  <td>
                    <span className="bb-personal-table__label">Name</span>
                    <span className="bb-personal-table__value">{name}</span>
                  </td>
                  <td>
                    <span className="bb-personal-table__label">Profession</span>
                    <span className="bb-personal-table__value">{profession}</span>
                  </td>
                  <td>
                    <span className="bb-personal-table__label">Rank / Title</span>
                    <span className="bb-personal-table__value">
                      {agent.system.biography.rankOrTitle ?? "—"}
                    </span>
                  </td>
                </tr>
  
                <tr>
                  <td>
                    <span className="bb-personal-table__label">Employer</span>
                    <span className="bb-personal-table__value">
                      {agent.system.biography.employer ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className="bb-personal-table__label">Nationality</span>
                    <span className="bb-personal-table__value">
                      {agent.system.biography.nationality ?? "—"}
                    </span>
                  </td>
                </tr>
  
                <tr>
                  <td>
                    <span className="bb-personal-table__label">Sex</span>
                    <span className="bb-personal-table__value">
                      {agent.system.biography.sex ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className="bb-personal-table__label">Age / DOB</span>
                    <span className="bb-personal-table__value">
                      {agent.system.biography.age ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className="bb-personal-table__label">Education</span>
                    <span className="bb-personal-table__value">
                      {agent.system.biography.education ?? "—"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
  
            <div className="bb-personal-stats-row">
              {(() => {
                const stat = agent.system.statistics.str;
                const { chance: eff, adj } = getEffectiveStatChance(agent, stat.x5, "str");
                return renderStatButton(
                  "STR",
                  {
                    value: stat.value,
                    x5: eff,
                    distinguishing_feature: stat.distinguishing_feature,
                  },
                  () => openStatRoll("STR", eff),
                  adj.delta
                );
              })()}

              {(() => {
                const stat = agent.system.statistics.con;
                const { chance: eff, adj } = getEffectiveStatChance(agent, stat.x5, "con");
                return renderStatButton("CON", {
                  value: stat.value,
                  x5: eff,
                  distinguishing_feature: stat.distinguishing_feature,
                }, () => openStatRoll("CON", eff), adj.delta);
              })()}

              {(() => {
                const stat = agent.system.statistics.dex;
                const { chance: eff, adj } = getEffectiveStatChance(agent, stat.x5, "dex");
                return renderStatButton("DEX", {
                  value: stat.value,
                  x5: eff,
                  distinguishing_feature: stat.distinguishing_feature,
                }, () => openStatRoll("DEX", eff), adj.delta);
              })()}

              {(() => {
                const stat = agent.system.statistics.int;
                const { chance: eff, adj } = getEffectiveStatChance(agent, stat.x5, "int");
                return renderStatButton("INT", {
                  value: stat.value,
                  x5: eff,
                  distinguishing_feature: stat.distinguishing_feature,
                }, () => openStatRoll("INT", eff), adj.delta);
              })()}

              {(() => {
                const stat = agent.system.statistics.pow;
                const { chance: eff, adj } = getEffectiveStatChance(agent, stat.x5, "pow");
                return renderStatButton("POW", {
                  value: stat.value,
                  x5: eff,
                  distinguishing_feature: stat.distinguishing_feature,
                }, () => openStatRoll("POW", eff), adj.delta);
              })()}

              {(() => {
                const stat = agent.system.statistics.cha;
                const { chance: eff, adj } = getEffectiveStatChance(agent, stat.x5, "cha");
                return renderStatButton("CHA", {
                  value: stat.value,
                  x5: eff,
                  distinguishing_feature: stat.distinguishing_feature,
                }, () => openStatRoll("CHA", eff), adj.delta);
              })()}
            </div>
          </div>
          {isEditOpen && (
            <div className="bb-modal" onClick={() => setIsEditOpen(false)}>
              <div
                className="bb-modal__dialog"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "520px" }}
              >
                <h3 className="bb-modal__title">Edit Permanent Stats</h3>

                <div className="bb-modal__body">
                  <div className="bb-form-grid">
                    {(
                      [
                        ["str", "STR"],
                        ["con", "CON"],
                        ["dex", "DEX"],
                        ["int", "INT"],
                        ["pow", "POW"],
                        ["cha", "CHA"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="bb-form-row">
                        <label className="bb-form-label">
                          <span className="bb-form-label__text">{label}</span>
                          <NumberSpinner
                            value={String(draftStats[key])}
                            min={1}
                            max={99}
                            onChange={(val) =>
                              setDraftStats((prev) => ({
                                ...prev,
                                [key]: Number(val) || 0,
                              }))
                            }
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <hr style={{ margin: "0.75rem 0" }} />

                  <label className="bb-checkbox bb-checkbox--small">
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={recalcHP}
                      onChange={(e) => {
                        setRecalcHP(e.target.checked);
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                    <span className="bb-checkbox__label">
                      Recalculate HP (from CON)
                    </span>
                  </label>

                  <label className="bb-checkbox bb-checkbox--small" style={{ marginTop: "0.35rem" }}>
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={recalcWP}
                      onChange={(e) => {
                        setRecalcWP(e.target.checked);
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                    <span className="bb-checkbox__label">
                      Recalculate WP (from POW)
                    </span>
                  </label>
                </div>

                <div className="bb-modal__footer">
                  <button
                    type="button"
                    className="bb-button"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="bb-button bb-button--primary"
                    onClick={() => {
                      const updated = JSON.parse(JSON.stringify(agent)) as DeltaGreenAgent;

                      (["str", "con", "dex", "int", "pow", "cha"] as const).forEach((k) => {
                        const stat = updated.system.statistics[k];
                        stat.value = draftStats[k];
                        stat.x5 = draftStats[k] * 5;
                      });

                      if (recalcHP && updated.system.health) {
                        const oldMax = updated.system.health.max;
                        const ratio =
                          oldMax > 0
                            ? updated.system.health.value / oldMax
                            : 1;

                        const newMax = updated.system.statistics.con.value;
                        updated.system.health.max = newMax;
                        updated.system.health.value = Math.max(
                          0,
                          Math.round(newMax * ratio)
                        );
                      }

                      if (recalcWP && updated.system.wp) {
                        const oldMax = updated.system.wp.max;
                        const ratio =
                          oldMax > 0
                            ? updated.system.wp.value / oldMax
                            : 1;

                        const newMax = updated.system.statistics.pow.value;
                        updated.system.wp.max = newMax;
                        updated.system.wp.value = Math.max(
                          0,
                          Math.round(newMax * ratio)
                        );
                      }

                      // Push update through store
                      if (!activeAgentId) return;

                      updateAgent(activeAgentId, updated);
                      setIsEditOpen(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    );
}

export default PersonalDataCard;