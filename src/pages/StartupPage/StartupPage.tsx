// src/pages/StartupPage/StartupPage.tsx
import React from "react";
import blackbookLogo from "../../assets/blackbook-logo.png";

interface StartupPageProps {
  onNewAgent: () => void;
  onLoadAgent: () => void;
  onHandlerMode: () => void;
}

const StartupPage: React.FC<StartupPageProps> = ({
  onNewAgent,
  onLoadAgent,
  onHandlerMode,
}) => {
  return (
    <div className="startup-screen">
      <div className="startup-logo">
        <img src={blackbookLogo} alt="Delta Green Blackbook" />
      </div>

      <h1 className="startup-title">BLACKBOOK</h1>
      <p className="startup-subtitle">Delta Green Agent Dossier System</p>

      <div className="startup-buttons">
        <div className="startup-buttons-row">
          <button
            type="button"
            className="startup-button startup-button--primary"
            onClick={onNewAgent}
          >
            New Agent
          </button>

          <button
            type="button"
            className="startup-button startup-button--primary"
            onClick={onLoadAgent}
          >
            Load Agent
          </button>
        </div>

        <div className="startup-buttons-row startup-buttons-row--single">
          <button
            type="button"
            className="startup-button startup-button--secondary"
            onClick={onHandlerMode}
            disabled
            title="Handler Mode is coming soon."
          >
            Handler Mode (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartupPage;