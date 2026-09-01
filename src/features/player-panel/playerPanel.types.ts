// src/features/player-panel/playerPanel.types.ts
export type BottomTabKey =
  | "weapons"
  | "armor"
  | "gear"
  | "wounds"
  | "details"
  | "notes"
  | "timeline"
  | "shell";

export type BottomTab = { key: BottomTabKey; label: string }