// src/features/character-creation/sections/ProfessionSection.tsx
import React, { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import type {
  Profession,
  ChoiceSelectionGroup,
} from "../../../models/characterCreationTypes";
import CustomProfessionModal from "./CustomProfessionModal";
import ProfessionSelector from "./ProfessionSelector";
import { buildBaseSkills } from "../../../models/baseSkills";
import { buildSkillsForStandardProfession } from "../../../lib/skillApplication";
import professionsRaw from "../../../data/professions.json";

type ProfessionSectionProps = {
  agent: DeltaGreenAgent;
  updateAgent: (agent: DeltaGreenAgent) => void;
  onSelectProfession?: (professionId: string | null) => void;
  selectedProfessionId?: string | null;
};

type ApplyState = {
  canApply: boolean;
  reason: string | null;
};

const ProfessionSection: React.FC<ProfessionSectionProps> = ({
  agent,
  updateAgent,
  onSelectProfession,
  selectedProfessionId,
}) => {
  const [professions, setProfessions] = React.useState<Profession[]>([]);
  const [selectedProfession, setSelectedProfession] = React.useState<string>(
    agent.system.biography.profession ?? ""
  );
  const [choiceSelections, setChoiceSelections] = React.useState<
    Record<number, ChoiceSelectionGroup>
  >({});
  const [fixedSkillSubtypes, setFixedSkillSubtypes] = React.useState<
    Record<number, string>
  >({});

  const [isCustomModalOpen, setIsCustomModalOpen] = React.useState(false);

  const [lastAppliedProfession, setLastAppliedProfession] =
    React.useState<string | null>(null);

  const blankSkills = React.useMemo(() => buildBaseSkills(), []);

  const currentProfession: Profession | undefined = React.useMemo(
    () => professions.find((p) => p.name === selectedProfession),
    [professions, selectedProfession]
  );

  React.useEffect(() => {
    const builtIn = professionsRaw as Profession[];
    const custom: Profession[] = JSON.parse(
      localStorage.getItem("customProfessions") ?? "[]"
    );
    const loaded = [...builtIn, ...custom];
    setProfessions(loaded);

    const metaProfName = selectedProfessionId ?? null;
    const agentProfName = agent.system.biography.profession;

    if (metaProfName && loaded.some((p) => p.name === metaProfName)) {
      setSelectedProfession(metaProfName);
    } else if (
      agentProfName &&
      loaded.some((p) => p.name === agentProfName)
    ) {
      setSelectedProfession(agentProfName);
    }
  }, [agent.system.biography.profession, selectedProfessionId]);

  const getApplyState = React.useCallback(
    (profession: Profession | undefined): ApplyState => {
      if (!profession) {
        return {
          canApply: false,
          reason: "Select a profession before applying it to the agent.",
        };
      }

      for (let idx = 0; idx < profession.fixedSkills.length; idx++) {
        const skill = profession.fixedSkills[idx];
        if (skill.typed && !skill.subtype) {
          const subtype = fixedSkillSubtypes[idx] ?? "";
          if (!subtype.trim()) {
            return {
              canApply: false,
              reason: `Provide a subtype for the fixed typed skill "${skill.key}" (e.g. Science [Biology]).`,
            };
          }
        }
      }

      for (let g = 0; g < profession.choiceSkills.length; g++) {
        const group = profession.choiceSkills[g];
        const selection = choiceSelections[g] ?? {
          selected: [],
          subtypes: {},
        };
        const selectedCount = selection.selected.length;

        if (selectedCount < group.choose) {
          return {
            canApply: false,
            reason: `Choose ${group.choose} option(s) in each choice group.`,
          };
        }

        for (const optIdx of selection.selected) {
          const opt = group.options[optIdx];
          if (!opt) continue;
          if (opt.typed) {
            const subtype = selection.subtypes[optIdx] ?? "";
            if (!subtype.trim()) {
              return {
                canApply: false,
                reason:
                  "Provide subtypes for all selected typed skills (e.g. Foreign Language [Arabic]).",
              };
            }
          }
        }
      }

      return { canApply: true, reason: null };
    },
    [choiceSelections, fixedSkillSubtypes]
  );

  const applyState = getApplyState(currentProfession);
  const hasAppliedCurrent =
    !!currentProfession && lastAppliedProfession === currentProfession.name;

  const handleApplyProfession = () => {
    if (!currentProfession || !applyState.canApply) return;

    const { skills, typedSkills } = buildSkillsForStandardProfession(
      blankSkills,
      currentProfession,
      choiceSelections,
      fixedSkillSubtypes
    );

    const updated: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));
    updated.system.biography.profession = currentProfession.name;
    updated.system.skills = skills;
    updated.system.typedSkills = typedSkills;

    if (!Array.isArray(updated.items)) {
      updated.items = [];
    }
    updated.items = updated.items.filter((it) => it.type !== "bond");

    if (currentProfession.bonds > 0) {
      const chaValue = updated.system.statistics.cha.value;
      for (let i = 0; i < currentProfession.bonds; i++) {
        const label = `Bond ${i + 1}`;
        updated.items.push({
          type: "bond",
          _id: nanoid(),
          name: label,
          img: "systems/deltagreen/assets/icons/person-black-bg.svg",
          system: {
            name: label,
            description: "",
            score: chaValue,
            relationship: "",
            hasBeenDamagedSinceLastHomeScene: false,
          },
        });
      }
    }

    updateAgent(updated);
    setLastAppliedProfession(currentProfession.name);
  };

  const buttonLabel = currentProfession
    ? hasAppliedCurrent
      ? `✓ Applied ${currentProfession.name} Profession`
      : `Apply ${currentProfession.name} Profession to Agent`
    : "Apply Profession to Agent";

  const buttonDisabled = !applyState.canApply || hasAppliedCurrent;

  const buttonTitle = !applyState.canApply
    ? applyState.reason ?? ""
    : hasAppliedCurrent
    ? "This profession has already been applied. Select a different profession to change it."
    : "";

  
return (
  <section className="bb-profession-section">

    <p className="bb-section-help">
      Choose an occupation to determine your starting skill kit and number of
      Bonds. You can fine-tune skill points later in the SKILLS section.
    </p>


      <ProfessionSelector
        professions={professions}
        selectedProfession={selectedProfession}
        setSelectedProfession={(name) => {
          setSelectedProfession(name);
          setLastAppliedProfession(null);
          onSelectProfession?.(name || null);
        }}
        choiceSelections={choiceSelections}
        setChoiceSelections={setChoiceSelections}
        fixedSkillSubtypes={fixedSkillSubtypes}
        setFixedSkillSubtypes={setFixedSkillSubtypes}
        onProfessionChange={() => {
          setChoiceSelections({});
          setFixedSkillSubtypes({});
          setLastAppliedProfession(null);
        }}
        onOpenCustomProfessionModal={() => setIsCustomModalOpen(true)}
      />
        
      <div className="bb-profession-actions">
        <button
          type="button"
          className="bb-button bb-button--apply"
          onClick={handleApplyProfession}
          disabled={buttonDisabled}
          title={buttonTitle}
        >
          {buttonLabel}
        </button>
      </div>

      {currentProfession && (
        <div className="bb-section-note">
          <p>
            Applying a profession will overwrite the agent's current skill values
            with that profession's kit.
          </p>
        </div>
      )}

      <CustomProfessionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        professions={professions}
        onProfessionsChange={(next) => {
          setProfessions(next);
        }}
        onAfterSave={(savedName) => {
          setSelectedProfession(savedName);
          setLastAppliedProfession(null);
          onSelectProfession?.(savedName || null);
        }}
      />
    </section>
  );
};

export default ProfessionSection;