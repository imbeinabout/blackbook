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

// Helper component to add a typed skill
const TypedSkillAdder: React.FC<{
  onAdd: (type: string, subtype: string) => void;
}> = ({ onAdd }) => {
  const [type, setType] = React.useState("");
  const [subtype, setSubtype] = React.useState("");

  return (
    <div>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">-- choose type --</option>
        <option value="art">Art</option>
        <option value="craft">Craft</option>
        <option value="science">Science</option>
        <option value="foreign_language">Foreign Language</option>
        <option value="military_science">Military Science</option>
        <option value="pilot">Pilot</option>
      </select>
      <input
        style={{ marginLeft: "0.5rem" }}
        type="text"
        value={subtype}
        placeholder="Subtype (e.g. Biology)"
        onChange={(e) => setSubtype(e.target.value)}
      />
      <button
        type="button"
        disabled={!type || !subtype}
        onClick={() => {
          onAdd(type, subtype);
          setType("");
          setSubtype("");
        }}
        style={{ marginLeft: "0.5rem" }}
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
  const [name, setName] = React.useState<string>("");
  const [bondCount, setBondCount] = React.useState<number>(1);
  const [standardSkills, setStandardSkills] = React.useState<string[]>([]);
  const [typedSkills, setTypedSkills] = React.useState<TypedSkill[]>([]);
  const [skillPoints, setSkillPoints] = React.useState<Record<string, number>>(
    {}
  );

  // UI-only state (status + inline delete confirmation)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [deleteConfirmMode, setDeleteConfirmMode] =
    React.useState<boolean>(false);

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

    // Prefill the Name field from the loaded profession
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

    // Assign points for standard skills
    fixed
      .filter((fs) => !fs.typed)
      .forEach((fs) => {
        points[fs.key] = fs.proficiency;
      });

    // Assign points for typed skills
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
      // "-- none selected --"
      setSelectedName(null);
      resetBuilder();
      return;
    }

    setSelectedName(nameValue);
    const prof = customProfessions.find((p) => p.name === nameValue);
    if (prof) {
      loadProfessionIntoBuilder(prof);
    } else {
      resetBuilder();
    }
  };

  // --- Builder derived values ---
  const totalSkillLimit = [0, 500, 450, 400, 350][bondCount] ?? 0;

  const allocatedPoints =
    standardSkills.reduce((sum, key) => {
      return sum + (skillPoints[key] ?? 0);
    }, 0) +
    typedSkills.reduce((sum, ts, idx) => {
      const key = `${ts.type}_${ts.subtype}_${idx}`;
      return sum + (skillPoints[key] ?? 0);
    }, 0);

  const remainingPoints = totalSkillLimit - allocatedPoints;
  const isSaveDisabled = remainingPoints !== 0;

  // --- Builder skill operations ---
  const addStandardSkill = (skillKey: string) => {
    if (standardSkills.length + typedSkills.length >= 10) return;
    if (!standardSkills.includes(skillKey)) {
      setStandardSkills((prev) => [...prev, skillKey]);
    }
  };

  const addNewTypedSkill = (type: string, subtype: string) => {
    if (standardSkills.length + typedSkills.length >= 10) return;
    const skill: TypedSkill = { type, subtype };
    setTypedSkills((prev) => [...prev, skill]);
    // Points default to 0
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
          if (k.startsWith(prefix)) {
            delete next[k];
          }
        });
      }
      return next;
    });
  };

  // --- Save/Delete logic ---
  const handleSave = () => {
    // Build the Profession from current builder state
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
    const remainingCustom = customProfessions.filter(
      (p) => p.name !== selectedName
    );
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #444",
          padding: "1.25rem",
          width: "640px",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#eee",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.75rem",
          }}
        >
          <h3 style={{ margin: 0 }}>Manage Custom Professions</h3>
          <button type="button" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div
            style={{
              marginBottom: "0.75rem",
              color: "#a0ffa0",
              fontSize: "0.9rem",
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Saved custom professions list */}
        {customProfessions.length > 0 ? (
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Saved custom professions:{" "}
              <select
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

            {!deleteConfirmMode ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmMode(true)}
                disabled={!selectedName}
                style={{
                  marginLeft: "0.5rem",
                  background: "#440000",
                  color: "#ffdddd",
                  border: "1px solid #aa0000",
                }}
              >
                Delete Selected
              </button>
            ) : (
              <span style={{ marginLeft: "0.5rem" }}>
                Delete{" "}
                <strong>{selectedName ?? "(none selected)"}</strong>?{" "}
                <button
                  type="button"
                  onClick={performDelete}
                  style={{
                    marginLeft: "0.25rem",
                    background: "#660000",
                    color: "#ffdddd",
                    border: "1px solid #aa0000",
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmMode(false)}
                  style={{ marginLeft: "0.25rem" }}
                >
                  Cancel
                </button>
              </span>
            )}
          </div>
        ) : (
          <p style={{ marginBottom: "1rem" }}>
            No custom professions saved yet. Build one below and click{" "}
            <strong>Save Profession</strong>.
          </p>
        )}

        {/* === Integrated Builder UI === */}
        <div
          style={{ border: "1px solid #444", padding: "1rem", marginTop: "1rem" }}
        >
          <h3>Build Your Own Profession</h3>

          {/* Name */}
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Name:{" "}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginLeft: "0.5rem", width: "60%" }}
                placeholder="e.g. Flight Surgeon"
              />
            </label>
          </div>

          {/* Bond Count */}
          <div style={{ marginBottom: "1rem" }}>
            <label>Bonds: </label>
            <select
              value={bondCount}
              onChange={(e) => setBondCount(parseInt(e.target.value, 10))}
            >
              <option value={1}>1 Bond (500 points)</option>
              <option value={2}>2 Bonds (450 points)</option>
              <option value={3}>3 Bonds (400 points)</option>
              <option value={4}>4 Bonds (350 points)</option>
            </select>
          </div>

          {/* Standard Skills */}
          <h4>Choose Standard Skills (Up to 10 total between standard + typed)</h4>
          {skillList.map((skill) => {
            const key = skill.toLowerCase().replace(/ /g, "_");
            const isSelected = standardSkills.includes(key);
            const count = standardSkills.length + typedSkills.length;

            return (
              <button
                key={key}
                disabled={isSelected || count >= 10}
                onClick={() => addStandardSkill(key)}
                style={{ marginRight: "0.5rem", marginBottom: "0.5rem" }}
              >
                {isSelected ? `${skill} ✓` : skill}
              </button>
            );
          })}

          {/* Add Typed Skill */}
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <h4>Add Typed Skill</h4>
            <TypedSkillAdder onAdd={addNewTypedSkill} />
          </div>

          {/* Allocate Points */}
          <h4>Allocate Profession Skill Points</h4>

          {/* Standard skills allocation */}
          {standardSkills.map((key) => {
            const prof = skillPoints[key] ?? 0;
            const label = skillList.find(
              (s) => s.toLowerCase().replace(/ /g, "_") === key
            );

            return (
              <div key={key}>
                <span style={{ width: "200px", display: "inline-block" }}>
                  {label}:{" "}
                </span>
                <select
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
                  onClick={() => removeStandardSkill(key)}
                  style={{
                    marginLeft: "0.5rem",
                    color: "#ff6666",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  title="Remove this skill"
                >
                  ✖
                </button>
              </div>
            );
          })}

          {/* Typed skills allocation */}
          {typedSkills.map((ts, idx) => {
            const typedKey = `${ts.type}_${ts.subtype}_${idx}`;
            const points = skillPoints[typedKey] ?? 0;
            const label = `${ts.type} [${ts.subtype}]`;

            return (
              <div key={typedKey}>
                <span style={{ width: "200px", display: "inline-block" }}>
                  {label}:{" "}
                </span>
                <select
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
                  onClick={() => removeTypedSkill(idx)}
                  style={{
                    marginLeft: "0.5rem",
                    color: "#ff6666",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  title="Remove this typed skill"
                >
                  ✖
                </button>
              </div>
            );
          })}

          {/* Points summary + Save */}
          <div style={{ marginTop: "1rem" }}>
            <strong>Points Used:</strong> {allocatedPoints} / {totalSkillLimit}
          </div>
          {remainingPoints < 0 && (
            <div
              style={{
                marginTop: "0.5rem",
                color: "#ff6666",
                fontWeight: "bold",
              }}
            >
              Points allocated exceed the allowed limit by{" "}
              {Math.abs(remainingPoints)}.
            </div>
          )}

          <button
            onClick={handleSave}
            style={{ marginTop: "1rem" }}
            disabled={isSaveDisabled}
            title={
              isSaveDisabled
                ? "Allocate all profession points before saving."
                : ""
            }
          >
            Save Profession
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomProfessionModal;