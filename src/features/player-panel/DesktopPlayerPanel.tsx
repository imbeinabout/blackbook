// src/features/player-panel/PlayerPanel.tsx
import React from "react";
import type { PlayerPanelProps } from "./PlayerPanel";

import { PlayerPanelLayout } from "./PlayerPanel.layout";

import PersonalDataCard from "./cards/PersonalDataCard";
import StatusCard from "./cards/StatusCard"
import PlayerBondsCard from "./cards/PlayerBondsCard";
import SanityAdaptationCard from "./cards/SanityAdaptationCard";
import SanLuckCard from "./cards/SanLuckCard";
import PlayerMotivationsCard from "./cards/PlayerMotivationsCard";
import ConditionsCard from "./cards/ConditionsCard";
import ModalsCard from "./cards/ModalsCard";
import SkillsCard from "./cards/SkillsCard";
import TabsCard from "./cards/TabsCard";
import SpecialTrainingCard from "./cards/SpecialTrainingCard";

const DesktopPlayerPanel: React.FC<PlayerPanelProps> = ({
  agent,
  baseSkills,
  bonusSkillPoints,
  veteranSkillPoints,
  headArmorRating,
  bodyArmorRating,
  headArmorTooltip,
  bodyArmorTooltip,
  bottomTabs,
  activeBottomTab,
  setActiveBottomTab,
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
  setOpenAddDisorderFromTemplate,
}) => {
  if (!agent) {
    return (
      <main className="bb-player-panel">
        <p style={{ padding: "1rem" }}>No agent loaded.</p>
      </main>
    );
  }

  const name = agent.name ?? "Unnamed Agent";
  const profession = agent.system.biography.profession ?? "Unknown Profession";

  // -----------------------------
  // TOP LEFT: Personal + Status
  // -----------------------------
  const topLeft = (
    <>
      {/* PERSONAL DATA */}
      <PersonalDataCard
        agent = {agent}
        openStatRoll={openStatRoll}
      />

      {/* STATUS */}
      <StatusCard
        agent = {agent}
        headArmorRating={headArmorRating}
        bodyArmorRating={bodyArmorRating}
        headArmorTooltip={headArmorTooltip}
        bodyArmorTooltip={bodyArmorTooltip}
        setEditTrack={setEditTrack}
      />
    </>
  );

  // -----------------------------
  // TOP MIDDLE: Bonds + Sanity Adaptation + SAN/LUCK buttons
  // -----------------------------
  const topMiddle = (
    <>
      <PlayerBondsCard agent={agent} updateAgent={updateAgent} />
      <SanityAdaptationCard
        agent={agent}
        onMutateAgent={updateAgentViaMutator}
        onRollD6={openGenericRoll}
      />
      <SanLuckCard
        agent={agent}
        openLuckTest={openLuckTest}
        openSanityTest={openSanityTest}
      />
    </>
  );

  // -----------------------------
  // TOP RIGHT: Motivations + Conditions + Modals buttons
  // -----------------------------
  const topRight = (
    <>
      <PlayerMotivationsCard
        agent={agent}
        updateAgent={updateAgent}
        onRequestAddDisorder={requestAddDisorder}
      />
      <ConditionsCard agent={agent} updateAgentViaMutator={updateAgentViaMutator}/>
      <ModalsCard 
        agent={agent} 
        updateAgentViaMutator={updateAgentViaMutator} 
        onGenericRoll={openGenericRoll}
        openStatRoll={openStatRoll}
        openSkillRoll={openSkillRoll}
        openSanityTest={openSanityTest}
        openLuckTest={openLuckTest}
      />
    </>
  );

  // -----------------------------
  // BOTTOM LEFT: Skills list
  // -----------------------------
  const bottomLeft = (
    <SkillsCard
      agent={agent}
      baseSkills={baseSkills}
      bonusSkillPoints={bonusSkillPoints}
      veteranSkillPoints={veteranSkillPoints}
      onRollSkill={openSkillRoll}
      updateAgentViaMutator={updateAgentViaMutator}
    />
  );

  // -----------------------------
  // BOTTOM RIGHT: Tabs + Special Training
  // -----------------------------
  const bottomRight = (
    <>
      <TabsCard
        agent={agent}
        bottomTabs={bottomTabs}
        activeBottomTab={activeBottomTab}
        setActiveBottomTab={setActiveBottomTab}
        openSkillRoll={openSkillRoll}
        openDamageRoll={openDamageRoll}
        openLethalityRoll={openLethalityRoll}
        updateAgent={updateAgent}
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
  );

  // Floating action: d100 button
  const floatingAction = (
    <button
      className="bb-dice-button"
      type="button"
      onClick={() => openGenericRoll("Free Roll", "")}
    >
      d100
    </button>
  );

  return (
    <PlayerPanelLayout
      topLeft={topLeft}
      topMiddle={topMiddle}
      topRight={topRight}
      bottomLeft={bottomLeft}
      bottomRight={bottomRight}
      floatingAction={floatingAction}
    />
  );
};

export default DesktopPlayerPanel;