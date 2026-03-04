// src/features/modals/LoadAgentModal.tsx
import React from "react";
import { useAgentStore, AgentId } from "../../store/agentStore";
import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";

interface LoadAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentLoaded: () => void;
}

const LoadAgentModal: React.FC<LoadAgentModalProps> = ({
  isOpen,
  onClose,
  onAgentLoaded,
}) => {
  const { agents, setActiveAgent, deleteAgent } = useAgentStore();

  const [selectedId, setSelectedId] = React.useState<AgentId | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const ids = Object.keys(agents) as AgentId[];
    if (ids.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((prev) => (prev && agents[prev] ? prev : ids[0]));
  }, [isOpen, agents]);

  if (!isOpen) return null;

  const agentEntries = Object.entries(agents) as [AgentId, DeltaGreenAgent][];
  const selectedAgent: DeltaGreenAgent | null =
    selectedId && agents[selectedId] ? agents[selectedId] : null;

  const handleLoad = () => {
    if (!selectedId) return;
    setActiveAgent(selectedId);
    onAgentLoaded(); 
  };

  const handleRequestDelete = () => {
    if (!selectedId) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedId) {
      setShowDeleteConfirm(false);
      return;
    }

    deleteAgent(selectedId);
    setShowDeleteConfirm(false);

    const remainingIds = Object.keys(agents).filter(
      (id) => id !== selectedId
    ) as AgentId[];
    setSelectedId(remainingIds.length > 0 ? remainingIds[0] : null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

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
        const newId = createAgent(parsed);

        setSelectedId(newId);

        onAgentLoaded();
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

  return (
    <>
      <input
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleImportFileInputChange}
      />

      {/* Main Load Agent modal */}
      <div className="bb-modal">
        <div className="bb-modal__dialog bb-load-modal__dialog">
          <h3 className="bb-modal__title">Load Agent</h3>

          {agentEntries.length === 0 ? (
            <div className="bb-modal__body">
              <p>No agents saved yet.</p>
            </div>
          ) : (
            <div className="bb-modal__body bb-load-modal__body">
              {/* Left: list of agents */}
              <div className="bb-load-modal__list">
                <ul className="agent-list">
                  {agentEntries.map(([id, agent]) => (
                    <li
                      key={id}
                      className={
                        "agent-list-item" +
                        (id === selectedId ? " agent-list-item--selected" : "")
                      }
                      onClick={() => setSelectedId(id)}
                    >
                      <div className="agent-main-line">
                        {agent.name || "(Unnamed Agent)"}
                        {agent.system?.biography?.profession && (
                          <>
                            {" "}
                            – {agent.system.biography.profession}
                          </>
                        )}
                      </div>
                      <div className="agent-sub-line">
                        {agent.system?.biography?.employer ||
                          agent.system?.biography?.nationality ||
                          "\u00A0"}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: details for selected agent */}
              <div className="bb-load-modal__details">
                {selectedAgent ? (
                  <>                  
                    <div className="bb-load-modal__details">
                      {selectedAgent ? (
                        <>
                          <h4 className="bb-load-modal__agent-name">
                            {selectedAgent.name || "(Unnamed Agent)"}
                          </h4>

                          {/* Biography detail fields */}
                          <div className="bb-load-modal__fields">
                            <DetailField
                              label="Profession"
                              value={selectedAgent.system.biography.profession}
                            />
                            <DetailField
                              label="Employer"
                              value={selectedAgent.system.biography.employer}
                            />
                            <DetailField
                              label="Nationality"
                              value={selectedAgent.system.biography.nationality}
                            />
                            <DetailField
                              label="Age / DOB"
                              value={selectedAgent.system.biography.age}
                            />
                            <DetailField
                              label="Sex"
                              value={selectedAgent.system.biography.sex}
                            />
                            <DetailField
                              label="Education"
                              value={selectedAgent.system.biography.education}
                            />
                          </div>

                          {/* Tracks summary (HP / WP / SAN / Breaking Point) */}
                          <div className="bb-load-modal__tracks">
                            {renderTrackSummary(selectedAgent)}
                          </div>
                        </>
                      ) : (
                        <p>No agent selected.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p>No agent selected.</p>
                )}
              </div>
            </div>
          )}

          {/* Footer: Import | Load+Cancel | Delete */}
          <div className="bb-load-modal__footer">
            {/* Far left: Import */}
            <div className="bb-load-modal__footer-left">
              <button
                type="button"
                className="bb-button bb-button--small"
                onClick={() => fileInputRef.current?.click()}
              >
                Import
              </button>
            </div>

            {/* Center: Load + Cancel */}
            <div className="bb-load-modal__footer-center">
              <button
                type="button"
                className="bb-button bb-button--small"
                onClick={handleLoad}
                disabled={!selectedId}
              >
                Load
              </button>
              <button
                type="button"
                className="bb-button bb-button--small"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>

            {/* Far right: Delete */}
            <div className="bb-load-modal__footer-right">
              <button
                type="button"
                className="bb-button bb-button--small bb-button--danger"
                onClick={handleRequestDelete}
                disabled={!selectedId}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Small confirm modal for delete */}
      {showDeleteConfirm && (
        <div className="bb-modal bb-modal--confirm">
          <div className="bb-modal__dialog bb-modal__dialog--small">
            <h4 className="bb-modal__title">Delete Agent?</h4>
            <div className="bb-modal__body">
              <p>
                This will permanently delete the selected agent dossier from
                this device. This action cannot be undone.
              </p>
            </div>
            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-button bb-button--small"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bb-button bb-button--small bb-button--danger"
                onClick={handleConfirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface DetailFieldProps {
  label: string;
  value?: string;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value }) => (
  <div className="bb-load-modal__field">
    <div className="bb-load-modal__field-label">{label}</div>
    <div className="bb-load-modal__field-value">
      {value && value.trim() !== "" ? value : "\u2014"}
    </div>
  </div>
);

function renderTrackSummary(agent: DeltaGreenAgent) {
  const hp = agent.system.health;
  const wp = agent.system.wp;
  const san = agent.system.sanity;

  return (
    <div className="bb-load-modal__track-grid">
      <div className="bb-load-modal__track-pill">
        <span className="bb-load-modal__track-label">HP</span>
        <span className="bb-load-modal__track-value">
          {hp.value}/{hp.max}
        </span>
      </div>
      <div className="bb-load-modal__track-pill">
        <span className="bb-load-modal__track-label">WP</span>
        <span className="bb-load-modal__track-value">
          {wp.value}/{wp.max}
        </span>
      </div>
      <div className="bb-load-modal__track-pill">
        <span className="bb-load-modal__track-label">SAN</span>
        <span className="bb-load-modal__track-value">
          {san.value}/{san.max}
        </span>
      </div>
      <div className="bb-load-modal__track-pill">
        <span className="bb-load-modal__track-label">Breaking Point</span>
        <span className="bb-load-modal__track-value">
          {san.currentBreakingPoint}
        </span>
      </div>
    </div>
  );
}

export default LoadAgentModal;