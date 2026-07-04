"use client";

import { useEffect, useState } from "react";

type ThemeMode = "jade-light" | "jade-dark";

const THEME_KEY = "open-ziwei-chart-mvp:theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeMode>("jade-dark");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const initialTheme = saved === "jade-light" ? "jade-light" : "jade-dark";

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
        aria-pressed={theme === "jade-light"}
        className={theme === "jade-light" ? "is-active" : ""}
        type="button"
        onClick={() => updateTheme("jade-light")}
      >
        玉白
      </button>
      <button
        aria-pressed={theme === "jade-dark"}
        className={theme === "jade-dark" ? "is-active" : ""}
        type="button"
        onClick={() => updateTheme("jade-dark")}
      >
        墨青
      </button>
    </div>
  );
}
