// src/features/player-panel/PlayerPanel.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import type { TrackType } from "../modals/StatusAdjustModal";
import { BottomTabKey } from "./playerPanel.types";

import { useLayoutMode } from "../../hooks/useLayoutMode";
import MobilePlayerPanel from "./mobile/MobilePlayerPanel";
import DesktopPlayerPanel from "./DesktopPlayerPanel";

export type PlayerPanelProps = {
  agent: DeltaGreenAgent | null;
  activeAgentId: string | null;

  // stats
  statSum: number;

  // skills
  baseSkills: any;
  bonusSkillPoints: Record<string, number>;
  veteranSkillPoints: Record<string, number>;

  // armor
  headArmorRating: number;
  bodyArmorRating: number;
  headArmorTooltip: string;
  bodyArmorTooltip: string;

  // bottom tabs
  bottomTabs: { key: BottomTabKey; label: string }[];
  activeBottomTab: BottomTabKey;
  setActiveBottomTab: (k: BottomTabKey) => void;

  // rolls
  openSkillRoll: (label: string, chance: number) => void;
  openStatRoll: (label: string, x5: number) => void;
  openDamageRoll: (weapon: string, formula: string) => void;
  openLethalityRoll: (weapon: string, lethality: number) => void;
  openGenericRoll: (label: string, formula: string) => void;
  openSanityTest: () => void;
  openLuckTest: () => void;

  // agent mutation
  updateAgent: (updated: DeltaGreenAgent) => void;
  updateAgentViaMutator: (mutate: (copy: DeltaGreenAgent) => void) => void;

  // UI hooks
  setEditTrack: (t: TrackType) => void;
  setOpenAddDisorderFromTemplate: (fn: (() => void) | null) => void;
  requestAddDisorder: () => void;
};

const PlayerPanel: React.FC<PlayerPanelProps> = (props) => {
  const layoutMode = useLayoutMode();

  if (layoutMode === "mobile") {
    return <MobilePlayerPanel {...props} />;
  }

  return <DesktopPlayerPanel {...props} />;
};

export default PlayerPanel;