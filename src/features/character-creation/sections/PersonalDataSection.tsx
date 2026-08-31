// src/features/character-creation/sections/PersonalDataSection.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";

type PersonalDataSectionProps = {
  agent: DeltaGreenAgent;
  updateField: (path: string[], value: any) => void;
  onPersonalDataChanged?: (field: string, before: string, after: string) => void;
};

const PersonalDataSection: React.FC<PersonalDataSectionProps> = ({
  agent,
  updateField,
  onPersonalDataChanged,
}) => {
  const biography = agent.system.biography;
  const sex = biography.sex;

  const snapshotRef = React.useRef("");

  const [sexMode, setSexMode] = React.useState<"M" | "F" | "OTHER">(
    sex === "M" ? "M" : sex === "F" ? "F" : "OTHER"
  );

  return (
    <section className="bb-identity-section">
      <h3 className="bb-section-title">Personal Data</h3>

      <div className="bb-form-grid">
        {/* Name */}
        <div className="bb-form-row">
          <label className="bb-form-label">
            <span className="bb-form-label__text">Name</span>
            <input
              className="bb-input"
              type="text"
              value={agent.name ?? ""}
              onChange={(e) => updateField(["name"], e.target.value)}
              onFocus={(e) => snapshotRef.current = e.target.value}
              onBlur={(e) => {
                const before = snapshotRef.current;
                const after = e.target.value;

                if (before === after) return;

                onPersonalDataChanged?.(
                  "name",
                  before,
                  after
                );
              }}
            />
          </label>
        </div>

        {/* Rank / Title */}
        <div className="bb-form-row">
          <label className="bb-form-label">
            <span className="bb-form-label__text">Rank / Title</span>
            <input
              className="bb-input"
              type="text"
              value={biography.rankOrTitle ?? ""}
              onChange={(e) =>
                updateField(
                  ["system", "biography", "rankOrTitle"],
                  e.target.value
                )
              }
              onFocus={(e) => snapshotRef.current = e.target.value}
              onBlur={(e) => {
                const before = snapshotRef.current;
                const after = e.target.value;

                if (before === after) return;

                onPersonalDataChanged?.(
                  "rankOrTitle",
                  before,
                  after
                );
              }}
            />
          </label>
        </div>

        {/* Employer */}
        <div className="bb-form-row">
          <label className="bb-form-label">
            <span className="bb-form-label__text">Employer</span>
            <input
              className="bb-input"
              type="text"
              value={biography.employer ?? ""}
              onChange={(e) =>
                updateField(
                  ["system", "biography", "employer"],
                  e.target.value
                )
              }
              onFocus={(e) => snapshotRef.current = e.target.value}
              onBlur={(e) => {
                const before = snapshotRef.current;
                const after = e.target.value;

                if (before === after) return;

                onPersonalDataChanged?.(
                  "employer",
                  before,
                  after
                );
              }}
            />
          </label>
        </div>

        {/* Age / DOB */}
        <div className="bb-form-row">
          <label className="bb-form-label">
            <span className="bb-form-label__text">Age / DOB</span>
            <input
              className="bb-input"
              type="text"
              value={biography.age ?? ""}
              onChange={(e) =>
                updateField(["system", "biography", "age"], e.target.value)
              }
              onFocus={(e) => snapshotRef.current = e.target.value}
              onBlur={(e) => {
                const before = snapshotRef.current;
                const after = e.target.value;

                if (before === after) return;

                onPersonalDataChanged?.(
                  "age",
                  before,
                  after
                );
              }}
            />
          </label>
        </div>

        {/* Nationality */}
        <div className="bb-form-row">
          <label className="bb-form-label">
            <span className="bb-form-label__text">Nationality</span>
            <input
              className="bb-input"
              type="text"
              value={biography.nationality ?? ""}
              onChange={(e) =>
                updateField(
                  ["system", "biography", "nationality"],
                  e.target.value
                )
              }
              onFocus={(e) => snapshotRef.current = e.target.value}
              onBlur={(e) => {
                const before = snapshotRef.current;
                const after = e.target.value;

                if (before === after) return;

                onPersonalDataChanged?.(
                  "nationality",
                  before,
                  after
                );
              }}
            />
          </label>
        </div>

        {/* Education */}
        <div className="bb-form-row">
          <label className="bb-form-label">
            <span className="bb-form-label__text">Education</span>
            <input
              className="bb-input"
              type="text"
              value={biography.education ?? ""}
              onChange={(e) =>
                updateField(
                  ["system", "biography", "education"],
                  e.target.value
                )
              }
              onFocus={(e) => snapshotRef.current = e.target.value}
              onBlur={(e) => {
                const before = snapshotRef.current;
                const after = e.target.value;

                if (before === after) return;

                onPersonalDataChanged?.(
                  "education",
                  before,
                  after
                );
              }}
            />
          </label>
        </div>

        {/* Sex selector */}
        <div className="bb-form-row bb-form-row--sex">
          <span className="bb-form-label__text">Sex</span>
          <div className="bb-toggle-group">
            <label className="bb-toggle">
              <input
                type="radio"
                className="bb-toggle__input"
                checked={sexMode === "M"}
                onChange={() => {
                  const before = biography.sex ?? "";
                  setSexMode("M");
                  updateField(["system", "biography", "sex"], "M");
                  if (before !== "M") {
                    onPersonalDataChanged?.(
                    "sex",
                    before,
                    "M"
                    );
                  }
                }}
              />
              <span className="bb-toggle__pill">
                <span className="bb-toggle__label">M</span>
              </span>
            </label>

            <label className="bb-toggle">
              <input
                type="radio"
                className="bb-toggle__input"
                checked={sexMode === "F"}
                onChange={() => {
                  const before = biography.sex ?? "";
                  setSexMode("F");
                  updateField(["system", "biography", "sex"], "F");
                  if (before !== "F") {
                    onPersonalDataChanged?.(
                    "sex",
                    before,
                    "F"
                    );
                  }
                  
                }}
              />
              <span className="bb-toggle__pill">
                <span className="bb-toggle__label">F</span>
              </span>
            </label>

            <label className="bb-toggle">
              <input
                type="radio"
                className="bb-toggle__input"
                checked={sexMode === "OTHER"}
                onChange={() => {
                  // Clear stored sex when switching to custom
                  setSexMode("OTHER");
                  updateField(["system", "biography", "sex"], "");
                }}
              />
              <span className="bb-toggle__pill">
                <span className="bb-toggle__label">Other</span>
              </span>
            </label>
          </div>

          {sexMode === "OTHER" && (
            <input
              className="bb-input bb-input--sex-other"
              type="text"
              value={
                biography.sex !== "M" && biography.sex !== "F"
                  ? biography.sex ?? ""
                  : ""
              }
              onChange={(e) =>
                updateField(["system", "biography", "sex"], e.target.value)
              }
              onFocus={(e) => snapshotRef.current = e.target.value}
              onBlur={(e) => {
                const before = snapshotRef.current;
                const after = e.target.value;

                if (before === after) return;

                onPersonalDataChanged?.(
                  "sex",
                  before,
                  after
                );
              }}
              placeholder="Enter value"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default PersonalDataSection;