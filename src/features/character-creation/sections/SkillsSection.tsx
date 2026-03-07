// src/features/character-creation/sections/SkillsSection.tsx
import React, { useState, useEffect } from "react";
import { getSkillBreakdown } from "../../../lib/skillApplication";
import {
  DeltaGreenAgent,
  TypedSkillBlock,
  SkillBlock,
} from "../../../models/DeltaGreenAgent";
import {
  BonusSkillPackage,
  BonusSkillPackageSkill,
} from "../../../models/characterCreationTypes";
import bonusSkillPackagesRaw from "../../../data/bonusSkillPackages.json";

type SkillsSectionProps = {
  agent: DeltaGreenAgent;
  baseSkills: Record<string, SkillBlock>;
  bonusSkillPoints: Record<string, number>;
  setBonusSkillPoints: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  veteranSkillPoints: Record<string, number>;
  updateAgent: (updated: DeltaGreenAgent) => void;
  onBonusSkillsFinalized?: () => void;
  onSkillsReset?: () => void;
  
  selectedBonusPackageId?: string | null;
  onSelectedBonusPackageChange?: (id: string | null) => void;
};

const SkillsSection: React.FC<SkillsSectionProps> = ({
  agent,
  baseSkills,
  bonusSkillPoints,
  setBonusSkillPoints,
  veteranSkillPoints,
  updateAgent,
  onBonusSkillsFinalized,
  onSkillsReset,
  selectedBonusPackageId,
  onSelectedBonusPackageChange,
}) => {
  const [bonusTypedSubtypes, setBonusTypedSubtypes] = useState<
    Record<string, string>
  >({});
  const [bonusCustomType, setBonusCustomType] = useState("");
  const [bonusCustomSubtype, setBonusCustomSubtype] = useState("");
  
  const [selectedBonusPackage, setSelectedBonusPackage] = useState<string | null>(
    selectedBonusPackageId ?? null
  );

  useEffect(() => {
    setSelectedBonusPackage(selectedBonusPackageId ?? null);
  }, [selectedBonusPackageId]);

  const [bonusSkillPackages, setBonusSkillPackages] = useState<
    BonusSkillPackage[]
  >([]);

  useEffect(() => {
    setBonusSkillPackages(bonusSkillPackagesRaw as BonusSkillPackage[]);
  }, []);

  const applyBonusMapToAgent = (
    source: DeltaGreenAgent,
    oldBonus: Record<string, number>,
    newBonus: Record<string, number>,
    veteran: Record<string, number>
  ): DeltaGreenAgent => {
    const updated: DeltaGreenAgent = JSON.parse(JSON.stringify(source));

    // Standard skills
    Object.entries(updated.system.skills).forEach(([key, skill]) => {
      const finalVal = source.system.skills[key]?.proficiency ?? 0;
      const oldBonusVal = oldBonus[key] ?? 0;
      const vetVal = veteran[key] ?? 0;

      const baseline = Math.max(finalVal - oldBonusVal - vetVal, 0);
      const newBonusVal = newBonus[key] ?? 0;

      updated.system.skills[key].proficiency = baseline + newBonusVal + vetVal;
    });

    // Typed skills
    Object.entries(updated.system.typedSkills).forEach(([key, skill]) => {
      const finalVal = source.system.typedSkills[key]?.proficiency ?? 0;
      const oldBonusVal = oldBonus[key] ?? 0;
      const vetVal = veteran[key] ?? 0;

      const baseline = Math.max(finalVal - oldBonusVal - vetVal, 0);
      const newBonusVal = newBonus[key] ?? 0;

      updated.system.typedSkills[key].proficiency = baseline + newBonusVal + vetVal;
    });

    return updated;
  };

  const applySelectedBonusPackage = () => {
    if (!selectedBonusPackage) {
      const newBonus: Record<string, number> = {};
      const updated = applyBonusMapToAgent(
        agent,
        bonusSkillPoints,
        newBonus,
        veteranSkillPoints
      );
      updateAgent(updated);
      setBonusSkillPoints({});
      return;
    }

    const pkg = bonusSkillPackages.find((p) => p.name === selectedBonusPackage);
    if (!pkg) {
      const newBonus: Record<string, number> = {};
      const updated = applyBonusMapToAgent(
        agent,
        bonusSkillPoints,
        newBonus,
        veteranSkillPoints
      );
      updateAgent(updated);
      setBonusSkillPoints({});
      return;
    }

    const draft: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));
    const newBonus: Record<string, number> = {};

    pkg.skills.forEach((entry: BonusSkillPackageSkill, idx: number) => {
      const { key, typed, subtype, needsSubtype } = entry;

      if (!typed) {
        if (key === "unnatural") return;
        newBonus[key] = (newBonus[key] ?? 0) + 20;
        return;
      }

      let finalSubtype = subtype;
      if (needsSubtype) {
        const id = `${selectedBonusPackage}:${key}:${idx}`;
        finalSubtype = bonusTypedSubtypes[id] ?? "";
      }
      if (!finalSubtype) {
        return;
      }

      const typedKey = `${key}_${finalSubtype}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      if (!draft.system.typedSkills[typedKey]) {
        draft.system.typedSkills[typedKey] = {
          type: "typeSkill",
          key: typedKey,
          actorType: "agent",
          label:
            key.charAt(0).toUpperCase() +
            key.slice(1) +
            ` [${finalSubtype}]`,
          sortLabel:
            key.charAt(0).toUpperCase() +
            key.slice(1) +
            ` [${finalSubtype}]`,
          group: key.charAt(0).toUpperCase() + key.slice(1),
          proficiency: 0,
          failure: false,
        };
      }
      newBonus[typedKey] = (newBonus[typedKey] ?? 0) + 20;
    });

    const updatedWithBonuses = applyBonusMapToAgent(
      draft,
      bonusSkillPoints,
      newBonus,
      veteranSkillPoints
    );
    updateAgent(updatedWithBonuses);
    setBonusSkillPoints(newBonus);
    
    if (Object.values(newBonus).some((v) => v > 0)) {
      onBonusSkillsFinalized?.();
    }

  };

  const handleResetSkillsSection = () => {
    setSelectedBonusPackage(null);
    setBonusTypedSubtypes({});
    setBonusCustomType("");
    setBonusCustomSubtype("");

    const newBonus: Record<string, number> = {};
    const updated = applyBonusMapToAgent(
      agent,
      bonusSkillPoints,
      newBonus,
      veteranSkillPoints
    );
    updateAgent(updated);
    setBonusSkillPoints({});
  };

  const totalBonusUsed = Object.values(bonusSkillPoints).reduce(
    (sum, v) => sum + v,
    0
  );
  const bonusPicksUsed = totalBonusUsed / 20;

  return (
    <section className="bb-skills-section">
      <h3 className="bb-section-title">Skills &amp; Bonus Points</h3>
      <p className="bb-section-help">
        Allocate your 8 × 20% bonus skill points. You can use a pre-built
        background package or assign bonuses directly. No skill can start
        higher than 80%.
      </p>

      {/* Bonus Skill Point Package */}
      <h4 className="bb-subsection-title">Bonus Skill Point Package</h4>
      <div className="bb-skills-card">
        <div className="bb-form-row">
          <label className="bb-form-label">
            <span className="bb-form-label__text">Package</span>
            <select
              className="bb-select bb-select--skills-package"
              value={selectedBonusPackage ?? ""}
              onChange={(e) => {
                const name = e.target.value || null;
                setSelectedBonusPackage(name);
                setBonusSkillPoints({});
              }}
            >
              <option value="">-- Select a Package --</option>
              {bonusSkillPackages.map((pkg) => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Subtype inputs for typed skills that need subtypes */}
        {selectedBonusPackage && (
          <div className="bb-skills-subpanel">
            {bonusSkillPackages
              .find((p) => p.name === selectedBonusPackage)
              ?.skills.map((entry, idx) => {
                if (!entry.typed || !entry.needsSubtype) return null;
                const id = `${selectedBonusPackage}:${entry.key}:${idx}`;
                return (
                  <div
                    key={id}
                    className="bb-form-row bb-form-row--inline"
                  >
                    <span className="bb-form-label__text">
                      {entry.key.replace("_", " ").toUpperCase()} subtype
                    </span>
                    <input
                      className="bb-input bb-input--subtype"
                      type="text"
                      value={bonusTypedSubtypes[id] ?? ""}
                      onChange={(e) =>
                        setBonusTypedSubtypes((prev) => ({
                          ...prev,
                          [id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
            <button
              type="button"
              className="bb-button bb-button--primary bb-skills-apply-btn"
              onClick={applySelectedBonusPackage}
            >
              Apply Bonus Package
            </button>
          </div>
        )}
      </div>

      {/* Custom typed bonus skill mini-form */}
      <div className="bb-skills-card bb-skills-card--inline">
        <h4 className="bb-subsection-title">
          Add Custom Typed Bonus Skill
        </h4>
        <div className="bb-form-row bb-form-row--inline">
          <span className="bb-form-label__text">Skill Type</span>
          <select
            className="bb-select bb-select--skills-package"
            value={bonusCustomType}
            onChange={(e) => setBonusCustomType(e.target.value)}
          >
            <option value="">-- select --</option>
            <option value="art">Art</option>
            <option value="craft">Craft</option>
            <option value="science">Science</option>
            <option value="foreign_language">Foreign Language</option>
            <option value="military_science">Military Science</option>
            <option value="pilot">Pilot</option>
          </select>
        </div>
        <div className="bb-form-row bb-form-row--inline">
          <span className="bb-form-label__text">Subtype</span>
          <input
            className="bb-input"
            type="text"
            value={bonusCustomSubtype}
            onChange={(e) => setBonusCustomSubtype(e.target.value)}
            placeholder="e.g. Botany, French, Rotorcraft"
          />
        </div>
        <button
          type="button"
          className="bb-button bb-button--primary bb-skills-add-btn"
          onClick={() => {
            if (!bonusCustomType || !bonusCustomSubtype.trim()) return;
            const type = bonusCustomType;
            const subtype = bonusCustomSubtype.trim();
            const typedKey = `${type}_${subtype}`
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "");

            const draft: DeltaGreenAgent = JSON.parse(
              JSON.stringify(agent)
            );
            if (!draft.system.typedSkills[typedKey]) {
              draft.system.typedSkills[typedKey] = {
                type: "typeSkill",
                key: typedKey,
                actorType: "agent",
                label:
                  type.charAt(0).toUpperCase() +
                  type.slice(1).replace("_", " ") +
                  ` [${subtype}]`,
                sortLabel:
                  type.charAt(0).toUpperCase() +
                  type.slice(1).replace("_", " ") +
                  ` [${subtype}]`,
                group:
                  type.charAt(0).toUpperCase() + type.slice(1),
                proficiency: 0,
                failure: false,
              };
            }

            const newBonus = {
              ...bonusSkillPoints,
              [typedKey]: (bonusSkillPoints[typedKey] ?? 0) + 20,
            };

            const updatedWithBonuses = applyBonusMapToAgent(
              draft,
              bonusSkillPoints,
              newBonus,
              veteranSkillPoints
            );
            updateAgent(updatedWithBonuses);
            setBonusSkillPoints(newBonus);
            onBonusSkillsFinalized?.();
            setBonusCustomType("");
            setBonusCustomSubtype("");
          }}
        >
          Add Typed Bonus Skill
        </button>
      </div>

      <h4 className="bb-subsection-title">
        Allocate Bonus Skill Points (8 × 20%)
      </h4>
      <div className="bb-skills-allocation">
        {/* Standard skills (except Unnatural) */}
        {Object.entries(agent.system.skills)
          .filter(([key]) => key !== "unnatural")
          .sort((a, b) => a[1].label.localeCompare(b[1].label))
          .map(([key, skill]) => {
            const { total, bonus } = getSkillBreakdown(
              key,
              /* isTyped */ false,
              agent,
              baseSkills,
              bonusSkillPoints,
              veteranSkillPoints
            );
            const canAddBonus =
              total + 20 <= 80 && bonusPicksUsed < 8;
            return (
              <div key={key} className="bb-skill-alloc-row">
                <span className="bb-skill-alloc-label">
                  {skill.label}
                </span>
                <div className="bb-skill-alloc-controls">
                  <button
                    type="button"
                    className="bb-skill-alloc-button"
                    disabled={bonus <= 0}
                    onClick={() => {
                      const newBonus = {
                        ...bonusSkillPoints,
                        [key]: Math.max(
                          (bonusSkillPoints[key] ?? 0) - 20,
                          0
                        ),
                      };
                      const updated = applyBonusMapToAgent(
                        agent,
                        bonusSkillPoints,
                        newBonus,
                        veteranSkillPoints
                      );
                      updateAgent(updated);
                      setBonusSkillPoints(newBonus);
                    }}
                  >
                    -
                  </button>
                  <span className="bb-skill-alloc-value">
                    {total}%
                  </span>
                  <button
                    type="button"
                    className="bb-skill-alloc-button"
                    disabled={!canAddBonus}
                    onClick={() => {
                      const newBonus = {
                        ...bonusSkillPoints,
                        [key]: (bonusSkillPoints[key] ?? 0) + 20,
                      };
                      const updated = applyBonusMapToAgent(
                        agent,
                        bonusSkillPoints,
                        newBonus,
                        veteranSkillPoints
                      );
                      updateAgent(updated);
                      setBonusSkillPoints(newBonus);
                      onBonusSkillsFinalized?.();
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}

        {/* Typed skills */}
        {Object.entries(agent.system.typedSkills)
          .sort((a, b) => a[1].label.localeCompare(b[1].label))
          .map(([key, skill]) => {
            const { total, bonus } = getSkillBreakdown(
              key,
              /* isTyped */ true,
              agent,
              baseSkills,
              bonusSkillPoints,
              veteranSkillPoints
            );
            const canAddBonus =
              total + 20 <= 80 && bonusPicksUsed < 8;
            return (
              <div
                key={key}
                className="bb-skill-alloc-row bb-skill-alloc-row--typed"
              >
                {/* Full label on its own line */}
                <div className="bb-skill-alloc-label-full">
                  {skill.label}
                </div>
                {/* Controls on the line below */}
                <div className="bb-skill-alloc-controls">
                  <button
                    type="button"
                    className="bb-skill-alloc-button"
                    disabled={bonus <= 0}
                    onClick={() => {
                      const newBonus = {
                        ...bonusSkillPoints,
                        [key]: Math.max(
                          (bonusSkillPoints[key] ?? 0) - 20,
                          0
                        ),
                      };
                      const updated = applyBonusMapToAgent(
                        agent,
                        bonusSkillPoints,
                        newBonus,
                        veteranSkillPoints
                      );
                      updateAgent(updated);
                      setBonusSkillPoints(newBonus);
                    }}
                  >
                    -
                  </button>
                  <span className="bb-skill-alloc-value">
                    {total}%
                  </span>
                  <button
                    type="button"
                    className="bb-skill-alloc-button"
                    disabled={!canAddBonus}
                    onClick={() => {
                      const newBonus = {
                        ...bonusSkillPoints,
                        [key]: (bonusSkillPoints[key] ?? 0) + 20,
                      };
                      const updated = applyBonusMapToAgent(
                        agent,
                        bonusSkillPoints,
                        newBonus,
                        veteranSkillPoints
                      );
                      updateAgent(updated);
                      setBonusSkillPoints(newBonus);
                      onBonusSkillsFinalized?.();
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        Bonus Picks Used: {bonusPicksUsed} / 8
      </div>

      {/* Reset button now lives at the bottom of the Skills section */}
      <div className="bb-sidebar-center" style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="bb-button bb-button--small bb-button--danger"
          onClick={() => {
            handleResetSkillsSection();
            onSkillsReset?.();
          }}
        >
          Reset Skills Section
        </button>
      </div>
    </section>
    );
};

export default SkillsSection;