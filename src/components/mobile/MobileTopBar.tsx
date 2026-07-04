"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

type ChartDisplayMode = "simple" | "full" | "debug";

const OPTIONS: Array<{ value: ChartDisplayMode; label: string }> = [
  { value: "simple", label: "简洁" },
  { value: "full", label: "完整" },
  { value: "debug", label: "调试" },
];

type MobileTopBarProps = {
  value: ChartDisplayMode;
  onChange: (value: ChartDisplayMode) => void;
};

export function MobileTopBar({ value, onChange }: MobileTopBarProps) {
  return (
    <header className="mobile-top-bar mobile-safe-top">
      <div className="mobile-top-bar-inner mode-switch" data-mode={value} aria-label="命盘显示模式">
        <span className="mode-active-indicator" />
        {OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={value === option.value ? "mode-button is-active" : "mode-button"}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <ThemeToggle compact />
    </header>
  );
}
