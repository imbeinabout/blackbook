// src/features/player-panel/cards/TabsCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import type { BottomTabKey } from "../playerPanel.types";

import { WeaponsTab } from "../tabs/WeaponsTab";
import { ArmorTab } from "../tabs/ArmorTab";
import { GearTab } from "../tabs/GearTab";
import { WoundsTab } from "../tabs/WoundsTab";
import { DetailsTab } from "../tabs/DetailsTab";
import { NotesTab } from "../tabs/NotesTab";
import { TerminalTab } from "../tabs/TerminalTab";

type TabsCardProps = {
  agent: DeltaGreenAgent;

  bottomTabs: { key: BottomTabKey; label: string }[];
  activeBottomTab: BottomTabKey;
  setActiveBottomTab: (k: BottomTabKey) => void;

  openSkillRoll: (label: string, chance: number) => void;
  openDamageRoll: (weapon: string, formula: string) => void;
  openLethalityRoll: (weapon: string, lethality: number) => void;

  updateAgent: (updated: DeltaGreenAgent) => void;
};

const TabsCard: React.FC<TabsCardProps> = ({
  agent,
  bottomTabs,
  activeBottomTab,
  setActiveBottomTab,
  openSkillRoll,
  openDamageRoll,
  openLethalityRoll,
  updateAgent,
}) => {
  return (
    <>
      <nav className="bb-tabs">
        {bottomTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={
              "bb-tabs__tab" + (activeBottomTab === tab.key ? " bb-tabs__tab--active" : "")
            }
            onClick={() => setActiveBottomTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="bb-tabs-wrapper">
        <div className="bb-tabs__content">
          {activeBottomTab === "weapons" && (
            <WeaponsTab
              agent={agent}
              onRollSkill={openSkillRoll}
              onRollDamage={openDamageRoll}
              onRollLethality={openLethalityRoll}
            />
          )}

          {activeBottomTab === "armor" && <ArmorTab agent={agent} />}
          {activeBottomTab === "gear" && <GearTab agent={agent} />}
          {activeBottomTab === "wounds" && <WoundsTab agent={agent} />}
          {activeBottomTab === "details" && <DetailsTab agent={agent} updateAgent={updateAgent} />}
          {activeBottomTab === "notes" && <NotesTab agent={agent} updateAgent={updateAgent} />}
          {activeBottomTab === "shell" && <TerminalTab />}
        </div>
      </div>
    </>
  );
};

export default TabsCard;