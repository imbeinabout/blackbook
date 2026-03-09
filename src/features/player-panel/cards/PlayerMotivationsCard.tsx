// src/features/player-panel/cards/PlayerMotivationsCard.tsx
import React from "react";
import type {
  DeltaGreenAgent,
  DeltaGreenItem,
} from "../../../models/DeltaGreenAgent";
import AddDisorderModal from "../../modals/AddDisorderModal";

interface PlayerMotivationsCardProps {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
  onRequestAddDisorder?: () => void;
}

const PlayerMotivationsCard: React.FC<PlayerMotivationsCardProps> = ({
  agent,
  updateAgent,
  onRequestAddDisorder,
}) => {
  const motivations: DeltaGreenItem[] =
    agent.items?.filter((it: any) => it.type === "motivation") ?? [];

  const motivationsForList = motivations.filter((mot) => {
    const label = (mot.system?.name ?? mot.name ?? "").trim();
    return label.length > 0;
  });

  const linkableMotivations = motivationsForList.filter((mot) => {
    const hasDisorder = (mot.system?.disorder ?? "").trim().length > 0;
    return !hasDisorder;
  });

  const hasMotivations = motivationsForList.length > 0;

  const disorders = motivations.filter(
    (mot) => (mot.system?.disorder ?? "").trim().length > 0
  );

  const [isModalOpen, setIsModalOpen] = React.useState(false);

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

  const handleToggleCrossed = (id: string, checked: boolean) => {
    updateMotivationById(id, (mot) => ({
      ...mot,
      system: {
        ...(mot.system ?? {}),
        crossedOut: checked,
      },
    }));
  };

  const handleToggleCured = (id: string, checked: boolean) => {
    updateMotivationById(id, (mot) => ({
      ...mot,
      system: {
        ...(mot.system ?? {}),
        disorderCured: checked,
      },
    }));
  };

  const openModal = React.useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleResetDisorders = () => {
    const items = (agent.items as DeltaGreenItem[]).reduce((acc, it) => {
      if (it.type !== "motivation") {
        acc.push(it);
        return acc;
      }
      const system = it.system ?? {};
      const newSystem = {
        ...system,
        disorder: "",
        disorderCured: false,
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
    }, [] as DeltaGreenItem[]);
    updateItems(items);
  };

  return (
    <>
      <div className="bb-card bb-card--mot-dis">
        <div className="bb-card__header">MOTIVATIONS & DISORDERS</div>
        <div className="bb-card__body">
          {!hasMotivations ? (
            <p>
              No motivations defined. Use the MOTIVATIONS section in the
              sidebar to add up to five.
            </p>
          ) : (
            <>
              <div className="bb-motdis-flex">
              {/* LEFT COLUMN — MOTIVATIONS */}
              <div className="bb-motdis-col">
                <h4 className="bb-motdis-subhead">Motivations</h4>
                <ol className="bb-motivations-list">
                  {motivationsForList.map(mot => (
                    <li key={mot._id} className={mot.system?.crossedOut ? "bb-motivation--crossed" : ""}>
                      <label className="bb-checkbox bb-checkbox--small">
                        <input
                          type="checkbox"
                          className="bb-checkbox__input"
                          checked={mot.system?.crossedOut ?? false}
                          onChange={(e) => {
                            handleToggleCrossed(mot._id, e.target.checked);
                            e.currentTarget.blur();
                          }}
                        />
                        <span className="bb-checkbox__box" />
                      </label>
                      <span className="bb-motivation-label">{mot.system?.name ?? mot.name}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* RIGHT COLUMN — DISORDERS */}
              <div className="bb-motdis-col">
                <h4 className="bb-motdis-subhead">Disorders</h4>
                {disorders.length === 0 ? (
                  <p className="bb-motdis-empty">No disorders recorded.</p>
                ) : (
                  <ul className="bb-disorders-list">
                    {disorders.map(mot => {
                      const cured = mot.system?.disorderCured ?? false;
                      const baseText = mot.system?.disorder ?? "";
                      const label = cured ? `${baseText} [cured]` : baseText;
                      return (
                        <li key={mot._id} className={cured ? "bb-disorder--cured" : undefined}>
                          <label className="bb-checkbox bb-checkbox--small">
                            <input
                              type="checkbox"
                              className="bb-checkbox__input"
                              checked={cured}
                              onChange={(e) => {
                                handleToggleCured(mot._id, e.target.checked);
                                e.currentTarget.blur();
                              }}
                            />
                            <span className="bb-checkbox__box" />
                          </label>
                          <span className="bb-disorder-label">{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            </>
          )}

          {/* Action buttons */}
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              gap: "0.5rem",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              className="bb-button bb-button--small"
              onClick={() => onRequestAddDisorder?.()}
            >
              Add Disorder
            </button>
            <button
              type="button"
              className="bb-button bb-button--small"
              onClick={handleResetDisorders}
              disabled={disorders.length === 0}
            >
              Reset Disorders
            </button>
          </div>
        </div>
      </div>

      
      {/* Add Disorder Modal */}
      {isModalOpen &&
        <AddDisorderModal
          isOpen={isModalOpen}
          agent={agent}
          linkableMotivations={linkableMotivations}
          onClose={closeModal}
          onApply={updateAgent}
        />
      }
    </>
  );
};

export default PlayerMotivationsCard;