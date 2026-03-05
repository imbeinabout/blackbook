// src/components/layout/Header/MobileHeader.tsx
import React from "react";
import blackbookLogo from "../../../assets/blackbook-logo.png";
import { useDropdown } from "./useDropdown";

type MobileHeaderProps = {
  isPlayMode: boolean;
  onToggleSidebar: () => void;

  // settings menu actions
  onNewAgent: () => void;
  onLoadAgent: () => void;
  onExportAgent: () => void;
  onImportRequested: () => void;
  onExit: () => void;
};

const MobileHeader: React.FC<MobileHeaderProps> = ({
  isPlayMode,
  onToggleSidebar,
  onNewAgent,
  onLoadAgent,
  onExportAgent,
  onImportRequested,
  onExit,
}) => {

  const { open: isSettingsOpen, setOpen: setIsSettingsOpen, ref: settingsRef } = useDropdown(false);

  return (
    <header className="bb-header bb-header--mobile">
      <div className="bb-header__left">
        <button
          type="button"
          className="bb-header__hamburger"
          onClick={onToggleSidebar}
          disabled={!isPlayMode}
          aria-label="Toggle sidebar"
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

export default MobileHeader;
export type { MobileHeaderProps };