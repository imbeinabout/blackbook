import React from "react";
import { MOBILE_SECTIONS, MobileSection } from "./mobileSections";

export function MobileSectionNav({
  active,
  onSelect,
}: {
  active: MobileSection;
  onSelect: (s: MobileSection) => void;
}) {
  const navRef = React.useRef<HTMLElement | null>(null);
  const buttonRefs = React.useRef<
    Partial<Record<MobileSection, HTMLButtonElement>>
  >({});

  React.useEffect(() => {
    const activeButton = buttonRefs.current[active];

    activeButton?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [active]);

  return (
    <nav
      ref={navRef}
      className="bb-mobile-section-nav"
    >
      {MOBILE_SECTIONS.map((s) => (
        <button
          key={s.key}
          ref={(el) => {
            if (el) {
              buttonRefs.current[s.key] = el;
            }
          }}
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