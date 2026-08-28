// src/app/App.tsx
import React from "react";
import { useAgentStore } from "../store/agentStore";
import { createEmptyAgent } from "../models/createEmptyAgent";

import StartupPage from "../pages/StartupPage/StartupPage";
import LoadAgentModal from "../features/modals/LoadAgentModal";
import MainPage from "../pages/MainPage/MainPage";

const App: React.FC = () => {
  const { createAgent, activeAgentId, agents, } = useAgentStore();

  const [isLoadModalOpen, setIsLoadModalOpen] = React.useState(false);

  const hasAgents = Object.keys(agents).length > 0;
  const canShowMainPage = hasAgents && activeAgentId && agents[activeAgentId];

  const handleNewAgent = () => {
    const newAgent = createEmptyAgent();
    createAgent(newAgent);
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
  };

  const handleCloseModal = () => {
    setIsLoadModalOpen(false);
  };

  const handleCloseAgent = () => {
    const { setActiveAgent } = useAgentStore.getState();
    setActiveAgent(null);
  };

  return (
    <>
      {!hasAgents && (
        <StartupPage
          onNewAgent={handleNewAgent}
          onLoadAgent={handleLoadAgentClick}
          onHandlerMode={handleHandlerMode}
        />
      )}

      {canShowMainPage && (
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