// src/components/ui/CardShell.tsx
import * as React from "react";

export function CardShell({ children }: React.PropsWithChildren) {
  return <section className="bb-card">{children}</section>;
}