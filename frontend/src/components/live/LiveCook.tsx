"use client";

import React, { useState } from "react";
import { useCookSession } from "../../context/CookSessionContext";
import { CookSession } from "../../types";
import { getMeatLabel } from "../../lib/formatters";
import { Stage, TempUnit, pullTempC, toUnit } from "./cookModel";
import { LiveViewInput, buildFreshness, buildReadout, buildTableRows, targetClock } from "./liveView";
import { useNow } from "./hooks";
import LiveNav from "./LiveNav";
import CookBand from "./CookBand";
import PullAlarm from "./PullAlarm";
import EndCookDialog from "./EndCookDialog";
import TideChartView from "./TideChartView";
import EstimateDetails from "./EstimateDetails";
import { CoreReadout, DataProblem, ReadingMeta, StageLine, TideTable } from "./LiveSections";

function cookLabelOf(session: CookSession): string {
  const cooker = getMeatLabel(session.cooker_type);
  return `${session.cut_type} · ${session.weight_kg} kg · ${cooker}`;
}

function pullExplanation(coreC: number | null, carryoverC: number | null, unit: TempUnit): string {
  const core = coreC !== null ? `Core is ${toUnit(coreC, unit)}°.` : "The core has reached the pull temperature.";
  if (carryoverC === null) return `${core} Carryover hasn't been estimated, so this is your target itself.`;
  return `${core} Expect it to coast about ${toUnit(carryoverC, unit, { delta: true })}° higher during the rest.`;
}

function chartSummary(view: LiveViewInput, etaClock: number | null): string {
  const core = view.telemetry ? `${toUnit(view.telemetry.core_temp_filtered, view.unit)}°` : "no reading yet";
  const projected = etaClock !== null ? ", projected to reach target" : "";
  return `Core temperature over time, now ${core}${projected}.`;
}

export default function LiveCook() {
  const {
    activeSession, telemetry, history, isConnected, stage, carryoverC, restStartedAt, peakRestTempC,
    tempUnit, alarmsEnabled, handleUpdateStatus, handleEndCook,
  } = useCookSession();
  const now = useNow(1000);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  if (!activeSession || !stage) {
    return (
      <div className="tide-world flex min-h-[100dvh] items-center justify-center px-5 text-[15px] text-tide-muted">
        <LiveNav />
        Loading your cook…
      </div>
    );
  }

  const currentStage: Stage = stage;
  const view: LiveViewInput = {
    stage: currentStage,
    targetC: activeSession.target_temp_c,
    telemetry,
    history,
    now,
    unit: tempUnit,
    carryoverC,
    restStartedAt,
    peakRestTempC,
    connected: isConnected,
  };
  const etaClock = targetClock(telemetry);
  const freshness = buildFreshness(view);
  // No projection when the data can't be trusted, at the pull, or during the rest.
  const chartEta = freshness.problem || currentStage === "pull" || currentStage === "rest" ? null : etaClock;
  const cookLabel = cookLabelOf(activeSession);
  const pit = telemetry?.ambient_temp != null ? `${toUnit(telemetry.ambient_temp, tempUnit)}°${tempUnit}` : "No pit probe";
  const isPull = currentStage === "pull";

  return (
    <div className={`tide-world min-h-[100dvh] md:pl-[88px] ${isPull ? "is-pull" : ""}`}>
      <LiveNav />
      <CookBand cookLabel={cookLabel} onRequestEndCook={() => setConfirmingEnd(true)}>
        {freshness.problem && <DataProblem message={freshness.problem} />}
        {isPull && (
          <PullAlarm
            explanation={pullExplanation(telemetry?.core_temp_filtered ?? null, carryoverC, tempUnit)}
            audible={alarmsEnabled}
            onPulled={() => handleUpdateStatus("resting")}
          />
        )}
      </CookBand>

      <main className="tide-layout mx-auto max-w-[1200px] px-5 md:px-10">
        <CoreReadout readout={buildReadout(view)} />
        <StageLine stage={currentStage} />
        <TideChartView
          history={history}
          now={now}
          etaClock={chartEta}
          targetC={activeSession.target_temp_c}
          pullC={pullTempC(activeSession.target_temp_c, carryoverC)}
          unit={tempUnit}
          summary={chartSummary(view, chartEta)}
        />
        <div className="[grid-area:table]">
          <TideTable rows={buildTableRows(view)} />
          {currentStage === "rest" && (
            <button
              type="button"
              onClick={() => setConfirmingEnd(true)}
              className="mt-5 min-h-[52px] w-full rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90"
            >
              Finish cook
            </button>
          )}
        </div>
        <ReadingMeta pit={pit} ageLabel={telemetry ? null : freshness.ageLabel} />
        <EstimateDetails telemetry={telemetry} carryoverC={carryoverC} unit={tempUnit} />
      </main>

      <EndCookDialog
        open={confirmingEnd}
        cookLabel={activeSession.cut_type}
        error={endError}
        onCancel={() => {
          setConfirmingEnd(false);
          setEndError(null);
        }}
        onConfirm={async () => {
          if (await handleEndCook()) return;
          setEndError("The cook couldn't be ended. Check the connection and try again; it's still recording.");
        }}
      />
    </div>
  );
}
