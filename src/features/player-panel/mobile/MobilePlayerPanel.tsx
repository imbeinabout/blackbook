import React from "react";

import "./MobilePlayerPanel.css"

import type { PlayerPanelProps } from "../PlayerPanel";
import { MOBILE_SECTIONS, MobileSection } from "./mobileSections";
import { MobileSectionNav } from "./MobileSectionNav";

// Cards
import PersonalDataCard from "../cards/PersonalDataCard";
import PlayerMotivationsCard from "../cards/PlayerMotivationsCard";
import StatusCard from "../cards/StatusCard";
import SanityAdaptationCard from "../cards/SanityAdaptationCard";
import ConditionsCard from "../cards/ConditionsCard";
import SanLuckCard from "../cards/SanLuckCard";
import SkillsCard from "../cards/SkillsCard";
import SpecialTrainingCard from "../cards/SpecialTrainingCard";
import PlayerBondsCard from "../cards/PlayerBondsCard";
import ModalsCard from "../cards/ModalsCard";

// Tabs reused as content
import { WeaponsTab } from "../tabs/WeaponsTab";
import { ArmorTab } from "../tabs/ArmorTab";
import { GearTab } from "../tabs/GearTab";
import { WoundsTab } from "../tabs/WoundsTab";
import { DetailsTab } from "../tabs/DetailsTab";
import { NotesTab } from "../tabs/NotesTab";
import { TerminalTab } from "../tabs/TerminalTab";

const MobilePlayerPanel: React.FC<PlayerPanelProps> = (props) => {
  const {
    agent,
    baseSkills,
    bonusSkillPoints,
    veteranSkillPoints,
    headArmorRating,
    bodyArmorRating,
    headArmorTooltip,
    bodyArmorTooltip,
    openSkillRoll,
    openStatRoll,
    openDamageRoll,
    openLethalityRoll,
    openGenericRoll,
    openSanityTest,
    openLuckTest,
    updateAgent,
    updateAgentViaMutator,
    requestAddDisorder,
    setEditTrack,
  } = props;

  const [section, setSection] = React.useState<MobileSection>("persona");
  const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);

  if (!agent) {
    return <main className="bb-player-panel">No agent loaded.</main>;
  }

  function TerminalOverlay({ onClose }: { onClose: () => void }) {
  return (
      <div className="bb-mobile-overlay">
        <button onClick={onClose}>Close</button>
        <TerminalTab />
      </div>
    );
  }

  return (
    <main className="bb-player-panel bb-player-panel--mobile">
      <MobileSectionNav
        active={section}
        onSelect={setSection}
      />

      <div className="bb-mobile-section-content">
        {section === "persona" && (
          <>
            <PersonalDataCard agent={agent} openStatRoll={openStatRoll} />
            <DetailsTab agent={agent} updateAgent={updateAgent} />
            <PlayerMotivationsCard
              agent={agent}
              updateAgent={updateAgent}
              onRequestAddDisorder={requestAddDisorder}
            />
          </>
        )}

        {section === "status" && (
          <>
            <StatusCard
              agent={agent}
              headArmorRating={headArmorRating}
              bodyArmorRating={bodyArmorRating}
              headArmorTooltip={headArmorTooltip}
              bodyArmorTooltip={bodyArmorTooltip}
              setEditTrack={setEditTrack}
            />
            <SanityAdaptationCard
              agent={agent}
              onMutateAgent={updateAgentViaMutator}
              onRollD6={openGenericRoll}
            />
            <ConditionsCard
              agent={agent}
              updateAgentViaMutator={updateAgentViaMutator}
            />
            <WoundsTab agent={agent}/>
          </>
        )}

        {section === "skills" && (
          <>
            <SanLuckCard
              agent={agent}
              openLuckTest={openLuckTest}
              openSanityTest={openSanityTest}
            />
            <SkillsCard
              agent={agent}
              baseSkills={baseSkills}
              bonusSkillPoints={bonusSkillPoints}
              veteranSkillPoints={veteranSkillPoints}
              onRollSkill={openSkillRoll}
              updateAgentViaMutator={updateAgentViaMutator}
            />
            <SpecialTrainingCard
              agent={agent}
              baseSkills={baseSkills}
              bonusSkillPoints={bonusSkillPoints}
              veteranSkillPoints={veteranSkillPoints}
              onUpdateAgent={updateAgent}
              onOpenSkillRoll={openSkillRoll}
              onOpenStatRoll={openStatRoll}
            />
          </>
        )}

        {section === "gear" && (
          <>
            <WeaponsTab
              agent={agent}
              onRollSkill={openSkillRoll}
              onRollDamage={openDamageRoll}
              onRollLethality={openLethalityRoll}
            />
            <ArmorTab agent={agent} />
            <GearTab agent={agent} />
          </>
        )}

        {section === "bonds" && (
          <PlayerBondsCard agent={agent} updateAgent={updateAgent} />
        )}

        {section === "tools" && (
          <>
            <ModalsCard
              agent={agent}
              updateAgentViaMutator={updateAgentViaMutator}
              onGenericRoll={openGenericRoll}
              openStatRoll={openStatRoll}
              openSkillRoll={openSkillRoll}
              openSanityTest={openSanityTest}
              openLuckTest={openLuckTest}
            />

            <button
              className="bb-button"
              onClick={() => setIsTerminalOpen(true)}
            >
              Open Terminal
            </button>

            <NotesTab agent={agent} updateAgent={updateAgent} />
          </>
        )}
      </div>

      {isTerminalOpen && (
        <TerminalOverlay onClose={() => setIsTerminalOpen(false)} />
      )}
    </main>
  );
};

export default MobilePlayerPanel;