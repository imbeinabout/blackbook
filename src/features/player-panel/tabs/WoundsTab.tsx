// src/features/player-panel/tabs/WoundsTab.tsx
import React from "react";
import { nanoid } from "nanoid";
import { useAgentStore } from "../../../store/agentStore";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../../models/DeltaGreenAgent";

type WoundSystem = {
  firstAidApplied: boolean;
  description: string;
};

interface WoundsTabProps {
  agent: DeltaGreenAgent | null;
}

export const WoundsTab: React.FC<WoundsTabProps> = ({ agent }) => {
  const { activeAgentId } = useAgentStore();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [woundName, setWoundName] = React.useState("");
  const [woundDescription, setWoundDescription] = React.useState("");
  const [woundFirstAid, setWoundFirstAid] = React.useState<boolean>(false);

  const resetForm = React.useCallback(() => {
    setWoundName("");
    setWoundDescription("");
    setWoundFirstAid(false);
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
          <span className="bb-weapons-tab__title">WOUNDS / AILMENTS</span>
          <button type="button" className="bb-button" disabled>
            Add wound / ailment
          </button>
        </div>
        <p>No agent loaded.</p>
      </div>
    );
  }

  const woundItems: DeltaGreenItem[] = agent.items.filter(
    (it) => it.type === "wound"
  );

  const handleAddWound = () => {
    const name = woundName.trim();
    if (!name) {
      window.alert("Please enter a name for the wound/ailment.");
      return;
    }

    updateActiveAgent((copy) => {
      const newWound: DeltaGreenItem = {
        type: "wound",
        _id: nanoid(),
        name,
        img: "systems/deltagreen/assets/icons/swap-bag-black-bg.svg",
        system: {
          firstAidApplied: woundFirstAid,
          description: woundDescription,
        } as WoundSystem,
      };
      copy.items.push(newWound);
    });

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteWound = (itemId: string) => {
    updateActiveAgent((copy) => {
      copy.items = copy.items.filter(
        (it) => !(it.type === "wound" && it._id === itemId)
      );
    });
  };

  const toggleFirstAid = (itemId: string) => {
    updateActiveAgent((copy) => {
      const item = copy.items.find(
        (it) => it.type === "wound" && it._id === itemId
      );
      if (!item) return;
      const sys = (item.system as WoundSystem) ?? {
        firstAidApplied: false,
        description: "",
      };
      sys.firstAidApplied = !sys.firstAidApplied;
      item.system = sys as any;
    });
  };

  const renderWoundsTable = () => {
    if (woundItems.length === 0) {
      return (
        <p className="bb-weapons-tab__empty">
          No wounds/ailments recorded. Use <strong>Add wound / ailment</strong>{" "}
          to track injuries and conditions.
        </p>
      );
    }

    return (
      <table className="bb-weapons-table">
        <thead>
          <tr>
            <th style={{ width: "5rem" }}>First Aid?</th>
            <th>Name</th>
            <th>Description</th>
            <th style={{ width: "3rem" }} />
          </tr>
        </thead>
        <tbody>
          {woundItems.map((item) => {
            const sys = item.system as WoundSystem;
            const checked = !!sys.firstAidApplied;
            return (
              <tr key={item._id}>
                <td>
                  <label className="bb-checkbox bb-checkbox--tiny">
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={checked}
                      onChange={(e) => {
                        toggleFirstAid(item._id);
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                    <span className="bb-checkbox__label">Applied</span>
                  </label>
                </td>
                <td>{item.name}</td>
                <td>{sys.description}</td>
                <td>
                  <button
                    type="button"
                    className="bb-button bb-button--small bb-button--danger"
                    onClick={() => handleDeleteWound(item._id)}
                    title="Remove this wound/ailment"
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
        <span className="bb-weapons-tab__title">WOUNDS / AILMENTS</span>
        <button
          type="button"
          className="bb-button bb-button--primary"
          onClick={() => setIsModalOpen(true)}
        >
          Add wound / ailment
        </button>
      </div>
      <div className="bb-weapons-tab__body">{renderWoundsTable()}</div>     
        <p
        style={{
            marginTop: "0.5rem",
            fontSize: "0.75rem",
            opacity: 0.8,
        }}
        >
        If first aid has already been attempted, only Medicine, Surgery, or
        long-term rest can help further.
        </p>
      {isModalOpen && (
        <div className="bb-modal" onClick={() => setIsModalOpen(false)}>
          <div
            className="bb-modal__dialog bb-modal__dialog--small bb-weapons-custom-modal__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="bb-modal__title">Add Wound / Ailment</h2>
            <div className="bb-modal__body bb-weapons-custom-modal__body">
              <div className="bb-form-grid">
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Name</span>
                    <input
                      type="text"
                      className="bb-input"
                      value={woundName}
                      onChange={(e) => setWoundName(e.target.value)}
                    />
                  </label>
                </div>
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Description</span>
                    <textarea
                      className="bb-input"
                      rows={3}
                      value={woundDescription}
                      onChange={(e) =>
                        setWoundDescription(e.target.value)
                      }
                    />
                  </label>
                </div>
                <div className="bb-form-row">
                  <label className="bb-checkbox">
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={woundFirstAid}
                      onChange={(e) => {
                        setWoundFirstAid(e.target.checked);
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                    <span className="bb-checkbox__label">
                      First Aid already applied?
                    </span>
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
                onClick={handleAddWound}
              >
                Add wound / ailment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};