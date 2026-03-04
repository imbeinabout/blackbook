// src/features/character-creation/sections/PersonalDataSection.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";

type PersonalDataSectionProps = {
  agent: DeltaGreenAgent;
  updateField: (path: string[], value: any) => void;
};

const PersonalDataSection: React.FC<PersonalDataSectionProps> = ({
  agent,
  updateField,
}) => {
  const biography = agent.system.biography;
  const sex = biography.sex;
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
                  setSexMode("M");
                  updateField(["system", "biography", "sex"], "M");
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
                  setSexMode("F");
                  updateField(["system", "biography", "sex"], "F");
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
              placeholder="Enter value"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default PersonalDataSection;