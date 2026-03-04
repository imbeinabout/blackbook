// src/pages/MainPage.tsx
import React from "react";

import "./MainPage.css"

import { MainPageLayout } from "./MainPage.layout";

import { useAgentStore } from "../../store/agentStore";
import type { CreationMeta, DeltaGreenAgent } from "../../models/DeltaGreenAgent";

import Header from "../../components/layout/Header";
import CharacterSidebar from "../../features/character-creation";
import PlayerPanel from "../../features/player-panel";
import Footer from "../../components/layout/Footer"

import { getCreationMeta, getSectionLock } from "../../features/character-creation/creation.logic";

import StatusAdjustModal, { TrackType } from "../../features/modals/StatusAdjustModal";
import DiceTray from "../../features/dice/DiceTray";
import { getEffectiveSanTestChance } from "../../features/player-panel/conditionRolls";
import AddDisorderModal from "../../features/modals/AddDisorderModal";

import { StatKey } from "../../models/characterCreationTypes";
import { buildBaseSkills } from "../../models/baseSkills";

type MainPageProps = {
  onCloseAgent: () => void;
  onNewAgent: () => void;
  onLoadAgent: () => void;
};

type BottomTabKey =
  | "weapons"
  | "armor"
  | "gear"
  | "wounds"
  | "details"
  | "notes"
  | "shell";

type SectionLock = {
  locked: boolean;
  reason?: string;
};

const bottomTabs: { key: BottomTabKey; label: string }[] = [
  { key: "weapons", label: "WEAPONS" },
  { key: "armor", label: "ARMOR" },
  { key: "gear", label: "GEAR" },
  { key: "wounds", label: "WOUNDS/AILMENTS" },
  { key: "details", label: "DETAILS" },
  { key: "notes", label: "NOTES" },
  { key: "shell", label: "SHELL" },
];

const creationSections = [
  "IDENTITY",
  "STATS",
  "PROFESSION",
  "SKILLS",
  "BONDS",
  "MOTIVATIONS",
  "DAMAGED VETERAN",
] as const;
  type CreationSectionKey = (typeof creationSections)[number];

const MainPage: React.FC<MainPageProps> = ({ 
  onCloseAgent, 
  onNewAgent, 
  onLoadAgent 
}) => {

  const emptyBonus: Record<string, number> = {};
  const emptyVeteran: Record<string, number> = {};
  const baseSkills = React.useMemo(() => buildBaseSkills(), []);

  const [toast, setToast] = React.useState<string | null>(null);

  const [isAddDisorderOpen, setIsAddDisorderOpen] = React.useState(false);

  const openAddDisorderModal = React.useCallback(() => {
    setIsAddDisorderOpen(true);
  }, []);

  const closeAddDisorderModal = React.useCallback(() => {
    setIsAddDisorderOpen(false);
  }, []);

  React.useEffect(() => {
    if (toast) {
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }
  }, [toast]);

  const { agents, activeAgentId, openAgentIds, setActiveAgent, closeAgent, updateAgent } =
    useAgentStore();

  const agent: DeltaGreenAgent | null =
  activeAgentId && agents[activeAgentId] ? agents[activeAgentId] : null;

  const linkableMotivations = React.useMemo(() => {
    if (!agent) return [];

    const motivations = (agent.items ?? []).filter((it: any) => it.type === "motivation");

    const motivationsForList = motivations.filter((mot: any) => {
      const label = (mot.system?.name ?? mot.name ?? "").trim();
      return label.length > 0;
    });

    return motivationsForList.filter((mot: any) => {
      const hasDisorder = (mot.system?.disorder ?? "").trim().length > 0;
      return !hasDisorder;
    });
  }, [agent]);

  const creationMeta = getCreationMeta(agent);
  const inPlay = creationMeta.playMode?.isPlaying === true;

  // Creation meta derived from the active agent; falls back to empty maps.
  const bonusSkillPoints: Record<string, number> = creationMeta.bonusSkillPointsByKey;
  const veteranSkillPoints: Record<string, number> = creationMeta.veteranSkillPointsByKey;
  const selectedProfessionId = creationMeta.selectedProfessionId ?? null;
  const selectedBonusPackageId = creationMeta.selectedBonusPackageId ?? null;
  const damagedVeteranTemplateId = creationMeta.damagedVeteranTemplateId ?? null;
  
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImportFromFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        window.alert("Could not read file.");
        return;
      }

      try {
        const parsed = JSON.parse(text) as DeltaGreenAgent;

        const { createAgent } = useAgentStore.getState();
      } catch (err) {
        console.error("Failed to import agent JSON", err);
        window.alert("Import failed: file is not a valid agent JSON.");
      }
    };

    reader.onerror = () => {
      window.alert("Failed to read file.");
    };

    reader.readAsText(file);
  };

  const handleImportFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleImportFromFile(file);

    event.target.value = "";
  };

  const handleExportAgent = () => {
    if (!activeAgentId || !agent) {
      window.alert("No active agent to export.");
      return;
    }

    try {
      const json = JSON.stringify(agent, null, 2);

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      const safeName = (agent.name || "agent")
        .replace(/[^a-z0-9_-]+/gi, "_")
        .slice(0, 40); // keep it tidy

      link.href = url;
      link.download = `dg-agent-${safeName || "agent"}-${activeAgentId}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export agent:", err);
      window.alert("Failed to export agent JSON.");
    }
  };

  const [openCreationSection, setOpenCreationSection] = React.useState<CreationSectionKey>("IDENTITY");
  const [activeBottomTab, setActiveBottomTab] = React.useState<BottomTabKey>("weapons");
  const [statMode, setStatMode] = React.useState<"Assigned" | "Rolled">("Assigned");

  const [editTrack, setEditTrack] = React.useState<null | TrackType>(null);
  const [editValue, setEditValue] = React.useState<string>("");

  const [openAddDisorderFromTemplate, setOpenAddDisorderFromTemplate] =
   React.useState<(() => void) | null>(null);
  
  const [isDiceTrayOpen, setIsDiceTrayOpen] = React.useState(false);
  const [pendingRollName, setPendingRollName] = React.useState<string | null>(
    null
  );
  const [pendingRollFormula, setPendingRollFormula] =
    React.useState<string | null>(null);

  const [pendingAdaptationDie, setPendingAdaptationDie] = React.useState<
    number | null
  >(null);

  const openGenericRoll = (label: string, formula: string) => {
    setPendingRollName(label);
    setPendingRollFormula(formula);
    setIsDiceTrayOpen(true);
  };
  
  const openSkillRoll = (label: string, chance: number) => {
    const safeChance = Math.max(0, Math.min(100, Math.floor(chance)));
    setPendingRollName(`${label} ${safeChance}%`);
    setPendingRollFormula(`1d100<=${safeChance}`);
    setIsDiceTrayOpen(true);
  };

  const openStatRoll = (label: string, x5: number) => {
    const safeChance = Math.max(0, Math.min(100, Math.floor(x5)));
    setPendingRollName(`${label} ${safeChance}%`);
    setPendingRollFormula(`1d100<=${safeChance}`);
    setIsDiceTrayOpen(true);
  };

  
  const openDamageRoll = (weaponName: string, damageFormula: string) => {
    setPendingRollName(`${weaponName} Damage`);
    setPendingRollFormula(damageFormula);
    setIsDiceTrayOpen(true);
  };

  const openLethalityRoll = (weaponName: string, lethalityPercent: number) => {
    const safeChance = Math.max(0, Math.min(100, Math.round(lethalityPercent)));
    setPendingRollName(`${weaponName} Lethality`);
    setPendingRollFormula(`1d100<=${safeChance}`);
    setIsDiceTrayOpen(true);
  };

  const openSanityTest = () => {
    if (!agent) return;

    const baseSan = agent.system.sanity?.value ?? 0;
    const { chance: eff, adj } = getEffectiveSanTestChance(agent, baseSan);

    const modText =
      adj.delta !== 0 ? ` (${adj.delta >= 0 ? "+" : ""}${adj.delta})` : "";

    setPendingRollName(`SAN Test ${eff}%${modText}`);
    setPendingRollFormula(`1d100<=${eff}`);
    setIsDiceTrayOpen(true);
  };

  const openLuckTest = () => {
    const chance = 50; // flat 50%
    setPendingRollName(`Luck Test ${chance}%`);
    setPendingRollFormula(`1d100<=${chance}`);
    setIsDiceTrayOpen(true);
  };

  const enterPlayMode = () => {
    if (!activeAgentId || !agent) return;

    // Snapshot current agent as baseline
    const baselineJson = JSON.stringify(agent);

    updateCreationMeta(activeAgentId, (prev) => ({
      ...prev,
      playMode: {
      isPlaying: true,
      baselineAgentJson: baselineJson,
      },
    }));

    const details = agent?.system?.details;
    const detailsIncomplete =
      !details ||
      !details.physicalDescription?.trim() ||
      !details.personalDetails?.trim();

    if (detailsIncomplete) {
      setActiveBottomTab("details");
      setToast("PLAY mode enabled. Please complete the DETAILS tab (at least Physical Description and Personal Details) before continuing.");
    } else {
      setToast("PLAY mode enabled. Sidebar creation sections are locked.");
    }
  };

  const exitPlayMode = () => {
    if (!activeAgentId || !agent) return;

    const creation = getCreationMeta(agent);
    if (!creation.playMode?.isPlaying) return;

    const confirmed = window.confirm(
      [
        "Exit PLAY mode and reset this Agent to their pre-play baseline?",
        "",
        "This will reset advances, conditions, bond scores, and other changes made during play.",
      ].join("\n")
    );

    if (!confirmed) return;

    const baselineJson = creation.playMode.baselineAgentJson;
    if (!baselineJson) {
      // No snapshot (shouldn't happen, but fail gracefully)
      updateCreationMeta(activeAgentId, (prev) => ({
      ...prev,
      playMode: { isPlaying: false, baselineAgentJson: undefined },
      }));
      setToast("PLAY mode disabled (no baseline snapshot was available).");
      return;
    }

    // Restore the snapshot
    const baselineAgent: DeltaGreenAgent = JSON.parse(baselineJson);
    const { updateAgent } = useAgentStore.getState();
    updateAgent(activeAgentId, baselineAgent);

    // Clear playMode on the *restored* agent
    updateCreationMeta(activeAgentId, (prev) => ({
      ...prev,
      playMode: { isPlaying: false, baselineAgentJson: undefined },
    }));

    setToast("PLAY mode disabled. Agent reset to baseline.");
  };

  const updateActiveAgentField = React.useCallback(
  (path: string[], value: any) => {
    if (!activeAgentId) return;

    const { agents, updateAgent } = useAgentStore.getState();
    const current = agents[activeAgentId];
    if (!current) return;

    const copy: DeltaGreenAgent = JSON.parse(JSON.stringify(current));
    let obj: any = copy;
    for (let i = 0; i < path.length - 1; i++) {
    obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = value;

    updateAgent(activeAgentId, copy);
  },
   [activeAgentId]
  );

  const updateActiveAgentViaMutator = React.useCallback(
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

  function updateCreationMeta(
    agentId: string,
    updater: (prev: CreationMeta) => CreationMeta
  ) {
    const { agents, updateAgent } = useAgentStore.getState();
    const current = agents[agentId];
    if (!current) return;

    const prev: CreationMeta = current.system.creation
      ? current.system.creation
     : getCreationMeta(current);

    const next = updater(prev);

    const copy: DeltaGreenAgent = JSON.parse(JSON.stringify(current));
    copy.system.creation = next;
    updateAgent(agentId, copy);
  }

  const setBonusSkillPoints: React.Dispatch<
  React.SetStateAction<Record<string, number>>
  > = React.useCallback(
  (value) => {
  if (!activeAgentId) return;

  const next =
  typeof value === "function"
  ? (value as (prev: Record<string, number>) => Record<string, number>)(
    bonusSkillPoints
  )
  : value;

  updateActiveAgentField(
    ["system", "creation", "bonusSkillPointsByKey"],
    next
  );
  },
  [activeAgentId, bonusSkillPoints, updateActiveAgentField]
  );

  const setVeteranSkillPoints: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  > = React.useCallback(
    (value) => {
      if (!activeAgentId) return;

      updateCreationMeta(activeAgentId, (prev) => {
        const currentMap = prev.veteranSkillPointsByKey || {};
        const nextMap =
          typeof value === "function"
            ? (value as (prev: Record<string, number>) => Record<string, number>)(
                currentMap
              )
            : value;

        return {
          ...prev,
          veteranSkillPointsByKey: nextMap,
        };
      });
    },
    [activeAgentId] 
  );

  const STAT_KEYS: StatKey[] = ["str", "con", "dex", "int", "pow", "cha"];
  const statSum = agent ? STAT_KEYS.reduce(
  (sum, key) => sum + agent.system.statistics[key].value,0)
  : 0;

  // Compute effective head/body armor from equipped armor items and track sources
  const {
    headArmorRating,
    bodyArmorRating,
    headArmorSources,
    bodyArmorSources,
  } = React.useMemo<{
    headArmorRating: number;
    bodyArmorRating: number;
    headArmorSources: string[];
    bodyArmorSources: string[];
  }>(() => {
    if (!agent) {
      return {
        headArmorRating: 0,
        bodyArmorRating: 0,
        headArmorSources: [],
        bodyArmorSources: [],
      };
    }

    let head = 0;
    let body = 0;
    let headSources: string[] = [];
    let bodySources: string[] = [];

    for (const item of agent.items) {
      if (item.type !== "armor") continue;
      const sys: any = item.system ?? {};
      if (!sys.equipped) continue;

      const rating = typeof sys.armor_rating === "number" ? sys.armor_rating : 0;
      const protection = (sys.protection as string) ?? "";
      const name = item.name ?? "Unnamed armor";

      // head
      if (protection === "head" || protection === "both") {
        if (rating > head) headSources = [name];
        else if (rating === head && rating > 0) headSources.push(name);
        head = Math.max(head, rating);
      }

      // body
      if (protection === "body" || protection === "both") {
        if (rating > body) bodySources = [name];
        else if (rating === body && rating > 0) bodySources.push(name);
        body = Math.max(body, rating);
      }
    }

    const baseProt = agent.system.health?.protection ?? 0;

    if (head === 0 && baseProt > 0) {
      head = baseProt;
      headSources = ["Base protection"];
    }

    if (body === 0 && baseProt > 0) {
      body = baseProt;
      bodySources = ["Base protection"];
    }

    return {
      headArmorRating: head,
      bodyArmorRating: body,
      headArmorSources: headSources,
      bodyArmorSources: bodySources,
    };
  }, [agent]);

  const headArmorTooltip =
    headArmorSources && headArmorSources.length > 0
      ? `Head AR ${headArmorRating} from: ${headArmorSources.join(", ")}`
      : `Head AR ${headArmorRating}`;

  const bodyArmorTooltip =
    bodyArmorSources && bodyArmorSources.length > 0
      ? `Body AR ${bodyArmorRating} from: ${bodyArmorSources.join(", ")}`
      : `Body AR ${bodyArmorRating}`;

  const headerNode = (
    <Header
      agents={agents}
      activeAgentId={activeAgentId}
      openAgentIds={openAgentIds}
      onSetActiveAgent={setActiveAgent}
      onCloseAgentTab={(id: string) => {
        closeAgent(id);
        if (id === activeAgentId && openAgentIds.length === 1) {
          onCloseAgent();
        }
      }}
      onNewAgent={onNewAgent}
      onLoadAgent={onLoadAgent}
      onExportAgent={handleExportAgent}
      onExit={onCloseAgent}
      onImportRequested={() => fileInputRef.current?.click()}
    />
  );

  const sidebarNode = (
    <CharacterSidebar
      agent={agent}
      navigation={{
        openSection: openCreationSection,
        setOpenSection: setOpenCreationSection,
        statMode,
        statSum,
        getSectionLock,
        onBlockedNav: setToast,
      }}
      creationState={{
        STAT_KEYS,
        baseSkills,
        bonusSkillPoints,
        veteranSkillPoints,
        selectedProfessionId,
        selectedBonusPackageId,
        damagedVeteranTemplateId,
        inPlay,
      }}
      creationActions={{
        setStatMode,
        updateActiveAgentField,

        selectProfession: (id) =>
          updateCreationMeta(activeAgentId!, (prev) => ({
            ...prev,
            selectedProfessionId: id,
          })),

        updateAgent: (updated) =>
          updateActiveAgentViaMutator(copy => Object.assign(copy, updated)),

        setBonusSkillPoints,
        setVeteranSkillPoints,

        selectBonusPackage: (id) =>
          updateCreationMeta(activeAgentId!, (prev) => ({
            ...prev,
            selectedBonusPackageId: id,
          })),

        finalizeBonusSkills: () =>
          updateCreationMeta(activeAgentId!, (prev) => ({
            ...prev,
            professionLockedByBonus: true,
          })),

        resetSkills: () =>
          updateCreationMeta(activeAgentId!, (prev) => ({
            ...prev,
            professionLockedByBonus: false,
            selectedBonusPackageId: null,
          })),

        selectDamagedVeteranTemplate: (id) =>
          updateCreationMeta(activeAgentId!, (prev) => ({
            ...prev,
            damagedVeteranTemplateId: id,
          })),

        applyDamagedVeteranTemplate: () =>
          updateCreationMeta(activeAgentId!, (prev) => ({
            ...prev,
            damagedVeteranTemplateApplied: true,
          })),

        resetDamagedVeteranTemplate: () =>
          updateCreationMeta(activeAgentId!, (prev) => ({
            ...prev,
            damagedVeteranTemplateApplied: false,
          })),

        enterPlayMode,
        exitPlayMode,

        requestAddDisorder: openAddDisorderModal,
        
      setAgent: (updater) => {
          if (!activeAgentId) return;
          const { agents, updateAgent } = useAgentStore.getState();
          const current = agents[activeAgentId];
          if (!current) return;

          const nextAgent =
            typeof updater === "function"
              ? (updater as (prev: DeltaGreenAgent) => DeltaGreenAgent)(current)
              : updater;

          updateAgent(activeAgentId, nextAgent);
        },
      }}
    />
  );

  const playerPanelLocked = !inPlay;

  const playerPanelNode = (
    <div 
      className={"bb-player-panel-shell" + (playerPanelLocked ? " bb-player-panel-shell--locked" : "")}
      onMouseDownCapture={(e) => {
        if (!playerPanelLocked) return;
        e.preventDefault();
        e.stopPropagation();
        setToast("Complete character creation in the sidebar, then click ENTER PLAY MODE to unlock the player panel.");
      }}
    >
    <PlayerPanel
      agent={agent}
      activeAgentId={activeAgentId}
      statSum={statSum}
      baseSkills={baseSkills}
      bonusSkillPoints={bonusSkillPoints}
      veteranSkillPoints={veteranSkillPoints}
      headArmorRating={headArmorRating}
      bodyArmorRating={bodyArmorRating}
      headArmorTooltip={headArmorTooltip}
      bodyArmorTooltip={bodyArmorTooltip}
      bottomTabs={bottomTabs}
      activeBottomTab={activeBottomTab}
      setActiveBottomTab={setActiveBottomTab}
      openSkillRoll={openSkillRoll}
      openStatRoll={openStatRoll}
      openDamageRoll={openDamageRoll}
      openLethalityRoll={openLethalityRoll}
      openGenericRoll={openGenericRoll}
      openSanityTest={openSanityTest}
      openLuckTest={openLuckTest}
      updateAgentViaMutator={updateActiveAgentViaMutator}
      requestAddDisorder={openAddDisorderModal}
      setEditTrack={setEditTrack}
      setOpenAddDisorderFromTemplate={setOpenAddDisorderFromTemplate}
      updateAgent={(updated) => {
        if (!activeAgentId) return;
        updateActiveAgentViaMutator(copy => Object.assign(copy, updated));
      }}
    />
    
    {playerPanelLocked && (
      <div className="bb-player-panel-lock-overlay">
        <div className="bb-player-panel-lock-overlay__msg">
          <strong>PLAYER PANEL LOCKED</strong>
          <br />
          Complete character creation, then click <strong>ENTER PLAY MODE</strong>.
        </div>
      </div>
    )}
    </div>
  );

  const footerNode = (
    <Footer />
  );

  return (
    <>
      <MainPageLayout
        header={headerNode}
        sidebar={sidebarNode}
        playerPanel={playerPanelNode}
        footer={footerNode}
      />

      <StatusAdjustModal
        track={editTrack}
        agent={agent ?? null}
        onClose={() => setEditTrack(null)}
        updateAgent={(updated) => {
          if (!activeAgentId) return;
          updateActiveAgentViaMutator(copy => Object.assign(copy, updated));
        }}
        onGenericRoll={openGenericRoll}
      />

      <DiceTray
        isOpen={isDiceTrayOpen}
        onClose={() => setIsDiceTrayOpen(false)}
        rollName={pendingRollName}
        rollFormula={pendingRollFormula}
      />

      {agent && (
        <AddDisorderModal
          isOpen={isAddDisorderOpen}
          agent={agent}
          linkableMotivations={linkableMotivations}
          onClose={closeAddDisorderModal}
          onApply={(updatedAgent) => {
            if (!activeAgentId) return;
            updateActiveAgentViaMutator(copy => Object.assign(copy, updatedAgent));
          }}
        />
      )}

      {toast && (
        <div className="bb-toast">
          {toast}
        </div>
      )}
    </>
  );
};

export default MainPage;