// src/components/layout/Header/useDropdown.ts
import * as React from "react";

export function useDropdown(initial = false) {
  const [open, setOpen] = React.useState(initial);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t || !ref.current) return;
      if (!ref.current.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return { open, setOpen, ref };
}