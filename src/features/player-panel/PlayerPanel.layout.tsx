// src/features/player-panel/PlayerPanel.layout.tsx
import React from "react";

type PlayerPanelLayoutProps = {
  topLeft: React.ReactNode;
  topMiddle: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
  floatingAction?: React.ReactNode;
};

export function PlayerPanelLayout({
  topLeft,
  topMiddle,
  topRight,
  bottomLeft,
  bottomRight,
  floatingAction,
}: PlayerPanelLayoutProps) {
  return (
    <main className="bb-player-panel">
      {/* TOP: 3 columns */}
      <div className="bb-player-panel__top">
        <section className="bb-top-col bb-top-col--left">{topLeft}</section>
        <section className="bb-top-col bb-top-col--middle">{topMiddle}</section>
        <section className="bb-top-col bb-top-col--right">{topRight}</section>
      </div>

      {/* BOTTOM: 2 columns */}
      <div className="bb-player-panel__bottom">
        <section className="bb-bottom-col bb-bottom-col--left">{bottomLeft}</section>
        <section className="bb-bottom-col bb-bottom-col--right">{bottomRight}</section>
      </div>

      {floatingAction}
    </main>
  );
}