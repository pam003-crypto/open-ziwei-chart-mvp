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
import type { AstrolabeResult, IztrolabeChartProps } from "@/lib/astrolabe";
import type { TransitContext } from "@/types/interpretation";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import {
  buildPalaceViewModel,
  getHoroscope,
  type PalaceViewModel,
} from "@/components/mobile/palaceViewModel";
import { PalaceZoomModal } from "@/components/mobile/PalaceZoomModal";

const Iztrolabe = dynamic(
  () => import("react-iztro").then((module) => module.Iztrolabe),
  {
    ssr: false,
    loading: () => (
      <div className="responsive-chart-loading">命盘加载中...</div>
    ),
  },
);

type ChartDisplayMode = "simple" | "full" | "debug";

type ResponsiveFullChartProps = {
  astrolabe: AstrolabeResult;
  chartProps: IztrolabeChartProps;
  chartMode: ChartDisplayMode;
  selectedPalaceIndex: number | null;
  transitContext: TransitContext;
  targetDate: Date;
  transitHour: number;
  onPalaceSelect: (index: number) => void;
};

const DESKTOP_BASE_WIDTH = 960;
const DESKTOP_BASE_HEIGHT = 1706;
const CLICK_PALACE_CLASSES = [
  "click-focused-palace",
  "click-opposite-palace",
  "click-surrounded-palace",
] as const;

function normalizeIndex(index: number): number {
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

function syncResponsivePalaces(root: HTMLElement, selectedPalaceIndex: number | null): void {
  const oppositeIndex =
    selectedPalaceIndex === null ? null : normalizeIndex(selectedPalaceIndex + 6);
  const surroundedIndexes =
    selectedPalaceIndex === null
      ? []
      : [
          normalizeIndex(selectedPalaceIndex + 4),
          normalizeIndex(selectedPalaceIndex - 4),
        ];

  root.querySelectorAll<HTMLElement>(".iztro-palace").forEach((palace) => {
    const palaceIndex = getPalaceIndex(palace);
    const selectedClasses = new Set<string>();

    palace.setAttribute("role", "button");
    palace.setAttribute("tabindex", "0");
    palace.setAttribute("aria-pressed", palaceIndex === selectedPalaceIndex ? "true" : "false");

    if (palaceIndex === null) {
      return;
    }

    palace.dataset.palaceIndex = String(palaceIndex);

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

export function ResponsiveFullChart({
  astrolabe,
  chartProps,
  chartMode,
  selectedPalaceIndex,
  transitContext,
  targetDate,
  transitHour,
  onPalaceSelect,
}: ResponsiveFullChartProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const chartRootRef = useRef<HTMLDivElement>(null);
  const lastTouchTargetRef = useRef<EventTarget | null>(null);
  const [containerWidth, setContainerWidth] = useState(DESKTOP_BASE_WIDTH);
  const [zoomPalace, setZoomPalace] = useState<PalaceViewModel | null>(null);
  const scale = Math.min(1, containerWidth / DESKTOP_BASE_WIDTH);
  const scaledHeight = DESKTOP_BASE_HEIGHT * scale;
  const horoscope = useMemo(
    () => getHoroscope(astrolabe, targetDate, transitHour),
    [astrolabe, targetDate, transitHour],
  );
  const palaceViewModels = useMemo(
    () =>
      new Map(
        astrolabe.palaces.map((palace) => [
          palace.index,
          buildPalaceViewModel(palace, horoscope, transitContext),
        ]),
      ),
    [astrolabe.palaces, horoscope, transitContext],
  );

  useEffect(() => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? DESKTOP_BASE_WIDTH;
      setContainerWidth(Math.max(1, Math.min(DESKTOP_BASE_WIDTH, width)));
    });

    observer.observe(shell);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const root = chartRootRef.current;

    if (!root) {
      return;
    }

    syncResponsivePalaces(root, selectedPalaceIndex);

    const observer = new MutationObserver(() => {
      syncResponsivePalaces(root, selectedPalaceIndex);
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
  }, [selectedPalaceIndex]);

  const openPalaceZoom = useCallback(
    (palaceIndex: number) => {
      const palace = palaceViewModels.get(palaceIndex);

      if (palace) {
        setZoomPalace(palace);
      }
    },
    [palaceViewModels],
  );

  const openPalaceZoomFromTarget = useCallback(
    (target: EventTarget | null) => {
      const root = chartRootRef.current;

      if (!root) {
        return;
      }

      const palace = getTargetPalace(target, root);
      const palaceIndex = palace ? getPalaceIndex(palace) : null;

      if (palaceIndex !== null) {
        openPalaceZoom(palaceIndex);
      }
    },
    [openPalaceZoom],
  );

  const doubleTapHandlers = useDoubleTap(() => {
    openPalaceZoomFromTarget(lastTouchTargetRef.current);
  });

  const handleChartClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const root = chartRootRef.current;

      if (!root) {
        return;
      }

      const palace = getTargetPalace(event.target, root);
      const palaceIndex = palace ? getPalaceIndex(palace) : null;

      if (palaceIndex !== null) {
        onPalaceSelect(palaceIndex);
      }
    },
    [onPalaceSelect],
  );

  const handleChartDoubleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const root = chartRootRef.current;

      if (!root) {
        return;
      }

      const palace = getTargetPalace(event.target, root);
      const palaceIndex = palace ? getPalaceIndex(palace) : null;

      if (palaceIndex !== null) {
        event.preventDefault();
        openPalaceZoom(palaceIndex);
      }
    },
    [openPalaceZoom],
  );

  const handleChartKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const root = chartRootRef.current;

      if (!root) {
        return;
      }

      const palace = getTargetPalace(event.target, root);
      const palaceIndex = palace ? getPalaceIndex(palace) : null;

      if (palaceIndex !== null) {
        event.preventDefault();
        onPalaceSelect(palaceIndex);
      }
    },
    [onPalaceSelect],
  );

  return (
    <section className="mobile-chart-view">
      <div className="mobile-chart-view-head">
        <div>
          <p className="section-kicker">Chart</p>
          <h2>命盘</h2>
          <p className="mobile-chart-hint">双击任意宫位可放大查看</p>
        </div>
      </div>

      <div className="responsive-chart-shell" ref={shellRef}>
        <div className="responsive-chart-stage" style={{ height: scaledHeight }}>
          <div
            className="responsive-chart-inner"
            style={{
              width: DESKTOP_BASE_WIDTH,
              height: DESKTOP_BASE_HEIGHT,
              transform: `scale(${scale})`,
            }}
          >
            <div
              className={`chart-canvas responsive-chart-canvas clickable-palace-mode chart-mode-${chartMode === "debug" ? "debug" : "full"}`}
              ref={chartRootRef}
              onClick={handleChartClick}
              onDoubleClick={handleChartDoubleClick}
              onKeyDown={handleChartKeyDown}
              onTouchStart={(event) => {
                lastTouchTargetRef.current = event.target;
                doubleTapHandlers.onTouchStart(event);
              }}
              onTouchMove={doubleTapHandlers.onTouchMove}
              onTouchEnd={doubleTapHandlers.onTouchEnd}
            >
              <Iztrolabe
                {...chartProps}
                horoscopeDate={targetDate}
                horoscopeHour={transitHour}
              />
            </div>
          </div>
        </div>
      </div>

      <PalaceZoomModal
        open={zoomPalace !== null}
        palace={zoomPalace}
        onClose={() => setZoomPalace(null)}
      />
    </section>
  );
}
