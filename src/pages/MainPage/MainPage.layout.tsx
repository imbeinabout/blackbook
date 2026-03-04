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
  isSidebarOpen: boolean;
};

export function MainPageLayout({
  header,
  sidebar,
  playerPanel,
  footer,
  isSidebarOpen,
}: MainPageLayoutProps) {
  return (
    <div className="bb-app">
      {header}

      <div className={"bb-main"}>
        <aside 
          className={
            "bb-sidebar-drawer" + 
            (isSidebarOpen ? "bb-sidebar-drawer--open" : "")
          }
        >
          <div className="bb-sidebar">
            {sidebar}
          </div>
        </aside>
        {playerPanel}
      </div>

      {footer}
    </div>
  );
}