"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  createAstrolabe,
  getIztrolabeChartProps,
  type AstrolabeResult,
  type IztrolabeChartProps,
} from "@/lib/astrolabe";
import { getCalendarSummary, type CalendarSummary } from "@/lib/calendar";
import { InterpretationPanel } from "./InterpretationPanel";
import { TransitControls } from "./TransitControls";
import { BirthInfoSummary } from "./mobile/BirthInfoSummary";
import { CurrentContextBar } from "./mobile/CurrentContextBar";
import { MobileChartView } from "./mobile/MobileChartView";
import { MobileTimeNavigator } from "./mobile/MobileTimeNavigator";
import { MobileTopBar } from "./mobile/MobileTopBar";
import type { BirthInfo } from "@/types/birth";
import type { TransitContext } from "@/types/interpretation";

const Iztrolabe = dynamic(
  () => import("react-iztro").then((module) => module.Iztrolabe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] items-center justify-center rounded-md border border-stone-200 bg-white text-sm text-stone-500">
        命盘加载中...
      </div>
    ),
  },
);

type ChartState =
  | {
      ok: true;
      astrolabe: AstrolabeResult;
      calendar: CalendarSummary;
      chartProps: IztrolabeChartProps;
    }
  | {
      ok: false;
      error: string;
    };

type ChartViewProps = {
  birthInfo: BirthInfo | null;
};

type ChartDisplayMode = "simple" | "full" | "debug";
type MobileChartMode = "cards" | "full";

type Palace = AstrolabeResult["palaces"][number];
type PalaceStar =
  | Palace["majorStars"][number]
  | Palace["minorStars"][number]
  | Palace["adjectiveStars"][number];

type PalaceTooltipViewModel = {
  title: string;
  sections: Array<{
    label: string;
    value: string;
  }>;
  debugLines: string[];
};

const CLICK_PALACE_CLASSES = [
  "click-focused-palace",
  "click-opposite-palace",
  "click-surrounded-palace",
] as const;

const CHART_MODE_OPTIONS: Array<{
  value: ChartDisplayMode;
  label: string;
}> = [
  { value: "simple", label: "简洁" },
  { value: "full", label: "完整" },
  { value: "debug", label: "调试" },
];

const DEFAULT_TRANSIT_CONTEXT: TransitContext = {
  scope: "natal",
  label: "本命",
  keywords: ["本命", "命宫", "身宫", "三方四正", "四化"],
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "排盘失败，请检查出生信息";
}

function normalizePalaceIndex(index: number): number {
  return ((index % 12) + 12) % 12;
}

function getPalaceIndex(palace: HTMLElement): number | null {
  const gridArea = palace.style.gridArea || window.getComputedStyle(palace).gridArea;
  const match = /g(\d{1,2})/.exec(gridArea);

  if (!match) {
    return null;
  }

  const index = Number(match[1]);
  return Number.isInteger(index) && index >= 0 && index < 12 ? index : null;
}

function getTargetPalace(target: EventTarget | null, root: HTMLElement): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const palace = target.closest(".iztro-palace");
  return palace instanceof HTMLElement && root.contains(palace) ? palace : null;
}

function getPalaceByIndex(
  astrolabe: AstrolabeResult,
  index: number | null,
): Palace | undefined {
  if (index === null) {
    return undefined;
  }

  return astrolabe.palaces.find((palace) => palace.index === index);
}

function formatStar(star: PalaceStar): string {
  const brightness = star.brightness ? `(${star.brightness})` : "";
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";

  return `${star.name}${brightness}${mutagen}`;
}

function formatStars(stars: PalaceStar[]): string {
  return stars.length > 0 ? stars.map(formatStar).join("、") : "无";
}

function getPalaceTooltip(palace: Palace): PalaceTooltipViewModel {
  const ageRange = palace.decadal.range.join(" - ");
  const yearlyAges = palace.ages.join(" ");

  return {
    title: `${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）`,
    sections: [
      { label: "主星", value: formatStars(palace.majorStars) },
      { label: "辅星", value: formatStars(palace.minorStars) },
      { label: "杂曜神煞", value: formatStars(palace.adjectiveStars) },
      { label: "大限", value: ageRange },
      { label: "流年年龄", value: yearlyAges },
      {
        label: "十二神",
        value: [
          palace.changsheng12 ? `长生：${palace.changsheng12}` : "",
          palace.boshi12 ? `博士：${palace.boshi12}` : "",
          palace.jiangqian12 ? `将前：${palace.jiangqian12}` : "",
          palace.suiqian12 ? `岁前：${palace.suiqian12}` : "",
        ]
          .filter(Boolean)
          .join(" / "),
      },
      {
        label: "标记",
        value: [
          palace.isOriginalPalace ? "命宫" : "",
          palace.isBodyPalace ? "身宫" : "",
        ]
          .filter(Boolean)
          .join("、") || "无",
      },
    ],
    debugLines: getDebugPalaceSummary(palace),
  };
}

function getDebugPalaceSummary(palace: Palace): string[] {
  return [
    `index: ${palace.index}`,
    `name: ${palace.name}`,
    `stemBranch: ${palace.heavenlyStem}${palace.earthlyBranch}`,
    `isOriginalPalace: ${String(palace.isOriginalPalace)}`,
    `isBodyPalace: ${String(palace.isBodyPalace)}`,
    `majorStars: ${formatStars(palace.majorStars)}`,
    `minorStars: ${formatStars(palace.minorStars)}`,
    `adjectiveStars: ${formatStars(palace.adjectiveStars)}`,
    `changsheng12: ${palace.changsheng12 || ""}`,
    `boshi12: ${palace.boshi12 || ""}`,
    `jiangqian12: ${palace.jiangqian12 || ""}`,
    `suiqian12: ${palace.suiqian12 || ""}`,
    `decadal: ${palace.decadal.range.join(" - ")} ${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}`,
    `ages: ${palace.ages.join(", ")}`,
    "simple rule: majorStars + mutagen + decadal + palace name + heavenlyStem/earthlyBranch",
  ];
}

function getTooltipText(tooltip: PalaceTooltipViewModel): string {
  return [
    tooltip.title,
    ...tooltip.sections.map((section) => `${section.label}: ${section.value}`),
  ].join("\n");
}

function syncClickablePalaces(
  root: HTMLElement,
  selectedPalaceIndex: number | null,
  astrolabe?: AstrolabeResult,
  enableTooltip = false,
): void {
  const oppositeIndex =
    selectedPalaceIndex === null ? null : normalizePalaceIndex(selectedPalaceIndex + 6);
  const surroundedIndexes =
    selectedPalaceIndex === null
      ? []
      : [
          normalizePalaceIndex(selectedPalaceIndex + 4),
          normalizePalaceIndex(selectedPalaceIndex - 4),
        ];

  root.querySelectorAll<HTMLElement>(".iztro-palace").forEach((palace) => {
    const palaceIndex = getPalaceIndex(palace);
    const selectedClasses = new Set<string>();

    palace.setAttribute("role", "button");
    palace.setAttribute("tabindex", "0");
    palace.setAttribute("aria-pressed", palaceIndex === selectedPalaceIndex ? "true" : "false");

    if (palaceIndex === null) {
      palace.removeAttribute("aria-label");
      return;
    }

    const palaceName = palace.querySelector(".iztro-palace-name")?.textContent?.trim();
    palace.dataset.palaceIndex = String(palaceIndex);
    palace.setAttribute("aria-label", `${palaceName || `第${palaceIndex + 1}宫`}，点击显示三方四正`);

    if (enableTooltip && astrolabe) {
      const tooltipPalace = getPalaceByIndex(astrolabe, palaceIndex);
      if (tooltipPalace) {
        palace.setAttribute("title", getTooltipText(getPalaceTooltip(tooltipPalace)));
      }
    } else {
      palace.removeAttribute("title");
    }

    if (selectedPalaceIndex !== null) {
      if (palaceIndex === selectedPalaceIndex) {
        selectedClasses.add("click-focused-palace");
      } else if (palaceIndex === oppositeIndex) {
        selectedClasses.add("click-opposite-palace");
      } else if (surroundedIndexes.includes(palaceIndex)) {
        selectedClasses.add("click-surrounded-palace");
      }
    }

    CLICK_PALACE_CLASSES.forEach((className) => {
      palace.classList.toggle(className, selectedClasses.has(className));
    });
  });
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-stone-100">{value}</dd>
    </div>
  );
}

export function ChartView({ birthInfo }: ChartViewProps) {
  const chartCanvasRef = useRef<HTMLDivElement>(null);
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [hoveredPalaceIndex, setHoveredPalaceIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<ChartDisplayMode>("simple");
  const [mobileChartMode, setMobileChartMode] = useState<MobileChartMode>("cards");
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [transitDate, setTransitDate] = useState<Date>(() => new Date());
  const [transitHour, setTransitHour] = useState<number>(0);
  const [transitContext, setTransitContext] = useState<TransitContext>(
    DEFAULT_TRANSIT_CONTEXT,
  );

  const chartState = useMemo<ChartState>(() => {
    if (!birthInfo) {
      return { ok: false, error: "请先输入出生信息" };
    }

    try {
      return {
        ok: true,
        astrolabe: createAstrolabe(birthInfo),
        calendar: getCalendarSummary(birthInfo),
        chartProps: getIztrolabeChartProps(birthInfo),
      };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  }, [birthInfo]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMobileState = () => setIsMobileLayout(mediaQuery.matches);

    syncMobileState();
    mediaQuery.addEventListener("change", syncMobileState);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileState);
    };
  }, []);

  useEffect(() => {
    setSelectedPalaceIndex(null);
    setHoveredPalaceIndex(null);
    setMobileChartMode("cards");

    if (chartState.ok) {
      setTransitDate(new Date());
      setTransitHour(chartState.chartProps.birthTime);
      setTransitContext(DEFAULT_TRANSIT_CONTEXT);
    }
  }, [birthInfo, chartState]);

  useEffect(() => {
    const root = chartCanvasRef.current;

    if (!root) {
      return;
    }

    syncClickablePalaces(
      root,
      selectedPalaceIndex,
      chartState.ok ? chartState.astrolabe : undefined,
      chartMode === "simple",
    );

    const observer = new MutationObserver(() => {
      syncClickablePalaces(
        root,
        selectedPalaceIndex,
        chartState.ok ? chartState.astrolabe : undefined,
        chartMode === "simple",
      );
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [selectedPalaceIndex, chartState, chartMode]);

  const toggleSelectedPalace = useCallback((palace: HTMLElement) => {
    const palaceIndex = getPalaceIndex(palace);

    if (palaceIndex === null) {
      return;
    }

    setSelectedPalaceIndex((currentIndex) =>
      currentIndex === palaceIndex ? null : palaceIndex,
    );
  }, []);

  const handleChartClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const root = chartCanvasRef.current;

      if (!root) {
        return;
      }

      const palace = getTargetPalace(event.target, root);

      if (palace) {
        toggleSelectedPalace(palace);
      }
    },
    [toggleSelectedPalace],
  );

  const handleChartMouseOver = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const root = chartCanvasRef.current;

    if (!root) {
      return;
    }

    const palace = getTargetPalace(event.target, root);
    const palaceIndex = palace ? getPalaceIndex(palace) : null;

    setHoveredPalaceIndex(palaceIndex);
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredPalaceIndex(null);
  }, []);

  const handleChartFocus = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const root = chartCanvasRef.current;

    if (!root) {
      return;
    }

    const palace = getTargetPalace(event.target, root);
    const palaceIndex = palace ? getPalaceIndex(palace) : null;

    setHoveredPalaceIndex(palaceIndex);
  }, []);

  const handleChartBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const root = chartCanvasRef.current;
    const nextTarget = event.relatedTarget;

    if (!root || !(nextTarget instanceof Node) || !root.contains(nextTarget)) {
      setHoveredPalaceIndex(null);
    }
  }, []);

  const handleChartKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const root = chartCanvasRef.current;

      if (!root) {
        return;
      }

      const palace = getTargetPalace(event.target, root);

      if (!palace) {
        return;
      }

      event.preventDefault();
      toggleSelectedPalace(palace);
    },
    [toggleSelectedPalace],
  );

  const handleMobilePalaceSelect = useCallback((palaceIndex: number) => {
    setSelectedPalaceIndex((currentIndex) =>
      currentIndex === palaceIndex ? null : palaceIndex,
    );
  }, []);

  if (!birthInfo) {
    return (
      <section className="chart-shell flex min-h-[360px] items-center justify-center text-center">
        <div>
          <p className="section-kicker">Astrolabe</p>
          <h2 className="section-title mt-2">等待排盘</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-stone-400">
            输入出生信息后，这里会生成紫微斗数命盘。
          </p>
        </div>
      </section>
    );
  }

  if (!chartState.ok) {
    return (
      <section className="chart-shell">
        <p className="rounded-md border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {chartState.error}
        </p>
      </section>
    );
  }

  const { astrolabe, calendar, chartProps } = chartState;
  const tooltipPalace = getPalaceByIndex(
    astrolabe,
    hoveredPalaceIndex ?? selectedPalaceIndex,
  );
  const palaceTooltip = tooltipPalace ? getPalaceTooltip(tooltipPalace) : null;
  const renderChartCanvas = (className: string) => (
    <div
      ref={chartCanvasRef}
      className={`chart-canvas clickable-palace-mode chart-mode-${chartMode} ${className}`}
      onClick={handleChartClick}
      onBlur={handleChartBlur}
      onFocus={handleChartFocus}
      onKeyDown={handleChartKeyDown}
      onMouseLeave={handleChartMouseLeave}
      onMouseOver={handleChartMouseOver}
    >
      <Iztrolabe
        {...chartProps}
        horoscopeDate={transitDate}
        horoscopeHour={transitHour}
      />
    </div>
  );

  if (isMobileLayout) {
    return (
      <section className="chart-shell mobile-chart-shell">
        <div className="mobile-layout">
          <MobileTopBar value={chartMode} onChange={setChartMode} />

          <CurrentContextBar
            targetDate={transitDate}
            transitContext={transitContext}
          />

          <InterpretationPanel
            astrolabe={astrolabe}
            selectedPalaceId={selectedPalaceIndex}
            targetDate={transitDate}
            transitContext={transitContext}
            transitHour={transitHour}
            variant="mobile"
          />

          <MobileTimeNavigator
            astrolabe={astrolabe}
            transitDate={transitDate}
            transitHour={transitHour}
            activeScope={transitContext.scope}
            onTransitDateChange={setTransitDate}
            onTransitHourChange={setTransitHour}
            onTransitContextChange={setTransitContext}
          />

          <MobileChartView
            astrolabe={astrolabe}
            chartMode={chartMode}
            fullChart={renderChartCanvas("mobile-chart-canvas")}
            mobileChartMode={mobileChartMode}
            onMobileChartModeChange={setMobileChartMode}
            onPalaceSelect={handleMobilePalaceSelect}
            selectedPalaceIndex={selectedPalaceIndex}
            transitContext={transitContext}
          />

          <BirthInfoSummary
            astrolabe={astrolabe}
            birthInfo={birthInfo}
            calendar={calendar}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="chart-shell space-y-5">
      <div className="chart-heading">
        <div>
          <p className="section-kicker">Ziwei Chart</p>
          <h2 className="section-title mt-2">排盘结果</h2>
        </div>

        <div className="chart-mode-switch" aria-label="命盘显示模式">
          {CHART_MODE_OPTIONS.map((option) => (
            <button
              aria-pressed={chartMode === option.value}
              className={chartMode === option.value ? "is-active" : ""}
              key={option.value}
              onClick={() => setChartMode(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid gap-4 rounded-md border border-stone-800 bg-stone-950/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="姓名" value={birthInfo.name} />
        <InfoItem label="性别" value={birthInfo.gender} />
        <InfoItem label="公历日期" value={calendar.solarDate || astrolabe.solarDate} />
        <InfoItem label="农历日期" value={calendar.lunarDate || astrolabe.lunarDate} />
        <InfoItem label="出生时辰" value={`${birthInfo.birthHour}时`} />
        <InfoItem
          label="当前历法"
          value={birthInfo.calendarType === "solar" ? "公历" : "农历"}
        />
        <InfoItem
          label="是否闰月"
          value={birthInfo.calendarType === "lunar" && birthInfo.isLeapMonth ? "是" : "否"}
        />
        <InfoItem label="干支" value={calendar.ganzhi || astrolabe.chineseDate} />
        <InfoItem label="生肖" value={calendar.zodiac || astrolabe.zodiac} />
        <InfoItem label="命宫" value={astrolabe.earthlyBranchOfSoulPalace} />
        <InfoItem label="身宫" value={astrolabe.earthlyBranchOfBodyPalace} />
        <InfoItem label="命主 / 身主" value={`${astrolabe.soul} / ${astrolabe.body}`} />
      </dl>

      {birthInfo.note ? (
        <p className="rounded-md border border-stone-800 bg-stone-950/70 px-4 py-3 text-sm leading-6 text-stone-300">
          {birthInfo.note}
        </p>
      ) : null}

      <div className="chart-workspace">
        <div className="chart-main-column">
          <div className="chart-frame overflow-hidden rounded-md border border-stone-800 bg-stone-200 p-2 shadow-2xl shadow-black/30 sm:p-3">
            {renderChartCanvas("mx-auto w-full max-w-[1024px]")}
          </div>

          {chartMode === "simple" && palaceTooltip ? (
            <section className="palace-tooltip-panel" aria-live="polite">
              <div>
                <p className="section-kicker">Palace Detail</p>
                <h3>{palaceTooltip.title}</h3>
              </div>
              <dl>
                {palaceTooltip.sections.map((section) => (
                  <div key={section.label}>
                    <dt>{section.label}</dt>
                    <dd>{section.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {chartMode === "debug" ? (
            <section className="chart-debug-panel">
              <div>
                <p className="section-kicker">Debug</p>
                <h3>宫位原始字段与显示规则</h3>
                <p>
                  simple: majorStars + mutagen + decadal + palace name +
                  heavenlyStem/earthlyBranch
                </p>
              </div>
              <div className="chart-debug-grid">
                {astrolabe.palaces.map((palace) => (
                  <article key={palace.index}>
                    <h4>
                      {palace.index}. {palace.name} {palace.heavenlyStem}
                      {palace.earthlyBranch}
                    </h4>
                    <pre>{getDebugPalaceSummary(palace).join("\n")}</pre>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="chart-side-column" aria-label="流年设置与解读">
          <TransitControls
            astrolabe={astrolabe}
            transitDate={transitDate}
            transitHour={transitHour}
            activeScope={transitContext.scope}
            onTransitDateChange={setTransitDate}
            onTransitHourChange={setTransitHour}
            onTransitContextChange={setTransitContext}
          />

          <InterpretationPanel
            astrolabe={astrolabe}
            transitContext={transitContext}
            targetDate={transitDate}
            transitHour={transitHour}
            selectedPalaceId={selectedPalaceIndex}
          />
        </aside>
      </div>
    </section>
  );
}
