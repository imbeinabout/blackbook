// src/features/character-creation/creation.types.ts
export type CreationSectionKey =
  | "IDENTITY"
  | "STATS"
  | "PROFESSION"
  | "SKILLS"
  | "BONDS"
  | "MOTIVATIONS"
  | "DAMAGED VETERAN";

export type SectionLock = {
  locked: boolean;
  reason?: string;
};