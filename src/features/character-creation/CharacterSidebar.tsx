// src/features/character-creation/CharacterSidebar.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import type { StatKey } from "../../models/characterCreationTypes";
import type { CreationSectionKey, SectionLock } from "./creation.types";

// Import section components
import PersonalDataSection from "./sections/PersonalDataSection";
import StatsSection from "./sections/StatsSection";
import ProfessionSection from "./sections/ProfessionSection";
import SkillsSection from "./sections/SkillsSection";
import BondsSection from "./sections/BondsSection";
import MotivationsSection from "./sections/MotivationsSection";
import DamagedVeteranSection from "./sections/DamagedVeteranSection";

type SidebarSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  locked?: boolean;
  lockReason?: string;
  children: React.ReactNode;
};

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  isOpen,
  onToggle,
  locked = false,
  lockReason,
  children,
}) => {
  const icon = locked ? "🔒" : isOpen ? "▾" : "▸";
  const headerTitle = locked ? lockReason ?? "This section is locked." : title;

  return (
    <section className="bb-sidebar-section">
      <button
        type="button"
        className={
          "bb-sidebar-section__header" +
          (locked ? " bb-sidebar-section__header--locked" : "") +
          (isOpen ? " bb-sidebar-section__header--open" : "")
        }
        onClick={onToggle}
        title={headerTitle}
      >
        <span className="bb-sidebar-section__icon">{icon}</span>
        <span className="bb-sidebar-section__title">{title}</span>
      </button>

      {isOpen && (
        <div
          className={
            "bb-sidebar-section__body" +
            (locked ? " bb-sidebar-section__body--locked" : "")
          }
        >
          {children}
        </div>
      )}
    </section>
  );
};

export type CharacterSidebarProps = {
  agent: DeltaGreenAgent | null;

  navigation: {
    openSection: CreationSectionKey;
    setOpenSection: (k: CreationSectionKey) => void;
    statMode: "Assigned" | "Rolled";
    statSum: number;
    getSectionLock: (
      k: CreationSectionKey,
      agent: DeltaGreenAgent | null
    ) => SectionLock;
    onBlockedNav: (msg: string) => void;
  };

  creationState: {
    STAT_KEYS: readonly StatKey[];
    baseSkills: any;
    bonusSkillPoints: Record<string, number>;
    veteranSkillPoints: Record<string, number>;
    selectedProfessionId: string | null;
    selectedBonusPackageId: string | null;
    damagedVeteranTemplateId: string | null;
    inPlay: boolean;
  };

  creationActions: {
    setStatMode: (m: "Assigned" | "Rolled") => void;
    updateActiveAgentField: (path: string[], value: any) => void;

    selectProfession: (id: string | null) => void;
    updateAgent: (agent: DeltaGreenAgent) => void;

    setBonusSkillPoints: React.Dispatch<
      React.SetStateAction<Record<string, number>>
    >;
    setVeteranSkillPoints: React.Dispatch<
      React.SetStateAction<Record<string, number>>
    >;

    selectBonusPackage: (id: string | null) => void;
    finalizeBonusSkills: () => void;
    resetSkills: () => void;

    selectDamagedVeteranTemplate: (id: string | null) => void;
    applyDamagedVeteranTemplate: () => void;
    resetDamagedVeteranTemplate: () => void;

    enterPlayMode: () => void;
    exitPlayMode: () => void;

    requestAddDisorder?: () => void;
    setAgent: React.Dispatch<React.SetStateAction<DeltaGreenAgent>>;
  };
};

const creationSections: CreationSectionKey[] = [
  "IDENTITY",
  "STATS",
  "PROFESSION",
  "SKILLS",
  "BONDS",
  "MOTIVATIONS",
  "DAMAGED VETERAN",
];

const CharacterSidebar: React.FC<CharacterSidebarProps> = (props) => {
  const {
    agent,
    navigation,
    creationState,
    creationActions
  } = props;

  
const {
    openSection,
    setOpenSection,
    statMode,
    statSum,
    getSectionLock,
    onBlockedNav,
  } = navigation;

  const {
    STAT_KEYS,
    baseSkills,
    bonusSkillPoints,
    veteranSkillPoints,
    selectedProfessionId,
    selectedBonusPackageId,
    damagedVeteranTemplateId,
    inPlay,
  } = creationState;

  const {
    setStatMode,
    updateActiveAgentField,
    selectProfession,
    selectBonusPackage,
    updateAgent,
    setBonusSkillPoints,
    setVeteranSkillPoints,
    finalizeBonusSkills,
    resetSkills,
    selectDamagedVeteranTemplate,
    applyDamagedVeteranTemplate,
    resetDamagedVeteranTemplate,
    enterPlayMode,
    exitPlayMode,
    requestAddDisorder,
    setAgent,
  } = creationActions;

  return (
    <aside className="bb-sidebar">
      {creationSections.map((sectionKey) => {
        const lock = getSectionLock(sectionKey, agent);

        return (
          <SidebarSection
            key={sectionKey}
            title={sectionKey}
            isOpen={openSection === sectionKey}
            onToggle={() => {
              if (lock.locked) {
                onBlockedNav(lock.reason ?? "This section is locked.");
                return;
              }

              // block leaving STATS when invalid
              if (
                openSection === "STATS" &&
                sectionKey !== "STATS" &&
                statMode === "Assigned" &&
                statSum > 72
              ) {
                onBlockedNav("⚠️ You must reduce your stats to 72 before continuing.");
                return;
              }

              setOpenSection(sectionKey);
            }}
            locked={lock.locked}
            lockReason={lock.reason}
          >
            {lock.locked ? (
              <p className="bb-sidebar-locked-msg">{lock.reason}</p>
            ) : sectionKey === "IDENTITY" ? (
              agent ? (
                <PersonalDataSection agent={agent} updateField={updateActiveAgentField} />
              ) : (
                <p>Load or create an agent to edit personal data.</p>
              )
            ) : sectionKey === "STATS" ? (
              agent ? (
                <StatsSection
                  agent={agent}
                  stats={STAT_KEYS}
                  statMode={statMode}
                  setStatMode={setStatMode}
                  updateField={updateActiveAgentField}
                />
              ) : (
                <p>Load or create an agent to edit stats.</p>
              )
            ) : sectionKey === "PROFESSION" ? (
              agent ? (
                <ProfessionSection
                  agent={agent}
                  selectedProfessionId={selectedProfessionId}
                  onSelectProfession={selectProfession}
                  updateAgent={updateAgent}
                />
              ) : (
                <p>Load or create an agent to choose a profession.</p>
              )
            ) : sectionKey === "SKILLS" ? (
              agent ? (
                <SkillsSection
                  agent={agent}
                  baseSkills={baseSkills}
                  bonusSkillPoints={bonusSkillPoints}
                  setBonusSkillPoints={setBonusSkillPoints}
                  veteranSkillPoints={veteranSkillPoints}
                  updateAgent={updateAgent}
                  selectedBonusPackageId={selectedBonusPackageId}
                  onSelectedBonusPackageChange={selectBonusPackage}
                  onBonusSkillsFinalized={finalizeBonusSkills}
                  onSkillsReset={resetSkills}
                />
              ) : (
                <p>Load or create an agent to allocate skills.</p>
              )
            ) : sectionKey === "BONDS" ? (
              agent ? (
                <BondsSection agent={agent} updateAgent={updateAgent} />
              ) : (
                <p>Load or create an agent to define bonds.</p>
              )
            ) : sectionKey === "MOTIVATIONS" ? (
              agent ? (
                <MotivationsSection agent={agent} updateAgent={updateAgent} />
              ) : (
                <p>Load or create an agent to define motivations.</p>
              )
            ) : sectionKey === "DAMAGED VETERAN" ? (
              agent ? (
                <DamagedVeteranSection
                  agent={agent}
                  setAgent={setAgent}
                  veteranSkillPoints={veteranSkillPoints}
                  setVeteranSkillPoints={setVeteranSkillPoints}
                  selectedTemplateId={damagedVeteranTemplateId}
                  onTemplateSelected={selectDamagedVeteranTemplate}
                  onTemplateApplied={applyDamagedVeteranTemplate}
                  onTemplateReset={resetDamagedVeteranTemplate}
                  onRequestAddDisorder={requestAddDisorder}
                />
              ) : (
                <p>Load or create an agent to configure Damaged Veteran options.</p>
              )
            ) : (
              <>
                <p>{sectionKey} content placeholder (creator fields go here).</p>
                <p>Lock/complete logic will be added later.</p>
              </>
            )}
          </SidebarSection>
        );
      })}

      {/* PLAY MODE CONTROLS */}
      <div className="bb-sidebar-play-controls">
        {!inPlay ? (
          <button
            type="button"
            className="bb-button bb-button--primary"
            onClick={enterPlayMode}
            disabled={!agent}
            title={
              agent
                ? "Lock creation sections and use the main sheet for play."
                : "Create or load an Agent first."
            }
          >
            ▶ ENTER PLAY MODE
          </button>
        ) : (
          <button
            type="button"
            className="bb-button bb-button--danger"
            onClick={exitPlayMode}
            title="Exit PLAY mode and reset this Agent to their pre-play baseline."
          >
            ⏹ EXIT PLAY MODE
          </button>
        )}
      </div>
    </aside>
  );
};

export default CharacterSidebar;