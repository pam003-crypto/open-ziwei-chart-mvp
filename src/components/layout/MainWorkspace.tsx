import type { ReactNode } from "react";

export function MainWorkspace({ children }: { children: ReactNode }) {
  return <section className="main-workspace">{children}</section>;
}
