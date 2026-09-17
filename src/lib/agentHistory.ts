// src/lib/agentHistory.ts
import { DeltaGreenAgent } from "../models/DeltaGreenAgent";
import { AgentStatistics } from "../models/events";

export function calculateAgentStatistics(
  agent: DeltaGreenAgent
): AgentStatistics {

  const stats: AgentStatistics = {
    totalEvents: agent.events.length,

    firstEventDate: undefined,
    lastEventDate: undefined,
    activeDays: undefined,

    categoryCounts: {},
    mostActiveCategory: undefined,

    skillChanges: 0,
    attributeChanges: 0,

    sanityEvents: 0,
    totalSanLost: 0,

    bondChanges: 0,

    conditionsAdded: 0,
    conditionsRemoved: 0,

    disordersAdded: 0,

    homeScenes: 0,
  };

  if (agent.events.length > 0) {
    const sorted = [...agent.events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    );

    stats.firstEventDate = sorted[0].timestamp;
    stats.lastEventDate = sorted[sorted.length - 1].timestamp;
    stats.activeDays =
      (new Date(stats.lastEventDate).getTime() -
        new Date(stats.firstEventDate).getTime()) /
      (1000 * 60 * 60 * 24);
  }

  for (const event of agent.events) {
    stats.categoryCounts[event.category] = (stats.categoryCounts[event.category] ?? 0) + 1;
    if (event.category === "skill") stats.skillChanges++;
    if (event.category === "attribute") stats.attributeChanges++;
    if (event.category === "sanity") {
      stats.sanityEvents++;
      const sanLoss = event.metadata?.actualSanLoss;
      if (typeof sanLoss === "number") {
        stats.totalSanLost += sanLoss;
      }
    }
    if (event.category === "bond") stats.bondChanges++;
    if (event.category === "condition") {
      if (event.action === "condition-added") stats.conditionsAdded++;
      if (event.action === "condition-removed") stats.conditionsRemoved++;
    }
    if (event.category === "disorder" && event.action === "disorder-added") stats.disordersAdded++;
    if (event.category === "home-scene") stats.homeScenes++;
  }

  const mostActive = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostActive) {
    stats.mostActiveCategory = {
      category: mostActive[0],
      count: mostActive[1],
    };
  }

  return stats;
}