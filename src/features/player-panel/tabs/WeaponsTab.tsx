// src/features/player-panel/tabs/WeaponsTab.tsx
import React from "react";
import { nanoid } from "nanoid";
import { useAgentStore } from "../../../store/agentStore";
import type { DeltaGreenAgent, DeltaGreenItem } from "../../../models/DeltaGreenAgent";
import weaponsDataJson from "../../../data/weapons.json";
import NumberSpinner from "../../../components/ui/NumberSpinner";

type WeaponTemplate = {
  name: string;
  description: string;
  skill: string;
  skillModifier: number;
  customSkillTarget: number;
  range: string;
  damage: string;
  armorPiercing: number;
  lethality: number;
  isLethal: boolean;
  killRadius: string;
  ammo: string;
  expense: string;
  equipped: boolean;
};

type WeaponSystem = WeaponTemplate & {
  currentAmmo?: number;
};

const weaponsData = weaponsDataJson as WeaponTemplate[];

interface WeaponsTabProps {
  agent: DeltaGreenAgent | null;
  onRollSkill: (label: string, chance: number) => void;
  onRollDamage: (weaponName: string, damageFormula: string) => void;
  onRollLethality: (weaponName: string, lethalityPercent: number) => void;
}

/**
 * Weapons tab: shows the agent's weapons table and an "Add weapon" modal.
 */
export const WeaponsTab: React.FC<WeaponsTabProps> = ({ 
  agent,
  onRollSkill,
  onRollDamage,
  onRollLethality,
}) => {
  const { activeAgentId } = useAgentStore();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = React.useState(0);

  // NEW: current filter by weapon.skill (empty string = no filter)
  const [filterSkill, setFilterSkill] = React.useState<string>("");

  // NEW: custom templates persisted in localStorage
  const CUSTOM_WEAPONS_KEY = "dg-custom-weapons";

  const [customTemplates, setCustomTemplates] = React.useState<WeaponTemplate[]>(
    () => {
      if (typeof window === "undefined") return [];
      try {
        const raw = window.localStorage.getItem(CUSTOM_WEAPONS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as WeaponTemplate[]) : [];
      } catch {
        return [];
      }
    }
  );

  const allWeapons = React.useMemo(
    () => [...weaponsData, ...customTemplates],
    [customTemplates]
  );

  const skillOptions = React.useMemo(
    () =>
      Array.from(new Set(allWeapons.map((w) => w.skill))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [allWeapons]
  );

  const expenseOptions = React.useMemo(
    () =>
      Array.from(
        new Set(allWeapons.map((w) => w.expense).filter((e) => e && e.trim()))
      ).sort((a, b) => a.localeCompare(b)),
    [allWeapons]
  );

  const filteredWeapons = React.useMemo(
    () =>
      filterSkill
        ? allWeapons.filter((w) => w.skill === filterSkill)
        : allWeapons,
    [filterSkill, allWeapons]
  );

  const safeSelectedIndex =
    filteredWeapons.length === 0
      ? 0
      : Math.min(selectedTemplateIndex, filteredWeapons.length - 1);

  const selectedTemplate =
    filteredWeapons[safeSelectedIndex] ?? filteredWeapons[0] ?? undefined;
  
  const [isCustomModalOpen, setIsCustomModalOpen] = React.useState(false);

  const [customName, setCustomName] = React.useState("");
  const [customDescription, setCustomDescription] = React.useState("");
  const [customSkill, setCustomSkill] = React.useState<string>("");
  const [customExpense, setCustomExpense] = React.useState<string>("");

  const [customAmmo, setCustomAmmo] = React.useState<number>(0);
  const [customArmorPiercing, setCustomArmorPiercing] = React.useState<number>(0);
  const [customRange, setCustomRange] = React.useState<string>("0");      // was number
  const [customKillRadius, setCustomKillRadius] = React.useState<string>("0"); // was number

  const [customIsLethal, setCustomIsLethal] = React.useState<boolean>(false);
  const [customLethalityPct, setCustomLethalityPct] = React.useState<number>(0); // percentage

  const [customNumDice, setCustomNumDice] = React.useState<number>(1);
  const [customDie, setCustomDie] = React.useState<string>("d6");
  const [customDamageMod, setCustomDamageMod] = React.useState<number>(0);

  const resetCustomWeaponForm = React.useCallback(() => {
    setCustomName("");
    setCustomDescription("");
    setCustomSkill(skillOptions[0] ?? "");
    setCustomExpense(expenseOptions[0] ?? "");
    setCustomAmmo(0);
    setCustomArmorPiercing(0);
    setCustomRange("0m");
    setCustomKillRadius("0m");
    setCustomIsLethal(false);
    setCustomLethalityPct(0);
    setCustomNumDice(1);
    setCustomDie("d6");
    setCustomDamageMod(0);
  }, [skillOptions, expenseOptions]);

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
          <span className="bb-weapons-tab__title">WEAPONS</span>
          <button type="button" className="bb-button" disabled>
            Add weapon
          </button>
        </div>
        <p>No agent loaded.</p>
      </div>
    );
  }

  const weaponItems: DeltaGreenItem[] = agent.items.filter(
    (it) => it.type === "weapon"
  );

  const handleToggleEquipped = (itemId: string) => {
    updateActiveAgent((copy) => {
      const item = copy.items.find((it) => it._id === itemId);
      if (!item) return;
      const sys = item.system as WeaponSystem;
      sys.equipped = !sys.equipped;
    });
  };

  const handleReload = (itemId: string) => {
    updateActiveAgent((copy) => {
      const item = copy.items.find((it) => it._id === itemId);
      if (!item) return;
      const sys = item.system as WeaponSystem;
      const maxAmmo = parseInt(sys.ammo || "0", 10);
      if (!Number.isNaN(maxAmmo) && maxAmmo > 0) {
        sys.currentAmmo = maxAmmo;
      }
    });
  };

  const handleSpendAmmo = (itemId: string) => {
    updateActiveAgent((copy) => {
      const item = copy.items.find((it) => it._id === itemId);
      if (!item) return;

      const sys = item.system as WeaponSystem;

      const maxAmmo = parseInt(sys.ammo || "0", 10);
      if (Number.isNaN(maxAmmo) || maxAmmo <= 0) return;

      const current =
        typeof sys.currentAmmo === "number"
          ? sys.currentAmmo
          : maxAmmo;

      sys.currentAmmo = Math.max(0, current - 1);
    });
  };

  const handleDeleteWeapon = (itemId: string) => {
    updateActiveAgent((copy) => {
        copy.items = copy.items.filter(
        (it) => !(it.type === "weapon" && it._id === itemId)
        );
    });
  };

  const handleAddFromTemplate = () => {
    const tmpl = selectedTemplate;
    if (!tmpl) return;

    updateActiveAgent((copy) => {
      const newWeapon: DeltaGreenItem = {
        type: "weapon",
        _id: nanoid(),
        name: tmpl.name,
        img: "systems/deltagreen/assets/icons/swap-bag-black-bg.svg",
        system: {
          ...tmpl,
          currentAmmo: tmpl.ammo
            ? parseInt(tmpl.ammo, 10) || undefined
            : undefined,
        } as WeaponSystem,
      };

      copy.items.push(newWeapon);
    });

    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setFilterSkill(""); 
    setSelectedTemplateIndex(0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const formatLethality = (value: number) => {
    if (!value || value <= 0) return "—";
    return `${Math.round(value * 100)}%`;
  };

  const getSkillProficiencyForLabel = (
    agent: DeltaGreenAgent,
    label: string
  ): number | null => {
    for (const skill of Object.values(agent.system.skills)) {
      if (skill.label === label) {
        return skill.proficiency ?? 0;
      }
    }

    for (const skill of Object.values(agent.system.typedSkills)) {
      if (skill.label === label) {
        return skill.proficiency ?? 0;
      }
    }

    return null;
  };

  // -------------------------
  // Unarmed Attack (SPECIAL)
  // Damage = 1D4 + STR modifier
  // STR 1-4 -> -2, 5-8 -> -1, 9-12 -> 0, 13-16 -> +1, 17-18 -> +2
  // -------------------------
  const getStrengthModifier = (strValue: number): number => {
    if (strValue <= 4) return -2;
    if (strValue <= 8) return -1;
    if (strValue <= 12) return 0;
    if (strValue <= 16) return 1;
    return 2; // 17-18
  };

  const formatDamageWithMod = (base: string, mod: number): string => {
    if (mod === 0) return base;
    if (mod > 0) return `${base}+${mod}`;
    return `${base}${mod}`;
  };

  const isUnarmedAttack = (name?: string) =>
    (name ?? "").trim().toLowerCase() === "unarmed attack";

  const getUnarmedDamageFormula = (): string => {
    const str = agent?.system.statistics.str.value ?? 0;
    const mod = getStrengthModifier(str);
    return formatDamageWithMod("1D4", mod);
  };

  const buildDamageString = () => {
    const base = `${customNumDice}${customDie}`;
    if (customDamageMod === 0) return base;
    if (customDamageMod > 0) return `${base}+${customDamageMod}`;
    return `${base}${customDamageMod}`; 
  };

  const handleSaveCustomWeapon = () => {
    const name = customName.trim();
    if (!name) {
      window.alert("Please enter a name for the custom weapon.");
      return;
    }

    const range =
    customRange && Number(customRange) > 0 ? `${customRange}m` : "";

    const killRadius =
        customKillRadius && Number(customKillRadius) > 0
            ? `${customKillRadius}m`
            : "";

    const lethality =
      customIsLethal && customLethalityPct > 0
        ? customLethalityPct / 100
        : 0;

    const damage = buildDamageString();

    const ammo = customAmmo > 0 ? String(customAmmo) : "";

    const tmpl: WeaponTemplate = {
      name,
      description: customDescription,
      skill: customSkill || "Firearms",
      skillModifier: 0,
      customSkillTarget: 0,
      range,
      damage,
      armorPiercing: customArmorPiercing || 0,
      lethality,
      isLethal: customIsLethal,
      killRadius,
      ammo,
      expense: customExpense || "Standard",
      equipped: true,
    };

    setCustomTemplates((prev) => {
      const next = [...prev, tmpl];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CUSTOM_WEAPONS_KEY, JSON.stringify(next));
      }
      return next;
    });

    setIsCustomModalOpen(false);
    if (tmpl.skill) {
      setFilterSkill(tmpl.skill);
      setSelectedTemplateIndex(0);
    }
  };

  const renderWeaponsTable = () => {
    if (weaponItems.length === 0) {
      return (
        <p className="bb-weapons-tab__empty">
          No weapons assigned. Use <strong>Add weapon</strong> to equip this
          agent.
        </p>
      );
    }

    return (
      <table className="bb-weapons-table">
        <thead>
          <tr>
            <th style={{ width: "2rem" }}>Eq.</th>
            <th>Name</th>
            <th>Skill</th>
            <th>Range</th>
            <th>Damage</th>
            <th>AP</th>
            <th>Lethality</th>
            <th>Kill&nbsp;R.</th>
            <th>Ammo</th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          {weaponItems.map((item) => {
            const sys = item.system as WeaponSystem;
            const isEquipped = !!sys.equipped;
            const currentAmmo =
              typeof sys.currentAmmo === "number"
                ? sys.currentAmmo
                : sys.ammo
                ? parseInt(sys.ammo, 10) || undefined
                : undefined;
            const ammoLabel =
              currentAmmo !== undefined && sys.ammo
                ? `${currentAmmo}/${sys.ammo}`
                : sys.ammo || "—";

            return (
              <tr
                key={item._id}
                className={
                  "bb-weapons-table__row" +
                  (isEquipped ? " bb-weapons-table__row--equipped" : "")
                }
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
                <td>
                  <button
                    type="button"
                    className="bb-button bb-button--small"
                    onClick={() => {
                      if (!agent) return;
                      const base = getSkillProficiencyForLabel(agent, sys.skill) ?? 0;
                      const modified = base + (sys.skillModifier ?? 0);
                      const chance = Math.max(0, Math.min(100, modified));
                      onRollSkill(sys.skill, chance)
                    }}
                  >
                    {sys.skill}
                    {sys.skillModifier
                      ? ` (${sys.skillModifier >= 0 ? "+" : ""}${
                          sys.skillModifier
                        })`
                      : ""}
                  </button>
                </td>
                <td>{sys.range || "—"}</td>
                <td>
                  {(() => {
                    const isUA = isUnarmedAttack(item.name);
                    const strVal = agent.system.statistics.str.value ?? 0;
                    const strMod = getStrengthModifier(strVal);

                    const damageFormula = isUA ? getUnarmedDamageFormula() : (sys.damage || "");

                    const tooltip = isUA
                      ? `Unarmed Attack = 1D4 + STR mod. STR ${strVal} ⇒ ${strMod >= 0 ? "+" : ""}${strMod}. Rolling: ${damageFormula}`
                      : `Rolling: ${damageFormula}`;

                    return (
                      <button
                        type="button"
                        className="bb-button bb-button--small"
                        title={tooltip}
                        onClick={() => {
                          if (!damageFormula) return;
                          onRollDamage(item.name, damageFormula);
                        }}
                      >
                        {damageFormula || "—"}
                      </button>
                    );
                  })()}
                </td>
                <td>
                  {sys.armorPiercing || sys.armorPiercing === 0
                    ? sys.armorPiercing
                    : "—"}
                </td>
                <td>
                    {(() => {
                        const hasLethality = !!sys.lethality && sys.lethality > 0;
                        return (
                        <button
                            type="button"
                            className="bb-button bb-button--small"
                            disabled={!hasLethality}
                            onClick={() => {
                            if (!hasLethality) return;
                            onRollLethality(item.name, Math.round(sys.lethality*100))
                            }}
                        >
                            {formatLethality(sys.lethality)}
                        </button>
                        );
                    })()}
                </td>
                <td>{sys.killRadius || "—"}</td>
                <td>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <button
                      type="button"
                      className="bb-button bb-button--small"
                      onClick={() => handleSpendAmmo(item._id)}
                      disabled={
                        !sys.ammo ||
                        parseInt(sys.ammo || "0", 10) <= 0 ||
                        (typeof sys.currentAmmo === "number" ? sys.currentAmmo <= 0 : false)
                      }
                      title="Spend 1 ammo"
                      style={{ padding: "0.05rem 0.35rem", minWidth: "1.6rem" }}
                    >
                      −
                    </button>

                    <span title={sys.ammo ? "Current / Max ammo" : ""}>{ammoLabel}</span>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="bb-button bb-button--small"
                    onClick={() => handleReload(item._id)}
                    disabled={!sys.ammo}
                    title="Reload to full magazine"
                  >
                    Reload
                  </button>
                </td>                
                <td>
                  <button
                    type="button"
                    className="bb-button bb-button--small bb-button--danger"
                    onClick={() => handleDeleteWeapon(item._id)}
                    title="Remove this weapon"
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
        <span className="bb-weapons-tab__title">WEAPONS</span>
        <button
          type="button"
          className="bb-button bb-button--primary"
          onClick={handleOpenModal}
        >
          Add weapon
        </button>
      </div>

      <div className="bb-weapons-tab__body">{renderWeaponsTable()}</div>

      {isModalOpen && (
        <div
          className="bb-modal"
          onClick={handleCloseModal}
        >
          <div
            className="bb-modal__dialog bb-load-modal__dialog bb-weapons-modal__dialog"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="bb-modal__header bb-weapons-modal__header">
                <h2 className="bb-modal__title">Add Weapon</h2>

                <div className="bb-weapons-modal__filter">
                    <label>
                    Skill:&nbsp;
                    <select
                        className="bb-select"
                        value={filterSkill}
                        onChange={(e) => {
                        setFilterSkill(e.target.value);
                        setSelectedTemplateIndex(0);
                        }}
                    >
                        <option value="">All</option>
                        {skillOptions.map((skill) => (
                        <option key={skill} value={skill}>
                            {skill}
                        </option>
                        ))}
                    </select>
                    </label>
                </div>
            </div>

            <div className="bb-modal__body bb-weapons-modal__body">
              {/* LEFT: list of templates */}
              <div className="bb-weapons-modal__list">
                <div className="bb-weapons-modal__list-header">
                    <button
                    type="button"
                    className="bb-button bb-button--small"
                    onClick={() => {
                        resetCustomWeaponForm();
                        setIsCustomModalOpen(true);
                    }}
                    >
                    Build custom weapon…
                    </button>
                </div>
                <ul className="bb-weapons-modal__list-items">
                    {filteredWeapons.map((w, idx) => {
                    const isSelected = idx === safeSelectedIndex;
                    return (
                        <li
                        key={`${w.name}-${idx}`}
                        className={
                            "bb-weapons-modal__list-item" +
                            (isSelected ? " bb-weapons-modal__list-item--selected" : "")
                        }
                        >
                        <button
                            type="button"
                            className="bb-weapons-modal__list-button"
                            onClick={() => setSelectedTemplateIndex(idx)}
                        >
                            <span className="bb-weapons-modal__list-name">{w.name}</span>
                            <span className="bb-weapons-modal__list-meta">
                            {w.skill}
                            {w.range ? ` • ${w.range}` : ""}
                            {(() => {
                              const dmg = isUnarmedAttack(w.name) ? getUnarmedDamageFormula() : w.damage;
                              return dmg ? ` • ${dmg}` : "";
                            })()}
                            </span>
                        </button>
                        </li>
                    );
                    })}
                    {filteredWeapons.length === 0 && (
                    <li className="bb-weapons-modal__list-item">
                        <span className="bb-weapons-modal__empty">
                        No weapons match this skill.
                        </span>
                    </li>
                    )}
                </ul>
                </div>

              {/* RIGHT: details for selected template */}
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
                          Skill
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {selectedTemplate.skill}
                          {selectedTemplate.skillModifier
                            ? ` (${
                                selectedTemplate.skillModifier >= 0 ? "+" : ""
                              }${selectedTemplate.skillModifier})`
                            : ""}
                        </div>
                      </div>

                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Range
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {selectedTemplate.range || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="bb-weapons-modal__field-label">Damage</div>
                        <div className="bb-weapons-modal__field-value">
                          {(() => {
                            const isUA = selectedTemplate ? isUnarmedAttack(selectedTemplate.name) : false;
                            const strVal = agent.system.statistics.str.value ?? 0;
                            const strMod = getStrengthModifier(strVal);

                            const dmg = selectedTemplate
                              ? (isUA ? getUnarmedDamageFormula() : (selectedTemplate.damage || ""))
                              : "";

                            const tooltip = isUA
                              ? `Unarmed Attack damage = 1D4 + STR mod. STR ${strVal} ⇒ mod ${strMod >= 0 ? "+" : ""}${strMod}.`
                              : (dmg ? `Rolling: ${dmg}` : "");

                            return (
                              <span title={tooltip}>
                                {dmg || "—"}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Armor Piercing
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {selectedTemplate.armorPiercing ||
                          selectedTemplate.armorPiercing === 0
                            ? selectedTemplate.armorPiercing
                            : "—"}
                        </div>
                      </div>

                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Lethality
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {formatLethality(selectedTemplate.lethality)}
                        </div>
                      </div>

                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Kill Radius
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {selectedTemplate.killRadius || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="bb-weapons-modal__field-label">
                          Ammo / Mag
                        </div>
                        <div className="bb-weapons-modal__field-value">
                          {selectedTemplate.ammo || "—"}
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
                  <p>No weapon selected.</p>
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
                    Add weapon
                </button>
            </div>
          </div>
        </div>
      )}
      {isCustomModalOpen && (
        <div
            className="bb-modal"
            onClick={() => setIsCustomModalOpen(false)}
        >
            <div
            className="bb-modal__dialog bb-modal__dialog--small bb-weapons-custom-modal__dialog"
            onClick={(e) => e.stopPropagation()}
            >
            <h2 className="bb-modal__title">Build Custom Weapon</h2>

            <div className="bb-modal__body bb-weapons-custom-modal__body">
                {/* Name & Description */}
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

                {/* Skill & Expense */}
                <div className="bb-form-grid">
                <div className="bb-form-row">
                    <label className="bb-form-label">
                    <span className="bb-form-label__text">Skill</span>
                    <select
                        className="bb-select"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                    >
                        {skillOptions.map((sk) => (
                        <option key={sk} value={sk}>
                            {sk}
                        </option>
                        ))}
                    </select>
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

                {/* Ammo, AP, Range, Kill Radius */}
                <div className="bb-form-grid">
                
                <div className="bb-form-row">
                    <label className="bb-form-label">
                        <span className="bb-form-label__text">Ammo</span>
                        <NumberSpinner
                            value={String(customAmmo)}
                            onChange={(val) => setCustomAmmo(Number(val) || 0)}
                            min={0}
                        />
                    </label>
                </div>

                <div className="bb-form-row">
                    <label className="bb-form-label">
                    <span className="bb-form-label__text">Armor Piercing</span>
                    <NumberSpinner
                        value={String(customArmorPiercing)}
                        onChange={(val) => setCustomArmorPiercing(Number(val) || 0)}
                        min={0}
                    />
                    </label>
                </div>

                <div className="bb-form-row">
                    <label className="bb-form-label">
                    <span className="bb-form-label__text">Range (m)</span>
                    <NumberSpinner
                        value={customRange}
                        onChange={(val) => setCustomRange(val)}
                        min={0}
                    />
                    </label>
                </div>

                <div className="bb-form-row">
                    <label className="bb-form-label">
                    <span className="bb-form-label__text">Kill Radius (m)</span>
                    <NumberSpinner
                        value={customKillRadius}
                        onChange={(val) => setCustomKillRadius(val)}
                        min={0}
                    />
                    </label>
                </div>
                </div>

                {/* Lethality */}
                <div className="bb-form-grid">
                <div className="bb-form-row">
                    <label className="bb-checkbox">
                    <input
                        type="checkbox"
                        className="bb-checkbox__input"
                        checked={customIsLethal}
                        onChange={(e) => {
                        const checked = e.target.checked;
                        setCustomIsLethal(checked);
                        if (!checked) {
                            setCustomLethalityPct(0);
                        }
                        }}
                    />
                    <span className="bb-checkbox__box" />
                    <span className="bb-checkbox__label">Does the Weapon Have Lethality?</span>
                    </label>
                </div>

                <div className="bb-form-row">
                    <label className="bb-form-label">
                    <span className="bb-form-label__text">Lethality (%)</span>
                    <NumberSpinner
                        value={String(customLethalityPct)}
                        onChange={(val) =>
                            setCustomLethalityPct(
                                Math.min(100, Math.max(0, Number(val) || 0))
                            )
                        }
                        min={0}
                        max={100}
                        disabled={!customIsLethal}
                    />
                    </label>
                </div>
                </div>

                {/* Damage builder */}
                <div className="bb-form-grid">
                <div className="bb-form-row">
                    <span className="bb-form-label__text">Damage</span>
                    <div
                        style={{
                        display: "flex",
                        gap: "0.25rem",
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                        }}
                    >
                        {/* Number of dice – narrow spinner */}
                        <div style={{ maxWidth: "3.5rem", flex: "0 0 auto" }}>
                        <NumberSpinner
                            value={String(customNumDice)}
                            onChange={(val) =>
                            setCustomNumDice(Math.max(1, Number(val) || 1))
                            }
                            min={1}
                            max={20}
                        />
                        </div>

                        {/* Die selector */}
                        <div style={{ flex: "0 0 auto" }}>
                        <select
                            className="bb-select"
                            value={customDie}
                            onChange={(e) => setCustomDie(e.target.value)}
                        >
                            <option value="d4">d4</option>
                            <option value="d6">d6</option>
                            <option value="d8">d8</option>
                            <option value="d10">d10</option>
                            <option value="d12">d12</option>
                            <option value="d20">d20</option>
                            <option value="d100">d100</option>
                        </select>
                        </div>

                        {/* Modifier – narrow spinner, allows negatives */}
                        <div style={{ maxWidth: "4.5rem", flex: "0 0 auto" }}>
                        <NumberSpinner
                            value={String(customDamageMod)}
                            onChange={(val) => setCustomDamageMod(Number(val) || 0)}
                            min={-99}
                            max={99}
                        />
                        </div>
                    </div>
                    </div>

                    <div className="bb-form-row">
                    <span className="bb-form-label__text">Damage Preview</span>
                    <strong>{buildDamageString()}</strong>
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
                onClick={handleSaveCustomWeapon}
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