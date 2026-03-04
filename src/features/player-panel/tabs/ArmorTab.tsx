// src/features/player-panel/tabs/ArmorTab.tsx
import React from "react";
import { nanoid } from "nanoid";
import { useAgentStore } from "../../../store/agentStore";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../../models/DeltaGreenAgent";
import armorDataJson from "../../../data/armor.json";
import NumberSpinner from "../../../components/ui/NumberSpinner";

type ArmorTemplate = {
  name: string;
  description: string;
  protection: "head" | "body" | "both" | string;
  armor_rating: number;
  expense: string;
  equipped: boolean;
};

type ArmorSystem = ArmorTemplate;

const armorData = armorDataJson as ArmorTemplate[];

interface ArmorTabProps {
  agent: DeltaGreenAgent | null;
}

export const ArmorTab: React.FC<ArmorTabProps> = ({ agent }) => {
  const { activeAgentId } = useAgentStore();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = React.useState(0);

  // Filter by protection (head/body/both)
  const [filterProtection, setFilterProtection] = React.useState<string>("");

  // Custom templates persisted in localStorage
  const CUSTOM_ARMOR_KEY = "dg-custom-armor";
  const [customTemplates, setCustomTemplates] = React.useState<ArmorTemplate[]>(
    () => {
      if (typeof window === "undefined") return [];
      try {
        const raw = window.localStorage.getItem(CUSTOM_ARMOR_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ArmorTemplate[]) : [];
      } catch {
        return [];
      }
    }
  );

  const allArmor = React.useMemo(
    () => [...armorData, ...customTemplates],
    [customTemplates]
  );

  const protectionOptions = React.useMemo(
    () =>
      Array.from(new Set(allArmor.map((a) => a.protection)))
        .filter((p) => p && String(p).trim())
        .sort((a, b) => String(a).localeCompare(String(b))),
    [allArmor]
  );

  const expenseOptions = React.useMemo(
    () =>
      Array.from(
        new Set(allArmor.map((a) => a.expense).filter((e) => e && e.trim()))
      ).sort((a, b) => a.localeCompare(b)),
    [allArmor]
  );

  const filteredArmor = React.useMemo(
    () =>
      filterProtection
        ? allArmor.filter((a) => a.protection === filterProtection)
        : allArmor,
    [filterProtection, allArmor]
  );

  const safeSelectedIndex =
    filteredArmor.length === 0
      ? 0
      : Math.min(selectedTemplateIndex, filteredArmor.length - 1);
  const selectedTemplate =
    filteredArmor[safeSelectedIndex] ?? filteredArmor[0] ?? undefined;

  const [isCustomModalOpen, setIsCustomModalOpen] = React.useState(false);
  const [customName, setCustomName] = React.useState("");
  const [customDescription, setCustomDescription] = React.useState("");
  const [customProtection, setCustomProtection] =
    React.useState<string>("head");
  const [customArmorRating, setCustomArmorRating] = React.useState<number>(1);
  const [customExpense, setCustomExpense] = React.useState<string>("standard");

  const resetCustomArmorForm = React.useCallback(() => {
    setCustomName("");
    setCustomDescription("");
    setCustomProtection("head");
    setCustomArmorRating(1);
    setCustomExpense(expenseOptions[0] ?? "standard");
  }, [expenseOptions]);

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
          <span className="bb-weapons-tab__title">ARMOR</span>
          <button type="button" className="bb-button" disabled>
            Add armor
          </button>
        </div>
        <p>No agent loaded.</p>
      </div>
    );
  }

  const armorItems: DeltaGreenItem[] = agent.items.filter(
    (it) => it.type === "armor"
  );

  const handleToggleEquipped = (itemId: string) => {
    updateActiveAgent((copy) => {
      const item = copy.items.find((it) => it._id === itemId);
      if (!item) return;
      const sys = item.system as ArmorSystem;
      sys.equipped = !sys.equipped;
    });
  };

  const handleDeleteArmor = (itemId: string) => {
    updateActiveAgent((copy) => {
      copy.items = copy.items.filter(
        (it) => !(it.type === "armor" && it._id === itemId)
      );
    });
  };

  const handleAddFromTemplate = () => {
    const tmpl = selectedTemplate;
    if (!tmpl) return;
    updateActiveAgent((copy) => {
      const newArmor: DeltaGreenItem = {
        type: "armor",
        _id: nanoid(),
        name: tmpl.name,
        img: "systems/deltagreen/assets/icons/swap-bag-black-bg.svg",
        system: {
          ...tmpl,
        } as ArmorSystem,
      };
      copy.items.push(newArmor);
    });
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setFilterProtection(""); 
    setSelectedTemplateIndex(0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const formatProtection = (p: string) => {
    switch (p) {
      case "head":
        return "Head";
      case "body":
        return "Body";
      case "both":
        return "Head & Body";
      default:
        return p;
    }
  };

  const handleSaveCustomArmor = () => {
    const name = customName.trim();
    if (!name) {
      window.alert("Please enter a name for the custom armor.");
      return;
    }

    const tmpl: ArmorTemplate = {
      name,
      description: customDescription,
      protection: customProtection,
      armor_rating: customArmorRating,
      expense: customExpense || "standard",
      equipped: true,
    };

    setCustomTemplates((prev) => {
      const next = [...prev, tmpl];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CUSTOM_ARMOR_KEY, JSON.stringify(next));
      }
      return next;
    });

    setIsCustomModalOpen(false);
    if (tmpl.protection) {
      setFilterProtection(tmpl.protection);
      setSelectedTemplateIndex(0);
    }
  };

  const renderArmorTable = () => {
    if (armorItems.length === 0) {
      return (
        <p className="bb-weapons-tab__empty">
          No armor assigned. Use <strong>Add armor</strong> to equip this agent.
        </p>
      );
    }

    return (
      <table className="bb-weapons-table">
        <thead>
          <tr>
            <th style={{ width: "2rem" }}>Eq.</th>
            <th>Name</th>
            <th>Protection</th>
            <th>Armor Rating</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {armorItems.map((item) => {
            const sys = item.system as ArmorSystem;
            const isEquipped = !!sys.equipped;

            return (
                <tr
                key={item._id}
                className={
                    "bb-weapons-table__row" +
                    (isEquipped ? " bb-weapons-table__row--equipped" : "")
                }
                title={sys.description} // NEW: row tooltip shows armor description
                >
                <td>
                    <label className="bb-checkbox bb-checkbox--tiny">
                    <input
                        type="checkbox"
                        className="bb-checkbox__input"
                        checked={isEquipped}
                        onChange={() => handleToggleEquipped(item._id)}
                    />
                    <span className="bb-checkbox__box" />
                    </label>
                </td>
                <td>{item.name}</td>
                <td>{formatProtection(sys.protection)}</td>
                <td>{sys.armor_rating}</td>
                <td>
                    <button
                    type="button"
                    className="bb-button bb-button--small bb-button--danger"
                    onClick={() => handleDeleteArmor(item._id)}
                    title="Remove this armor"
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
        <span className="bb-weapons-tab__title">ARMOR</span>
        <button
          type="button"
          className="bb-button bb-button--primary"
          onClick={handleOpenModal}
        >
          Add armor
        </button>
      </div>
      <div className="bb-weapons-tab__body">{renderArmorTable()}</div>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.75rem",
            opacity: 0.8,
          }}
        >
          Body armor reduces the damage of all attacks except Called Shots and successful Lethality rolls.
        </p>
      {/* Add armor modal */}
      {isModalOpen && (
        <div className="bb-modal" onClick={handleCloseModal}>
          <div
            className="bb-modal__dialog bb-load-modal__dialog bb-weapons-modal__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bb-modal__header bb-weapons-modal__header">
              <h2 className="bb-modal__title">Add Armor</h2>
              <div className="bb-weapons-modal__filter">
                <label>
                  Protection:
                  <select
                    className="bb-select"
                    value={filterProtection}
                    onChange={(e) => {
                      setFilterProtection(e.target.value);
                      setSelectedTemplateIndex(0);
                    }}
                  >
                    <option value="">All</option>
                    {protectionOptions.map((p) => (
                      <option key={p} value={p}>
                        {formatProtection(p)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="bb-modal__body bb-weapons-modal__body">
              {/* LEFT: list of armor templates */}
              <div className="bb-weapons-modal__list">
                <div className="bb-weapons-modal__list-header">
                  <button
                    type="button"
                    className="bb-button bb-button--small"
                    onClick={() => {
                      resetCustomArmorForm();
                      setIsCustomModalOpen(true);
                    }}
                  >
                    Build custom armor…
                  </button>
                </div>
                <ul className="bb-weapons-modal__list-items">
                  {filteredArmor.map((a, idx) => {
                    const isSelected = idx === safeSelectedIndex;
                    return (
                      <li
                        key={`${a.name}-${idx}`}
                        className={
                          "bb-weapons-modal__list-item" +
                          (isSelected
                            ? " bb-weapons-modal__list-item--selected"
                            : "")
                        }
                      >
                        <button
                          type="button"
                          className="bb-weapons-modal__list-button"
                          onClick={() => setSelectedTemplateIndex(idx)}
                        >
                          <span className="bb-weapons-modal__list-name">
                            {a.name}
                          </span>
                          <span className="bb-weapons-modal__list-meta">
                            {formatProtection(a.protection)}
                            {a.armor_rating
                              ? ` • AR ${a.armor_rating}`
                              : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {filteredArmor.length === 0 && (
                    <li className="bb-weapons-modal__list-item">
                      <span className="bb-weapons-modal__empty">
                        No armor matches this protection.
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* RIGHT: details for selected armor */}
              <div className="bb-weapons-modal__details">
                {selectedTemplate ? (
                  <>
                    <h3 className="bb-weapons-modal__weapon-name">
                      {selectedTemplate.name}
                    </h3>
                    <p className="bb-weapons-modal__weapon-desc">
                      {selectedTemplate.description}
                    </p>
                    <div className="bb-weapons-modal__details-grid">
                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Protection
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {formatProtection(selectedTemplate.protection)}
                        </div>
                      </div>
                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Armor Rating
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {selectedTemplate.armor_rating}
                        </div>
                      </div>
                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Expense
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {selectedTemplate.expense || "—"}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No armor selected.</p>
                )}
              </div>
            </div>

            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bb-button bb-button--primary"
                onClick={handleAddFromTemplate}
                disabled={!selectedTemplate}
              >
                Add armor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom armor modal */}
      {isCustomModalOpen && (
        <div className="bb-modal" onClick={() => setIsCustomModalOpen(false)}>
          <div
            className="bb-modal__dialog bb-modal__dialog--small bb-weapons-custom-modal__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="bb-modal__title">Build Custom Armor</h2>
            <div className="bb-modal__body bb-weapons-custom-modal__body">
              <div className="bb-form-grid">
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Name</span>
                    <input
                      type="text"
                      className="bb-input"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </label>
                </div>
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Description</span>
                    <textarea
                      className="bb-input"
                      rows={3}
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="bb-form-grid">
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Protection</span>
                    <select
                      className="bb-select"
                      value={customProtection}
                      onChange={(e) => setCustomProtection(e.target.value)}
                    >
                      <option value="head">Head</option>
                      <option value="body">Body</option>
                      <option value="both">Head & Body</option>
                    </select>
                  </label>
                </div>
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Armor Rating</span>
                    <NumberSpinner
                      value={String(customArmorRating)}
                      onChange={(val) =>
                        setCustomArmorRating(Math.max(0, Number(val) || 0))
                      }
                      min={0}
                    />
                  </label>
                </div>
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Expense</span>
                    <select
                      className="bb-select"
                      value={customExpense}
                      onChange={(e) => setCustomExpense(e.target.value)}
                    >
                      {expenseOptions.map((ex) => (
                        <option key={ex} value={ex}>
                          {ex}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button"
                onClick={() => setIsCustomModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bb-button bb-button--primary"
                onClick={handleSaveCustomArmor}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};