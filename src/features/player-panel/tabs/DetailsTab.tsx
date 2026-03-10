// src/features/player-panel/tabs/DetailsTab.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { useLayoutMode } from "../../../hooks/useLayoutMode";

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

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const aliasListRef = React.useRef<HTMLDivElement | null>(null);
  const aliasModalBodyRef = React.useRef<HTMLDivElement | null>(null);
  const newAliasRowRef = React.useRef<HTMLTableRowElement | null>(null);
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

  const activeAliases = aliases.filter(
    (a) => a.active && a.name && a.name.trim().length > 0
  );

  const handleFile = React.useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          updateDetails({ photoDataUrl: result });
        }
      };
      reader.readAsDataURL(file);
    },
    [updateDetails]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
          <h3 className="bb-section-title">Agent Photo</h3>
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
              <img
                src={details.photoDataUrl}
                alt={`${agent.name} portrait`}
                className="bb-photo-dropzone__image"
              />
            ) : (
              <div className="bb-photo-dropzone__placeholder">
                <p className="bb-photo-dropzone__hint">
                  {isMobile ? "Tap to add a photo" : "Drag & drop an image here, or click to choose a file."}
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {details.photoDataUrl && (
            <button
              type="button"
              className="bb-btn bb-btn--ghost bb-details-tab__clear-photo"
              onClick={() => updateDetails({ photoDataUrl: "" })}
            >
              Remove photo
            </button>
          )}

          {/* ALIASES UNDER PHOTO */}
          <section className="bb-details-tab__aliases">
            <h3 className="bb-section-title">Aliases</h3>
            {activeAliases.length === 0 ? (
              <p className="bb-text-muted">No active aliases.</p>
            ) : (
              <ul className="bb-alias-list">
                {activeAliases.map((alias, index) => {
                  const tooltipParts = [];
                  if (alias.description?.trim()) {
                    tooltipParts.push(alias.description.trim());
                  }
                  if (alias.credentials?.trim()) {
                    tooltipParts.push(`Credentials: ${alias.credentials.trim()}`);
                  }
                  const title =
                    tooltipParts.length > 0 ? tooltipParts.join("\n\n") : "";

                  return (
                    <li
                      key={index}
                      className="bb-alias-list__item"
                      title={title}
                    >
                      {alias.name}
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              className="bb-btn bb-btn--ghost bb-aliases__manage-btn"
              onClick={() => setIsAliasModalOpen(true)}
            >
              Manage aliases
            </button>
          </section>
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
              onChange={(e) =>
                updateDetails({ homeFamilyDevelopments: e.target.value })
              }
            />
          </div>
        </section>

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
                              className="bb-btn bb-btn--ghost bb-btn--small"
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
                onClick={() => setIsAliasModalOpen(false)}
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