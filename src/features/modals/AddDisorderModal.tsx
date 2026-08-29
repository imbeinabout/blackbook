// src/features/modals/AddDisorderModal.tsx
import React from "react";
import { createPortal } from "react-dom";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../models/DeltaGreenAgent";
import { nanoid } from "nanoid";
import { addAgentEvent } from "../../lib/eventLogger";

export interface AddDisorderModalProps {
  isOpen: boolean;
  agent: DeltaGreenAgent;
  linkableMotivations: DeltaGreenItem[];
  onClose: () => void;
  onApply: (updatedAgent: DeltaGreenAgent) => void;
}

const AddDisorderModal: React.FC<AddDisorderModalProps> = ({
  isOpen,
  agent,
  linkableMotivations,
  onClose,
  onApply,
}) => {
  const [newDisorderText, setNewDisorderText] = React.useState("");
  const [selectedMotivationId, setSelectedMotivationId] = React.useState("");
  const [strikeOnAdd, setStrikeOnAdd] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setNewDisorderText("");
      setSelectedMotivationId("");
      setStrikeOnAdd(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const text = newDisorderText.trim();
    if (!text) return;

    const items = agent.items as DeltaGreenItem[];

    // Case 1: attach disorder to an existing motivation
    if (selectedMotivationId) {
      const updatedItems = items.map((it) => {
        if (it.type !== "motivation") return it;

        const baseSystem = {
          ...(it.system ?? {}),
          disorderCured: false,
        };

        if (it._id !== selectedMotivationId) {
          return { ...it, system: baseSystem };
        }

        return {
          ...it,
          system: {
            ...baseSystem,
            disorder: text,
            crossedOut: strikeOnAdd ? true : baseSystem.crossedOut,
          },
        };
      });

      const numDisorders = items.filter((it) => it.type === "motivation" && (it.system?.disorder ?? "").trim().length > 0).length;
      addAgentEvent(agent, {
        category: "disorder",
        action: "disorder-added",
        source: "manual",
        summary: `Added disorder "${text}" linked to motivation "${updatedItems.find((it) => it._id === selectedMotivationId)?.system?.name ?? ""}"`,
        before: numDisorders,
        after: numDisorders + 1,
        relatedEntity: selectedMotivationId,
        metadata: {
          disorderName: text,
          motivationId: selectedMotivationId,
          motivationName: updatedItems.find((it) => it._id === selectedMotivationId)?.system?.name ?? "",
        },
      });

      onApply({ ...agent, items: updatedItems });
      onClose();
      return;
    }

    // Case 2: disorder-only motivation
    const cleanedItems = items.map((it) =>
      it.type === "motivation"
        ? { ...it, system: { ...(it.system ?? {}), disorderCured: false } }
        : it
    );

    const disorderOnly: DeltaGreenItem = {
      type: "motivation",
      _id: nanoid(),
      name: "",
      img: "systems/deltagreen/assets/icons/swap-bag-black-bg.svg",
      system: {
        name: "",
        description: "",
        disorder: text,
        disorderCured: false,
        crossedOut: false,
      },
    };

    const numDisorders = items.filter((it) => it.type === "motivation" && (it.system?.disorder ?? "").trim().length > 0).length;
    addAgentEvent(agent, {
      category: "disorder",
      action: "disorder-added",
      source: "manual",
      summary: `Added disorder "${text}"`,
      before: numDisorders,
      after: numDisorders + 1,
      relatedEntity: disorderOnly._id,
      metadata: {
        disorderName: text,
        id: disorderOnly._id,
      },
    });

    onApply({ ...agent, items: [...cleanedItems, disorderOnly] });
    onClose();
  };

  return createPortal(
    <div className="bb-modal">
      <div className="bb-modal__dialog bb-add-disorder-dialog">
        <h3 className="bb-modal__title">Add Disorder</h3>

        <div className="bb-modal__body">
          <label style={{ fontSize: "0.8rem" }}>
            Disorder description
            <textarea
              value={newDisorderText}
              onChange={(e) => setNewDisorderText(e.target.value)}
              rows={3}
              placeholder="e.g. Paranoia, intrusive thoughts, phobia..."
              style={{ marginTop: "0.2rem" }}
            />
          </label>

          <label style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
            Related motivation (optional)
            <select
              value={selectedMotivationId}
              onChange={(e) => setSelectedMotivationId(e.target.value)}
            >
              <option value="">No related motivation</option>
              {linkableMotivations.map((mot) => (
                <option key={mot._id} value={mot._id}>
                  {mot.system?.name ?? mot.name}
                </option>
              ))}
            </select>
          </label>

          {selectedMotivationId && (
            <label className="bb-checkbox bb-checkbox--small" style={{ marginTop: "0.4rem" }}>
              <input
                type="checkbox"
                className="bb-checkbox__input"
                checked={strikeOnAdd}
                onChange={(e) => {
                  setStrikeOnAdd(e.target.checked);
                  e.currentTarget.blur();
                }}
              />
              <span className="bb-checkbox__box" />
              <span className="bb-checkbox__label">
                Strike out motivation when adding disorder
              </span>
            </label>
          )}
        </div>

        <div className="bb-modal__footer">
          <button className="bb-button bb-button--small" onClick={onClose}>
            Cancel
          </button>
          <button
            className="bb-button bb-button--small bb-button--primary"
            onClick={handleConfirm}
            disabled={!newDisorderText.trim()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddDisorderModal;