// src/features/character-creation/sections/CustomProfessionModal.tsx
import React from "react";
import type { Profession, TypedSkill } from "../../../models/characterCreationTypes";
import { skillList } from "../../../models/baseSkills";

type CustomProfessionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  professions: Profession[];
  onProfessionsChange: (next: Profession[]) => void;
  onAfterSave?: (savedName: string) => void;
};

const CUSTOM_STORAGE_KEY = "customProfessions";

/**
 * Helper UI for adding a typed skill (type + subtype).
 * No inline styles: uses bb-cp-* class hooks.
 */
const TypedSkillAdder: React.FC<{
  onAdd: (type: string, subtype: string) => void;
}> = ({ onAdd }) => {
  const [type, setType] = React.useState("");
  const [subtype, setSubtype] = React.useState("");

  const canAdd = type.trim().length > 0 && subtype.trim().length > 0;

  return (
    <div className="bb-cp-typed-adder">
      <label className="bb-cp-field">
        <span className="bb-cp-field__label">Type</span>
        <select
          className="bb-cp-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">-- choose type --</option>
          <option value="Art">Art</option>
          <option value="Craft">Craft</option>
          <option value="Science">Science</option>
          <option value="Foreign Language">Foreign Language</option>
          <option value="Military Science">Military Science</option>
          <option value="Pilot">Pilot</option>
        </select>
      </label>

      <label className="bb-cp-field">
        <span className="bb-cp-field__label">Subtype</span>
        <input
          className="bb-cp-input"
          value={subtype}
          onChange={(e) => setSubtype(e.target.value)}
          placeholder="e.g. Surgery, French, Helicopter..."
        />
      </label>

      <button
        type="button"
        className="bb-button bb-cp-add-typed-btn"
        disabled={!canAdd}
        onClick={() => {
          if (!canAdd) return;
          onAdd(type.trim(), subtype.trim());
          setType("");
          setSubtype("");
        }}
      >
        Add
      </button>
    </div>
  );
};

const CustomProfessionModal: React.FC<CustomProfessionModalProps> = ({
  isOpen,
  onClose,
  professions,
  onProfessionsChange,
  onAfterSave,
}) => {
  // --- Selection + persistence state ---
  const [selectedName, setSelectedName] = React.useState<string | null>(null);

  // Builder state
  const [name, setName] = React.useState("");
  const [bondCount, setBondCount] = React.useState<number>(1);
  const [standardSkills, setStandardSkills] = React.useState<string[]>([]);
  const [typedSkills, setTypedSkills] = React.useState<TypedSkill[]>([]);
  const [skillPoints, setSkillPoints] = React.useState<Record<string, number>>({});

  // UI-only state (status + inline delete confirmation)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [deleteConfirmMode, setDeleteConfirmMode] = React.useState(false);

  const customProfessions = React.useMemo(
    () => professions.filter((p) => p.isCustom),
    [professions]
  );

  const resetBuilder = () => {
    setName("");
    setBondCount(1);
    setStandardSkills([]);
    setTypedSkills([]);
    setSkillPoints({});
    setStatusMessage(null);
  };

  const loadProfessionIntoBuilder = (prof: Profession) => {
    resetBuilder();

    setName(prof.name ?? "");
    setBondCount(prof.bonds);

    const std: string[] = [];
    const typed: TypedSkill[] = [];
    const points: Record<string, number> = {};

    const fixed = prof.fixedSkills ?? [];

    fixed.forEach((fs) => {
      if (fs.typed) {
        if (!fs.subtype) return;
        typed.push({ type: fs.key, subtype: fs.subtype });
      } else {
        std.push(fs.key);
      }
    });

    // Points for standard
    fixed
      .filter((fs) => !fs.typed)
      .forEach((fs) => {
        points[fs.key] = fs.proficiency;
      });

    // Points for typed: store by a stable generated key with idx
    let idx = 0;
    fixed
      .filter((fs) => fs.typed && fs.subtype)
      .forEach((fs) => {
        const key = `${fs.key}_${fs.subtype}_${idx}`;
        points[key] = fs.proficiency;
        idx++;
      });

    setStandardSkills(std);
    setTypedSkills(typed);
    setSkillPoints(points);
  };

  const handleSelectCustom = (nameValue: string) => {
    setDeleteConfirmMode(false);
    setStatusMessage(null);

    if (!nameValue) {
      setSelectedName(null);
      resetBuilder();
      return;
    }

    setSelectedName(nameValue);
    const prof = customProfessions.find((p) => p.name === nameValue);
    if (prof) loadProfessionIntoBuilder(prof);
    else resetBuilder();
  };

  // --- Builder derived values ---
  const totalSkillLimit = [0, 500, 450, 400, 350][bondCount] ?? 0;

  const allocatedPoints =
    standardSkills.reduce((sum, key) => sum + (skillPoints[key] ?? 0), 0) +
    typedSkills.reduce((sum, ts, idx) => {
      const k = `${ts.type}_${ts.subtype}_${idx}`;
      return sum + (skillPoints[k] ?? 0);
    }, 0);

  const remainingPoints = totalSkillLimit - allocatedPoints;
  const isSaveDisabled = remainingPoints !== 0;

  // --- Builder skill operations ---
  const totalSkillCount = standardSkills.length + typedSkills.length;

  const addStandardSkill = (skillKey: string) => {
    if (totalSkillCount >= 10) return;
    if (!standardSkills.includes(skillKey)) {
      setStandardSkills((prev) => [...prev, skillKey]);
      // default points to 0 if not present
      setSkillPoints((prev) => (prev[skillKey] != null ? prev : { ...prev, [skillKey]: 0 }));
    }
  };

  const addNewTypedSkill = (type: string, subtype: string) => {
    if (totalSkillCount >= 10) return;
    const skill: TypedSkill = { type, subtype };
    setTypedSkills((prev) => [...prev, skill]);
    // points default to 0; key is computed using idx in render
  };

  const removeStandardSkill = (skillKey: string) => {
    setStandardSkills((prev) => prev.filter((k) => k !== skillKey));
    setSkillPoints((prev) => {
      const next = { ...prev };
      delete next[skillKey];
      return next;
    });
  };

  const removeTypedSkill = (index: number) => {
    setTypedSkills((prev) => prev.filter((_, idx) => idx !== index));
    setSkillPoints((prev) => {
      const next = { ...prev };
      const ts = typedSkills[index];
      if (ts) {
        const prefix = `${ts.type}_${ts.subtype}_`;
        Object.keys(next).forEach((k) => {
          if (k.startsWith(prefix)) delete next[k];
        });
      }
      return next;
    });
  };

  // --- Save/Delete logic ---
  const handleSave = () => {
    const fixedStandard = [...standardSkills].map((key) => ({
      key,
      proficiency: skillPoints[key] ?? 0,
    }));

    const fixedTyped = typedSkills.map((t, idx) => {
      const key = `${t.type}_${t.subtype}_${idx}`;
      return {
        key: t.type,
        typed: true as const,
        subtype: t.subtype,
        proficiency: skillPoints[key] ?? 0,
      };
    });

    const proto: Profession = {
      name: "",
      description: "User-created profession",
      bonds: bondCount,
      fixedSkills: [...fixedStandard, ...fixedTyped],
      choiceSkills: [],
      isCustom: true,
    };

    const finalName =
      name.trim() || selectedName || proto.name || "Custom Profession";

    const finalProf: Profession = {
      ...proto,
      name: finalName,
      isCustom: true,
    };

    const nonCustom = professions.filter((p) => !p.isCustom);
    const othersCustom = customProfessions.filter((p) => p.name !== finalName);
    const next = [...nonCustom, ...othersCustom, finalProf];

    onProfessionsChange(next);

    const toStore = [...othersCustom, finalProf];
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(toStore));

    setSelectedName(finalName);
    setDeleteConfirmMode(false);
    setStatusMessage(`Custom profession "${finalName}" saved.`);
    onAfterSave?.(finalName);
  };

  const performDelete = () => {
    if (!selectedName) return;

    const nonCustom = professions.filter((p) => !p.isCustom);
    const remainingCustom = customProfessions.filter((p) => p.name !== selectedName);
    const next = [...nonCustom, ...remainingCustom];

    onProfessionsChange(next);
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(remainingCustom));

    const deleted = selectedName;
    setSelectedName(null);
    resetBuilder();
    setDeleteConfirmMode(false);
    setStatusMessage(`Custom profession "${deleted}" deleted.`);
  };

  if (!isOpen) return null;

  return (
    <div className="bb-modal bb-cp-modal" role="dialog" aria-modal="true">
      <div className="bb-modal__dialog bb-cp-dialog">
        {/* Header */}
        <div className="bb-cp-header">
          <h3 className="bb-cp-title">Manage Custom Professions</h3>
          <button type="button" className="bb-button bb-cp-close-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Status */}
        {statusMessage && <div className="bb-cp-status">{statusMessage}</div>}

        {/* Saved custom professions */}
        <div className="bb-cp-panel">
          {customProfessions.length > 0 ? (
            <div className="bb-cp-row">
              <label className="bb-cp-field">
                <span className="bb-cp-field__label">Saved custom professions</span>
                <select
                  className="bb-cp-select"
                  value={selectedName ?? ""}
                  onChange={(e) => handleSelectCustom(e.target.value)}
                >
                  <option value="">-- none selected --</option>
                  {customProfessions.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="bb-cp-actions">
                {!deleteConfirmMode ? (
                  <button
                    type="button"
                    className="bb-button bb-cp-delete-btn"
                    onClick={() => setDeleteConfirmMode(true)}
                    disabled={!selectedName}
                  >
                    Delete Selected
                  </button>
                ) : (
                  <div className="bb-cp-delete-confirm">
                    <div className="bb-cp-delete-text">
                      Delete <strong>{selectedName ?? "(none selected)"}</strong>?
                    </div>
                    <div className="bb-cp-delete-actions">
                      <button
                        type="button"
                        className="bb-button bb-button--danger"
                        onClick={performDelete}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="bb-button bb-button--ghost"
                        onClick={() => setDeleteConfirmMode(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="bb-cp-empty">
              No custom professions saved yet. Build one below and click{" "}
              <strong>Save Profession</strong>.
            </p>
          )}
        </div>

        {/* Builder */}
        <div className="bb-cp-builder">
          <h4 className="bb-cp-subtitle">Build Your Own Profession</h4>

          {/* Name */}
          <div className="bb-cp-row">
            <label className="bb-cp-field">
              <span className="bb-cp-field__label">Name</span>
              <input
                className="bb-cp-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flight Surgeon"
              />
            </label>
          </div>

          {/* Bonds */}
          <div className="bb-cp-row">
            <label className="bb-cp-field">
              <span className="bb-cp-field__label">Bonds</span>
              <select
                className="bb-cp-select"
                value={bondCount}
                onChange={(e) => setBondCount(parseInt(e.target.value, 10))}
              >
                <option value={1}>1 Bond (500 points)</option>
                <option value={2}>2 Bonds (450 points)</option>
                <option value={3}>3 Bonds (400 points)</option>
                <option value={4}>4 Bonds (350 points)</option>
              </select>
            </label>
          </div>

          {/* Standard skills */}
          <h5 className="bb-cp-subtitle bb-cp-subtitle--small">
            Choose Standard Skills (Up to 10 total between standard + typed)
          </h5>

          <div className="bb-cp-skill-grid">
            {skillList.map((skill) => {
              const key = skill.toLowerCase().replace(/ /g, "_");
              const isSelected = standardSkills.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  className={
                    "bb-button bb-cp-skill-btn" + (isSelected ? " bb-cp-skill-btn--selected" : "")
                  }
                  disabled={!isSelected && totalSkillCount >= 10}
                  onClick={() => addStandardSkill(key)}
                >
                  {isSelected ? `${skill} ✓` : skill}
                </button>
              );
            })}
          </div>

          {/* Add typed skill */}
          <h5 className="bb-cp-subtitle bb-cp-subtitle--small">Add Typed Skill</h5>
          <TypedSkillAdder onAdd={addNewTypedSkill} />

          {/* Allocate points */}
          <h5 className="bb-cp-subtitle bb-cp-subtitle--small">Allocate Profession Skill Points</h5>

          <div className="bb-cp-alloc">
            {/* Standard allocation */}
            {standardSkills.map((key) => {
              const prof = skillPoints[key] ?? 0;
              const label =
                skillList.find((s) => s.toLowerCase().replace(/ /g, "_") === key) ?? key;

              return (
                <div key={key} className="bb-cp-alloc-row">
                  <div className="bb-cp-alloc-label">{label}</div>

                  <select
                    className="bb-cp-select bb-cp-alloc-select"
                    value={prof}
                    onChange={(e) =>
                      setSkillPoints((prev) => ({
                        ...prev,
                        [key]: parseInt(e.target.value, 10),
                      }))
                    }
                  >
                    {[0, 10, 20, 30, 40, 50, 60].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="bb-cp-remove-btn"
                    onClick={() => removeStandardSkill(key)}
                    title="Remove this skill"
                    aria-label={`Remove ${label}`}
                  >
                    ✖
                  </button>
                </div>
              );
            })}

            {/* Typed allocation */}
            {typedSkills.map((ts, idx) => {
              const typedKey = `${ts.type}_${ts.subtype}_${idx}`;
              const points = skillPoints[typedKey] ?? 0;
              const label = `${ts.type} [${ts.subtype}]`;

              return (
                <div key={typedKey} className="bb-cp-alloc-row">
                  <div className="bb-cp-alloc-label">{label}</div>

                  <select
                    className="bb-cp-select bb-cp-alloc-select"
                    value={points}
                    onChange={(e) =>
                      setSkillPoints((prev) => ({
                        ...prev,
                        [typedKey]: parseInt(e.target.value, 10),
                      }))
                    }
                  >
                    {[0, 10, 20, 30, 40, 50, 60].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="bb-button bb-button--danger bb-cp-remove-btn"
                    onClick={() => removeTypedSkill(idx)}
                    title="Remove this typed skill"
                    aria-label={`Remove ${label}`}
                  >
                    ✖
                  </button>
                </div>
              );
            })}
          </div>

          {/* Summary + Save */}
          <div className="bb-cp-summary">
            <div className="bb-cp-summary__line">
              Points Used: <strong>{allocatedPoints}</strong> / {totalSkillLimit}
            </div>

            {remainingPoints < 0 && (
              <div className="bb-cp-warning">
                Points allocated exceed the allowed limit by{" "}
                <strong>{Math.abs(remainingPoints)}</strong>.
              </div>
            )}

            {remainingPoints > 0 && (
              <div className="bb-cp-warning">
                You still have <strong>{remainingPoints}</strong> unallocated points.
              </div>
            )}

            <button
              type="button"
              className="bb-button bb-button--apply bb-cp-save-btn"
              onClick={handleSave}
              disabled={isSaveDisabled}
              title={
                isSaveDisabled
                  ? "Allocate exactly all points before saving."
                  : "Save this custom profession."
              }
            >
              Save Profession
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomProfessionModal;