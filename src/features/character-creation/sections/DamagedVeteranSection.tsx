// src/features/character-creation/sections/DamagedVeteranSection.tsx
import React, { useEffect, useState } from "react";
import { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";

type DamagedVeteranOption =
  | "none"
  | "extreme_violence"
  | "captivity"
  | "hard_experience"
  | "things_not_meant";

type DamagedVeteranSectionProps = {
  agent: DeltaGreenAgent;
  setAgent: React.Dispatch<React.SetStateAction<DeltaGreenAgent>>;
  veteranSkillPoints: Record<string, number>;
  setVeteranSkillPoints: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  selectedTemplateId?: string | null;
  onTemplateSelected?: (id: string | null) => void;
  onRequestAddDisorder?: () => void;
  onTemplateApplied?: () => void;
  onTemplateReset?: () => void;
};

const DamagedVeteranSection: React.FC<DamagedVeteranSectionProps> = ({
  agent,
  setAgent,
  veteranSkillPoints,
  setVeteranSkillPoints,
  selectedTemplateId,
  onTemplateSelected,
  onRequestAddDisorder,
  onTemplateApplied,
  onTemplateReset,
}) => {
  const [selectedOption, setSelectedOption] = useState<DamagedVeteranOption>("none");
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [templateApplied, setTemplateApplied] = useState(false);
  const [bondToRemoveId, setBondToRemoveId] = React.useState<string | null>(
    null
  );

  const bonds = React.useMemo(
    () =>
      agent.items.filter(
        (item) => item.type === "bond"
      ) as Array<{
        _id: string;
        name: string;
        system: { score: number };
      }>,
    [agent]
  );

  useEffect(() => {
    if (!selectedTemplateId || selectedTemplateId === "none") {
      setSelectedOption("none");
    } else {
      setSelectedOption(selectedTemplateId as DamagedVeteranOption);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    if (
      selectedOption === "hard_experience" &&
      bonds.length > 0 &&
      !bondToRemoveId
    ) {
      setBondToRemoveId(bonds[0]._id);
    }
  }, [selectedOption, bonds, bondToRemoveId]);

  // Keep templateApplied in sync with veteranSkillPoints (applied state)
  useEffect(() => {
    const hasVeteran = Object.keys(veteranSkillPoints).length > 0;
    setTemplateApplied(hasVeteran);
  }, [veteranSkillPoints]);

  // List of skills from the agent, excluding Unnatural
  const skillEntries = Object.values(agent.system.skills).filter(
    (s) => s.key !== "unnatural"
  );

  // This still drives the UI & breakdown, but the *actual* skill
  // proficiencies are now also written onto the agent.
  function addVeteranPoints(
    target: DeltaGreenAgent,
    skillKey: string,
    amount: number
  ) {
    // Update the skill's proficiency on the *target* agent
    const std = target.system.skills[skillKey];
    if (std) {
      std.proficiency = (std.proficiency ?? 0) + amount;
    } else {
      const typed = target.system.typedSkills[skillKey];
      if (typed) {
        typed.proficiency = (typed.proficiency ?? 0) + amount;
      }
    }

    // Special rule: Unnatural reduces SAN max by the same amount
    if (skillKey === "unnatural") {
      const san = target.system.sanity;
      san.max = Math.max(0, san.max - amount);
    }
  }

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as DamagedVeteranOption;
    setSelectedOption(value);
    onTemplateSelected?.(value === "none" ? null : value);
  };

  const toggleHardSkill = (key: string) => {
    setHardSkills((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 4) {
        return prev; // enforce max 4
      }
      return [...prev, key];
    });
  };

  const applyTemplate = () => {
    if (templateApplied) {
      alert(
        "Damaged Veteran template has already been applied. Changing it later is not yet supported in this UI."
      );
      return;
    }
    if (selectedOption === "none") {
      return;
    }
    if (selectedOption === "hard_experience") {
      if (hardSkills.length !== 4) {
        alert(
          "For Hard Experience, select exactly four skills to receive +10%."
        );
        return;
      }
      if (bonds.length > 0 && !bondToRemoveId) {
        alert("Select which Bond to remove for Hard Experience.");
        return;
      }
    }

    const shouldTriggerDisorder = selectedOption === "things_not_meant";
    const veteranDeltas: Record<string, number> = {};

    setAgent((prev) => {

      const next = structuredClone(prev) as DeltaGreenAgent;
      const stats = next.system.statistics;
      const sanity = next.system.sanity;

      const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(max, n));

      const powValue = stats.pow.value;
      const chaValue = stats.cha.value;

      const adjustBondsBy = (delta: number) => {
        next.items = next.items.map((it) => {
          if (it.type !== "bond") return it;
          const score = (it.system?.score as number) ?? 0;
          return {
            ...it,
            system: {
              ...it.system,
              score: clamp(score + delta, 0, 99),
            },
          };
        });
      };

      switch (selectedOption) {
        case "extreme_violence": {
          // +10 Occult, -5 SAN, CHA -3, each Bond -3, Adapted to Violence
          veteranDeltas["occult"] = (veteranDeltas["occult"] ?? 0) + 10;
          addVeteranPoints(next,"occult", 10);

          sanity.value = clamp(sanity.value - 5, 0, 99);

          stats.cha.value = chaValue - 3;
          stats.cha.x5 = stats.cha.value * 5;

          adjustBondsBy(-3);
          sanity.adaptations.violence.isAdapted = true;
          break;
        }

        case "captivity": {
          // +10 Occult, -5 SAN, POW -3, Adapted to Helplessness
          veteranDeltas["occult"] = (veteranDeltas["occult"] ?? 0) + 10;
          addVeteranPoints(next,"occult", 10);

          sanity.value = clamp(sanity.value - 5, 0, 99);

          stats.pow.value = powValue - 3;
          stats.pow.x5 = stats.pow.value * 5;

          // keep WP aligned to POW at creation time
          next.system.wp.value = stats.pow.value;
          next.system.wp.max = stats.pow.value;

          sanity.adaptations.helplessness.isAdapted = true;
          break;
        }

        case "hard_experience": {
          // +10 Occult, +10 to any four skills (other than Unnatural),
          // -5 SAN, remove one chosen Bond
          veteranDeltas["occult"] = (veteranDeltas["occult"] ?? 0) + 10;
          addVeteranPoints(next, "occult", 10);

          hardSkills.forEach((key) => {
            veteranDeltas[key] = (veteranDeltas[key] ?? 0) + 10;
            addVeteranPoints(next, key, 10);
          });

          sanity.value = clamp(sanity.value - 5, 0, 99);

          if (bondToRemoveId) {
            // Find the bond object before removing it
            const removedBond = next.items.find(
              (it) => it.type === "bond" && it._id === bondToRemoveId
            );

            if (removedBond) {
              // Ensure creation meta exists and store the removed bond there
              const creation = next.system.creation ?? {
                bonusSkillPointsByKey: {},
                veteranSkillPointsByKey: {},
                selectedProfessionId: null,
                selectedBonusPackageId: null,
                damagedVeteranTemplateId: null,
                professionLockedByBonus: false,
                damagedVeteranTemplateApplied: false,
                playMode: { isPlaying: false },
              };
              creation.damagedVeteranRemovedBond = removedBond;
              next.system.creation = creation;
            }

            // Physically remove the bond from the agent
            next.items = next.items.filter(
              (it) => !(it.type === "bond" && it._id === bondToRemoveId)
            );
          }
          break;
        }

        case "things_not_meant": {
          // +10 Unnatural, +20 Occult, SAN - POW, reset BP = SAN - POW
          veteranDeltas["unnatural"] = (veteranDeltas["unnatural"] ?? 0) + 10;
          addVeteranPoints(next,"unnatural", 10);
          veteranDeltas["occult"] = (veteranDeltas["occult"] ?? 0) + 20;
          addVeteranPoints(next,"occult", 20);
          const sanLoss = powValue;
          sanity.value = clamp(sanity.value - sanLoss, 0, 99);
          sanity.currentBreakingPoint = clamp(
            sanity.value - stats.pow.value,
            0,
            99
          );
          break;
        }

        default:
          break;
      }

      return next;
    });

    // Persist veteran skill point deltas into creation meta
    if (Object.keys(veteranDeltas).length > 0) {
      setVeteranSkillPoints((prevMap) => {
        const nextMap = { ...prevMap };
        for (const [key, delta] of Object.entries(veteranDeltas)) {
          nextMap[key] = (nextMap[key] ?? 0) + delta;
        }
        return nextMap;
      });
    }

    setTemplateApplied(true);

    if (shouldTriggerDisorder && onRequestAddDisorder) {
      onRequestAddDisorder();
    }
  };

  const handleResetDamagedVeteranSection = () => {
    // 1) Undo changes on the agent itself
    setAgent((prev) => {
      const next = structuredClone(prev) as DeltaGreenAgent;
      const stats = next.system.statistics;
      const sanity = next.system.sanity;

      const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(max, n));

      // A. Undo all veteran skill bonuses for this template
      for (const [skillKey, amount] of Object.entries(veteranSkillPoints)) {
        if (amount === 0) continue;

        // Reverse veteran bump on skills
        const std = next.system.skills[skillKey];
        if (std) {
          std.proficiency = (std.proficiency ?? 0) - amount;
        } else {
          const typed = next.system.typedSkills[skillKey];
          if (typed) {
            typed.proficiency = (typed.proficiency ?? 0) - amount;
          }
        }

        // Unnatural-specific SAN max adjustment
        if (skillKey === "unnatural") {
          sanity.max = clamp(sanity.max + amount, 0, 99);
        }
      }

      // B. Template-specific undo
      switch (selectedOption) {
        case "extreme_violence": {
          // Apply inverse: remove adaptation to violence, SAN+5, CHA+3, bonds+3
          sanity.adaptations.violence.isAdapted = false;
          sanity.value = clamp(sanity.value + 5, 0, 99);

          stats.cha.value = stats.cha.value + 3;
          stats.cha.x5 = stats.cha.value * 5;

          next.items = next.items.map((it) => {
            if (it.type !== "bond") return it;
            const score = (it.system?.score as number) ?? 0;
            return {
              ...it,
              system: {
                ...it.system,
                score: clamp(score + 3, 0, 99),
              },
            };
          });
          break;
        }
        case "captivity": {
          // Inverse: remove helplessness adaptation, SAN+5, POW+3 (+WP resync)
          sanity.adaptations.helplessness.isAdapted = false;
          sanity.value = clamp(sanity.value + 5, 0, 99);

          stats.pow.value = stats.pow.value + 3;
          stats.pow.x5 = stats.pow.value * 5;
          next.system.wp.value = stats.pow.value;
          next.system.wp.max = stats.pow.value;
          break;
        }
        case "hard_experience": {
          // Inverse: SAN+5; restoring removed bond from creation meta
          sanity.value = clamp(sanity.value + 5, 0, 99);

          const creation = next.system.creation;
          const removedBond = creation?.damagedVeteranRemovedBond;

          if (removedBond) {
            next.items = [...next.items, removedBond];
            creation!.damagedVeteranRemovedBond = null;
          }

          break;
        }
        case "things_not_meant": {
          // Inverse: SAN = SAN + POW, BP = BP + POW
          const powValue = stats.pow.value;
          sanity.value = clamp(sanity.value + powValue, 0, 99);
          sanity.currentBreakingPoint = clamp(
            sanity.currentBreakingPoint + powValue,
            0,
            99
          );

          // Reset disorders and uncross motivations
          next.items = next.items.reduce((acc, it) => {
            if (it.type !== "motivation") {
              acc.push(it);
              return acc;
            }
            const system = it.system ?? {};
            const newSystem = {
              ...system,
              disorder: "",
              disorderCured: false,
              crossedOut: false,
            };
            const label = (newSystem.name ?? it.name ?? "").trim();
            if (!label) {
              return acc;
            }
            acc.push({
              ...it,
              system: newSystem,
            });
            return acc;
          }, [] as typeof next.items);

          break;
        }
        default:
          break;
      }

      return next;
    });

    // 2) Clear veteranSkillPoints from creation meta
    setVeteranSkillPoints({});

    // 3) Clear local UI state & notify parent
    setSelectedOption("none");
    setHardSkills([]);
    setBondToRemoveId(null);
    setTemplateApplied(false);
    onTemplateSelected?.(null);
  };

  return (
    <section className="bb-dv-section">
      <p className="bb-dv-p">
        If this Agent is already part of Delta Green, choose one Damaged
        Veteran option to represent the past operation that broke them. This
        will permanently adjust SAN, stats, skills, and Bonds.
      </p>

      {/* Option selection */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div className="bb-radio-grid">
          <input
            type="radio"
            name="damaged-vet"
            value="none"
            checked={selectedOption === "none"}
            onChange={handleOptionChange}
          />
          <div>No Damaged Veteran Template</div>
        </div>

        <div className="bb-radio-grid">
          <input
            type="radio"
            name="damaged-vet"
            value="extreme_violence"
            checked={selectedOption === "extreme_violence"}
            onChange={handleOptionChange}
          />
          <div>
            <div>Extreme Violence</div>
            <div className="bb-radio-desc">
              +10% Occult, SAN −5, CHA −3, each Bond −3, Adapted to Violence
            </div>
          </div>
        </div>

        <div className="bb-radio-grid">
          <input
            type="radio"
            name="damaged-vet"
            value="captivity"
            checked={selectedOption === "captivity"}
            onChange={handleOptionChange}
          />
          <div>
            <div>Captivity or Imprisonment</div>
            <div className="bb-radio-desc">
              +10% Occult, SAN −5, POW −3, Adapted to Helplessness
            </div>
          </div>
        </div>

        <div className="bb-radio-grid">
          <input
            type="radio"
            name="damaged-vet"
            value="hard_experience"
            checked={selectedOption === "hard_experience"}
            onChange={handleOptionChange}
          />
          <div>
            <div>Hard Experience</div>
            <div className="bb-radio-desc">
              +10% Occult, +10% to any four skills, SAN −5, remove one Bond
            </div>
          </div>
        </div>

        <div className="bb-radio-grid">
          <input
            type="radio"
            name="damaged-vet"
            value="things_not_meant"
            checked={selectedOption === "things_not_meant"}
            onChange={handleOptionChange}
          />
          <div>
            <div>Things Man Was Not Meant to Know</div>
            <div className="bb-radio-desc">
              +10% Unnatural, +20% Occult, SAN − POW, new Unnatural disorder,
              reset Breaking Point
            </div>
          </div>
        </div>
      </div>

      {/* Hard Experience skill & bond selection */}
      {selectedOption === "hard_experience" && (
        <div
          style={{
            border: "1px solid #3a3a3a",
            padding: "0.5rem",
            borderRadius: "4px",
            marginBottom: "0.75rem",
            boxSizing: "border-box",
          }}
        >
          <p style={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Choose exactly four skills (other than Unnatural) to receive +10%.
          </p>
          <div
            style={{
              maxHeight: "10rem",
              overflowY: "auto",
              borderTop: "1px solid #333",
              paddingTop: "0.25rem",
            }}
          >
            {skillEntries.map((s) => {
              const checked = hardSkills.includes(s.key);

              return (
                <div key={s.key} className="bb-radio-grid">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      toggleHardSkill(s.key);
                      e.currentTarget.blur();
                    }}
                    disabled={!checked && hardSkills.length >= 4}
                  />
                  <div>
                    <div>{s.label}: {s.proficiency}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="dv-section__subheading"
            style={{ marginTop: "0.5rem" }}
          >
            Choose a Bond to remove
          </div>
          {bonds.length === 0 ? (
            <p>No bonds to remove. (You may want to define bonds first.)</p>
          ) : (
            <div style={{ marginTop: "0.25rem" }}>
              {bonds.map((bond) => (
                <div key={bond._id} className="bb-radio-grid">
                  <input
                    type="radio"
                    name="hard-experience-bond"
                    value={bond._id}
                    checked={bondToRemoveId === bond._id}
                    onChange={() => setBondToRemoveId(bond._id)}
                  />
                  <div>
                    <div>{bond.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply + Reset buttons */}
      <div className="dv-button-stack">
        <button
          type="button"
          className="bb-button bb-button--apply"
          onClick={() => {
            applyTemplate();
            onTemplateApplied?.();
          }}
          disabled={selectedOption === "none" || templateApplied}
          title={
            templateApplied
              ? "Template already applied. Reset this section to change it."
              : "Apply the selected Damaged Veteran template."
          }
        >
          Apply Damaged Veteran Template
        </button>
        <button
          type="button"
          className="bb-button bb-button--small bb-button--danger"
          onClick={() => {
            handleResetDamagedVeteranSection();
            onTemplateReset?.();
          }}
          disabled={!templateApplied}
          title={
            !templateApplied
              ? "Apply a Damaged Veteran template before you can reset it."
              : "Undo the Damaged Veteran template changes for this agent."
          }
        >
          Reset Damaged Veteran Section
        </button>
      </div>

      {templateApplied && (
        <p
          style={{
            fontSize: "0.8rem",
            opacity: 0.8,
            marginTop: "0.25rem",
          }}
        >
          Template applied. Resetting this section will undo these changes for
          this Agent.
        </p>
      )}
    </section>
  );
};

export default DamagedVeteranSection;