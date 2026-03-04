// src/features/player-panel/cards/StatusCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { renderTrack, renderSanityTrack } from "../playerPanel.helpers"
import type { TrackType } from "../../modals/StatusAdjustModal";

type StatusCardProps = {
    agent: DeltaGreenAgent;
    headArmorRating: number;
    bodyArmorRating: number;
    headArmorTooltip: string;
    bodyArmorTooltip: string;
    setEditTrack: (t: TrackType) => void;
}

const StatusCard: React.FC<StatusCardProps> = ({
    agent,
    headArmorRating,
    bodyArmorRating,
    headArmorTooltip,
    bodyArmorTooltip,
    setEditTrack,
}) => {
  return (
    <div className="bb-card bb-card--status">
      <div className="bb-card__header">STATUS</div>
        <div className="bb-card__body bb-status">
          <div className="bb-status__armor">
            <div className="bb-status__helmet">
              <span className="bb-status__armor-value" title={headArmorTooltip}>
                {headArmorRating}
              </span>
            </div>
            <div className="bb-status__body-armor">
              <span className="bb-status__armor-value" title={bodyArmorTooltip}>
                {bodyArmorRating}
              </span>
            </div>
          </div>

          <div className="bb-status__tracks">
            {/* HP */}
            <div className="bb-status__row">
              <button
                type="button"
                className="bb-button bb-status__track-btn"
                onClick={() => {
                  if (!agent.system.health) return;
                  setEditTrack("HP");
                }}
              >
                ⚙
              </button>
              {renderTrack("HP", agent.system.health)}
            </div>

            {/* WP */}
            <div className="bb-status__row">
              <button
                type="button"
                className="bb-button bb-status__track-btn"
                onClick={() => {
                  if (!agent.system.wp) return;
                  setEditTrack("WP");
                }}
              >
                ⚙
              </button>
              {renderTrack("WP", agent.system.wp)}
            </div>

            {/* SAN */}
            <div className="bb-status__row">
              <button
                type="button"
                className="bb-button bb-status__track-btn"
                onClick={() => {
                  if (!agent.system.sanity) return;
                  setEditTrack("SAN");
                }}
              >
                ⚙
              </button>
              {renderSanityTrack(
                agent.system.sanity,
                agent.system.skills["unnatural"]?.proficiency ?? 0
              )}
            </div>
          </div>
        </div>
    </div>
  )
}

export default StatusCard;