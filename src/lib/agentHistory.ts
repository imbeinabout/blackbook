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
    activitySpanDays: undefined,
    activeDays: undefined,

    categoryCounts: {},
    mostActiveCategory: undefined,

    campaigns: 0,
    operations: 0,
    sessions: 0,
    latestCampaign: undefined,
    latestOperation: undefined,
    latestSession: undefined,

    sanityLossEvents: 0,
    totalSanLost: 0,
    totalSanRecovered: 0,
    netSanChange: 0,
    breakingPointsCrossed: 0,
    temporaryInsanityEpisodes: 0,
    adaptedtoViolence: false,
    adaptedtoHelplessness: false,
    sanLostByType: {
      helplessness: 0,
      violence: 0,
      unnatural: 0
    },

    hpDamageTaken: 0,
    hpRecovered: 0,
    woundsAdded: 0,
    woundsRemoved: 0,
    firstAidApplications: 0,

    wpDamageTaken: 0,
    wpRecovered: 0,

    bondsCreated: 0,
    bondsRemoved: 0,
    bondScoreChanges: 0,
    bondDamagedEvents: 0,
    totalBondDamage: 0,
    totalBondRecovery: 0,
    projectionEvents: 0,

    disordersAdded: 0,
    disordersCured: 0,
    motivationsCrossedOut: 0,
    motivationsRestored: 0,

    statValueChanges: 0,
    skillValueChanges: 0,
    skillUpgradeEvents: 0,
    totalSkillPointsGained: 0,
    totalSkillPointsReversed: 0,
    specialTrainingAdded: 0,
    specialTrainingRemoved: 0,
    mostImprovedSkill: undefined,

    conditionsAdded: 0,
    conditionsRemoved: 0,

    homeScenesCompleted: 0,
    personalPursuits: 0,
    bondsResolvedInHomeScenes: 0
  };

  const sortedEvents = [...agent.events].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  );

  if (agent.events.length > 0) {

    stats.firstEventDate = sortedEvents[0].timestamp;
    stats.lastEventDate = sortedEvents[sortedEvents.length - 1].timestamp;
    stats.activitySpanDays =
      (new Date(stats.lastEventDate).getTime() -
        new Date(stats.firstEventDate).getTime()) /
      (1000 * 60 * 60 * 24);
    
    const activeDateKeys = new Set(sortedEvents.map(event => event.timestamp.slice(0, 10)));
    stats.activeDays = activeDateKeys.size; //UPDATE: Slice by TZ instead of UTC to get local date counts. This is a simplification and may not be accurate for all time zones.
  }

  const skillImprovements: Record<string, number> = {};
  const addSkillImprovement = (skillKey: string, amount: number) => {
    if (!skillImprovements[skillKey]) {
      skillImprovements[skillKey] = 0;
    }
    skillImprovements[skillKey] += amount;
  };

  let mostActiveCategory: string | undefined;
  let mostActiveCount = 0;

  for (const event of sortedEvents) {
    stats.categoryCounts[event.category] = (stats.categoryCounts[event.category] ?? 0) + 1;
    if (stats.categoryCounts[event.category] > mostActiveCount) {
      mostActiveCount = stats.categoryCounts[event.category];
      mostActiveCategory = event.category;
    }
    if (event.category === "marker") {
      const markerName = event.metadata?.markerName as string | undefined;
      if (event.action === "campaign") {
        stats.campaigns++;
        stats.latestCampaign = markerName ?? '';
      }
      if (event.action === "operation") {
        stats.operations++;
        stats.latestOperation = markerName ?? '';
      }
      if (event.action === "session") {
        stats.sessions++;
        stats.latestSession = markerName ?? '';
      }
    }
    if (event.category === "skill") {
      if (event.action === "skill-adjusted" || event.action === "skill-upgraded") {
        stats.skillValueChanges++;
      }
    }
    if (event.category === "attribute" && event.action === "stat-change") {
      stats.statValueChanges++;
    }
    if (event.category === "sanity") {
      const sanLoss = event.metadata?.actualSanLoss as number | undefined;
      if (event.action === "san-change" && sanLoss !== undefined && sanLoss > 0) {
        stats.sanityLossEvents++;
        stats.totalSanLost += sanLoss;
        if (event.metadata?.sanType === "helplessness") {
          stats.sanLostByType.helplessness += sanLoss;
        }
        if (event.metadata?.sanType === "violence") {
          stats.sanLostByType.violence += sanLoss;
        }
        if (event.metadata?.sanType === "unnatural") stats.sanLostByType.unnatural += sanLoss;
      }
      if (event.action === "san-change" && sanLoss !== undefined && sanLoss < 0) {
        stats.totalSanRecovered += Math.abs(sanLoss);
      }
      if (event.action === "san-change") {
        if (event.metadata?.crossedBreakingPoint) stats.breakingPointsCrossed++;
        if (event.metadata?.temporaryInsanity) stats.temporaryInsanityEpisodes++;
        const projectedLoss = event.metadata?.projectedLoss as number | undefined;
        if (projectedLoss !== undefined && projectedLoss > 0) stats.projectionEvents++;
      }
    }

    if (event.category === "attribute" && event.action === "hp-change") {
      const amount = event.metadata?.amount as number | undefined;
      if (event.metadata?.mode === "damage") {
        stats.hpDamageTaken += amount ?? 0;
      }
      if (event.metadata?.mode === "heal") {
        stats.hpRecovered += amount ?? 0;
      }
    }
    if (event.category === "wound" && event.action === "wound-added") stats.woundsAdded++;
    if (event.category === "wound" && event.action === "wound-removed") stats.woundsRemoved++;
    if (event.category === "wound" && event.action === "first-aid-applied") stats.firstAidApplications++;

    if (event.category === "attribute" && event.action === "wp-change") {
      const amount = event.metadata?.amount as number | undefined;
      if (event.metadata?.mode === "damage") {
        stats.wpDamageTaken += amount ?? 0;
      }
      if (event.metadata?.mode === "heal") {
        stats.wpRecovered += amount ?? 0;
      }
    }

    if (event.category === "bond" && event.action === "bond-change") {
      stats.bondScoreChanges++;
      const delta = event.metadata?.delta as number | undefined;
      if (delta !== undefined) {
        if (delta < 0) {
          stats.bondDamagedEvents++;
          stats.totalBondDamage += Math.abs(delta);
        } else {
          stats.totalBondRecovery += delta;
        }
      }
    }
    if (event.category === "bond" && event.action === "bond-created") stats.bondsCreated++;
    if (event.category === "bond" && event.action === "bond-removed") stats.bondsRemoved++;
    if (event.category === "bond" && event.action === "projection") stats.projectionEvents++;

    if (event.category === "condition") {
      if (event.action === "condition-added") stats.conditionsAdded++;
      if (event.action === "condition-removed") stats.conditionsRemoved++;
    }
    if (event.category === "disorder" && event.action === "disorder-added") stats.disordersAdded++;
    if (event.category === "disorder" && event.action === "disorder-cured") stats.disordersCured++;
    if (event.category === "motivation" && event.action === "motivation-crossed") {
      if(event.metadata?.crossedOut === true) {
        stats.motivationsCrossedOut++;
      } 
      if(event.metadata?.crossedOut === false) {
        stats.motivationsRestored++;
      }
    }

    if (event.category === "skill") {
      if (event.action === "skill-upgraded") {
        stats.skillUpgradeEvents++;
        const skillKey = event.metadata?.skillKey as string | undefined;
        const netChange = event.metadata?.newAdvancement as number | undefined;
        if (skillKey && netChange !== undefined) {
          stats.totalSkillPointsGained += netChange;
          addSkillImprovement(skillKey, netChange);
        }
      }
      if (event.action === "skill-adjusted") {
        const skillKey = event.metadata?.skillKey as string | undefined;
        const delta = event.metadata?.delta as number | undefined;
        if (delta !== undefined && skillKey !== undefined) {
          if (delta > 0) {
            stats.totalSkillPointsGained += delta;
            addSkillImprovement(skillKey, delta);
          }
          if (delta < 0) {
            stats.totalSkillPointsReversed += Math.abs(delta);
            addSkillImprovement(skillKey, delta);
          }
        }
      }
      if (event.action === "special-training-added") stats.specialTrainingAdded++;
      if (event.action === "special-training-removed") stats.specialTrainingRemoved++;
    }
    if (event.category === "home-scene" && event.action === "personal-pursuit-applied" && event.metadata?.pursuitId === "improve_skills_stats") {
      const summaryItems = event.metadata?.summaryItems as { key: string; label: string; value: number }[] | undefined;
      if (summaryItems !== undefined) {
        const skillSummary = summaryItems.find(item => item.key === "skill");
        if (skillSummary && skillSummary.value > 0) {
          stats.totalSkillPointsGained += skillSummary.value;
          addSkillImprovement(skillSummary.label, skillSummary.value);
        }
      }
    }

    if (event.category === "home-scene" && event.action === "personal-pursuit-applied" && event.metadata?.pursuitId === "establish_new_bond") {
      const outcome = event.metadata?.outcome as string | undefined;
      if (outcome !== undefined && outcome.includes("success")) {
        stats.bondsCreated++;
      }
    }
    
    if (event.category === "home-scene" && event.action === "personal-pursuit-applied") {
      stats.personalPursuits++;
      const summaryItems = event.metadata?.summaryItems as { key: string; label: string; value: number }[] | undefined;
      if (summaryItems !== undefined) {
        for (const item of summaryItems) {
          if (item.key === "selected_bond" && item.value < 0) {
            stats.bondScoreChanges++;
            stats.bondDamagedEvents++;
            stats.totalBondDamage += Math.abs(item.value);
          } else if (item.key === "selected_bond" && item.value > 0) {
            stats.bondScoreChanges++;
            stats.totalBondRecovery += item.value;
          }
        }
      }
    }
    if (event.category === "home-scene" && event.action === "home-scene-completed") {
      stats.homeScenesCompleted++;
      const bondsResolved = event.metadata?.bondsResolved as number | undefined;
      if (bondsResolved !== undefined) {
        stats.bondsResolvedInHomeScenes += bondsResolved ?? 0;
      }
    }
  }

  stats.adaptedtoHelplessness = agent.system.sanity?.adaptations.helplessness.isAdapted ?? false;
  stats.adaptedtoViolence = agent.system.sanity?.adaptations.violence.isAdapted ?? false;

  stats.netSanChange = stats.totalSanRecovered - stats.totalSanLost;

  let mostImprovedSkill:
    | { key: string; label: string; netChange: number }
    | undefined;

  for (const [key, netChange] of Object.entries(skillImprovements)) {
    if (
      !mostImprovedSkill ||
      netChange > mostImprovedSkill.netChange
    ) {
      mostImprovedSkill = {
        key,
        label: agent.system.skills[key]?.label ?? key,
        netChange
      };
    }
  }

  stats.mostImprovedSkill = mostImprovedSkill;

  if (mostActiveCategory) {
    stats.mostActiveCategory = {
      category: mostActiveCategory,
      count: mostActiveCount
    };
  }

  return stats;
}