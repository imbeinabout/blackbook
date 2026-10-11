// src/features/player-panel/terminal/Terminal.tsx
import React, { useState, useEffect, useRef } from "react";
import { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import { calculateAgentStatistics } from "../../../lib/agentHistory";
import { calculateAgentMilestones } from "../../../lib/agentMilestones";

// ------------------------
// Command Types
// ------------------------
export interface TerminalContext {
  clear: () => void;
  listVisible: () => string;
  setStateFlag: (flag: string, value: boolean) => void;
  getStateFlag: (flag: string) => boolean;

  agent?: DeltaGreenAgent;
}

export interface Command {
  name: string;
  aliases: string[];
  hidden?: boolean;
  execute: (ctx: TerminalContext, raw: string) => string | Promise<string>;
}

// ------------------------
// Utility: simple fuzzy matching
// ------------------------
function fuzzyMatch(input: string, target: string): boolean {
  if (target.startsWith(input)) return true;
  let mismatches = 0;
  for (let i = 0; i < Math.min(input.length, target.length); i++) {
    if (input[i] !== target[i]) mismatches++;
    if (mismatches > 1) return false;
  }
  return true;
}

// ------------------------
// SECRET HASH-BASED TRIGGERS
// ------------------------
function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

const SECRET_HASHES: Record<string, number> = {
  majestic: simpleHash("CONNECTION-PRIORITY-ALPHA"), // user must type exact phrase
};

// ------------------------
// Command Registry
// ------------------------
const COMMANDS: Command[] = [
  {
    name: "help",
    aliases: ["h", "?"],
    hidden: false,
    execute: (ctx) =>
      "Available commands:\n" + ctx.listVisible(),
  },
  {
    name: "clear",
    aliases: [],
    hidden: false,
    execute: (ctx) => {
      ctx.clear();
      return "";
    },
  },
  {
    name: "contact",
    aliases: [],
    hidden: false,
    execute: (ctx) => {
      ctx.setStateFlag("contactUsed", true);
      return "Attempting secure transmission...\nResponse: NO HANDLER FOUND.";
    },
  },
  {
    name: "events",
    aliases: ["ev"],
    hidden: false,
    execute: (ctx, raw) => {
      if (!ctx.agent) {
        return "NO AGENT LOADED.";
      }

      const parts = raw.split(/\s+/);
      const count = Math.max(
        1,
        Number(parts[1] ?? 10)
      );

      const events =
        ctx.agent.events?.slice(0, count) ?? [];

      if (events.length === 0) {
        return "NO EVENTS RECORDED.";
      }

      return events
        .map(
          (e, i) =>
            `${i + 1}. [${e.category}] ${e.action}\n   ${e.summary}`
        )
        .join("\n");
    },
  },
  {
    name: "eventcount",
    aliases: ["ec"],
    hidden: false,
    execute: (ctx) => {
      return `Events: ${ctx.agent?.events?.length ?? 0}`;
    },
  },
  {
    name: "milestones",
    aliases: ["ms"],
    hidden: false,
    execute: (ctx) => {
      if (!ctx.agent) {
        return "NO AGENT LOADED.";
      }

      const milestones = calculateAgentMilestones(ctx.agent, calculateAgentStatistics(ctx.agent));
      
      const summaryMilestones = (): string =>
      [
        "=== MILESTONES ===",
        ...milestones.map((m) => {
          const status = m.achieved ? "ACHIEVED" : "IN PROGRESS";
          return `${m.title.padEnd(24, ".")} ${status} (${m.progress}/${m.target})${m.skill ? ` [${m.skill.toUpperCase()}]` : ""}`;
        }),
      ]
      .join("\n");
      
      return summaryMilestones();
    },
  },
  {
    name: "stats",
    aliases: ["st"],
    hidden: false,
    execute: (ctx, raw) => {
      if (!ctx.agent) {
        return "NO AGENT LOADED.";
      }

      const stats = calculateAgentStatistics(ctx.agent);

      const subcommand = raw.split(/\s+/)[1]?.toLowerCase() ?? "summary";

      const summaryStats = (): string =>
        [
          "=== HANDLER ASSESSMENT ===",
          "",
          stats.operations >= 10
            ? "Veteran field operative."
            : stats.operations >= 3
            ? "Experienced field operative."
            : "Limited field experience.",
          "",
          `Operations: ${stats.operations}`,
          `Events Recorded: ${stats.totalEvents}`,
          `Most Developed Skill: ${
            stats.mostImprovedSkill?.label ?? "Unknown"
          }`,
          `Total SAN Lost: ${stats.totalSanLost}`,
          `Total Bond Damage: ${stats.totalBondDamage}`,
          `Most Active Area: ${
            stats.mostActiveCategory?.category ?? "Unknown"
          }`,
        ]
        .join("\n");
    
      const serviceStats = (): string =>
        [
          "=== SERVICE RECORD ===",
          `Campaigns: ${stats.campaigns}`,
          `Operations: ${stats.operations}`,
          `Sessions: ${stats.sessions}`,
          "",
          `Events Recorded: ${stats.totalEvents}`,
          `First Event: ${stats.firstEventDate ?? "N/A"}`,
          `Latest Event: ${stats.lastEventDate ?? "N/A"}`,
          `Career Length: ${stats.activeDays ?? 0} days`,
          "",
          `Latest Campaign: ${stats.latestCampaign ?? "N/A"}`,
          `Latest Operation: ${stats.latestOperation ?? "N/A"}`,
          `Latest Session: ${stats.latestSession ?? "N/A"}`
        ]
        .join("\n");

      const developmentStats = (): string =>
        [
          "=== DEVELOPMENT ===",
          `Skill Changes: ${stats.skillValueChanges}`,
          `Skill Upgrades: ${stats.skillUpgradeEvents}`,
          `Skill Points Gained: ${stats.totalSkillPointsGained}`,
          `Skill Points Reversed: ${stats.totalSkillPointsReversed}`,
          `Attribute Changes: ${stats.statValueChanges}`,
          `Special Training Added: ${stats.specialTrainingAdded}`,
          "",
          `Most Improved Skill: ${
            stats.mostImprovedSkill
              ? `${stats.mostImprovedSkill.label} (+${stats.mostImprovedSkill.netChange})`
              : "N/A"
          }`
        ]
        .join("\n");

      const psychologyStats = (): string =>
        [
          "=== PSYCHOLOGICAL PROFILE ===",
          `SAN Events: ${stats.sanityLossEvents}`,
          `SAN Lost: ${stats.totalSanLost}`,
          `SAN Recovered: ${stats.totalSanRecovered}`,
          `Net SAN Change: ${stats.netSanChange}`,
          "",
          `Breaking Points: ${stats.breakingPointsCrossed}`,
          `Temporary Insanity: ${stats.temporaryInsanityEpisodes}`,
          "",
          `Adapted to Violence: ${
            stats.adaptedtoViolence ? "YES" : "NO"
          }`,
          `Adapted to Helplessness: ${
            stats.adaptedtoHelplessness ? "YES" : "NO"
          }`,
          "",
          `Violence Loss: ${stats.sanLostByType.violence}`,
          `Helplessness Loss: ${stats.sanLostByType.helplessness}`,
          `Unnatural Loss: ${stats.sanLostByType.unnatural}`
        ]
        .join("\n");

      const relationshipStats = (): string =>
        [
          "=== RELATIONSHIPS ===",
          `Bonds Created: ${stats.bondsCreated}`,
          `Bonds Removed: ${stats.bondsRemoved}`,
          "",
          `Bond Damage Events: ${stats.bondDamagedEvents}`,
          `Total Bond Damage: ${stats.totalBondDamage}`,
          `Total Bond Recovery: ${stats.totalBondRecovery}`,
          "",
          `Projection Events: ${stats.projectionEvents}`,
          "",
          `Home Scenes: ${stats.homeScenesCompleted}`,
          `Personal Pursuits: ${stats.personalPursuits}`,
          `Bonds Resolved: ${stats.bondsResolvedInHomeScenes}`
        ]
        .join("\n");

      const conditionStats = (): string =>
        [
          "=== CONDITIONS & DISORDERS ===",
          `Conditions Added: ${stats.conditionsAdded}`,
          `Conditions Removed: ${stats.conditionsRemoved}`,
          "",
          `Disorders Developed: ${stats.disordersAdded}`,
          `Disorders Cured: ${stats.disordersCured}`
        ]
        .join("\n");

      const traumaStats = (): string =>
        [
          "=== PHYSICAL TRAUMA ===",
          `HP Damage Taken: ${stats.hpDamageTaken}`,
          `HP Recovered: ${stats.hpRecovered}`,
          "",
          `WP Damage Taken: ${stats.wpDamageTaken}`,
          `WP Recovered: ${stats.wpRecovered}`,
          "",
          `Wounds Sustained: ${stats.woundsAdded}`,
          `Wounds Healed: ${stats.woundsRemoved}`,
          "",
          `First Aid Applications: ${stats.firstAidApplications}`
        ]
        .join("\n");
      
      const activityStats = (): string =>
        [
          "=== ACTIVITY PROFILE ===",
          `Most Active Category: ${
            stats.mostActiveCategory?.category ?? "N/A"
          }`,
          "",
          ...Object.entries(stats.categoryCounts)
            .sort((a,b) => b[1] - a[1])
            .map(([cat,count]) =>
              `${cat.padEnd(16, ".")} ${count}`
            )
        ]
        .join("\n");

      switch (subcommand) {
        case "all":
          return [
            summaryStats(),
            "",
            serviceStats(),
            "",
            traumaStats(),
            "",
            developmentStats(),
            "",
            psychologyStats(),
            "",
            relationshipStats(),
            "",
            conditionStats(),
            "",
            activityStats(),
          ].join("\n");

        case "summary":
          return summaryStats();

        case "service":
          return serviceStats();

        case "trauma":
          return traumaStats();

        case "development":
          return developmentStats();

        case "psychology":
          return psychologyStats();

        case "relationships":
          return relationshipStats();

        case "conditions":
          return conditionStats();

        case "activity":
          return activityStats();

        default:
          return [
            `UNKNOWN STATISTICS CATEGORY: ${subcommand}`,
            "",
            "Available categories:",
            "all",
            "record",
            "development",
            "mental",
            "relationships",
            "conditions",
            "activity",
          ].join("\n");
      }
    },
  },

  // ------------------------
  // Hidden Easter Eggs
  // ------------------------
  {
    name: "glyph",
    aliases: ["sigil"],
    hidden: true,
    execute: () =>
      `>>> ᚷᛚᛁᚦ PROTOCOL ACTIVE.\nDO NOT TRANSLATE.`,
  },

  {
    name: "santa",
    aliases: ["hohoho"],
    hidden: true,
    execute: () =>
      `         .-""-.
 /,..___\\
() {_____}
  (/-@-@-\\)
  {\`-=^=-'}
  {  \`-'  }
   {     }
    \`---'`,
  },

  {
    name: "bunny",
    aliases: ["easter"],
    hidden: true,
    execute: () =>
      `            O O
           dO Ob
          dOO OOO
         dOOO OOOb
        dOOOO OOOOb
        OOOOO OOOOO
        OOOOO OOOOO
        OOOOO OOOOO
        YOOOO OOOOO
         YOOO OOOP
    oOOOOOOOOOOOOb
  oOOOOOOOOOOOOOOOb
 oOOOb dOOOOOOOOOOO
OOOOOOOOOOOOOOOOOOO
OOOOOOOOOOOOOOOOOOP
OOOOOOOOOOOOOOOOOP
 YOOOOOOOOOOOOOOP
   YOOOOOOOOOOOP
  %%%%%%%%%%%%%%
 %%%%%%OOOjgsOOO`,
  },

  {
    name: "majestic",
    aliases: ["mj12"],
    hidden: true,
    execute: (ctx, raw) => {
      // Hash-based access requirement
      if (simpleHash(raw.trim()) !== SECRET_HASHES.majestic)
        return "UNAUTHORIZED ACCESS. KEY PHRASE INVALID.";

      // State-based gating
      if (!ctx.getStateFlag("contactUsed"))
        return "HANDLER VERIFICATION REQUIRED.";

      return "MJ-12 FLAGGED.\nField team has been notified of your inquiry.";
    },
  },
];

// ------------------------
// Parser Builder
// ------------------------
function createParser(commands: Command[]) {
  const nameMap = new Map<string, Command>();

  for (const cmd of commands) {
    nameMap.set(cmd.name, cmd);
    cmd.aliases.forEach((a) => nameMap.set(a, cmd));
  }

  const normalize = (t: string) => t.trim().toLowerCase();

  function findCommand(input: string): Command | null {
    const norm = normalize(input);

    if (nameMap.has(norm)) return nameMap.get(norm)!;

    let found: Command | null = null;
    nameMap.forEach((cmd, key) => {
        if (found) return;
        if (key.length <= 1) return;
        if (fuzzyMatch(norm, key)) found = cmd;
    });
    return found;
  }

  async function parse(line: string, ctx: TerminalContext): Promise<string> {
    const segments = line.split("|").map((s) => s.trim());
    let output = "";

    for (const seg of segments) {
      const cmd = findCommand(seg);
      if (!cmd) {
        output += `Unknown command: ${seg}\n`;
        continue;
      }

      const result = await cmd.execute(ctx, seg);
      if (result) output += result + "\n";
    }

    return output.trim();
  }

  return { parse, commands };
}

const parser = createParser(COMMANDS);

// ------------------------
// Component
// ------------------------

type TerminalProps = {
  agent: DeltaGreenAgent;
};

export default function DeltaGreenTerminalAdvanced({ agent }: TerminalProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [stateFlags, setStateFlags] = useState<Record<string, boolean>>({});
  const screenRef = useRef<HTMLDivElement>(null);

  const ctx: TerminalContext = {
    clear: () => setLines([]),
    listVisible: () =>
      COMMANDS.filter((c) => !c.hidden)
        .map((c) => c.name)
        .join(", "),
    setStateFlag: (flag, value) =>
      setStateFlags((f) => ({ ...f, [flag]: value })),
    getStateFlag: (flag) => !!stateFlags[flag],

    agent,
  };

  
  useEffect(() => {
    if (!screenRef.current) return;
    screenRef.current.scrollTop = screenRef.current.scrollHeight;
  }, [lines]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = input;
    setInput("");
    if (!raw.trim()) return;

    const trimmed = raw.trim();
    if (simpleHash(trimmed) === SECRET_HASHES.majestic) {
        const majestic = COMMANDS.find(c => c.name === "majestic");
        const out = majestic ? await majestic.execute(ctx, trimmed) : "…";
        setLines(prev => [...prev, `> ${raw}`, ...String(out).split("\n")]);
        return;
    }
    const result = await parser.parse(raw, ctx);

    setLines((prev) => [
        ...prev,
        `> ${raw}`,
        ...result.split("\n").map((l) => `  ${l}`),
    ]);
  }

  useEffect(() => {
    const script = [
      "DNI ROUTING PROTOCOL v3.2…",
      "Decrypting asset file…",
      "WARNING: UNAUTHORIZED ACCESS WILL BE LOGGED.",
      "Loading ████████████ records…",
      ">> CONNECTION ESTABLISHED",
    ];

    let i = 0;
    const interval = setInterval(() => {
      setLines((p) => [...p, script[i]]);
      i++;
      if (i >= script.length) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.wrapper}>
        <div style={styles.screen} ref={screenRef}>
        {lines.map((line, i) => (
            <pre key={i} style={styles.line}>{line}</pre>
        ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.inputRow}>
        <span style={styles.prompt}>{"> "}</span>
        <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.input}
        />
        </form>
    </div>
  );
}

// ------------------------
// Inline Styles
// ------------------------
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: "var(--bb-panel-bg)",
    border: "1px solid var(--bb-border)",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
  },

  screen: {
    flex: 1,
    minHeight: 0,
    padding: "0.5rem 0.6rem",
    overflowY: "auto",
    overflowX: "hidden",

    fontFamily: "Courier New, monospace",
    fontSize: "0.8rem",
    lineHeight: 1.35,

    color: "var(--bb-text-muted)",
    background: "linear-gradient(#020403, #030604)",

    whiteSpace: "pre-wrap",
  },

  line: {
    margin: "0.15rem 0",
    color: "var(--bb-text-muted)",
  },

  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",

    padding: "0.35rem 0.5rem",
    borderTop: "1px solid var(--bb-border-soft)",
    background: "var(--bb-panel-alt)",

    flex: "0 0 auto",
  },

  prompt: {
    color: "var(--bb-accent)",
    fontWeight: 600,
    userSelect: "none",
  },

  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",

    color: "var(--bb-text)",
    fontFamily: "inherit",
    fontSize: "0.8rem",

    caretColor: "var(--bb-accent)",
  },
};