import React from "react";

import "./MobilePlayerPanel.css"
import { CardShell } from "../../../components/ui/CardShell";

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

  const sectionOrder = React.useMemo(
    () => MOBILE_SECTIONS.map(s => s.key),
    []
  );
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const [transitionDir, setTransitionDir] = React.useState<"left" | "right" | null>(null);

  if (!agent) {
    return <main className="bb-player-panel">No agent loaded.</main>;
  }

  function handleTouchStart(e: React.TouchEvent) {
  const touch = e.touches[0];
  touchStartX.current = touch.clientX;
  touchStartY.current = touch.clientY;
}

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    const HORIZONTAL_THRESHOLD = 50;

    // Ignore mostly-vertical gestures
    if (Math.abs(dx) < HORIZONTAL_THRESHOLD || Math.abs(dx) < Math.abs(dy)) {
      return;
    }

    const currentIndex = sectionOrder.indexOf(section);

    if (dx < 0 && currentIndex < sectionOrder.length - 1) {
      setTransitionDir("left");
      setSection(sectionOrder[currentIndex + 1]);
    }

    if (dx > 0 && currentIndex > 0) {
      setTransitionDir("right");
      setSection(sectionOrder[currentIndex - 1]);
    }
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
        onSelect={(next) => {
          const currentIndex = sectionOrder.indexOf(section);
          const nextIndex = sectionOrder.indexOf(next);
          setTransitionDir(nextIndex > currentIndex ? "left" : "right");
          setSection(next);
        }}
      />

      <div         
        className={`bb-mobile-section-content ${
            transitionDir ? `is-${transitionDir}` : ""
          }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onAnimationEnd={() => setTransitionDir(null)}
      >
        <div className="bb-mobile-section-inner">
        {section === "persona" && (
          <>
            <PersonalDataCard agent={agent} openStatRoll={openStatRoll} />
            <CardShell>
              <DetailsTab agent={agent} updateAgent={updateAgent} />
            </CardShell>
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
            <CardShell>
              <WoundsTab agent={agent}/>
            </CardShell>
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
            <CardShell>
              <WeaponsTab
                agent={agent}
                onRollSkill={openSkillRoll}
                onRollDamage={openDamageRoll}
                onRollLethality={openLethalityRoll}
              />
            </CardShell>
            <CardShell>
              <ArmorTab agent={agent} />
            </CardShell>
            <CardShell>
              <GearTab agent={agent} />
            </CardShell>
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
              openTerminal={() => setIsTerminalOpen(true)}
            />
            <CardShell>
              <NotesTab agent={agent} updateAgent={updateAgent} />
            </CardShell>
          </>
        )}
        </div>
      </div>

      {isTerminalOpen && (
        <TerminalOverlay onClose={() => setIsTerminalOpen(false)} />
      )}
        <button
          className="bb-dice-button bb-only-mobile"
          onClick={() => openGenericRoll("Free Roll", "")}
          aria-label="Roll d100"
        >
          d100
        </button>
    </main>
  );
};

export default MobilePlayerPanel;