// src/lib/agentMilestones.ts

import { DeltaGreenAgent } from "../models/DeltaGreenAgent";
import { AgentStatistics, AgentMilestone } from "../models/events";

export function calculateAgentMilestones(
  agent: DeltaGreenAgent,
  stats: AgentStatistics
): AgentMilestone[] {
  const highestSkill = Math.max(
    ...Object.values(agent.system.skills).map(skill => skill.proficiency)
  );
  const masterySkill = Object.values(agent.system.skills).find(skill => skill.proficiency === highestSkill);

  const unnatural = agent.system.skills.unnatural?.proficiency ?? 0;

  return [
    {
      id: "skill_mastery",
      title: "Skill Mastery",
      icon: "mastery",
      achieved: highestSkill >= 90,
      progress: highestSkill,
      skill: masterySkill?.key,
      target: 90,
    },

    {
      id: "veteran_operative",
      title: "Veteran Operative",
      icon: "veteran",
      achieved: stats.operations >= 5,
      progress: stats.operations,
      target: 5,
    },

    {
      id: "legend",
      title: "Legend",
      icon: "legend",
      achieved: stats.operations >= 10,
      progress: stats.operations,
      target: 10,
    },

    {
      id: "documented_agent",
      title: "Documented Agent",
      icon: "documented",
      achieved: stats.totalEvents >= 100,
      progress: stats.totalEvents,
      target: 100,
    },

    {
      id: "extensive_record",
      title: "Extensive Record",
      icon: "record",
      achieved: stats.totalEvents >= 500,
      progress: stats.totalEvents,
      target: 500,
    },

    {
      id: "forbidden_scholar",
      title: "Forbidden Scholar",
      icon: "scholar",
      achieved: unnatural > 0,
      progress: unnatural,
      target: 1,
      skill: "unnatural",
    },
  ];
}