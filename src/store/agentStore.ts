// src/store/agentStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";

import type { DeltaGreenAgent } from "../models/DeltaGreenAgent";
import { idbGetItem, idbSetItem, idbRemoveItem } from "./indexedDbStorage";

export type AgentId = string;

export interface AgentStoreState {
  agents: Record<AgentId, DeltaGreenAgent>;
  activeAgentId: AgentId | null;

  openAgentIds: AgentId[];

  createAgent: (agent: DeltaGreenAgent) => AgentId;
  updateAgent: (id: AgentId, agent: DeltaGreenAgent) => void;
  deleteAgent: (id: AgentId) => void;

  setActiveAgent: (id: AgentId | null) => void;

  closeAgent: (id: AgentId) => void;

  loadAgents: (
    agents: Record<AgentId, DeltaGreenAgent>,
    activeId: AgentId | null
  ) => void;
  reorderOpenAgentIds: (ids: AgentId[]) => void;
}

export const useAgentStore = create<AgentStoreState>()(
  persist(
    (set, get) => ({
      agents: {},
      activeAgentId: null,
      openAgentIds: [],

      createAgent: (agent) => {
        const id = nanoid();
        set((state) => ({
          agents: {
            ...state.agents,
            [id]: agent,
          },
          activeAgentId: id,
          openAgentIds: [...state.openAgentIds, id],
        }));
        return id;
      },

      updateAgent: (id, agent) => {
        set((state) => {
          if (!state.agents[id]) return state;
          return {
            ...state,
            agents: {
              ...state.agents,
              [id]: agent,
            },
          };
        });
      },

      deleteAgent: (id) => {
        set((state) => {
          if (!state.agents[id]) return state;

          const { [id]: _deleted, ...restAgents } = state.agents;
          const filteredOpen = state.openAgentIds.filter(
            (openId) => openId !== id
          );
          const wasActive = state.activeAgentId === id;

          let nextActive: AgentId | null = state.activeAgentId;

          if (wasActive) {
            nextActive =
              filteredOpen.length > 0
                ? (filteredOpen[filteredOpen.length - 1] as AgentId)
                : null;
          } else if (nextActive && !restAgents[nextActive]) {
            nextActive =
              filteredOpen.length > 0
                ? (filteredOpen[filteredOpen.length - 1] as AgentId)
                : null;
          }

          return {
            agents: restAgents,
            openAgentIds: filteredOpen,
            activeAgentId: nextActive,
          };
        });
      },

      setActiveAgent: (id) => {
        set((state) => {
          if (id && !state.agents[id]) {
            return state;
          }

          let openAgentIds = state.openAgentIds;
          if (id && !openAgentIds.includes(id)) {
            openAgentIds = [...openAgentIds, id];
          }

          return {
            ...state,
            activeAgentId: id,
            openAgentIds,
          };
        });
      },

      closeAgent: (id) => {
        set((state) => {
          const filteredOpen = state.openAgentIds.filter(
            (openId) => openId !== id
          );
          if (filteredOpen.length === state.openAgentIds.length) {
            return state;
          }

          let nextActive: AgentId | null = state.activeAgentId;
          if (state.activeAgentId === id) {
            nextActive =
              filteredOpen.length > 0
                ? (filteredOpen[filteredOpen.length - 1] as AgentId)
                : null;
          }

          return {
            ...state,
            openAgentIds: filteredOpen,
            activeAgentId: nextActive,
          };
        });
      },

      loadAgents: (agents, activeId) => {
        const ids = Object.keys(agents) as AgentId[];
        const safeActiveId =
          activeId && agents[activeId]
            ? activeId
            : ids.length > 0
            ? (ids[0] as AgentId)
            : null;

        set({
          agents,
          activeAgentId: safeActiveId,
          openAgentIds: safeActiveId ? [safeActiveId] : [],
        });
      },

      reorderOpenAgentIds: (ids) => {
        set((state) => {
          const unique = Array.from(new Set(ids));

          const filtered = unique.filter((id) => state.openAgentIds.includes(id));

          const remainder = state.openAgentIds.filter((id) => !filtered.includes(id));

          return {
            ...state,
            openAgentIds: [...filtered, ...remainder],
          };
        });
      },

    }),
    {
      name: "dg-agent-store",

      storage: createJSONStorage(() => ({
        getItem: idbGetItem,
        setItem: idbSetItem,
        removeItem: idbRemoveItem,
      })),

      partialize: (state) => ({
        agents: state.agents,
        activeAgentId: state.activeAgentId,
        openAgentIds: state.openAgentIds,
      }),
    }
  )
);