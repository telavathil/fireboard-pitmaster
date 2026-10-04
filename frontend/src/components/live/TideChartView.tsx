"use client";

import React from "react";
import { TelemetryPayload } from "../../types";
import { TempUnit } from "./cookModel";
import { buildTideChart } from "./tideChart";
import { useElementWidth } from "./hooks";

interface TideChartViewProps {
  history: ReadonlyArray<TelemetryPayload>;
  now: number;
  etaClock: number | null;
  targetC: number;
  pullC: number;
  unit: TempUnit;
  summary: string;
}

const PAD_TOP = 22;
const PAD_BOTTOM = 26;
const SCALE_GUTTER = 36; // the temperature scale sits outside the plot so it never crosses a line

/** The signature move: the cook drawn as a tide chart, past solid and forecast projected. */
export default function TideChartView({ history, now, etaClock, targetC, pullC, unit, summary }: TideChartViewProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>(340);
  // Phone: proportional. Desktop: tall enough to stand beside the readout and table.
  const height = Math.round(width >= 560 ? Math.min(600, width * 0.85) : Math.max(210, width * 0.62));
  const plotWidth = Math.max(120, width - SCALE_GUTTER);
  const chart = buildTideChart(
    { history, now, etaClock, targetC, pullC, unit },
    { width: plotWidth, height, padTop: PAD_TOP, padBottom: PAD_BOTTOM },
  );
  const baseline = height - PAD_BOTTOM;
  const labelNowLeft = chart.nowX > plotWidth - 40;

  return (
    <figure ref={ref} className="[grid-area:chart] mt-6 md:mt-5">
      {history.length === 0 ? (
        <div className="flex items-center justify-center border-y border-tide-rule text-[14px] text-tide-muted" style={{ height }}>
          The curve starts with the first reading.
        </div>
      ) : (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} className="block overflow-visible">
          {chart.yTicks.map((tick) => (
            <g key={tick.label}>
              <line x1={0} y1={tick.y} x2={plotWidth} y2={tick.y} stroke="var(--tide-rule)" strokeWidth={1} opacity={0.6} />
              <text x={width} y={tick.y + 4} textAnchor="end" fontSize={11} fill="var(--tide-muted)">
                {tick.label}
              </text>
            </g>
          ))}
          {chart.projection && (
            <path d={chart.projection} fill="none" stroke="var(--tide-blue)" strokeWidth={2.5} strokeDasharray="7 5" strokeLinecap="round" />
          )}
          <path d={chart.past} fill="none" stroke="var(--tide-ink)" strokeWidth={2.75} strokeLinejoin="round" strokeLinecap="round" />
          {/* Drawn last so nothing sits on top of the one red element. */}
          <line x1={0} y1={chart.pullY} x2={plotWidth} y2={chart.pullY} stroke="var(--tide-pull)" strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={0} y={chart.pullY - 7} fontSize={12} fontWeight={600} fill="var(--tide-pull)">
            {chart.pullLabel}
          </text>
          <line x1={chart.nowX} y1={6} x2={chart.nowX} y2={baseline} stroke="var(--tide-ink)" strokeWidth={1} />
          <text
            x={chart.nowX + (labelNowLeft ? -6 : 6)}
            y={14}
            textAnchor={labelNowLeft ? "end" : "start"}
            fontSize={12}
            fontWeight={700}
            fill="var(--tide-ink)"
          >
            now
          </text>
          <line x1={0} y1={baseline} x2={plotWidth} y2={baseline} stroke="var(--tide-rule)" strokeWidth={1} />
          {chart.ticks.map((tick) => (
            <text key={tick.x} x={tick.x} y={height - 8} textAnchor="middle" fontSize={12} fill="var(--tide-muted)">
              {tick.label}
            </text>
          ))}
        </svg>
      )}
      <figcaption className="mt-2 text-[13px] text-tide-muted">
        {etaClock !== null
          ? "Solid: readings. Dashed: the model's projected path to target, not a range."
          : "Readings so far. The projection shows while there is a current estimate."}
      </figcaption>
    </figure>
  );
}
