// src/features/character-creation/sections/BondsSection.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";

type BondsSectionProps = {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
};

const BondsSection: React.FC<BondsSectionProps> = ({ agent, updateAgent }) => {
  const bonds = agent.items?.filter((it: any) => it.type === "bond") ?? [];

  const updateBondAtIndex = (
    index: number,
    transform: (bond: any) => any
  ) => {
    const items = [...agent.items];
    const bondIndices = items
      .map((it, idx) => (it.type === "bond" ? idx : -1))
      .filter((idx) => idx !== -1);

    const bondItemIndex = bondIndices[index];
    if (bondItemIndex === undefined) return;

    const bond = items[bondItemIndex];
    items[bondItemIndex] = transform(bond);

    updateAgent({ ...agent, items });
  };

  const handleBondNameChange = (index: number, newName: string) => {
    updateBondAtIndex(index, (bond) => ({
      ...bond,
      name: newName,
      system: {
        ...(bond.system ?? {}),
        name: newName,
        // Leave description unchanged; you can still type it separately
      },
    }));
  };

  const handleBondDescriptionChange = (index: number, newDesc: string) => {
    updateBondAtIndex(index, (bond) => ({
      ...bond,
      system: {
        ...(bond.system ?? {}),
        description: newDesc,
      },
    }));
  };

  if (bonds.length === 0) {
    return (
      <section style={{ marginTop: "1.0rem" }}>
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          Apply a profession in the PROFESSION section to generate your starting
          Bonds. Each profession sets how many Bonds you start with, and each
          Bond’s initial score equals your Charisma.
        </p>
      </section>
    );
  }

  const cha = agent.system.statistics.cha.value;

  return (
    <section className="bb-bonds-section">
      <p className="bb-bonds-description">
        Your profession gives you {bonds.length} Bond
        {bonds.length === 1 ? "" : "s"}. Each Bond’s starting score equals your
        Charisma ({cha}). Use this section to name and describe each Bond.
      </p>
      {bonds.map((bond, idx) => (
        <div
          key={bond._id ?? idx}
          className="bb-bond-area"
        >
          <label className="bb-bond-label">
            Name
            <input
              type="text"
              value={bond.system?.name ?? bond.name ?? ""}
              onChange={(e) => handleBondNameChange(idx, e.target.value)}
              className="bb-bond-input"
            />
          </label>

          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            Description / Relationship
            <textarea
              value={bond.system?.description ?? ""}
              onChange={(e) =>
                handleBondDescriptionChange(idx, e.target.value)
              }
              className="bb-bond-textarea"
              rows={2}
            />
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "0.25rem",
            }}
          >
            <span>
              <strong>Score:</strong>{" "}
              {bond.system?.score ?? cha}
            </span>
            {/* Checkbox intentionally omitted in sidebar */}
          </div>
        </div>
      ))}
    </section>
  );
};

export default BondsSection;