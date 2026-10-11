// src/features/player-panel/tabs/DetailsTab.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { useLayoutMode } from "../../../hooks/useLayoutMode";
import { addAgentEvent } from "../../../lib/eventLogger";
import { calculateAgentStatistics } from "../../../lib/agentHistory";
import { calculateAgentMilestones } from "../../../lib/agentMilestones";
import { AgentMilestone } from "../../../models/events";

type DetailsTabProps = {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
};

type AgentAlias = {
  active: boolean;
  name: string;
  description?: string;
  credentials?: string;
};

export const DetailsTab: React.FC<DetailsTabProps> = ({ agent, updateAgent }) => {
  const details = agent.system.details ?? {
    physicalDescription: "",
    personalDetails: "",
    homeFamilyDevelopments: "",
    photoDataUrl: "",
    aliases: [] as AgentAlias[],
  };

  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isAliasModalOpen, setIsAliasModalOpen] = React.useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const aliasListRef = React.useRef<HTMLDivElement | null>(null);
  const aliasModalBodyRef = React.useRef<HTMLDivElement | null>(null);
  const newAliasRowRef = React.useRef<HTMLTableRowElement | null>(null);
  const aliasesBeforeEditRef = React.useRef<AgentAlias[]>([]);
  const detailsBeforeEditRef = React.useRef({
    physicalDescription: "",
    personalDetails: "",
    homeFamilyDevelopments: "",
  });

  const [pendingScrollToNewAlias, setPendingScrollToNewAlias] = React.useState(false);
  
  const updateDetails = React.useCallback(
    (partial: Partial<typeof details>) => {
      updateAgent({
        ...agent,
        system: {
          ...agent.system,
          details: {
            ...details,
            ...partial,
          },
        },
      });
    },
    [agent, details, updateAgent]
  );

  const statistics = React.useMemo(() => calculateAgentStatistics(agent), [agent]);
  const milestones = React.useMemo(() => calculateAgentMilestones(agent, statistics), [agent, statistics]);
  const achievedMilestones = milestones.filter(m => m.achieved);
  const midpoint = Math.ceil(achievedMilestones.length / 2);
  const leftMilestones = achievedMilestones.slice(0, midpoint);
  const rightMilestones = achievedMilestones.slice(midpoint);
  const [selectedMilestone, setSelectedMilestone] = React.useState<AgentMilestone | null>(null);
  
  const isMobile = useLayoutMode() === "mobile";

  const aliases: AgentAlias[] = (details as any).aliases ?? [];

  React.useLayoutEffect(() => {
    if (!pendingScrollToNewAlias) return;
    if (!isAliasModalOpen) return;

    // Run after layout so the new row exists and has a position
    const row = newAliasRowRef.current;
    const container = aliasModalBodyRef.current;

    if (row && container) {
      // Ensure container is the scroll context
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    setPendingScrollToNewAlias(false);
  }, [pendingScrollToNewAlias, isAliasModalOpen, aliases.length]);

  const captureDetailsSnapshot = () => {
    detailsBeforeEditRef.current = {
      physicalDescription: details.physicalDescription,
      personalDetails: details.personalDetails,
      homeFamilyDevelopments: details.homeFamilyDevelopments,
    };
  };

  const commitDetailsChanges = () => {
    const before = detailsBeforeEditRef.current;

    const after = {
      physicalDescription: details.physicalDescription,
      personalDetails: details.personalDetails,
      homeFamilyDevelopments: details.homeFamilyDevelopments,
    };

    if (
      JSON.stringify(before) ===
      JSON.stringify(after)
    ) {
      return;
    }

    const copy: DeltaGreenAgent =
      JSON.parse(JSON.stringify(agent));

    addAgentEvent(copy, {
      category: "system",
      action: "details-updated",
      source: "manual",
      summary: "Updated agent details",
      relatedEntity: "details",
      before,
      after,
      storeEvent: false,
    });

    updateAgent(copy);
  };
  
  const openAliasModal = () => {
    aliasesBeforeEditRef.current =
      JSON.parse(JSON.stringify(aliases));

    setIsAliasModalOpen(true);
  };
  
  const handleAliasChange = (
    index: number,
    field: keyof AgentAlias,
    value: string | boolean
  ) => {
    const updated = aliases.map((alias, i) =>
      i === index ? { ...alias, [field]: value } : alias
    );
    updateDetails({ aliases: updated });
  };

  const handleAddAlias = () => {
    const updated = [
      ...aliases,
      { active: true, name: "" } as AgentAlias,
    ];
    updateDetails({ aliases: updated });
    setIsAliasModalOpen(true);
    setPendingScrollToNewAlias(true);

    // Scroll to newly added row after render
    requestAnimationFrame(() => {
      const el = aliasListRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const handleRemoveAlias = (index: number) => {
    const updated = aliases.filter((_, i) => i !== index);
    updateDetails({ aliases: updated });
  };

  const handleAliasDone = () => {
    const before = aliasesBeforeEditRef.current;
    const after = aliases;

    if (
      JSON.stringify(before) !==
      JSON.stringify(after)
    ) {
      const copy: DeltaGreenAgent =
        JSON.parse(JSON.stringify(agent));

      addAgentEvent(copy, {
        category: "system",
        action: "aliases-updated",
        source: "manual",
        summary: "Updated agent aliases",
        relatedEntity: "aliases",
        before,
        after,
        metadata: {
          aliases: after,
          addedCount: Math.max(0, after.length - before.length),
          removedCount: Math.max(0, before.length - after.length),
        },
      });

      updateAgent(copy);
    }

    setIsAliasModalOpen(false);
  };

  const activeAliases = aliases.filter(
    (a) => a.active && a.name && a.name.trim().length > 0
  );

  const handleFile = React.useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;

        if (typeof result !== "string") return;

        if (details.photoDataUrl === result) {
          return;
        }

        const copy: DeltaGreenAgent =
          JSON.parse(JSON.stringify(agent));

        copy.system.details = {
          ...details,
          photoDataUrl: result,
        };

        addAgentEvent(copy, {
          category: "system",
          action: "photo-updated",
          source: "manual",
          summary: "Updated agent photo",
          relatedEntity: "details",
          storeEvent: false,
          metadata: {
            photoDataUrl: result,
          },
        });

        updateAgent(copy);
      };

      reader.readAsDataURL(file);
    },
    [agent, details.photoDataUrl, updateAgent]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemovePhoto = () => {
    if (!details.photoDataUrl) return;

    const copy: DeltaGreenAgent =
      JSON.parse(JSON.stringify(agent));

    copy.system.details = {
      ...details,
      photoDataUrl: "",
    };

    addAgentEvent(copy, {
      category: "system",
      action: "photo-updated",
      source: "manual",
      summary: "Removed agent photo",
      relatedEntity: "details",
      storeEvent: false,
      metadata: {
        photoDataUrl: "",
      },
    });

    updateAgent(copy);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClickDropzone = () => {
    fileInputRef.current?.click();
  };

  const getMilestoneIcon = (milestoneId: string): string => {
    return `/milestones/${milestoneId}.svg`;
  };

  const placeholderPersonal = `» A detail or two about the Agent’s personality, beliefs, hobbies, obsessions, and motivations.
» Something you admire about the Agent.
» Something you dislike about the Agent.
» Why does Delta Green trust your Agent to confront unnatural threats and keep them secret?
» Why does your Agent agree to help Delta Green and keep its secrets?`;

  return (
    <div className="bb-details-tab">
      <div className="bb-details-tab__grid">
        {/* PHOTO */}
        <section className="bb-details-tab__photo">
          {activeAliases.length !== 0 ? (
              <h3 className="bb-section-title bb-details-tab__photo-title">
                {activeAliases.length > 0
                  ? activeAliases[0].name
                  : "AGENT PHOTO"
                }
              </h3>
            ) : (
              <h3 className="bb-section-title">
                AGENT PHOTO
              </h3>
          )}
          <div className="bb-photo-frame">
            <div className="bb-photo-frame__milestones bb-photo-frame__milestones--left">
              {leftMilestones.map((milestone) => (
                <img
                  key={milestone.id}
                  src={getMilestoneIcon(milestone.icon)}
                  title={milestone.title}
                  className="bb-milestone-badge"
                  onClick={() => setSelectedMilestone(selectedMilestone === milestone ? null : milestone)}
                />
              ))}
            </div>
            <div
              className={
                "bb-photo-dropzone" +
                (isDragOver ? " bb-photo-dropzone--drag-over" : "")
              }
              onClick={handleClickDropzone}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {details.photoDataUrl ? (
                <>
                  {
                    <img
                      src={details.photoDataUrl}
                      alt={`${agent.name} portrait`}
                      className="bb-photo-dropzone__image"
                    />
                  }

                  <button
                    type="button"
                    className="bb-photo-dropzone__remove bb-button bb-button--danger bb-button--small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="bb-photo-dropzone__placeholder">
                  <p className="bb-photo-dropzone__hint">
                    {isMobile ? "Tap to add a photo" : "Drag & drop an image here, or click to choose a file."}
                  </p>
                </div>
              )}
            </div>
            <div className="bb-photo-frame__milestones bb-photo-frame__milestones--right">
              {rightMilestones.map((milestone) => (
                <img
                  key={milestone.id}
                  src={getMilestoneIcon(milestone.icon)}
                  title={milestone.title}
                  className="bb-milestone-badge"
                  onClick={() => setSelectedMilestone(selectedMilestone === milestone ? null : milestone)}
                />
              ))}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {selectedMilestone && (
            <div className="bb-milestone-details">
              {selectedMilestone.title}
            </div>
          )}

          <button
            type="button"
            className="bb-btn"
            onClick={() => setIsStatisticsOpen(true)}
          >
            Agent Statistics
          </button>

          <button
            type="button"
            className="bb-btn bb-btn--ghost bb-aliases__manage-btn"
            onClick={openAliasModal}
          >
            Manage Aliases
          </button>
        </section>

        {/* TEXT FIELDS */}
        <section className="bb-details-tab__text">
          <div className="bb-field-group">
            <label className="bb-field-label" htmlFor="bb-physical-description">
              Physical description
            </label>
            <br />
            <textarea
              id="bb-physical-description"
              className="bb-textarea"
              rows={3}
              value={details.physicalDescription}
              onFocus={captureDetailsSnapshot}
              onBlur={commitDetailsChanges}
              onChange={(e) =>
                updateDetails({ physicalDescription: e.target.value })
              }
            />
          </div>

          <div className="bb-field-group">
            <label className="bb-field-label" htmlFor="bb-personal-details">
              Personal details
            </label>
            <br />
            <textarea
              id="bb-personal-details"
              className="bb-textarea"
              rows={7}
              placeholder={placeholderPersonal}
              value={details.personalDetails}
              onFocus={captureDetailsSnapshot}
              onBlur={commitDetailsChanges}
              onChange={(e) =>
                updateDetails({ personalDetails: e.target.value })
              }
            />
          </div>

          <div className="bb-field-group">
            <label
              className="bb-field-label"
              htmlFor="bb-home-family-developments"
            >
              Developments which affect home and family
            </label>
            <br />
            <textarea
              id="bb-home-family-developments"
              className="bb-textarea"
              rows={4}
              value={details.homeFamilyDevelopments}
              onFocus={captureDetailsSnapshot}
              onBlur={commitDetailsChanges}
              onChange={(e) =>
                updateDetails({ homeFamilyDevelopments: e.target.value })
              }
            />
          </div>

          <div className="bb-field-group">
            <label className="bb-field-label">
              Active Aliases
            </label>

            <div className="bb-details-tab__alias-viewer">
              {activeAliases.length === 0 ? (
                <p className="bb-text-muted">
                  No active aliases.
                </p>
              ) : (
                <ul className="bb-alias-list">
                  {activeAliases.map((alias, index) => {
                    const tooltipParts = [];

                    if (alias.description?.trim()) {
                      tooltipParts.push(alias.description.trim());
                    }

                    if (alias.credentials?.trim()) {
                      tooltipParts.push(
                        `Credentials: ${alias.credentials.trim()}`
                      );
                    }

                    return (
                      <li
                        key={index}
                        className="bb-alias-list__item"
                        title={tooltipParts.join("\n\n")}
                      >
                        {alias.name}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

        </section>
      
      {/* STATISTICS MODAL */}
      {isStatisticsOpen && (
        <div className="bb-modal">
          <div className="bb-modal__dialog bb-agent-statistics-modal">
            <div className="bb-modal__header">
              <h3 className="bb-modal__title">
                Agent Statistics
              </h3>
            </div>

            <div className="bb-modal__body bb-agent-statistics-modal__body">

              <h2>Handler Assessment</h2>

              <p className="bb-text-muted">
                {
                  statistics.operations >= 10
                    ? "Veteran field operative."
                    : statistics.operations >= 3
                    ? "Experienced field operative."
                    : "Limited field experience."
                }
              </p>

              <p className="bb-text-muted">
                Most developed specialty:
                {" "}
                {statistics.mostImprovedSkill?.label ?? "Unknown"}.
              </p>

              <p className="bb-text-muted">
                Most activity recorded in:
                {" "}
                {statistics.mostActiveCategory?.category ?? "Unknown"}
                {" ("}
                {statistics.mostActiveCategory?.count ?? 0}
                {" events)."}
              </p>

              <div className="bb-agent-statistics-grid">
                <section>
                {/* PERSONNEL SUMMARY */}

              <h2>Personnel Dossier</h2>

              <div className="bb-timeline-kv">
                <span>Campaigns Participated</span>
                <span>{statistics.campaigns}</span>
              </div>
              
              <div className="bb-timeline-kv">
                <span>Operations Served</span>
                <span>{statistics.operations}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Sessions Participated</span>
                <span>{statistics.sessions}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Career Active Days</span>
                <span>{statistics.activeDays ?? 0}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Events Recorded</span>
                <span>{statistics.totalEvents}</span>
              </div>

              {statistics.latestCampaign && (
                <div className="bb-timeline-kv">
                  <span>Current Campaign</span>
                  <span>{statistics.latestCampaign}</span>
                </div>
              )}

              {statistics.latestOperation && (
                <div className="bb-timeline-kv">
                  <span>Current Operation</span>
                  <span>{statistics.latestOperation}</span>
                </div>
              )}

              {statistics.latestSession && (
                <div className="bb-timeline-kv">
                  <span>Latest Session</span>
                  <span>{statistics.latestSession}</span>
                </div>
              )}

              
              </section>

              <section>
              {/* DEVELOPMENT */}

              <h2>Development</h2>

              <div className="bb-timeline-kv">
                <span>Skill Changes</span>
                <span>{statistics.skillValueChanges}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Skill Upgrades</span>
                <span>{statistics.skillUpgradeEvents}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Total Skill Points Gained</span>
                <span>{statistics.totalSkillPointsGained}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Total Skill Points Reversed</span>
                <span>{statistics.totalSkillPointsReversed}</span>
              </div>

              {statistics.mostImprovedSkill && (
                <div className="bb-timeline-kv">
                  <span>Most Improved Skill</span>
                  <span>
                    {statistics.mostImprovedSkill.label}
                    {" (+"}
                    {statistics.mostImprovedSkill.netChange}
                    {")"}
                  </span>
                </div>
              )}

              <div className="bb-timeline-kv">
                <span>Attribute Changes</span>
                <span>{statistics.statValueChanges}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Special Training Acquired</span>
                <span>{statistics.specialTrainingAdded}</span>
              </div>

              
              </section>

              <section>
              {/* CONDITIONS */}

              <h2>Conditions & Disorders</h2>

              <div className="bb-timeline-kv">
                <span>Conditions Added</span>
                <span>{statistics.conditionsAdded}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Conditions Removed</span>
                <span>{statistics.conditionsRemoved}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Disorders Developed</span>
                <span>{statistics.disordersAdded}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Disorders Cured</span>
                <span>{statistics.disordersCured}</span>
              </div>

              
              </section>

              <section>
              {/* PSYCHOLOGICAL PROFILE */}

              <h2>Psychological Profile</h2>

              <div className="bb-timeline-kv">
                <span>Current Violence Adaptation</span>
                <span>{statistics.adaptedtoViolence ? "YES" : "NO"}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Current Helplessness Adaptation</span>
                <span>{statistics.adaptedtoHelplessness ? "YES" : "NO"}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>SAN Loss Events</span>
                <span>{statistics.sanityLossEvents}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Total SAN Lost</span>
                <span>{statistics.totalSanLost}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Total SAN Recovered</span>
                <span>{statistics.totalSanRecovered}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Net SAN Change</span>
                <span>{statistics.netSanChange}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Breaking Points Crossed</span>
                <span>{statistics.breakingPointsCrossed}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Temporary Insanity Episodes</span>
                <span>{statistics.temporaryInsanityEpisodes}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Violence SAN Loss</span>
                <span>{statistics.sanLostByType.violence}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Helplessness SAN Loss</span>
                <span>{statistics.sanLostByType.helplessness}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Unnatural SAN Loss</span>
                <span>{statistics.sanLostByType.unnatural}</span>
              </div>

              
              </section>

              <section>
              {/* PHYSICAL TRAUMA */}

              <h2>Physical Trauma</h2>

              <div className="bb-timeline-kv">
                <span>HP Damage Taken</span>
                <span>{statistics.hpDamageTaken}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>HP Recovered</span>
                <span>{statistics.hpRecovered}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>WP Damage Taken</span>
                <span>{statistics.wpDamageTaken}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>WP Recovered</span>
                <span>{statistics.wpRecovered}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Wounds Sustained</span>
                <span>{statistics.woundsAdded}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Wounds Healed</span>
                <span>{statistics.woundsRemoved}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>First Aid Applications</span>
                <span>{statistics.firstAidApplications}</span>
              </div>

              
              </section>

              <section>
              {/* RELATIONSHIPS */}

              <h2>Relationships</h2>

              <div className="bb-timeline-kv">
                <span>Bonds Created</span>
                <span>{statistics.bondsCreated}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Bonds Removed</span>
                <span>{statistics.bondsRemoved}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Bond Damage Events</span>
                <span>{statistics.bondDamagedEvents}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Total Bond Damage</span>
                <span>{statistics.totalBondDamage}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Total Bond Recovery</span>
                <span>{statistics.totalBondRecovery}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Projected SAN Onto Bonds</span>
                <span>{statistics.projectionEvents}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Home Scenes Completed</span>
                <span>{statistics.homeScenesCompleted}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Personal Pursuits</span>
                <span>{statistics.personalPursuits}</span>
              </div>

              <div className="bb-timeline-kv">
                <span>Bonds Resolved</span>
                <span>{statistics.bondsResolvedInHomeScenes}</span>
              </div>
              </section>

              <section>
              {/* EVENT PROFILE */}

              <h2>Activity Profile</h2>

              {Object.entries(statistics.categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="bb-timeline-kv">
                    <span>{category}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </section>
              </div>

            </div>
            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-btn"
                onClick={() => setIsStatisticsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALIAS MODAL */}
      {isAliasModalOpen && (
        <div className="bb-modal">
          <div className="bb-modal__dialog bb-aliases-modal__dialog">
            <div className="bb-modal__header">
              <h3 className="bb-modal__title">Manage Aliases</h3>
            </div>

            <div className="bb-modal__body" ref={aliasModalBodyRef}>
              {aliases.length === 0 && (
                <p className="bb-text-muted">
                  No aliases yet. Add one below.
                </p>
              )}

              {aliases.length > 0 && (
                <div ref={aliasListRef} className="bb-aliases-modal__table-wrapper">
                  <table className="bb-weapons-table bb-aliases-table">
                    <thead>
                      <tr>
                        <th className="bb-aliases-table__active-col">Active</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Credentials</th>
                        <th className="bb-aliases-table__actions-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aliases.map((alias, index) => {
                        const isNew =
                          !alias.name?.trim() &&
                          !(alias.description ?? "").trim() &&
                          !(alias.credentials ?? "").trim();
                        return (
                        <tr
                          key={index}
                          className={
                            "bb-aliases-table__row" +
                            (alias.active ? " bb-aliases-table__row--active" : "") +
                            (isNew ? " bb-aliases-table__row--new" : "")
                          }
                        >

                          {/* Active */}
                          <td className="bb-aliases-table__active-cell" data-label="Active">
                            <label className="bb-checkbox-label">
                              <input
                                type="checkbox"
                                checked={alias.active}
                                onChange={(e) => {
                                  handleAliasChange(
                                    index,
                                    "active",
                                    e.target.checked
                                  );
                                  e.currentTarget.blur();
                                }}
                              />
                            </label>
                          </td>

                          {/* Name */}
                          <td data-label="Name">
                            <input
                              type="text"
                              className="bb-input bb-aliases-table__name-input"
                              value={alias.name}
                              onChange={(e) =>
                                handleAliasChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Alias name"
                            />
                          </td>

                          {/* Description */}
                          <td data-label="Description">
                            <textarea
                              className="bb-textarea bb-aliases-table__textarea"
                              rows={2}
                              value={alias.description ?? ""}
                              onChange={(e) =>
                                handleAliasChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Who is this alias? Background, cover story, etc."
                            />
                          </td>

                          {/* Credentials */}
                          <td data-label="Credentials">
                            <textarea
                              className="bb-textarea bb-aliases-table__textarea"
                              rows={2}
                              value={alias.credentials ?? ""}
                              onChange={(e) =>
                                handleAliasChange(
                                  index,
                                  "credentials",
                                  e.target.value
                                )
                              }
                              placeholder="Badges, IDs, uniforms, online accounts..."
                            />
                          </td>

                          {/* Remove */}
                          <td className="bb-aliases-table__actions-cell" data-label="Actions">
                            <button
                              type="button"
                              className="bb-btn bb-btn--ghost bb-btn--small bb-button--danger"
                              onClick={() => handleRemoveAlias(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bb-modal__footer">
              <button
                type="button"
                className="bb-btn"
                onClick={handleAddAlias}
              >
                Add alias
              </button>
              <button
                type="button"
                className="bb-btn bb-btn--ghost"
                onClick={handleAliasDone}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};