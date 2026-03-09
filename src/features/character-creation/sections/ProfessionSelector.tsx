// src/features/character-creation/sections/ProfessionSelector.tsx
import React from "react";
import {
  Profession,
  ChoiceSelectionGroup,
  ChoiceSkillOption,
} from "../../../models/characterCreationTypes";

type ProfessionSelectorProps = {
  professions: Profession[];

  selectedProfession: string;
  setSelectedProfession: (name: string) => void;

  choiceSelections: Record<number, ChoiceSelectionGroup>;
  setChoiceSelections: React.Dispatch<
    React.SetStateAction<Record<number, ChoiceSelectionGroup>>
  >;

  fixedSkillSubtypes: Record<number, string>;
  setFixedSkillSubtypes: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;

  onProfessionChange: () => void;
  onOpenCustomProfessionModal?: () => void;
};

const ProfessionSelector: React.FC<ProfessionSelectorProps> = ({
  professions,
  selectedProfession,
  setSelectedProfession,
  choiceSelections,
  setChoiceSelections,
  fixedSkillSubtypes,
  setFixedSkillSubtypes,
  onProfessionChange,
  onOpenCustomProfessionModal,
}) => {
  const selectedProfObj =
    professions.find((p) => p.name === selectedProfession) ?? null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profName = e.target.value;
    setSelectedProfession(profName);
    onProfessionChange();
  };

  const formatSkillName = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="bb-profession-selector">
      <h4 className="bb-profession-selector__title">Select a Profession</h4>

      <div className="bb-form-row bb-form-row--compact">
        <label className="bb-form-label">
          <select
            className="bb-select bb-select--profession"
            value={selectedProfession}
            onChange={handleChange}
          >
            <option value="">-- Select Profession --</option>

            {/* Built-in professions */}
            {professions
              .filter((p) => !p.isCustom && p.name !== "Custom Profession")
              .map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}

            {/* Custom professions */}
            {professions
              .filter((p) => p.isCustom)
              .map((p) => (
                <option key={p.name} value={p.name}>
                  {`★ ${p.name}`}
                </option>
              ))}
          </select>
        </label>

        {onOpenCustomProfessionModal && (
          <button
            type="button"
            className="bb-button bb-button--ghost bb-profession-selector__manage-btn"
            onClick={onOpenCustomProfessionModal}
          >
            🛠 Manage Custom Professions
          </button>
        )}
      </div>

      {/* Bonds & description */}
      {selectedProfession && selectedProfObj && (
        <div className="bb-profession-meta">
          <div className="bb-profession-meta__line">
            <span className="bb-profession-meta__label">Bonds:</span>{" "}
            <span className="bb-profession-meta__value">
              {selectedProfObj.bonds}
            </span>
          </div>
          <div className="bb-profession-meta__description">
            {selectedProfObj.description}
          </div>
        </div>
      )}

      {/* Fixed skills */}
      {selectedProfObj && (
        <div className="bb-profession-block">
          <h5 className="bb-profession-block__title">
            Fixed Skills for {selectedProfObj.name}
          </h5>
          <ul className="bb-skill-list bb-skill-list--fixed">
            {selectedProfObj.fixedSkills.map((skill, idx) => (
              <li key={`${skill.key}-${idx}`} className="bb-skill-list__item">
                <span className="bb-skill-list__name">
                  {formatSkillName(skill.key)}
                </span>

                {skill.typed && (
                  <>
                    {skill.subtype ? (
                      <>
                        {" ["}
                        <span className="bb-skill-list__subtype">{skill.subtype}</span>
                        {"]"}
                      </>
                    ) : (
                      <>
                        {" ["}
                        <input
                          type="text"
                          className="bb-input bb-input--subtype"
                          value={fixedSkillSubtypes[idx] ?? ""}
                          onChange={(e) =>
                            setFixedSkillSubtypes(prev => ({ ...prev, [idx]: e.target.value }))
                          }
                        />
                        {"]"}
                      </>
                    )}
                  </>
                )}

                <span className="bb-skill-list__value">: {skill.proficiency}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Choice skill groups */}
      {selectedProfObj && selectedProfObj.choiceSkills.length > 0 && (
        <div className="bb-profession-block">
          {selectedProfObj.choiceSkills.map((choiceGroup, idx) => (
            <div key={idx} className="bb-choice-group">
              <div className="bb-choice-group__header">
                Choose {choiceGroup.choose}:
              </div>
              <ul className="bb-choice-group__list">
                {choiceGroup.options.map((opt, optIdx) => {
                  const group = choiceSelections[idx] ?? {
                    selected: [],
                    subtypes: {},
                  };
                  const isSelected = group.selected.includes(optIdx);
                  const selectedCount = group.selected.length;
                  const disabled =
                    !isSelected &&
                    selectedCount >= choiceGroup.choose;

                  return (
                    <li
                      key={opt.key + optIdx}
                      className="bb-choice-group__item"
                    >
                      <label className="bb-checkbox">
                        <input
                          type="checkbox"
                          className="bb-checkbox__input"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={(e) => {
                            setChoiceSelections((prev) => {
                              const existing =
                                prev[idx] ?? {
                                  selected: [],
                                  subtypes: {},
                                };
                              let newSelected: number[];
                              if (e.target.checked) {
                                newSelected = [...existing.selected, optIdx];
                              } else {
                                newSelected = existing.selected.filter(
                                  (i) => i !== optIdx
                                );
                              }
                              return {
                                ...prev,
                                [idx]: {
                                  ...existing,
                                  selected: newSelected,
                                },
                              };
                            });
                            e.currentTarget.blur();
                          }}
                        />
                        <span className="bb-checkbox__box" />
                        <span className="bb-checkbox__label">
                          {opt.label ?? formatSkillName(opt.key)}
                          {opt.typed && (
                            <>
                              {" ["}
                              <input
                                type="text"
                                className="bb-input bb-input--subtype"
                                value={group.subtypes[optIdx] ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChoiceSelections((prev) => {
                                    const existing =
                                      prev[idx] ?? {
                                        selected: [],
                                        subtypes: {},
                                      };
                                    return {
                                      ...prev,
                                      [idx]: {
                                        ...existing,
                                        subtypes: {
                                          ...existing.subtypes,
                                          [optIdx]: val,
                                        },
                                      },
                                    };
                                  });
                                }}
                              />
                              {"]"}
                            </>
                          )}
                          <span className="bb-skill-list__value">
                            : {opt.proficiency}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ProfessionSelector);