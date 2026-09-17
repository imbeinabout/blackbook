import { DeltaGreenAgent } from "../models/DeltaGreenAgent";
import { AgentStatistics } from "../models/events";

export function calculateAgentStatistics(
  agent: DeltaGreenAgent
): AgentStatistics {

  const stats: AgentStatistics = {
    totalEvents: agent.events.length,

    firstEventDate: undefined,
    lastEventDate: undefined,

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
  }

  for (const event of agent.events) {
    stats.categoryCounts[event.category] = (stats.categoryCounts[event.category] ?? 0) + 1;
    if (event.category === "skill") stats.skillChanges++;
    if (event.category === "attribute") stats.attributeChanges++;
    if (event.category === "sanity") {
      stats.sanityEvents++;
      if (event.metadata?.actualSanLoss) {
        stats.totalSanLost += event.metadata.actualSanLoss as number; //TODO: Update SAN events to always have actualSanLoss in metadata
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

  stats.mostActiveCategory = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return stats;
}