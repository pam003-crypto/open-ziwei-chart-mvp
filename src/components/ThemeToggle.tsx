"use client";

import { useEffect, useState } from "react";

type ThemeMode = "plain-paper" | "rice-paper";

const THEME_KEY = "open-ziwei-chart-mvp:paper-theme:v2";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeMode>("plain-paper");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const initialTheme = saved === "rice-paper" ? "rice-paper" : "plain-paper";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function updateTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  return (
    <div className={compact ? "theme-toggle is-compact" : "theme-toggle"} aria-label="主题切换">
      <span className="theme-toggle-indicator" data-theme-position={theme} />
      <button
        aria-pressed={theme === "plain-paper"}
        className={theme === "plain-paper" ? "is-active" : ""}
        type="button"
        onClick={() => updateTheme("plain-paper")}
      >
        素纸
      </button>
      <button
        aria-pressed={theme === "rice-paper"}
        className={theme === "rice-paper" ? "is-active" : ""}
        type="button"
        onClick={() => updateTheme("rice-paper")}
      >
        暖纸
      </button>
    </div>
  );
}
