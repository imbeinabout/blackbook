// src/pages/MainPage/MainPage.layout.tsx
/** @jsxRuntime classic */
/** @jsx React.createElement */

// MainPage.layout.tsx
import React from "react";

type MainPageLayoutProps = {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  playerPanel: React.ReactNode;
  footer: React.ReactNode;
};

export function MainPageLayout({
  header,
  sidebar,
  playerPanel,
  footer,
}: MainPageLayoutProps) {
  return (
    <div className="bb-app">
      {header}

      <div className={"bb-main"}>
        <aside className={"bb-sidebar"}>{sidebar}</aside>
        {playerPanel}
      </div>

      {footer}
    </div>
  );
}