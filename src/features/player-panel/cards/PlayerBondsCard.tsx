// src/features/player-panel/cards/PlayerBondsCard.tsx
import React from "react";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../../models/DeltaGreenAgent";
import { addAgentEvent } from "../../../lib/eventLogger";
import { nanoid } from "nanoid";

interface PlayerBondsCardProps {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
}

const PlayerBondsCard: React.FC<PlayerBondsCardProps> = ({
  agent,
  updateAgent,
}) => {
  const bonds: DeltaGreenItem[] =
    agent.items?.filter((it: any) => it.type === "bond") ?? [];

  const [isAdding, setIsAdding] = React.useState(false);
  const [newBondName, setNewBondName] = React.useState("");
  const [newBondDesc, setNewBondDesc] = React.useState("");

  const handleToggleDamaged = (
    id: string,
    checked: boolean
  ) => {
    const updated =
      JSON.parse(JSON.stringify(agent)) as DeltaGreenAgent;

    const bond = updated.items.find(
      (it) => it.type === "bond" && it._id === id
    );

    if (!bond) return;

    const before =
      bond.system?.hasBeenDamagedSinceLastHomeScene ?? false;

    bond.system = {
      ...(bond.system ?? {}),
      hasBeenDamagedSinceLastHomeScene: checked,
    };

    addAgentEvent(updated, {
      category: "bond",
      action: "bond-damage-flag",
      source: "manual",
      summary: checked
        ? `Marked bond ${bond.name} as damaged`
        : `Cleared damaged status for bond ${bond.name}`,
      relatedEntity: id,
      before: before ? "damaged" : "cleared",
      after: checked ? "damaged" : "cleared",
      metadata: {
        id,
        bondName: bond.name,
        score: bond.system?.score,
        hasBeenDamagedSinceLastHomeScene: checked,
      },
    });

    updateAgent(updated);
  };

  const handleAdjustScore = (
    id: string,
    delta: number
  ) => {
    const updated =
      JSON.parse(JSON.stringify(agent)) as DeltaGreenAgent;

    const bond = updated.items.find(
      (it) => it.type === "bond" && it._id === id
    );

    if (!bond) return;

    const current = bond.system?.score ?? 0;
    const next = Math.max(0, current + delta);

    bond.system = {
      ...(bond.system ?? {}),
      score: next,
    };

    addAgentEvent(updated, {
      category: "bond",
      action: "bond-change",
      source: "manual",
      summary:
        delta > 0
          ? `Increased bond ${bond.name} score by ${delta}`
          : `Damaged bond ${bond.name} score by ${Math.abs(delta)}`,
      relatedEntity: bond._id,
      before: current,
      after: next,
      metadata: {
        bondName: bond.name,
        delta,
      },
    });

    updateAgent(updated);
  };

  const handleRemoveBond = (id: string) => {
    const updated =
      JSON.parse(JSON.stringify(agent)) as DeltaGreenAgent;

    const bond = updated.items.find(
      (it) => it.type === "bond" && it._id === id
    );

    if (!bond) return;

    addAgentEvent(updated, {
      category: "bond",
      action: "bond-removed",
      source: "manual",
      summary: `Removed bond ${bond.name}`,
      relatedEntity: id,
      before: `Number of bonds: ${bonds.length}`,
      after: `Number of bonds: ${bonds.length - 1}`,
      metadata: {
        id,
        bondName: bond.name,
        score: bond.system?.score,
      },
    });

    updated.items = updated.items.filter(
      (it) => it.type !== "bond" || it._id !== id
    );

    updateAgent(updated);
  };

  const startAddBond = () => {
    const defaultLabel = `Bond ${bonds.length + 1}`;
    setIsAdding(true);
    setNewBondName(defaultLabel);
    setNewBondDesc("");
  };

  const cancelAddBond = () => {
    setIsAdding(false);
    setNewBondName("");
    setNewBondDesc("");
  };

  const confirmAddBond = () => {
    const name = newBondName.trim() || `Bond ${bonds.length + 1}`;
    const desc = newBondDesc.trim();
    const cha = agent.system.statistics.cha.value;

    const newBond: DeltaGreenItem = {
      type: "bond",
      _id: nanoid(),
      name,
      img: "systems/deltagreen/assets/icons/person-black-bg.svg",
      system: {
        name,
        description: desc,
        score: cha,
        relationship: "",
        hasBeenDamagedSinceLastHomeScene: false,
      },
    };

    const updated =
      JSON.parse(JSON.stringify(agent)) as DeltaGreenAgent;

    updated.items.push(newBond);

    addAgentEvent(updated, {
      category: "bond",
      action: "bond-created",
      source: "manual",
      summary: `Created bond ${name} at score ${cha}`,
      relatedEntity: newBond._id,
      before: `Number of bonds: ${bonds.length}`,
      after: `Number of bonds: ${bonds.length + 1}`,
      metadata: {
        bondName: name,
        score: cha,
        description: desc,
      },
    });

    updateAgent(updated);
    setIsAdding(false);
    setNewBondName("");
    setNewBondDesc("");
  };

  return (
    <div className="bb-card bb-card--bonds">
      <div className="bb-card__header">BONDS</div>
      <div className="bb-card__body">
        {bonds.length === 0 ? (
          <p>No bonds defined.</p>
        ) : (
          <table className="bb-bonds-table">
            <tbody>
              {bonds.map((bond) => (
                <tr className="bb-bonds-table__row" key={bond._id}>
                  <td>
                    <label className="bb-checkbox bb-checkbox--small">
                      <input
                        type="checkbox"
                        className="bb-checkbox__input"
                        checked={bond.system?.hasBeenDamagedSinceLastHomeScene ?? false}
                        onChange={(e) => {
                          handleToggleDamaged(bond._id, e.target.checked);
                          e.currentTarget.blur();
                        }}
                      />
                      <span className="bb-checkbox__box" />
                    </label>
                  </td>

                  <td>
                    <div className="bb-bond-name">
                      {bond.system?.name ?? bond.name}
                    </div>
                    {bond.system?.description && (
                      <div className="bb-bond-desc">
                        {bond.system.description}
                      </div>
                    )}
                  </td>

                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="bb-gear-qty">
                      <button
                        type="button"
                        className="bb-button bb-button--small"
                        style = {{ marginRight: "0.25rem" }}
                        onClick={() => handleAdjustScore(bond._id, -1)}
                      >
                        -
                      </button>
                      <span className="bb-gear-qty__value">
                        {bond.system?.score ?? 0}
                      </span>
                      <button
                        type="button"
                        className="bb-button bb-button--small"
                        style = {{ marginLeft: "0.25rem" }}
                        onClick={() => handleAdjustScore(bond._id, +1)}
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleRemoveBond(bond._id)}
                      className="bb-button bb-button--small bb-button--danger"
                      title="Remove this bond"
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isAdding ? (
          <div style={{ 
            marginTop: "0.5rem",
            display: "flex", 
            justifyContent: "center" 
            }}>
          <button
            type="button"
            onClick={startAddBond}
            className="bb-button"
          >
            Add Bond
          </button>
          </div>
        ) : (
          <div className="bb-bond-add-form">
            <div style={{ marginBottom: "0.25rem" }}>
              <label>
                Name{" "}
                <input
                  type="text"
                  className="bb-bond-input"
                  value={newBondName}
                  onChange={(e) => setNewBondName(e.target.value)}
                  autoFocus
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.25rem" }}>
              <label>
                Description / Relationship{" "}
                <textarea
                  className="bb-bond-textarea"
                  value={newBondDesc}
                  onChange={(e) => setNewBondDesc(e.target.value)}
                  rows={3}
                  placeholder="Spouse, child, partner, mentor, etc."
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                    type="button"
                    className="bb-button bb-button--small"
                    onClick={confirmAddBond}
                >
                    Confirm Bond
                </button>
                <button
                    type="button"
                    className="bb-button bb-button--small"
                    onClick={cancelAddBond}
                >
                    Cancel
                </button>
                </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerBondsCard;