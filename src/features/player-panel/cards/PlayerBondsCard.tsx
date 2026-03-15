// src/features/player-panel/cards/PlayerBondsCard.tsx
import React from "react";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../../models/DeltaGreenAgent";

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

  const updateItems = (newItems: DeltaGreenItem[]) => {
    updateAgent({
      ...agent,
      items: newItems,
    });
  };

  const updateBondById = (
    id: string,
    transform: (bond: DeltaGreenItem) => DeltaGreenItem
  ) => {
    const items = (agent.items as DeltaGreenItem[]).map((it) =>
      it.type === "bond" && it._id === id ? transform(it) : it
    );
    updateItems(items);
  };

  const handleToggleDamaged = (id: string, checked: boolean) => {
    updateBondById(id, (bond) => ({
      ...bond,
      system: {
        ...(bond.system ?? {}),
        hasBeenDamagedSinceLastHomeScene: checked,
      },
    }));
  };

  const handleAdjustScore = (id: string, delta: number) => {
    updateBondById(id, (bond) => {
      const current = bond.system?.score ?? 0;
      const next = Math.max(0, current + delta);
      return {
        ...bond,
        system: {
          ...(bond.system ?? {}),
          score: next,
        },
      };
    });
  };

  const handleRemoveBond = (id: string) => {
    const items = (agent.items as DeltaGreenItem[]).filter(
      (it) => it.type !== "bond" || it._id !== id
    );
    updateItems(items);
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
      _id:
        (crypto as any).randomUUID?.() ??
        Math.random().toString(36).slice(2),
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

    updateItems([...(agent.items as DeltaGreenItem[]), newBond]);
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