"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

const CLICK_PALACE_CLASSES = [
  "click-focused-palace",
  "click-opposite-palace",
  "click-surrounded-palace",
] as const;

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

function syncClickablePalaces(root: HTMLElement, selectedPalaceIndex: number | null): void {
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
    setSelectedPalaceIndex(null);

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

    syncClickablePalaces(root, selectedPalaceIndex);

    const observer = new MutationObserver(() => {
      syncClickablePalaces(root, selectedPalaceIndex);
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
  }, [selectedPalaceIndex, chartState]);

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

  return (
    <section className="chart-shell space-y-5">
      <div>
        <p className="section-kicker">Ziwei Chart</p>
        <h2 className="section-title mt-2">排盘结果</h2>
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

      <div className="overflow-hidden rounded-md border border-stone-800 bg-stone-200 p-2 shadow-2xl shadow-black/30 sm:p-3">
        <div
          ref={chartCanvasRef}
          className="chart-canvas clickable-palace-mode mx-auto w-full max-w-[1024px]"
          onClick={handleChartClick}
          onKeyDown={handleChartKeyDown}
        >
          <Iztrolabe
            {...chartProps}
            horoscopeDate={transitDate}
            horoscopeHour={transitHour}
          />
        </div>
      </div>

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
    </section>
  );
}
