// src/features/player-panel/cards/SkillsCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { getSkillBreakdown } from "../../../lib/skillApplication";
import { formatTypedSkillLabel } from "../playerPanel.helpers";
import { getEffectiveSkillChance } from "../conditionRolls";

type SkillsCardProps = {
  agent: DeltaGreenAgent;
  baseSkills: any;
  bonusSkillPoints: Record<string, number>;
  veteranSkillPoints: Record<string, number>;
  onRollSkill: (label: string, chance: number) => void;
  updateAgentViaMutator: (mutate: (copy: DeltaGreenAgent) => void) => void;
};

const SkillsCard: React.FC<SkillsCardProps> = ({
  agent,
  baseSkills,
  bonusSkillPoints,
  veteranSkillPoints,
  onRollSkill,
  updateAgentViaMutator
}) => {
  return (
    <div className="bb-card bb-card--skills-list">
      <div className="bb-card__header">SKILLS</div>
      <div className="bb-card__body">
        <div className="bb-skills-grid">
          {/* Standard skills */}
          {Object.entries(agent.system.skills)
            .sort((a, b) => a[1].label.localeCompare(b[1].label))
            .map(([key, skill]) => {
              const { total, breakdownText } = getSkillBreakdown(
                key,
                false,
                agent,
                baseSkills,
                bonusSkillPoints,
                veteranSkillPoints
              );

              const { chance: effective, adj } = getEffectiveSkillChance(agent, total, key);

              const modLabel =
                adj.delta !== 0
                  ? ` (mod ${adj.delta >= 0 ? "+" : ""}${adj.delta} from: ${adj.sources.join(", ")})`
                  : "";

              const titleText =
                breakdownText && breakdownText.trim().length > 0
                  ? `${skill.label}: ${effective}${breakdownText}${modLabel}`
                  : `${skill.label}: ${effective}${modLabel}`;

              return (
                <div className="bb-skill-cell" key={key}>
                  <label className="bb-skill-advancement bb-checkbox bb-checkbox--tiny">
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={!!skill.failure}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateAgentViaMutator((copy) => {
                          if (copy.system.skills[key]) {
                            copy.system.skills[key].failure = checked;
                          }
                        });
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                  </label>                  
                    <button
                      type="button"
                      className="bb-skill-button"
                      title={titleText}
                      onClick={() => onRollSkill(skill.label, effective)}
                    >
                      <span className="bb-skill-button__label">{skill.label}</span>
                      <span
                        className={
                          "bb-skill-button__value" +
                          (adj.delta < 0 ? " bb-skill-value--penalty" : "") +
                          (adj.delta > 0 ? " bb-skill-value--bonus" : "")
                        }
                        title={
                          adj.delta !== 0
                            ? `${total}% ${adj.delta > 0 ? "+" : ""}${adj.delta} (${adj.sources.join(", ")})`
                            : undefined
                        }
                      >
                        {effective}
                      </span>
                    </button>
                </div>
              );
            })}

          {/* Typed skills */}
          {Object.entries(agent.system.typedSkills)
            .sort((a, b) => a[1].label.localeCompare(b[1].label))
            .map(([key, skill]) => {
              const { total, breakdownText } = getSkillBreakdown(
                key,
                true,
                agent,
                baseSkills,
                bonusSkillPoints,
                veteranSkillPoints
              );

              // Hide typed skills that are effectively at 0%
              if (total <= 0) return null;

              
              const { chance: effective, adj } = getEffectiveSkillChance(agent, total, key);

              const modLabel =
                adj.delta !== 0
                  ? ` (mod ${adj.delta >= 0 ? "+" : ""}${adj.delta} from: ${adj.sources.join(", ")})`
                  : "";

              const formattedLabel = formatTypedSkillLabel(skill.label);

              const titleText =
                breakdownText && breakdownText.trim().length > 0
                  ? `${formattedLabel}: ${total}${breakdownText}${modLabel}`
                  : `${formattedLabel}: ${total}${modLabel}`;

              return (
                <div className="bb-skill-cell" key={key}>
                  <label className="bb-skill-advancement bb-checkbox bb-checkbox--tiny">
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={!!skill.failure}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateAgentViaMutator((copy) => {
                          if (copy.system.typedSkills[key]) {
                            copy.system.typedSkills[key].failure = checked;
                          }
                        });
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                  </label>

                  <button
                    type="button"
                    className="bb-skill-button"
                    title={titleText}
                    onClick={() => onRollSkill(formattedLabel, effective)}
                  >
                    <span className="bb-skill-button__label">{formattedLabel}</span>
                    <span
                      className={
                        "bb-skill-button__value" +
                        (adj.delta < 0 ? " bb-skill-value--penalty" : "") +
                        (adj.delta > 0 ? " bb-skill-value--bonus" : "")
                      }
                      title={
                        adj.delta !== 0
                          ? `${total}% ${adj.delta > 0 ? "+" : ""}${adj.delta} (${adj.sources.join(", ")})`
                          : undefined
                      }
                    >
                      {effective}
                    </span>
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default SkillsCard;