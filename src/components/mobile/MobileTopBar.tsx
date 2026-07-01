"use client";

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
      <div className="mobile-top-bar-inner" aria-label="命盘显示模式">
        {OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={value === option.value ? "is-active" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </header>
  );
}
