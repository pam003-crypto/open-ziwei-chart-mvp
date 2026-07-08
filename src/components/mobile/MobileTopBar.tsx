"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

export function MobileTopBar() {
  return (
    <header className="mobile-top-bar mobile-safe-top">
      <ThemeToggle compact />
    </header>
  );
}
