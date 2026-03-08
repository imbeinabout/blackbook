import React from "react";
import { MOBILE_SECTIONS, MobileSection } from "./mobileSections";

export function MobileSectionNav({
  active,
  onSelect,
}: {
  active: MobileSection;
  onSelect: (s: MobileSection) => void;
}) {
  return (
    <nav className="bb-mobile-section-nav">
      {MOBILE_SECTIONS.map((s) => (
        <button
          key={s.key}
          className={
            "bb-mobile-section-nav__btn" +
            (s.key === active ? " is-active" : "")
          }
          onClick={() => onSelect(s.key)}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}