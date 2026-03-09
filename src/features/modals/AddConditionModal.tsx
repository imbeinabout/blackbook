// src/features/modals/AddConditionModal.tsx
import React from "react";
import { nanoid } from "nanoid";
import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import type { ConditionTemplate, ConditionCategory } from "../../models/conditions";
import conditionsDataJson from "../../data/conditions.json";
import NumberSpinner from "../../components/ui/NumberSpinner";
import { addCondition } from "../player-panel/conditions.logic";

const builtInTemplates = conditionsDataJson as ConditionTemplate[];

type AddConditionModalProps = {
  isOpen: boolean;
  agent: DeltaGreenAgent;
  onClose: () => void;
  updateAgentViaMutator: (mutate: (copy: DeltaGreenAgent) => void) => void;
};

type CustomTemplate = ConditionTemplate;

const CUSTOM_CONDITIONS_KEY = "dg-custom-conditions";

const categories: { value: ConditionCategory; label: string }[] = [
  { value: "physical", label: "Physical" },
  { value: "combat", label: "Combat" },
  { value: "mental", label: "Mental" },
  { value: "sanity", label: "Sanity" },
  { value: "chemical", label: "Chemical" },
  { value: "social", label: "Social" },
  { value: "status", label: "Status"},
];

type StatKey = "str" | "con" | "dex" | "int" | "pow" | "cha";
const STAT_KEYS: { key: StatKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "dex", label: "DEX" },
  { key: "int", label: "INT" },
  { key: "pow", label: "POW" },
  { key: "cha", label: "CHA" },
];

function safeNum(s: string) {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function isNonZero(n: number) {
  return !!n && n !== 0;
}

const AddConditionModal: React.FC<AddConditionModalProps> = ({
  isOpen,
  agent,
  onClose,
  updateAgentViaMutator,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isCustomOpen, setIsCustomOpen] = React.useState(false);

  const [cModStats, setCModStats] = React.useState<string>("0");  // all stat x5 tests
  const [cModSkills, setCModSkills] = React.useState<string>("0"); // all skill tests
  const [cModSan, setCModSan] = React.useState<string>("0");      // SAN tests

  const [advStatsOpen, setAdvStatsOpen] = React.useState(false);
  const [advSkillsOpen, setAdvSkillsOpen] = React.useState(false);

  const [cModByStat, setCModByStat] = React.useState<Record<StatKey, string>>({
    str: "0",
    con: "0",
    dex: "0",
    int: "0",
    pow: "0",
    cha: "0",
  });

  const [cSkillOverrides, setCSkillOverrides] = React.useState<Record<string, string>>({});

  const [skillSearch, setSkillSearch] = React.useState("");
  const [skillPick, setSkillPick] = React.useState<string>(""); // skill key
  const [skillPickMod, setSkillPickMod] = React.useState<string>("0");

  const [customTemplates, setCustomTemplates] = React.useState<CustomTemplate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(CUSTOM_CONDITIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CustomTemplate[]) : [];
    } catch {
      return [];
    }
  });

  const allTemplates = React.useMemo(() => {
    return [...builtInTemplates, ...customTemplates];
  }, [customTemplates]);

  React.useEffect(() => {
    if (!isOpen) return;
    setSelectedIndex(0);
  }, [isOpen]);

  const safeIndex =
    allTemplates.length === 0 ? 0 : Math.min(selectedIndex, allTemplates.length - 1);
  const selected = allTemplates[safeIndex] ?? allTemplates[0];

  const handleAddSelected = () => {
    if (!selected) return;
    updateAgentViaMutator((copy) => {
      addCondition(copy, {
        id: selected.id,
        label: selected.label,
        category: selected.category,
      });
    });
    onClose();
  };

  const [cLabel, setCLabel] = React.useState("");
  const [cCategory, setCCategory] = React.useState<ConditionCategory>("physical");
  const [cDescription, setCDescription] = React.useState("");
  const [cEffectsCount, setCEffectsCount] = React.useState<string>("1");
  const [cEffects, setCEffects] = React.useState<string[]>([""]);

  const skillOptions = React.useMemo(() => {
    const entries = Object.entries(agent.system.skills).map(([key, s]) => ({
      key,
      label: s.label ?? key,
    }));
    entries.sort((a, b) => a.label.localeCompare(b.label));
    return entries;
  }, [agent]);

  const filteredSkillOptions = React.useMemo(() => {
    const q = skillSearch.trim().toLowerCase();
    if (!q) return skillOptions;
    return skillOptions.filter(
      (s) => s.label.toLowerCase().includes(q) || s.key.toLowerCase().includes(q)
    );
  }, [skillOptions, skillSearch]);

  React.useEffect(() => {
    if (!isCustomOpen) return;
    if (skillOptions.length === 0) return;
    setSkillPick((prev) => (prev ? prev : skillOptions[0].key));
  }, [isCustomOpen, skillOptions]);

  const resetCustom = React.useCallback(() => {
    setCLabel("");
    setCCategory("physical");
    setCDescription("");
    setCEffectsCount("1");
    setCEffects([""]);

    setCModStats("0");
    setCModSkills("0");
    setCModSan("0");

    setAdvStatsOpen(false);
    setAdvSkillsOpen(false);
    setCModByStat({ str: "0", con: "0", dex: "0", int: "0", pow: "0", cha: "0" });
    setCSkillOverrides({});
    setSkillSearch("");
    setSkillPick("");
    setSkillPickMod("0");
  }, []);

  React.useEffect(() => {
    const n = Math.max(0, Math.min(6, Number(cEffectsCount) || 0));
    setCEffects((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  }, [cEffectsCount]);

  const addSkillOverride = () => {
    const key = skillPick;
    if (!key) return;
    const mod = safeNum(skillPickMod);
    if (!isNonZero(mod)) return;
    setCSkillOverrides((prev) => ({
      ...prev,
      [key]: String(mod),
    }));
  };

  const removeSkillOverride = (key: string) => {
    setCSkillOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const saveCustomCondition = () => {
    const label = cLabel.trim();
    if (!label) {
      window.alert("Please enter a name for the custom condition.");
      return;
    }

    const statsMod = safeNum(cModStats);
    const skillsMod = safeNum(cModSkills);
    const sanMod = safeNum(cModSan);

    const byStat: Partial<Record<StatKey, number>> = {};
    for (const sk of Object.keys(cModByStat) as StatKey[]) {
      const n = safeNum(cModByStat[sk]);
      if (isNonZero(n)) byStat[sk] = n;
    }

    const bySkill: Record<string, number> = {};
    for (const [k, v] of Object.entries(cSkillOverrides)) {
      const n = safeNum(v);
      if (isNonZero(n)) bySkill[k] = n;
    }

    const statsHasAny = isNonZero(statsMod) || Object.keys(byStat).length > 0;
    const skillsHasAny = isNonZero(skillsMod) || Object.keys(bySkill).length > 0;
    const sanHasAny = isNonZero(sanMod);

    const rollMods =
      statsHasAny || skillsHasAny || sanHasAny
        ? {
            ...(statsHasAny
              ? {
                  stats: {
                    ...(isNonZero(statsMod) ? { all: statsMod } : {}),
                    ...(Object.keys(byStat).length > 0 ? { byStat } : {}),
                  },
                }
              : {}),
            ...(skillsHasAny
              ? {
                  skills: {
                    ...(isNonZero(skillsMod) ? { all: skillsMod } : {}),
                    ...(Object.keys(bySkill).length > 0 ? { bySkill } : {}),
                  },
                }
              : {}),
            ...(sanHasAny ? { san: sanMod } : {}),
          }
        : undefined;

    const id = `custom_${nanoid(8)}`;

    const tmpl: CustomTemplate = {
      id,
      label,
      category: cCategory,
      description: cDescription.trim() || undefined,
      effects: cEffects.map((x) => x.trim()).filter((x) => x.length > 0),
      rollMods,
    };

    setCustomTemplates((prev) => {
      const next = [...prev, tmpl];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CUSTOM_CONDITIONS_KEY, JSON.stringify(next));
      }
      return next;
    });

    setIsCustomOpen(false);

    const newIndex = builtInTemplates.length + customTemplates.length;
    setSelectedIndex(newIndex);
  };

  if (!isOpen) return null;

  const renderRollModsSummary = (t: ConditionTemplate) => {
    const rm: any = t.rollMods;
    if (!rm) return "—";

    const statsAll = rm.stats?.all;
    const skillsAll = rm.skills?.all;
    const san = rm.san;

    const statsBy = rm.stats?.byStat ? Object.entries(rm.stats.byStat) : [];
    const skillsBy = rm.skills?.bySkill ? Object.entries(rm.skills.bySkill) : [];

    const parts: string[] = [];
    parts.push(`Stats: ${statsAll != null ? statsAll : "—"}`);
    parts.push(`Skills: ${skillsAll != null ? skillsAll : "—"}`);
    parts.push(`SAN: ${san != null ? san : "—"}`);

    const advParts: string[] = [];
    if (statsBy.length > 0) {
      advParts.push(
        `Stats overrides: ${statsBy
          .map(([k, v]: any) => `${String(k).toUpperCase()} ${v > 0 ? "+" : ""}${v}`)
          .join(", ")}`
      );
    }
    if (skillsBy.length > 0) {
      const slice = skillsBy.slice(0, 5);
      const more = skillsBy.length > 5 ? ` (+${skillsBy.length - 5} more)` : "";
      advParts.push(
        `Skill overrides: ${slice
          .map(([k, v]: any) => `${k} ${v > 0 ? "+" : ""}${v}`)
          .join(", ")}${more}`
      );
    }

    return (
      <>
        <div>{parts.join(" | ")}</div>
        {advParts.length > 0 && (
          <div className="bb-text-muted" style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>
            {advParts.join(" · ")}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Main Add Condition modal */}
      <div className="bb-modal" onClick={onClose}>
        <div
          className="bb-modal__dialog bb-load-modal__dialog bb-weapons-modal__dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bb-modal__header bb-weapons-modal__header">
            <h2 className="bb-modal__title">Add Condition</h2>
          </div>

          <div className="bb-modal__body bb-weapons-modal__body">
            {/* LEFT: list */}
            <div className="bb-weapons-modal__list">
              <div className="bb-weapons-modal__list-header">
                <button
                  type="button"
                  className="bb-button bb-button--small"
                  onClick={() => {
                    resetCustom();
                    setIsCustomOpen(true);
                  }}
                >
                  Add custom condition…
                </button>
              </div>

              <ul className="bb-weapons-modal__list-items">
                {allTemplates.map((c, idx) => {
                  const isSel = idx === safeIndex;
                  const isStimulated = c.id === "stimulated";
                  const hasExhausted = agent.system.conditions?.some(
                    (cond) => cond.id === "exhausted"
                  );

                  const disabled = isStimulated && !hasExhausted;
                  return (
                    <li
                      key={`${c.id}-${idx}`}
                      className={
                        "bb-weapons-modal__list-item" +
                        (isSel ? " bb-weapons-modal__list-item--selected" : "")
                      }
                    >
                      <button
                        type="button"
                        className="bb-weapons-modal__list-button"
                        disabled={disabled}
                        title={
                          disabled
                            ? "Requires the Exhausted condition"
                            : undefined
                        }
                        onClick={() => setSelectedIndex(idx)}
                      >
                        <span className="bb-weapons-modal__list-name">{c.label}</span>
                        <span className="bb-weapons-modal__list-meta">{c.category}</span>
                      </button>
                    </li>
                  );
                })}

                {allTemplates.length === 0 && (
                  <li className="bb-weapons-modal__list-item">
                    <span className="bb-weapons-modal__empty">No conditions available.</span>
                  </li>
                )}
              </ul>
            </div>

            {/* RIGHT: details */}
            <div className="bb-weapons-modal__details">
              {selected ? (
                <>
                  <h3 className="bb-weapons-modal__weapon-name">{selected.label}</h3>
                  <p className="bb-weapons-modal__weapon-desc">{selected.description || "—"}</p>

                  <div className="bb-weapons-modal__details-grid">
                    <div>
                      <div className="bb-weapons-modal__field-label">Category</div>
                      <div className="bb-weapons-modal__field-value">{selected.category}</div>
                    </div>

                    <div>
                      <div className="bb-weapons-modal__field-label">Effects</div>
                      <div className="bb-weapons-modal__field-value">
                        {selected.effects && selected.effects.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                            {selected.effects.map((e, i) => (
                              <li key={i} style={{ marginBottom: "0.15rem" }}>
                                {e}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="bb-weapons-modal__field-label">Roll Mods</div>
                      <div className="bb-weapons-modal__field-value">
                        {renderRollModsSummary(selected)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>No condition selected.</p>
              )}
            </div>
          </div>

          <div className="bb-modal__footer">
            <button type="button" className="bb-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="bb-button bb-button--primary"
              onClick={handleAddSelected}
              disabled={!selected}
            >
              Add Condition
            </button>
          </div>
        </div>
      </div>

      {/* Custom condition sub-modal */}
      {isCustomOpen && (
        <div className="bb-modal" onClick={() => setIsCustomOpen(false)}>
          <div
            className="bb-modal__dialog bb-modal__dialog--small"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="bb-modal__title">Add Custom Condition</h2>

            <div className="bb-modal__body">
              <div className="bb-form-grid">
                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Name</span>
                    <input
                      type="text"
                      className="bb-input"
                      value={cLabel}
                      onChange={(e) => setCLabel(e.target.value)}
                    />
                  </label>
                </div>

                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Category</span>
                    <select
                      className="bb-select"
                      value={cCategory}
                      onChange={(e) => setCCategory(e.target.value as ConditionCategory)}
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Basic Roll Modifiers */}
                <div className="bb-form-grid" style={{ marginTop: "0.5rem" }}>
                  <div className="bb-form-row">
                    <label className="bb-form-label">
                      <span className="bb-form-label__text">Roll Mod: Stats (×5 tests)</span>
                      <NumberSpinner
                        label=""
                        min={-80}
                        max={80}
                        value={cModStats}
                        onChange={setCModStats}
                      />
                    </label>
                    <div className="bb-text-muted" style={{ fontSize: "0.72rem", marginTop: "0.15rem" }}>
                      Applies to STR/CON/DEX/INT/POW/CHA ×5 rolls.
                    </div>
                  </div>

                  <div className="bb-form-row">
                    <label className="bb-form-label">
                      <span className="bb-form-label__text">Roll Mod: Skills</span>
                      <NumberSpinner
                        label=""
                        min={-80}
                        max={80}
                        value={cModSkills}
                        onChange={setCModSkills}
                      />
                    </label>
                    <div className="bb-text-muted" style={{ fontSize: "0.72rem", marginTop: "0.15rem" }}>
                      Applies to all skill tests.
                    </div>
                  </div>

                  <div className="bb-form-row">
                    <label className="bb-form-label">
                      <span className="bb-form-label__text">Roll Mod: SAN</span>
                      <NumberSpinner
                        label=""
                        min={-80}
                        max={80}
                        value={cModSan}
                        onChange={setCModSan}
                      />
                    </label>
                    <div className="bb-text-muted" style={{ fontSize: "0.72rem", marginTop: "0.15rem" }}>
                      Applies to SANITY TEST rolls.
                    </div>
                  </div>
                </div>

                {/* Advanced toggles */}
                <div style={{ marginTop: "0.35rem" }}>
                  <label className="bb-checkbox bb-checkbox--small" style={{ marginTop: "0.35rem" }}>
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={advStatsOpen}
                      onChange={(e) => {
                        setAdvStatsOpen(e.target.checked);
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                    <span className="bb-checkbox__label">Advanced… Stats overrides</span>
                  </label>

                  {advStatsOpen && (
                    <div className="bb-form-grid" style={{ marginTop: "0.35rem" }}>
                      {STAT_KEYS.map((s) => (
                        <div className="bb-form-row" key={s.key}>
                          <label className="bb-form-label">
                            <span className="bb-form-label__text">{s.label} override (%)</span>
                            <NumberSpinner
                              label=""
                              min={-80}
                              max={80}
                              value={cModByStat[s.key]}
                              onChange={(v) =>
                                setCModByStat((prev) => ({ ...prev, [s.key]: v }))
                              }
                            />
                          </label>
                        </div>
                      ))}
                      <div className="bb-text-muted" style={{ fontSize: "0.72rem" }}>
                        These add on top of “Stats (×5 tests)”.
                      </div>
                    </div>
                  )}

                  <label className="bb-checkbox bb-checkbox--small" style={{ marginTop: "0.6rem" }}>
                    <input
                      type="checkbox"
                      className="bb-checkbox__input"
                      checked={advSkillsOpen}
                      onChange={(e) => {
                        setAdvSkillsOpen(e.target.checked);
                        e.currentTarget.blur();
                      }}
                    />
                    <span className="bb-checkbox__box" />
                    <span className="bb-checkbox__label">Advanced… Skill overrides</span>
                  </label>

                  {advSkillsOpen && (
                    <div className="bb-form-grid" style={{ marginTop: "0.35rem" }}>
                      <div className="bb-form-row">
                        <label className="bb-form-label">
                          <span className="bb-form-label__text">Search skills</span>
                          <input
                            type="text"
                            className="bb-input"
                            value={skillSearch}
                            onChange={(e) => setSkillSearch(e.target.value)}
                            placeholder="Type to filter…"
                          />
                        </label>
                      </div>

                      <div className="bb-form-row">
                        <label className="bb-form-label">
                          <span className="bb-form-label__text">Pick skill</span>
                          <select
                            className="bb-select"
                            value={skillPick}
                            onChange={(e) => setSkillPick(e.target.value)}
                          >
                            {filteredSkillOptions.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="bb-form-row">
                        <label className="bb-form-label">
                          <span className="bb-form-label__text">Override (%)</span>
                          <NumberSpinner
                            label=""
                            min={-80}
                            max={80}
                            value={skillPickMod}
                            onChange={setSkillPickMod}
                          />
                        </label>
                        <button
                          type="button"
                          className="bb-button bb-button--small"
                          onClick={addSkillOverride}
                          style={{ marginTop: "0.25rem" }}
                        >
                          Add / Update Override
                        </button>
                        <div className="bb-text-muted" style={{ fontSize: "0.72rem", marginTop: "0.15rem" }}>
                          Overrides add on top of “Skills”.
                        </div>
                      </div>

                      {Object.keys(cSkillOverrides).length > 0 && (
                        <div className="bb-form-row">
                          <span className="bb-form-label__text">Current overrides</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {Object.entries(cSkillOverrides)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([k, v]) => {
                                const label = skillOptions.find((s) => s.key === k)?.label ?? k;
                                return (
                                  <div
                                    key={k}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "0.5rem",
                                      border: "1px solid var(--bb-border-soft)",
                                      padding: "0.25rem 0.35rem",
                                      background: "#020403",
                                    }}
                                  >
                                    <span style={{ fontSize: "0.8rem" }}>
                                      {label}: {Number(v) > 0 ? "+" : ""}
                                      {v}
                                    </span>
                                    <button
                                      type="button"
                                      className="bb-button bb-button--small bb-button--danger"
                                      onClick={() => removeSkillOverride(k)}
                                      title="Remove override"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bb-form-row" style={{ marginTop: "0.35rem" }}>
                  <label className="bb-form-label">
                    <span className="bb-form-label__text">Description</span>
                    <textarea
                      className="bb-input"
                      rows={3}
                      value={cDescription}
                      onChange={(e) => setCDescription(e.target.value)}
                    />
                  </label>
                </div>

                <div className="bb-form-row">
                  <label className="bb-form-label">
                    <span className="bb-form-label__text"># of effect lines</span>
                    <NumberSpinner
                      label=""
                      min={0}
                      max={6}
                      value={cEffectsCount}
                      onChange={setCEffectsCount}
                    />
                  </label>
                </div>

                {cEffects.map((val, idx) => (
                  <div className="bb-form-row" key={idx}>
                    <label className="bb-form-label">
                      <span className="bb-form-label__text">Effect {idx + 1}</span>
                      <input
                        type="text"
                        className="bb-input"
                        value={val}
                        onChange={(e) => {
                          const next = [...cEffects];
                          next[idx] = e.target.value;
                          setCEffects(next);
                        }}
                        placeholder="e.g. −20% to Firearms tests"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bb-modal__footer">
              <button type="button" className="bb-button" onClick={() => setIsCustomOpen(false)}>
                Cancel
              </button>
              <button type="button" className="bb-button bb-button--primary" onClick={saveCustomCondition}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddConditionModal;