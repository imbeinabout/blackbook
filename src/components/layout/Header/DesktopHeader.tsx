// src/components/layout/Header/DesktopHeader.tsx
import React from "react";
import blackbookLogo from "../../../assets/blackbook-logo.png";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { useAgentStore } from "../../../store/agentStore";
import { useDropdown } from "./useDropdown";

export type HeaderProps = {
  agents: Record<string, DeltaGreenAgent>;
  activeAgentId: string | null;
  openAgentIds: string[];
  isPlayMode: boolean;

  onSetActiveAgent: (id: string) => void;
  onCloseAgentTab: (id: string) => void;

  onNewAgent: () => void;
  onLoadAgent: () => void;
  onExportAgent: () => void;
  onExit: () => void;

  onImportRequested: () => void;
  onToggleSidebar: () => void;
};

const MAX_VISIBLE_TABS = 4;

const DesktopHeader: React.FC<HeaderProps> = ({
  agents,
  activeAgentId,
  openAgentIds,
  isPlayMode,
  onSetActiveAgent,
  onCloseAgentTab,
  onNewAgent,
  onLoadAgent,
  onExportAgent,
  onExit,
  onImportRequested,
  onToggleSidebar,
}) => {
  const { open: isSettingsOpen, setOpen: setIsSettingsOpen, ref: settingsRef } = useDropdown(false);

  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreRef = React.useRef<HTMLDivElement | null>(null);

  // Close hamburger menu on outside click
  React.useEffect(() => {
    if (!isSettingsOpen) return;
    const handle = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !settingsRef.current) return;
      if (!settingsRef.current.contains(target)) setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isSettingsOpen]);

  // Close "More" menu on outside click
  React.useEffect(() => {
    if (!isMoreOpen) return;
    const handle = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !moreRef.current) return;
      if (!moreRef.current.contains(target)) setIsMoreOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isMoreOpen]);

  // Keep More menu closed if no overflow
  const orderedTabIds = React.useMemo(() => {
    return openAgentIds;
  }, [openAgentIds, activeAgentId]);

  const visibleTabIds = orderedTabIds.slice(0, MAX_VISIBLE_TABS);
  const overflowTabIds = orderedTabIds.slice(MAX_VISIBLE_TABS);

  React.useEffect(() => {
    if (overflowTabIds.length === 0 && isMoreOpen) setIsMoreOpen(false);
  }, [overflowTabIds.length, isMoreOpen]);

  return (
    <header className="bb-header">
      <div className="bb-header__left">
        <button
          className="bb-header__hamburger"
          aria-label="Toggle sidebar"
          type="button"
          disabled={!isPlayMode}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <div className="bb-header__logo">
          <img
            src={blackbookLogo}
            alt="Delta Green Blackbook"
            className="bb-header__logo-img"
          />
        </div>
      </div>

      <div className="bb-header__center">
        <div className="bb-header__tabs">
          {visibleTabIds.length === 0 ? (
            <div className="bb-header__tab bb-header__tab--empty">No agent loaded</div>
          ) : (
            visibleTabIds.map((id) => {
              const tabAgent = agents[id];
              if (!tabAgent) return null;

              const tabName = tabAgent.name || "Unnamed Agent";
              const tabProfession = tabAgent.system.biography.profession || "Unknown Profession";
              const isActive = id === activeAgentId;

              return (
                <div
                  key={id}
                  className={
                    "bb-header__tab" + (isActive ? " bb-header__tab--active" : "")
                  }
                  onClick={() => onSetActiveAgent(id)}
                >
                  <span className="bb-header__tab-label">
                    {`${tabName} – ${tabProfession}`}
                  </span>

                  <button
                    type="button"
                    className="bb-header__tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseAgentTab(id);
                    }}
                    title="Close this agent"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}

          {overflowTabIds.length > 0 && (
            <div ref={moreRef} className="bb-header__more-wrapper">
              <button
                type="button"
                className="bb-header__tab bb-header__tab--more"
                onClick={() => setIsMoreOpen((o) => !o)}
                title="Show more agents"
              >
                More ▾
              </button>

              {isMoreOpen && (
                <div className="bb-header__more-menu">
                  {overflowTabIds.map((id) => {
                    const tabAgent = agents[id];
                    if (!tabAgent) return null;

                    const tabName = tabAgent.name || "Unnamed Agent";
                    const tabProfession =
                      tabAgent.system.biography.profession || "Unknown Profession";

                    return (
                      <div key={id} className="bb-header__more-item">
                        <button
                          type="button"
                          className="bb-header__more-item-label"
                          onClick={() => {
                            onSetActiveAgent(id);
                            const reordered = [
                              id,
                              ...openAgentIds.filter((x) => x !== id),
                            ];
                            useAgentStore.getState().reorderOpenAgentIds(reordered);
                            setIsMoreOpen(false);
                          }}
                        >
                          {`${tabName} – ${tabProfession}`}
                        </button>

                        <button
                          type="button"
                          className="bb-header__more-item-close"
                          onClick={() => onCloseAgentTab(id)}
                          title="Close this agent"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="bb-header__tab bb-header__tab--add"
            onClick={onNewAgent}
            title="Create new agent"
          >
            +
          </button>
        </div>
      </div>

      <div className="bb-header__right">
        <div ref={settingsRef} className="bb-header__settings-wrapper">
          <button
            className="bb-header__settings"
            aria-label="Open settings"
            onClick={() => setIsSettingsOpen(o => !o)}
          >
            ⚙
          </button>

          {isSettingsOpen && (
            <div className="bb-header__menu">
              <button
                type="button"
                className="bb-header__menu-item"
                onClick={() => {
                  setIsSettingsOpen(false);
                  onNewAgent();
                }}
              >
                New Agent
              </button>
              <button
                type="button"
                className="bb-header__menu-item"
                onClick={() => {
                  setIsSettingsOpen(false);
                  onLoadAgent();
                }}
              >
                Load Agent
              </button>
              <button
                type="button"
                className="bb-header__menu-item"
                onClick={() => {
                  setIsSettingsOpen(false);
                  onExportAgent();
                }}
              >
                Export Agent
              </button>
              <button
                type="button"
                className="bb-header__menu-item"
                onClick={() => {
                  setIsSettingsOpen(false);
                  onImportRequested();
                }}
              >
                Import Agent
              </button>
              <div className="bb-header__menu-divider" />
              <button
                type="button"
                className="bb-header__menu-item bb-header__menu-item--danger"
                onClick={() => {
                  setIsSettingsOpen(false);
                  onExit();
                }}
              >
                Exit
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;