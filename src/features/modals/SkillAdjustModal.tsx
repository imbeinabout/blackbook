// src/features/modals/SkillAdjustModal.tsx

import React from "react";
import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import NumberSpinner from "../../components/ui/NumberSpinner";

type SkillAdjustModalProps = {
  open: boolean;
  agent: DeltaGreenAgent | null;
  onClose: () => void;
  updateAgent: (updated: DeltaGreenAgent) => void;
};

type SkillOption = {
  key: string;
  label: string;
  typed: boolean;
};

const SkillAdjustModal: React.FC<SkillAdjustModalProps> = ({
  open,
  agent,
  onClose,
  updateAgent,
}) => {
  const skillOptions = React.useMemo<SkillOption[]>(() => {
    if (!agent) return [];

    const normalSkills = Object.entries(agent.system.skills).map(
      ([key, skill]) => ({
        key,
        label: skill.label,
        typed: false,
      })
    );

    const typedSkills = Object.entries(agent.system.typedSkills).map(
      ([key, skill]) => ({
        key,
        label: skill.label,
        typed: true,
      })
    );

    return [...normalSkills, ...typedSkills].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [agent]);

  const [selectedSkillKey, setSelectedSkillKey] = React.useState("");
  const [adjustment, setAdjustment] = React.useState(0);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    setAdjustment(0);
    setReason("");

    if (skillOptions.length > 0) {
      setSelectedSkillKey(skillOptions[0].key);
    }
  }, [open, skillOptions]);

  if (!open || !agent) {
    return null;
  }

  const selectedSkill =
    agent.system.skills[selectedSkillKey] ??
    agent.system.typedSkills[selectedSkillKey];

  const currentValue = selectedSkill?.proficiency ?? 0;

  const projectedValue = Math.max(
    0,
    Math.min(99, currentValue + adjustment)
  );

  const handleSave = () => {
    if (!selectedSkillKey) return;

    const updated: DeltaGreenAgent = JSON.parse(
      JSON.stringify(agent)
    );

    const skill =
      updated.system.skills[selectedSkillKey] ??
      updated.system.typedSkills[selectedSkillKey];

    if (!skill) return;

    skill.proficiency = projectedValue;

    // Future-proof history storage
    const anyAgent = updated as any;

    if (!anyAgent.system.skillHistory) {
      anyAgent.system.skillHistory = [];
    }

    anyAgent.system.skillHistory.push({
      timestamp: new Date().toISOString(),
      skillKey: selectedSkillKey,
      skillLabel: skill.label,
      oldValue: currentValue,
      adjustment,
      newValue: projectedValue,
      reason: reason.trim(),
    });

    updateAgent(updated);
    onClose();
  };

  return (
  <div className="bb-modal">
    <div
      className="bb-modal__dialog bb-skill-adjust-modal__dialog"
      onClick={(e) => e.stopPropagation()}
    >
        <div className="bb-modal__header">
            <h3 className="bb-modal__title">
                Adjust Skill
            </h3>
        </div>

        <div className="bb-modal__body bb-skill-adjust-modal__body">

          <div className="bb-form-group">
            <label>Skill</label>

            <select
              value={selectedSkillKey}
              onChange={(e) =>
                setSelectedSkillKey(e.target.value)
              }
            >
              {skillOptions.map((skill) => (
                <option
                  key={skill.key}
                  value={skill.key}
                >
                  {skill.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bb-form-group">
            <NumberSpinner
                label="Adjustment"
                min={-99}
                max={99}
                value={String(adjustment)}
                onChange={(value) => {
                const n = Number(value);

                if (!value || Number.isNaN(n)) {
                    setAdjustment(0);
                    return;
                }

                setAdjustment(n);
                }}
            />
          </div>

          <div className="bb-form-group">
            <label>Reason (optional)</label>

            <textarea
              rows={4}
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              placeholder="Training, home scene, Handler award, etc."
            />
          </div>

          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              border: "1px solid #666",
            }}
          >
            <strong>Current:</strong> {currentValue}
            <br />
            <strong>Adjustment:</strong>{" "}
            {adjustment >= 0
              ? `+${adjustment}`
              : adjustment}
            <br />
            <strong>New Value:</strong>{" "}
            {projectedValue}
          </div>
        </div>

        <div className="bb-modal__footer">
          <button
            type="button"
            className="bb-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="bb-button bb-button--primary"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillAdjustModal;