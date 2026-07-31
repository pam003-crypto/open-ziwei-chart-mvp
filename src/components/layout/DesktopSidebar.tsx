import type { ReactNode } from "react";

export function DesktopSidebar({ children }: { children: ReactNode }) {
  return <aside className="desktop-workbench">{children}</aside>;
}
