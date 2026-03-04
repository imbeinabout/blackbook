// src/features/player-panel/terminal/Terminal.tsx
import React, { useState, useEffect, useRef } from "react";

// ------------------------
// Command Types
// ------------------------
export interface TerminalContext {
  clear: () => void;
  listVisible: () => string;
  setStateFlag: (flag: string, value: boolean) => void;
  getStateFlag: (flag: string) => boolean;
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
export default function DeltaGreenTerminalAdvanced() {
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