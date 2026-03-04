// src/features/player-panel/cards/SanLuckCard.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { getEffectiveSanTestChance } from "../conditionRolls";

type SanLuckCardProps = {
  agent: DeltaGreenAgent;
  openSanityTest: (chanceOverride?: number) => void;
  openLuckTest: () => void;
};

const SanLuckCard: React.FC<SanLuckCardProps> = ({
  agent,
  openSanityTest,
  openLuckTest,
}) => {
  const baseSan = agent.system.sanity?.value ?? 0;
  const { chance: effective, adj } = getEffectiveSanTestChance(agent, baseSan);

  const hasMod = adj.delta !== 0;
  const isPenalty = adj.delta < 0;
  const isBonus = adj.delta > 0;

  const title = hasMod
    ? `SAN ${baseSan}% → ${effective}% (${adj.delta > 0 ? "+" : ""}${adj.delta}% from: ${adj.sources.join(
        ", "
      )})`
    : `SAN ${baseSan}%`;

  return (
    <div className="bb-card bb-card--san-luck">
      <div className="bb-card__body bb-san-luck__body">
        <button
          type="button"
          className={[
            "bb-button",
            "bb-button--san-test",
            hasMod ? "bb-button--modified" : "",
            isPenalty ? "bb-button--penalty" : "",
            isBonus ? "bb-button--bonus" : "",
          ].join(" ")}
          title={title}
          onClick={() => openSanityTest(effective)}
        >
          <span className="bb-san-test__label">SANITY TEST</span>

          {hasMod && (
            <span
              className={[
                "bb-roll-mod-badge",
                isPenalty ? "bb-roll-mod-badge--penalty" : "",
                isBonus ? "bb-roll-mod-badge--bonus" : "",
              ].join(" ")}
              aria-label={`SAN modifier ${adj.delta > 0 ? "+" : ""}${adj.delta}`}
            >
              {adj.delta > 0 ? "+" : ""}
              {adj.delta}
            </span>
          )}
        </button>

        <button
          type="button"
          className="bb-button bb-button--luck-test"
          onClick={openLuckTest}
        >
          ☘ LUCK TEST ☘
        </button>
      </div>
    </div>
  );
};

export default SanLuckCard;