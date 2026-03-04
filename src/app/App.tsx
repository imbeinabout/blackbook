// src/app/App.tsx
import React from "react";
import { useAgentStore } from "../store/agentStore";
import { createEmptyAgent } from "../models/createEmptyAgent";

import StartupPage from "../pages/StartupPage/StartupPage";
import LoadAgentModal from "../features/modals/LoadAgentModal";
import MainPage from "../pages/MainPage/MainPage";

type Screen = "startup" | "main";

const App: React.FC = () => {
  const { createAgent, activeAgentId } = useAgentStore();

  const [screen, setScreen] = React.useState<Screen>("startup");
  const [isLoadModalOpen, setIsLoadModalOpen] = React.useState(false);

  const handleNewAgent = () => {
    const newAgent = createEmptyAgent();
    createAgent(newAgent); // store also sets activeAgentId
    setScreen("main");
  };

  const handleLoadAgentClick = () => {
    setIsLoadModalOpen(true);
  };

  const handleHandlerMode = () => {
    // Placeholder for now
    alert("Handler Mode is not implemented yet.");
  };

  const handleAgentLoaded = () => {
    setIsLoadModalOpen(false);
    setScreen("main");
  };

  const handleCloseModal = () => {
    setIsLoadModalOpen(false);
  };

  const handleCloseAgent = () => {
    const { setActiveAgent } = useAgentStore.getState();
    setActiveAgent(null);
    setScreen("startup");
  };

  const showMain =
    screen === "main" && activeAgentId !== null;

  return (
    <>
      {screen === "startup" && (
        <StartupPage
          onNewAgent={handleNewAgent}
          onLoadAgent={handleLoadAgentClick}
          onHandlerMode={handleHandlerMode}
        />
      )}

      {showMain && (
        <MainPage
          onCloseAgent={handleCloseAgent}
          onNewAgent={handleNewAgent}
          onLoadAgent={handleLoadAgentClick}
        />
      )}

      <LoadAgentModal
        isOpen={isLoadModalOpen}
        onClose={handleCloseModal}
        onAgentLoaded={handleAgentLoaded}
      />
    </>
  );
};

export default App;