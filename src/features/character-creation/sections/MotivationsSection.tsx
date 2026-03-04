
// src/features/character-creation/sections/MotivationsSection.tsx
import React from "react";
import type {
  DeltaGreenAgent,
  DeltaGreenItem,
} from "../../../models/DeltaGreenAgent";

type MotivationsSectionProps = {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
};

const MAX_MOTIVATIONS = 5;

const MotivationsSection: React.FC<MotivationsSectionProps> = ({
  agent,
  updateAgent,
}) => {
  const motivations =
  agent.items
    ?.filter((it: any) => {
      if (it.type !== "motivation") return false;

      const label = (it.system?.name ?? it.name ?? "").trim();
      const hasDisorder = (it.system?.disorder ?? "").trim().length > 0;

      if (!label && hasDisorder) return false;
      return true;
    }) ?? [];

  const updateItems = (newItems: DeltaGreenItem[]) => {
    updateAgent({
      ...agent,
      items: newItems,
    });
  };

  const updateMotivationById = (
    id: string,
    transform: (mot: DeltaGreenItem) => DeltaGreenItem
  ) => {
    const items = (agent.items as DeltaGreenItem[]).map((it) =>
      it.type === "motivation" && it._id === id ? transform(it) : it
    );
    updateItems(items);
  };

  const handleNameChange = (id: string, newName: string) => {
    const name = newName.trimStart();
    updateMotivationById(id, (mot) => ({
      ...mot,
      name,
      system: {
        ...(mot.system ?? {}),
        name,
        description:
          mot.system?.description ??
          (name ? `<p>${name}</p>` : "<p></p>"),
      },
    }));
  };

  const handleRemove = (id: string) => {
    const items = (agent.items as DeltaGreenItem[]).filter(
      (it) => !(it.type === "motivation" && it._id === id)
    );
    updateItems(items);
  };

  const handleAdd = () => {
    if (motivations.length >= MAX_MOTIVATIONS) return;
    const n = motivations.length + 1;
    const name = `Motivation ${n}`;
    const newMotivation: DeltaGreenItem = {
      type: "motivation",
      _id:
        (crypto as any).randomUUID?.() ??
        Math.random().toString(36).slice(2),
      name,
      img: "systems/deltagreen/assets/icons/swap-bag-black-bg.svg",
      system: {
        name,
        description: `<p>${name}</p>`,
        disorder: "",
        crossedOut: false,
        disorderCured: false,
      },
    };
    updateItems([...(agent.items as DeltaGreenItem[]), newMotivation]);
  };

  return (
    <div className="bb-identity-section">
      <p className="bb-section-help">
        As you play, your Agent can have up to five motivations that
        serve as driving factors (e.g. “Stand up for the little guy”, “Serve my
        country”, “Figure stuff out.”)
      </p>

      {motivations.length === 0 && (
        <p style={{ fontSize: "0.75rem", opacity: 0.85 }}>
          No motivations defined yet. Use the button below to add one.
        </p>
      )}

      {motivations.map((mot, idx) => (
        <div
          key={mot._id}
          className="bb-form-row"
          style={{ marginBottom: "0.3rem" }}
        >
          <label className="bb-form-label">
            <span className="bb-form-label__text">
              Motivation {idx + 1}
            </span>
            <input
              type="text"
              value={mot.system?.name ?? mot.name ?? ""}
              onChange={(e) =>
                handleNameChange(mot._id, e.target.value)
              }
              className="bb-input"
              style={{
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "#101010",
                color: "#c4f0c4",
                border: "1px solid #3a3a3a",
                padding: "0.25rem 0.5rem",
              }}
              maxLength={120}
              placeholder='e.g. "Serve my country"'
            />
          </label>
          <button
            type="button"
            className="bb-button bb-button--small"
            style={{ alignSelf: "flex-end", marginTop: "0.15rem" }}
            onClick={() => handleRemove(mot._id)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="bb-button bb-button--primary"
        style={{ marginTop: "0.5rem", width: "100%" }}
        disabled={motivations.length >= MAX_MOTIVATIONS}
        onClick={handleAdd}
      >
        {motivations.length === 0 ? "Add Motivation" : "Add Another Motivation"}
      </button>
      {motivations.length >= MAX_MOTIVATIONS && (
        <p className="bb-section-note">
          You already have the maximum of {MAX_MOTIVATIONS} motivations.
        </p>
      )}
    </div>
  );
};

export default MotivationsSection;