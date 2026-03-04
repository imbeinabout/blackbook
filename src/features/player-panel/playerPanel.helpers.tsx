// src/features/player-panel/playerPanel.helpers.tsx
import React from "react";

import type { DeltaGreenAgent } from "../../models/DeltaGreenAgent";
import type { BottomTabKey, BottomTab } from "./playerPanel.types";
import { WeaponsTab } from "./tabs/WeaponsTab";
import { WoundsTab } from "./tabs/WoundsTab";
import { GearTab } from "./tabs/GearTab";
import { ArmorTab } from "./tabs/ArmorTab";

export const bottomTabs: BottomTab[] = [
  { key: "weapons", label: "WEAPONS" },
  { key: "armor", label: "ARMOR" },
  { key: "gear", label: "GEAR" },
  { key: "wounds", label: "WOUNDS/AILMENTS" },
  { key: "details", label: "DETAILS" },
  { key: "notes", label: "NOTES" },
  { key: "shell", label: "SHELL" },
];

export function renderStatButton(
  label: string,
  stat: { value: number; x5: number; distinguishing_feature?: string },
  onClick?: () => void,
  rollMod?: number
) {
  const hasMod = typeof rollMod === "number" && rollMod !== 0;

  return (
    <button
      key={label}
      type="button"
      className={"bb-stat-button" + (hasMod ? " bb-stat-button--modified" : "")}
      onClick={onClick}
      title={
        hasMod
          ? `${label}: ${stat.value} (x5 ${stat.x5}) [${rollMod > 0 ? "+" : ""}${rollMod}%]`
          : `${label}: ${stat.value} (x5 ${stat.x5})`
      }
    >
      <div className="bb-stat-button__label">{label}</div>
      <div className="bb-stat-button__value">{stat.value}</div>

      <div className="bb-stat-button__x5">
        {stat.x5}
        {hasMod && (
          <span
            className={
              "bb-roll-mod-inline" +
              (rollMod! < 0 ? " bb-roll-mod-inline--penalty" : "") +
              (rollMod! > 0 ? " bb-roll-mod-inline--bonus" : "")
            }
          >
            {rollMod! > 0 ? "+" : ""}
            {rollMod}
          </span>
        )}
      </div>

      {stat.distinguishing_feature && stat.distinguishing_feature.trim() !== "" && (
        <div className="bb-stat-button__df">
          <small>{stat.distinguishing_feature}</small>
        </div>
      )}
    </button>
  );
}


export function renderTrack(
  label: string,
  valueBlock:
    | { value: number; max: number; min: number; protection?: number }
    | undefined,
  onAdjust?: () => void
) {
  if (!valueBlock) {
    return (
      <div className="bb-track" key={label}>
        <div className="bb-track__label">
          {label}
          {onAdjust && (
            <button
              type="button"
              className="bb-track__edit-btn bb-button--small"
              onClick={onAdjust}
            >
              ⚙
            </button>
          )}
          <span className="bb-track__value">—</span>
        </div>
        <div className="bb-track__bar" />
      </div>
    );
  }

  const percent = Math.max(0, Math.min(100, (valueBlock.value / valueBlock.max) * 100));

  return (
    <div className="bb-track" key={label}>
      <div className="bb-track__label">
        {label}
        {onAdjust && (
          <button
            type="button"
            className="bb-track__edit-btn bb-button--small"
            onClick={onAdjust}
          >
            ⚙
          </button>
        )}
        <span className="bb-track__value">
          {valueBlock.value}/{valueBlock.max}
        </span>
      </div>
      <div className="bb-track__bar">
        <div
          className="bb-track__fill"
          style={{ width: `${percent}%` }}
          title={`${label}: ${valueBlock.value}/${valueBlock.max}`}
        />
      </div>
    </div>
  );
}

export function formatTypedSkillLabel(raw: string): string {
  if (!raw) return raw;

  // Expect labels like "military_science [land]" or "foreign_language [arabic]"
  const bracketIndex = raw.indexOf("[");
  let skillPart = raw;
  let subtypePart = "";

  if (bracketIndex !== -1) {
    skillPart = raw.slice(0, bracketIndex).trim();
    subtypePart = raw.slice(bracketIndex).trim(); 
  }

  const skillWords = skillPart
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );

  const formattedSkill = skillWords.join(" ");

  let formattedSubtype = subtypePart;
  if (subtypePart.startsWith("[") && subtypePart.endsWith("]")) {
    const inner = subtypePart.slice(1, -1).trim();
    const subtypeWords = inner
      .split(" ")
      .filter(Boolean)
      .map(
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      );
    formattedSubtype = `[${subtypeWords.join(" ")}]`;
  }

  return formattedSubtype ? `${formattedSkill} ${formattedSubtype}` : formattedSkill;
}

export function renderSanityTrack(
  sanity:
    | {
        value: number;
        max: number;
        currentBreakingPoint: number;
      }
    | undefined,
  unnaturalScore: number = 0,
  onAdjust?: () => void
) {
  if (!sanity) {
    return (
      <div className="bb-track bb-track--san" key="SAN">
        <div className="bb-track__label">
          SAN
          {onAdjust && (
            <button
              type="button"
              className="bb-track__edit-btn bb-button--small"
              onClick={onAdjust}
            >
              ⚙
            </button>
          )}
          <span className="bb-track__value">—</span>
        </div>
        <div className="bb-track__bar bb-track__bar--san" />
      </div>
    );
  }

  // The track is always scaled to 0–99 ticks visually
  const BASE_TICKS = 99;

  const clampedSan = Math.max(0, Math.min(BASE_TICKS, sanity.value));
  const clampedBP = Math.max(
    0,
    Math.min(BASE_TICKS, sanity.currentBreakingPoint)
  );
  const clampedUnnatural = Math.max(
    0,
    Math.min(BASE_TICKS, unnaturalScore || 0)
  );

  const sanPercent = (clampedSan / BASE_TICKS) * 100;
  const bpPercent = (clampedBP / BASE_TICKS) * 100;
  const bleedPercent = (clampedUnnatural / BASE_TICKS) * 100;

  return (
    <div className="bb-track bb-track--san" key="SAN">
      <div className="bb-track__label">
        SAN
        {onAdjust && (
          <button
            type="button"
            className="bb-track__edit-btn bb-button--small"
            onClick={onAdjust}
          >
            ⚙
          </button>
        )}
        <span className="bb-track__value">
          {sanity.value}/{sanity.max}
        </span>
      </div>
      <div className="bb-track__bar bb-track__bar--san">
        <div
          className="bb-track__bleed bb-track__bleed--san"
          style={{ width: `${bleedPercent}%` }}
          title={
            clampedUnnatural > 0 ? `Unnatural: ${clampedUnnatural}` : undefined
          }
        />
        <div
          className="bb-track__fill bb-track__fill--san"
          style={{ width: `${sanPercent}%` }}
        />
        <div className="bb-track__bp" style={{ left: `${bpPercent}%` }} />
        <div
          className="bb-track__bp-label"
          style={{ left: `${bpPercent}%` }}
        >
          {sanity.currentBreakingPoint}
        </div>
      </div>
    </div>
  );
}