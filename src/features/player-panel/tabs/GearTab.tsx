// src/features/player-panel/tabs/GearTab.tsx
import React from "react";
import { nanoid } from "nanoid";
import { useAgentStore } from "../../../store/agentStore";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../../models/DeltaGreenAgent";
import NumberSpinner from "../../../components/ui/NumberSpinner";

type GearSystem = {
  quantity: number;
  description: string;
};

interface GearTabProps {
  agent: DeltaGreenAgent | null;
}

export const GearTab: React.FC<GearTabProps> = ({ agent }) => {
  const { activeAgentId } = useAgentStore();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [gearName, setGearName] = React.useState("");
  const [gearDescription, setGearDescription] = React.useState("");
  const [gearQty, setGearQty] = React.useState<number>(1);

  const resetForm = React.useCallback(() => {
    setGearName("");
    setGearDescription("");
    setGearQty(1);
  }, []);

  const updateActiveAgent = React.useCallback(
    (mutate: (copy: DeltaGreenAgent) => void) => {
      if (!activeAgentId) return;
      const { agents, updateAgent } = useAgentStore.getState();
      const current = agents[activeAgentId];
      if (!current) return;
      const copy: DeltaGreenAgent = JSON.parse(JSON.stringify(current));
      mutate(copy);
      updateAgent(activeAgentId, copy);
    },
    [activeAgentId]
  );

  if (!agent) {
    return (
      <div className="bb-weapons-tab">
        <div className="bb-weapons-tab__header">
          <span className="bb-weapons-tab__title">GEAR</span>
          <button type="button" className="bb-button" disabled>
            Add gear
          </button>
        </div>
        <p>No agent loaded.</p>
      </div>
    );
  }

  const gearItems: DeltaGreenItem[] = agent.items.filter(
    (it) => it.type === "gear"
  );

  const handleAddGear = () => {
    const name = gearName.trim();
    if (!name) {
      window.alert("Please enter an item name.");
      return;
    }
    const qty = Math.max(0, gearQty);

    updateActiveAgent((copy) => {
      const newGear: DeltaGreenItem = {
        type: "gear",
        _id: nanoid(),
        name,
        img: "systems/deltagreen/assets/icons/swap-bag-black-bg.svg",
        system: {
          quantity: qty,
          description: gearDescription,
        } as GearSystem,
      };
      copy.items.push(newGear);
    });

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteGear = (itemId: string) => {
    updateActiveAgent((copy) => {
      copy.items = copy.items.filter(
        (it) => !(it.type === "gear" && it._id === itemId)
      );
    });
  };

  const adjustQuantity = (itemId: string, delta: number) => {
    updateActiveAgent((copy) => {
      const item = copy.items.find(
        (it) => it.type === "gear" && it._id === itemId
      );
      if (!item) return;
      const sys = (item.system as GearSystem) ?? {
        quantity: 0,
        description: "",
      };
      const next = Math.max(0, (sys.quantity ?? 0) + delta);
      sys.quantity = next;
      item.system = sys as any;
    });
  };

  const renderGearTable = () => {
    if (gearItems.length === 0) {
      return (
        <p className="bb-weapons-tab__empty">
          No gear assigned. Use <strong>Add gear</strong> to add items.
        </p>
      );
    }

    return (
      <table className="bb-weapons-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style={{ width: "8rem" }}>Quantity</th>
            <th>Description</th>
            <th style={{ width: "3rem" }} />
          </tr>
        </thead>
        <tbody>
          {gearItems.map((item) => {
            const sys = item.system as GearSystem;
            const qty = sys.quantity ?? 0;
            return (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>
                  <div className="bb-gear-qty">
                    <button
                      type="button"
                      className="bb-button bb-button--small"
                      onClick={() => adjustQuantity(item._id, -1)}
                    >
                      -
                    </button>
                    <span className="bb-gear-qty__value">{qty}</span>
                    <button
                      type="button"
                      className="bb-button bb-button--small"
                      onClick={() => adjustQuantity(item._id, +1)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{sys.description}</td>
                <td>
                  <button
                    type="button"
                    className="bb-button bb-button--small bb-button--danger"
                    onClick={() => handleDeleteGear(item._id)}
                    title="Remove this gear item"
                  >
                    ✖
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="bb-weapons-tab">
      <div className="bb-weapons-tab__header">
        <span className="bb-weapons-tab__title">GEAR</span>
        <button
          type="button"
          className="bb-button bb-button--primary"
          onClick={() => setIsModalOpen(true)}
        >
          Add gear
        </button>
      </div>
      <div className="bb-weapons-tab__body">{renderGearTable()}</div>

      {isModalOpen && (
        <div className="bb-modal" onClick={() => setIsModalOpen(false)}>
          <div
            className="bb-modal__dialog bb-modal__dialog--small bb-weapons-custom-modal__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="bb-modal__title">Add Gear</h2>
            <div className="bb-modal__body bb-weapons-custom-modal__body">
              <div className="bb-form-grid">
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Item</span>
                    <input
                      type="text"
                      className="bb-input"
                      value={gearName}
                      onChange={(e) => setGearName(e.target.value)}
                    />
                  </label>
                </div>
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Quantity</span>
                    <NumberSpinner
                      value={String(gearQty)}
                      onChange={(val) =>
                        setGearQty(Math.max(0, Number(val) || 0))
                      }
                      min={0}
                    />
                  </label>
                </div>
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Description</span>
                    <textarea
                      className="bb-input"
                      rows={3}
                      value={gearDescription}
                      onChange={(e) => setGearDescription(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bb-button bb-button--primary"
                onClick={handleAddGear}
              >
                Add gear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};