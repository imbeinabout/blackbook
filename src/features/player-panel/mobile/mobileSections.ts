export type MobileSection =
  | "persona"
  | "status"
  | "skills"
  | "gear"
  | "bonds"
  | "timeline"
  | "tools";

export const MOBILE_SECTIONS: {
  key: MobileSection;
  label: string;
}[] = [
  { key: "persona", label: "INFO" },
  { key: "status", label: "STATUS" },
  { key: "skills", label: "SKILLS" },
  { key: "gear", label: "GEAR" },
  { key: "bonds", label: "BONDS" },
  { key: "timeline", label: "HISTORY" },
  { key: "tools", label: "TOOLS" },
];