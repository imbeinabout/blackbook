export type MobileSection =
  | "persona"
  | "status"
  | "skills"
  | "gear"
  | "bonds"
  | "tools";

export const MOBILE_SECTIONS: {
  key: MobileSection;
  label: string;
}[] = [
  { key: "persona", label: "PERSONA" },
  { key: "status", label: "STATUS" },
  { key: "skills", label: "SKILLS" },
  { key: "gear", label: "GEAR" },
  { key: "bonds", label: "BONDS" },
  { key: "tools", label: "TOOLS" },
];