"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

// Knop om de conceptweergave te verlaten. Alleen zichtbaar als iemand de site
// los in draft mode bekijkt, niet binnen Presentation in de Studio.
export function DraftModeKnop() {
  const inPresentation = useIsPresentationTool();
  if (inPresentation !== false) return null;
  return (
    <a
      href="/api/draft-mode/disable"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 50,
        padding: "10px 16px",
        borderRadius: 999,
        background: "var(--blauw)",
        color: "var(--wit)",
        fontSize: 14,
        textDecoration: "none",
      }}
    >
      Conceptweergave sluiten
    </a>
  );
}
