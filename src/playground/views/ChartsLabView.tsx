import React, { useMemo, useState } from 'react';
import {
  LkAreaChart,
  LkBarChart,
  LkButton,
  LkCard,
  LkDonutChart,
  LkLineChart,
  LkMotionReveal,
  LkPieChart,
  LkProgressChart,
  LkSegmentedControl,
  LkSparkline,
  LkSwitch,
  formatLkNumber,
  useLkCore,
} from '../../lk-core';

type DatasetMode = 'populated' | 'empty' | 'error';
type PeriodKey = 'week' | 'month' | 'quarter';

const PERIOD_SERIES: Record<
  PeriodKey,
  Array<{ label: string; adoption: number; stability: number; latency: number }>
> = {
  week: [
    { label: 'Lun', adoption: 420, stability: 290, latency: 24 },
    { label: 'Mar', adoption: 510, stability: 340, latency: 21 },
    { label: 'Mer', adoption: 490, stability: 380, latency: 19 },
    { label: 'Jeu', adoption: 640, stability: 430, latency: 18 },
    { label: 'Ven', adoption: 720, stability: 510, latency: 16 },
    { label: 'Sam', adoption: 680, stability: 495, latency: 17 },
    { label: 'Dim', adoption: 790, stability: 560, latency: 15 },
  ],
  month: [
    { label: 'S1', adoption: 1840, stability: 1210, latency: 25 },
    { label: 'S2', adoption: 2190, stability: 1490, latency: 22 },
    { label: 'S3', adoption: 2650, stability: 1740, latency: 19 },
    { label: 'S4', adoption: 3120, stability: 2180, latency: 16 },
  ],
  quarter: [
    { label: 'Jan', adoption: 4200, stability: 2950, latency: 27 },
    { label: 'Fév', adoption: 5180, stability: 3420, latency: 23 },
    { label: 'Mar', adoption: 6490, stability: 4190, latency: 18 },
  ],
};

const PIE_BREAKDOWN = [
  { name: 'LK Design', value: 38 },
  { name: 'LK Charts', value: 27 },
  { name: 'LK Themes', value: 21 },
  { name: 'LK Storage', value: 14 },
];

export function ChartsLabView() {
  const { dictionary, settings } = useLkCore();
  const c = dictionary.chartsLab;

  const [datasetMode, setDatasetMode] = useState<DatasetMode>('populated');
  const [period, setPeriod] = useState<PeriodKey>('week');
  const [showGrid, setShowGrid] = useState(true);
  const [stacked, setStacked] = useState(false);
  const [curved, setCurved] = useState(true);

  const activeRows = useMemo(
    () => (datasetMode === 'populated' ? PERIOD_SERIES[period] : []),
    [datasetMode, period],
  );
  const activePie = useMemo(
    () => (datasetMode === 'populated' ? PIE_BREAKDOWN : []),
    [datasetMode],
  );
  const activeError = datasetMode === 'error' ? c.errorSimulatedMsg : null;

  const sparkRequests = useMemo(
    () => activeRows.map((r) => r.adoption),
    [activeRows],
  );
  const sparkStability = useMemo(
    () => activeRows.map((r) => r.stability),
    [activeRows],
  );
  const sparkLatency = useMemo(
    () => activeRows.map((r) => r.latency),
    [activeRows],
  );

  const emptyRestoreAction = (
    <LkButton size="sm" variant="secondary" onClick={() => setDatasetMode('populated')}>
      {c.restoreDataBtn}
    </LkButton>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--lk-text)' }}>
            {c.title}
          </h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--lk-text-secondary)' }}>
            {c.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LkSegmentedControl
            ariaLabel={c.datasetModeLabel}
            value={datasetMode}
            onChange={setDatasetMode}
            options={[
              { value: 'populated', label: c.modes.populated },
              { value: 'empty', label: c.modes.empty },
              { value: 'error', label: c.modes.error },
            ]}
          />
          <LkSegmentedControl
            ariaLabel={c.periodLabel}
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'week', label: c.periods.week },
              { value: 'month', label: c.periods.month },
              { value: 'quarter', label: c.periods.quarter },
            ]}
          />
        </div>
      </div>

      {/* Interactive Display Options */}
      <LkCard surface="solid" className="!py-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LkSwitch label={c.toggleGrid} checked={showGrid} onChange={setShowGrid} />
          <LkSwitch label={c.toggleCurved} checked={curved} onChange={setCurved} />
          <LkSwitch label={c.toggleStacked} checked={stacked} onChange={setStacked} />
        </div>
      </LkCard>

      {/* Sparklines Row */}
      <LkMotionReveal>
        <LkCard title={c.sparklineCardTitle} subtitle={c.sparklineCardSub}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--lk-text-muted)' }}>
                  {c.sparklineLabels.requests}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--lk-text)' }}>
                  {datasetMode === 'populated'
                    ? formatLkNumber(activeRows[activeRows.length - 1]?.adoption ?? 0, settings.numberFormat)
                    : '—'}
                </span>
              </div>
              <LkSparkline
                data={sparkRequests}
                variant="area"
                error={activeError}
                ariaLabel={c.sparklineLabels.requests}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--lk-text-muted)' }}>
                  {c.sparklineLabels.conversion}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--lk-text)' }}>
                  {datasetMode === 'populated'
                    ? formatLkNumber(activeRows[activeRows.length - 1]?.stability ?? 0, settings.numberFormat)
                    : '—'}
                </span>
              </div>
              <LkSparkline
                data={sparkStability}
                variant="line"
                color="#2FB87D"
                error={activeError}
                ariaLabel={c.sparklineLabels.conversion}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--lk-text-muted)' }}>
                  {c.sparklineLabels.latency}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--lk-text)' }}>
                  {datasetMode === 'populated'
                    ? `${activeRows[activeRows.length - 1]?.latency ?? 0} ms`
                    : '—'}
                </span>
              </div>
              <LkSparkline
                data={sparkLatency}
                variant="bar"
                color="#4C8DFF"
                valueFormatter={(v) => `${v} ms`}
                error={activeError}
                ariaLabel={c.sparklineLabels.latency}
              />
            </div>
          </div>
        </LkCard>
      </LkMotionReveal>

      {/* Cartesian Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LkCard title={c.lineCardTitle} subtitle={c.lineCardSub}>
          <LkLineChart
            data={activeRows}
            xKey="label"
            height={250}
            showGrid={showGrid}
            curved={curved}
            error={activeError}
            emptyTitle={c.emptyCustomTitle}
            emptyDescription={c.emptyCustomDesc}
            emptyAction={emptyRestoreAction}
            series={[
              { key: 'adoption', label: c.seriesLabels.adoption },
              { key: 'stability', label: c.seriesLabels.stability },
            ]}
          />
        </LkCard>

        <LkCard title={c.areaCardTitle} subtitle={c.areaCardSub}>
          <LkAreaChart
            data={activeRows}
            xKey="label"
            height={250}
            showGrid={showGrid}
            curved={curved}
            stacked={stacked}
            error={activeError}
            emptyTitle={c.emptyCustomTitle}
            emptyDescription={c.emptyCustomDesc}
            emptyAction={emptyRestoreAction}
            series={[
              { key: 'adoption', label: c.seriesLabels.web },
              { key: 'stability', label: c.seriesLabels.mobile },
            ]}
          />
        </LkCard>

        <LkCard title={c.barCardTitle} subtitle={c.barCardSub} className="lg:col-span-2">
          <LkBarChart
            data={activeRows}
            xKey="label"
            height={260}
            showGrid={showGrid}
            stacked={stacked}
            error={activeError}
            emptyTitle={c.emptyCustomTitle}
            emptyDescription={c.emptyCustomDesc}
            emptyAction={emptyRestoreAction}
            series={[
              { key: 'adoption', label: c.seriesLabels.web },
              { key: 'stability', label: c.seriesLabels.mobile },
            ]}
          />
        </LkCard>
      </div>

      {/* Circular & Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <LkCard title={c.pieCardTitle} subtitle={c.pieCardSub} className="lg:col-span-4">
          <LkPieChart
            data={activePie}
            height={220}
            error={activeError}
            emptyTitle={c.emptyCustomTitle}
            emptyDescription={c.emptyCustomDesc}
            emptyAction={emptyRestoreAction}
            valueFormatter={(v) => `${v}%`}
          />
        </LkCard>

        <LkCard title={c.donutCardTitle} subtitle={c.donutCardSub} className="lg:col-span-4">
          <LkDonutChart
            data={activePie}
            height={220}
            centerValue={datasetMode === 'populated' ? '100%' : '0%'}
            centerLabel={c.donutCenterLabel}
            error={activeError}
            emptyTitle={c.emptyCustomTitle}
            emptyDescription={c.emptyCustomDesc}
            emptyAction={emptyRestoreAction}
            valueFormatter={(v) => `${v}%`}
          />
        </LkCard>

        <LkCard title={c.progressCardTitle} subtitle={c.progressCardSub} className="lg:col-span-4">
          <div className="flex flex-col gap-5">
            <LkProgressChart
              value={datasetMode === 'populated' ? 100 : 0}
              max={100}
              label={c.progressBarLabel}
              sublabel={c.progressBarSub}
              error={activeError}
            />

            <LkProgressChart
              value={datasetMode === 'populated' ? 84 : 0}
              max={100}
              label={c.progressSegmentedLabel}
              error={activeError}
              segments={
                datasetMode === 'populated'
                  ? [
                      { id: 'ui', label: 'UI', value: 42 },
                      { id: 'charts', label: 'Charts', value: 28 },
                      { id: 'tokens', label: 'Tokens', value: 14 },
                    ]
                  : []
              }
            />

            <LkProgressChart
              variant="ring"
              size="md"
              value={datasetMode === 'populated' ? 96 : 0}
              max={100}
              label={c.progressRingLabel}
              sublabel={c.progressRingSub}
              error={activeError}
            />
          </div>
        </LkCard>
      </div>
    </div>
  );
}
