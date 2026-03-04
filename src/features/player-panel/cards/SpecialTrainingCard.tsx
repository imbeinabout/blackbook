// src/features/player-panel/cards/SpecialTrainingCard.tsx
import React from "react";
import { nanoid } from "nanoid";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { StatKey } from "../../../models/characterCreationTypes";
import { buildBaseSkills } from "../../../models/baseSkills";
import { getSkillBreakdown } from "../../../lib/skillApplication";

type BaseSkills = ReturnType<typeof buildBaseSkills>;

type TrainingTargetKind = "stat" | "skill" | "typedSkill";

interface SpecialTrainingEntry {
  id: string;
  name: string;
  targetType: TrainingTargetKind;
  targetKey: string; // StatKey or skill/typedSkill key
}

interface SpecialTrainingCardProps {
  agent: DeltaGreenAgent;
  baseSkills: BaseSkills;
  bonusSkillPoints: Record<string, number>;
  veteranSkillPoints: Record<string, number>;
  onUpdateAgent: (updated: DeltaGreenAgent) => void;
  onOpenSkillRoll: (label: string, chance: number) => void;
  onOpenStatRoll: (label: string, x5: number) => void;
}

const SpecialTrainingCard: React.FC<SpecialTrainingCardProps> = ({
  agent,
  baseSkills,
  bonusSkillPoints,
  veteranSkillPoints,
  onUpdateAgent,
  onOpenSkillRoll,
  onOpenStatRoll,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [selectedTarget, setSelectedTarget] = React.useState<string>("");

  const STAT_KEYS: StatKey[] = ["str", "con", "dex", "int", "pow", "cha"];

  const currentTraining: SpecialTrainingEntry[] = React.useMemo(
    () => (agent.system.specialTraining ?? []) as SpecialTrainingEntry[],
    [agent.system.specialTraining]
  );

  const withUpdatedAgent = React.useCallback(
    (mutate: (copy: DeltaGreenAgent) => void) => {
      const copy: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));
      mutate(copy);
      onUpdateAgent(copy);
    },
    [agent, onUpdateAgent]
  );

  const getStatLabel = (key: StatKey) => key.toUpperCase();

  const getSkillChance = (skillKey: string, isTyped: boolean): number => {
    const { total } = getSkillBreakdown(
      skillKey,
      isTyped,
      agent,
      baseSkills,
      bonusSkillPoints,
      veteranSkillPoints
    );
    return total;
  };

  const getTargetDisplay = (entry: SpecialTrainingEntry): string => {
    if (entry.targetType === "stat") {
      const stat = agent.system.statistics[entry.targetKey as StatKey];
      if (!stat) return "Unknown STAT";
      return `${getStatLabel(entry.targetKey as StatKey)} (x5)`;
    }

    if (entry.targetType === "skill") {
      const skill = agent.system.skills[entry.targetKey];
      return skill?.label ?? "Unknown Skill";
    }

    const tSkill = agent.system.typedSkills[entry.targetKey];
    return tSkill?.label ?? "Unknown Typed Skill";
  };

  const handleRollTraining = (entry: SpecialTrainingEntry) => {
    if (entry.targetType === "stat") {
      const stat = agent.system.statistics[entry.targetKey as StatKey];
      if (!stat) {
        window.alert("Associated STAT not found on this Agent.");
        return;
      }
      onOpenStatRoll(entry.name, stat.x5);
      return;
    }

    const isTyped = entry.targetType === "typedSkill";
    const chance = getSkillChance(entry.targetKey, isTyped);
    onOpenSkillRoll(entry.name, chance);
  };

  const statOptions = STAT_KEYS.map((key) => {
    const stat = agent.system.statistics[key];
    const label = `${getStatLabel(key)} (x5 = ${stat?.x5 ?? 0}%)`;
    return {
      value: `stat:${key}`,
      label,
    };
  });

  const standardSkillOptions = Object.entries(agent.system.skills)
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .map(([key, skill]) => ({
      value: `skill:${key}`,
      label: skill.label,
    }));

  const typedSkillOptions = Object.entries(agent.system.typedSkills)
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .map(([key, skill]) => ({
      value: `typedSkill:${key}`,
      label: skill.label,
    }));

  const handleAddTraining = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      window.alert("Please enter a name for the special training.");
      return;
    }
    if (!selectedTarget) {
      window.alert("Please select a STAT or SKILL for this training.");
      return;
    }

    const [targetType, targetKey] = selectedTarget.split(
      ":"
    ) as [TrainingTargetKind, string];

    const newEntry: SpecialTrainingEntry = {
      id: nanoid(),
      name: trimmedName,
      targetType,
      targetKey,
    };

    withUpdatedAgent((copy) => {
      const existing = (copy.system.specialTraining ??
        []) as SpecialTrainingEntry[];
      copy.system.specialTraining = [...existing, newEntry];
    });

    setNewName("");
    setSelectedTarget("");
  };

  const handleRemoveTraining = (id: string) => {
    withUpdatedAgent((copy) => {
      const existing = (copy.system.specialTraining ??
        []) as SpecialTrainingEntry[];
      copy.system.specialTraining = existing.filter((t) => t.id !== id);
    });
  };

  return (
    <>
      <div className="bb-card bb-card--special-training">
        <div className="bb-card__header">
          <span>SPECIAL TRAINING</span>
          <button
            type="button"
            className="bb-button bb-button--small"
            style={{ float: "right" }}
            onClick={() => setIsModalOpen(true)}
          >
            Manage training
          </button>
        </div>

        <div className="bb-card__body">
          {currentTraining.length === 0 ? (
            <p>No special training recorded.</p>
          ) : (
            <div className="bb-skills-grid">
              {currentTraining
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((entry) => {
                  const targetDisplay = getTargetDisplay(entry);
                  return (
                    <div
                      className="bb-skill-cell"
                      key={entry.id}
                    >
                      <button
                        type="button"
                        className="bb-skill-button"
                        onClick={() => handleRollTraining(entry)}
                        title={targetDisplay}
                      >
                        <span className="bb-skill-button__label">
                          {entry.name}
                        </span>
                        <span className="bb-skill-button__value">
                          {targetDisplay}
                        </span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="bb-modal">
          <div className="bb-modal__dialog">
            <div className="bb-modal__header">Manage Special Training</div>
            <div className="bb-modal__body">
              {/* Existing entries */}
              {currentTraining.length > 0 ? (
                <table className="bb-table bb-table--tight">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Uses</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {currentTraining
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.name}</td>
                          <td>{getTargetDisplay(entry)}</td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="bb-button bb-button--small bb-button--danger"
                              onClick={() => handleRemoveTraining(entry.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p>No special training defined yet.</p>
              )}

              {/* Add new training */}
              <hr />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 160px" }}>
                  <label className="bb-field-label">
                    Training name
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{ width: "100%", marginTop: "0.15rem" }}
                    />
                  </label>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <label className="bb-field-label">
                    Uses STAT / SKILL
                    <select
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                      style={{ width: "100%", marginTop: "0.15rem" }}
                    >
                      <option value="">— choose —</option>
                      <optgroup label="Statistics">
                        {statOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Skills">
                        {standardSkillOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                      {typedSkillOptions.length > 0 && (
                        <optgroup label="Typed Skills">
                          {typedSkillOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button bb-button--secondary"
                onClick={handleAddTraining}
              >
                Add training
              </button>
              <button
                type="button"
                className="bb-button"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpecialTrainingCard;