// src/features/player-panel/tabs/TerminalTab.tsx
import React from "react";
import DeltaGreenTerminalAdvanced from "../terminal/Terminal";

/**
 * TerminalTab
 *
 * This tab hosts the in-universe terminal / shell emulator.
 * It is intentionally isolated from agent state for now,
 * but will later be wired to agent data, dice rolls, or logs.
 */
export const TerminalTab: React.FC = () => {
  return (
    <div className="bb-terminal-tab">
      <div className="bb-terminal-tab__header">
        SECURE SHELL
      </div>

      <div className="bb-terminal-tab__body">
        <DeltaGreenTerminalAdvanced />
      </div>
    </div>
  );
};