"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CompactPalaceCell } from "@/components/CompactPalaceCell";
import { PalaceZoomModal } from "@/components/mobile/PalaceZoomModal";
import {
  buildPalaceViewModel,
  getHoroscope,
  type PalaceViewModel,
} from "@/components/mobile/palaceViewModel";
import {
  adaptPalaces,
  type CompactPalaceViewModel,
} from "@/lib/palaceAdapter";
import {
  createAstrolabe,
  toBirthTimeIndex,
  type AstrolabeResult,
} from "@/lib/astrolabe";
import { getCalendarSummary, type CalendarSummary } from "@/lib/calendar";
import { BirthInfoSummary } from "./mobile/BirthInfoSummary";
import { CurrentContextBar } from "./mobile/CurrentContextBar";
import { InterpretationPanel } from "./InterpretationPanel";
import { MobileTimeNavigator } from "./mobile/MobileTimeNavigator";
import { MobileTopBar } from "./mobile/MobileTopBar";
import { TransitControls } from "./TransitControls";
import type { BirthInfo } from "@/types/birth";
import type { TransitContext } from "@/types/interpretation";

type ChartState =
  | {
      ok: true;
      astrolabe: AstrolabeResult;
      calendar: CalendarSummary;
      birthTime: number;
    }
  | {
      ok: false;
      error: string;
    };

type ChartViewProps = {
  birthInfo: BirthInfo | null;
};

type ChartDisplayMode = "simple" | "full" | "debug";

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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-stone-100">{value}</dd>
    </div>
  );
}

function CompactInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function getRelation(
  index: number,
  selectedPalaceIndex: number | null,
): "selected" | "opposite" | "surrounded" | null {
  if (selectedPalaceIndex === null) {
    return null;
  }

  if (index === selectedPalaceIndex) {
    return "selected";
  }

  if (index === normalizePalaceIndex(selectedPalaceIndex + 6)) {
    return "opposite";
  }

  if (
    index === normalizePalaceIndex(selectedPalaceIndex + 4) ||
    index === normalizePalaceIndex(selectedPalaceIndex - 4)
  ) {
    return "surrounded";
  }

  return null;
}

function getDebugPalaceSummary(palace: CompactPalaceViewModel): string[] {
  return [
    `index: ${palace.index}`,
    `name: ${palace.palaceName}`,
    `stemBranch: ${palace.stemBranch || ""}`,
    `isLifePalace: ${String(Boolean(palace.isLifePalace))}`,
    `isBodyPalace: ${String(Boolean(palace.isBodyPalace))}`,
    `mainStars: ${palace.mainStars.map((star) => star.name).join(", ")}`,
    `minorStars: ${palace.minorStars.map((star) => star.name).join(", ")}`,
    `miscStars: ${palace.miscStars.map((star) => star.name).join(", ")}`,
    `flowStars: ${palace.flowStars.map((star) => star.name).join(", ")}`,
    `changsheng: ${palace.changsheng || ""}`,
    `boshi: ${palace.boshi || ""}`,
    `jiangqian: ${palace.jiangqian || ""}`,
    `suiqian: ${palace.suiqian || ""}`,
    `decadal: ${palace.ageRange || ""}`,
    `yearlyAges: ${(palace.yearlyAges || []).join(", ")}`,
    "layout rule: main/minor top-left, misc/flow top-right, flow age middle-left, gods bottom-left, decadal/name bottom-center, branch/changsheng bottom-right",
  ];
}

function CompactCenterInfo({
  astrolabe,
  birthInfo,
  calendar,
  transitContext,
  transitDate,
  transitHour,
}: {
  astrolabe: AstrolabeResult;
  birthInfo: BirthInfo;
  calendar: CalendarSummary;
  transitContext: TransitContext;
  transitDate: Date;
  transitHour: number;
}) {
  const astrolabeExtra = astrolabe as AstrolabeResult & {
    fiveElementsClass?: string;
  };
  const dateText = transitDate.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div className="compact-center-cell" style={{ gridArea: "ct" }}>
      <div className="compact-center-block">
        <p className="compact-center-title">基本信息</p>
        <div className="compact-center-grid">
          <CompactInfoItem label="姓名" value={birthInfo.name} />
          <CompactInfoItem label="性别" value={birthInfo.gender} />
          <CompactInfoItem
            label="公历"
            value={calendar.solarDate || astrolabe.solarDate}
          />
          <CompactInfoItem
            label="农历"
            value={calendar.lunarDate || astrolabe.lunarDate}
          />
          <CompactInfoItem label="时辰" value={`${birthInfo.birthHour}时`} />
          <CompactInfoItem label="生肖" value={calendar.zodiac || astrolabe.zodiac} />
          <CompactInfoItem label="五行局" value={astrolabeExtra.fiveElementsClass || "未取"} />
          <CompactInfoItem label="干支" value={calendar.ganzhi || astrolabe.chineseDate} />
          <CompactInfoItem label="命宫" value={astrolabe.earthlyBranchOfSoulPalace} />
          <CompactInfoItem label="身宫" value={astrolabe.earthlyBranchOfBodyPalace} />
          <CompactInfoItem label="命主" value={astrolabe.soul} />
          <CompactInfoItem label="身主" value={astrolabe.body} />
        </div>
      </div>

      <div className="compact-center-block">
        <p className="compact-center-title">运限信息</p>
        <div className="compact-center-grid">
          <CompactInfoItem label="当前" value={transitContext.label} />
          <CompactInfoItem label="阳历" value={dateText} />
          <CompactInfoItem label="时辰索引" value={String(transitHour)} />
          <CompactInfoItem
            label="运限宫"
            value={transitContext.palaceName || "随选择变化"}
          />
        </div>
      </div>
    </div>
  );
}

function CompactChartGrid({
  astrolabe,
  birthInfo,
  calendar,
  chartMode,
  palaces,
  selectedPalaceIndex,
  transitContext,
  transitDate,
  transitHour,
  onOpenDetail,
  onSelectPalace,
}: {
  astrolabe: AstrolabeResult;
  birthInfo: BirthInfo;
  calendar: CalendarSummary;
  chartMode: ChartDisplayMode;
  palaces: CompactPalaceViewModel[];
  selectedPalaceIndex: number | null;
  transitContext: TransitContext;
  transitDate: Date;
  transitHour: number;
  onOpenDetail: (index: number) => void;
  onSelectPalace: (index: number) => void;
}) {
  return (
    <div className={`compact-chart-scroll chart-mode-${chartMode}`}>
      <div className="compact-chart-grid">
        {palaces.map((palace) => {
          const relation = getRelation(palace.index, selectedPalaceIndex);

          return (
            <CompactPalaceCell
              isOpposite={relation === "opposite"}
              isSelected={relation === "selected"}
              isSurrounded={relation === "surrounded"}
              key={palace.index}
              mode={chartMode}
              onOpenDetail={onOpenDetail}
              onSelect={onSelectPalace}
              palace={palace}
            />
          );
        })}

        <CompactCenterInfo
          astrolabe={astrolabe}
          birthInfo={birthInfo}
          calendar={calendar}
          transitContext={transitContext}
          transitDate={transitDate}
          transitHour={transitHour}
        />
      </div>
    </div>
  );
}

export function ChartView({ birthInfo }: ChartViewProps) {
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<ChartDisplayMode>("simple");
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [transitDate, setTransitDate] = useState<Date>(() => new Date());
  const [transitHour, setTransitHour] = useState<number>(0);
  const [transitContext, setTransitContext] = useState<TransitContext>(
    DEFAULT_TRANSIT_CONTEXT,
  );
  const [zoomPalace, setZoomPalace] = useState<PalaceViewModel | null>(null);

  const chartState = useMemo<ChartState>(() => {
    if (!birthInfo) {
      return { ok: false, error: "请先输入出生信息" };
    }

    try {
      return {
        ok: true,
        astrolabe: createAstrolabe(birthInfo),
        calendar: getCalendarSummary(birthInfo),
        birthTime: toBirthTimeIndex(birthInfo.birthHour),
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
    setZoomPalace(null);

    if (chartState.ok) {
      setTransitDate(new Date());
      setTransitHour(chartState.birthTime);
      setTransitContext(DEFAULT_TRANSIT_CONTEXT);
    }
  }, [birthInfo, chartState]);

  const { astrolabe, calendar } = chartState.ok
    ? chartState
    : { astrolabe: null, calendar: null };

  const compactPalaces = useMemo(
    () =>
      astrolabe
        ? adaptPalaces(astrolabe, transitDate, transitHour, transitContext)
        : [],
    [astrolabe, transitContext, transitDate, transitHour],
  );
  const horoscope = useMemo(
    () => (astrolabe ? getHoroscope(astrolabe, transitDate, transitHour) : undefined),
    [astrolabe, transitDate, transitHour],
  );
  const palaceZoomMap = useMemo(
    () =>
      astrolabe
        ? new Map(
            astrolabe.palaces.map((palace) => [
              palace.index,
              buildPalaceViewModel(palace, horoscope, transitContext),
            ]),
          )
        : new Map<number, PalaceViewModel>(),
    [astrolabe, horoscope, transitContext],
  );

  const handleSelectPalace = useCallback((index: number) => {
    setSelectedPalaceIndex((currentIndex) => (currentIndex === index ? null : index));
  }, []);

  const handleOpenPalaceDetail = useCallback(
    (index: number) => {
      const palace = palaceZoomMap.get(index);

      if (palace) {
        setZoomPalace(palace);
      }
    },
    [palaceZoomMap],
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

  if (!astrolabe || !calendar) {
    return null;
  }

  const chartGrid = (
    <CompactChartGrid
      astrolabe={astrolabe}
      birthInfo={birthInfo}
      calendar={calendar}
      chartMode={chartMode}
      onOpenDetail={handleOpenPalaceDetail}
      onSelectPalace={handleSelectPalace}
      palaces={compactPalaces}
      selectedPalaceIndex={selectedPalaceIndex}
      transitContext={transitContext}
      transitDate={transitDate}
      transitHour={transitHour}
    />
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

          <MobileTimeNavigator
            activeScope={transitContext.scope}
            astrolabe={astrolabe}
            onTransitContextChange={setTransitContext}
            onTransitDateChange={setTransitDate}
            onTransitHourChange={setTransitHour}
            transitDate={transitDate}
            transitHour={transitHour}
          />

          <section className="mobile-chart-view">
            <div className="mobile-chart-view-head">
              <div>
                <p className="section-kicker">Chart</p>
                <h2>命盘</h2>
                <p className="mobile-chart-hint">点击宫位显示三方四正，双击放大查看</p>
              </div>
            </div>
            {chartGrid}
          </section>

          <InterpretationPanel
            astrolabe={astrolabe}
            selectedPalaceId={selectedPalaceIndex}
            targetDate={transitDate}
            transitContext={transitContext}
            transitHour={transitHour}
            variant="mobile"
          />

          <BirthInfoSummary
            astrolabe={astrolabe}
            birthInfo={birthInfo}
            calendar={calendar}
          />

          <PalaceZoomModal
            open={zoomPalace !== null}
            palace={zoomPalace}
            onClose={() => setZoomPalace(null)}
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
            {chartGrid}
          </div>

          {chartMode === "debug" ? (
            <section className="chart-debug-panel">
              <div>
                <p className="section-kicker">Debug</p>
                <h3>宫位原始字段与显示规则</h3>
                <p>
                  adapter: iztro palace -&gt; CompactPalaceViewModel；
                  layout: 固定分区渲染十二宫。
                </p>
              </div>
              <div className="chart-debug-grid">
                {compactPalaces.map((palace) => (
                  <article key={palace.index}>
                    <h4>
                      {palace.index}. {palace.palaceName} {palace.stemBranch}
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
            activeScope={transitContext.scope}
            astrolabe={astrolabe}
            onTransitContextChange={setTransitContext}
            onTransitDateChange={setTransitDate}
            onTransitHourChange={setTransitHour}
            transitDate={transitDate}
            transitHour={transitHour}
          />

          <InterpretationPanel
            astrolabe={astrolabe}
            selectedPalaceId={selectedPalaceIndex}
            targetDate={transitDate}
            transitContext={transitContext}
            transitHour={transitHour}
          />
        </aside>
      </div>

      <PalaceZoomModal
        open={zoomPalace !== null}
        palace={zoomPalace}
        onClose={() => setZoomPalace(null)}
      />
    </section>
  );
}
