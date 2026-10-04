"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCookSession } from "../../context/CookSessionContext";
import { toUnit } from "../live/cookModel";
import LiveNav from "../live/LiveNav";
import SetupSummary, { StartBar } from "./SetupSummary";
import { Segmented, SetupSection, TargetStepper, TextField } from "./SetupFields";
import {
  COOKERS,
  DEFAULT_DRAFT,
  DraftErrors,
  LengthUnit,
  MEATS,
  PRESETS,
  SetupDraft,
  WeightUnit,
  applyPreset,
  convertEntry,
  parseStoredDraft,
  stepTarget,
  toSessionPayload,
  validateDraft,
} from "./setupModel";

const LAST_SETUP_KEY = "pitmaster_last_setup";
const WEIGHT_UNITS = [{ id: "kg", label: "kg" }, { id: "lb", label: "lb" }] as const;
const LENGTH_UNITS = [{ id: "mm", label: "mm" }, { id: "in", label: "in" }] as const;
const TEMP_UNITS = [{ id: "F", label: "°F" }, { id: "C", label: "°C" }] as const;

function loadLastDraft(): SetupDraft {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    return parseStoredDraft(localStorage.getItem(LAST_SETUP_KEY)) ?? DEFAULT_DRAFT;
  } catch {
    return DEFAULT_DRAFT;
  }
}

function saveLastDraft(draft: SetupDraft) {
  try {
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode); defaults will be used next time.
  }
}

export default function SetupScreen() {
  const { tempUnit, setTempUnit, startCook, isCreatingSession, sessionError } = useCookSession();
  const [draft, setDraft] = useState<SetupDraft>(loadLastDraft);
  const [errors, setErrors] = useState<DraftErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const [failedSubmits, setFailedSubmits] = useState(0);

  // After a failed submit renders its errors, move focus to the first invalid field.
  useEffect(() => {
    if (failedSubmits > 0) formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [failedSubmits]);

  const update = (patch: Partial<SetupDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      (Object.keys(patch) as Array<keyof SetupDraft>).forEach((key) => delete next[key]);
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    if (await startCook(toSessionPayload(draft))) saveLastDraft(draft);
  };

  const activePreset = PRESETS.find(
    (p) => p.meatType === draft.meatType && p.cutType === draft.cutType && Math.abs(p.targetC - draft.targetC) < 0.3,
  );
  const cooker = COOKERS.find((c) => c.id === draft.cookerType)?.label ?? draft.cookerType;
  const summary = [
    { label: "Cut", value: draft.cutType.trim() || "Not named yet" },
    { label: "Size", value: `${draft.weight || "?"} ${draft.weightUnit} · ${draft.thickness || "?"} ${draft.thicknessUnit} thick` },
    { label: "Cooker", value: cooker },
    { label: "Target", value: `${toUnit(draft.targetC, tempUnit)}°${tempUnit}` },
  ];

  return (
    <div className="tide-world min-h-[100dvh] md:pl-[88px]">
      <LiveNav />
      <header className="tide-band">
        <div className="mx-auto max-w-[1200px] px-5 pb-4 pt-[max(env(safe-area-inset-top),18px)] md:px-10">
          <h1 className="pt-2 text-[17px] font-semibold">Start a cook</h1>
        </div>
      </header>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="setup-layout mx-auto max-w-[1200px] px-5 md:px-10">
        <div className="min-w-0">
          <SetupSection title="What's cooking">
            <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={activePreset?.id === preset.id}
                  onClick={() => update(applyPreset(draft, preset))}
                  className="min-h-[44px] rounded-full px-4 text-[14px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink aria-pressed:bg-tide-ink aria-pressed:text-tide-ground aria-pressed:ring-tide-ink"
                >
                  {preset.label} · {toUnit(preset.targetC, tempUnit)}°
                </button>
              ))}
            </div>
            <div className="grid gap-5">
              <Segmented legend="Protein" name="meat" value={draft.meatType} options={MEATS} onChange={(meatType) => update({ meatType })} columns={4} />
              <TextField label="Cut" value={draft.cutType} onChange={(cutType) => update({ cutType })} error={errors.cutType} placeholder="e.g. Pork shoulder" />
            </div>
          </SetupSection>

          <SetupSection title="Size">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Weight"
                value={draft.weight}
                inputMode="decimal"
                onChange={(weight) => update({ weight })}
                error={errors.weight}
                trailing={<div className="w-[108px] shrink-0"><Segmented legend="Weight unit" name="weight-unit" hideLegend compact value={draft.weightUnit} options={WEIGHT_UNITS} onChange={(unit: WeightUnit) => update({ weightUnit: unit, weight: convertEntry(draft.weight, draft.weightUnit, unit) })} /></div>}
              />
              <TextField
                label="Thickness at the thickest point"
                value={draft.thickness}
                inputMode="decimal"
                onChange={(thickness) => update({ thickness })}
                error={errors.thickness}
                trailing={<div className="w-[108px] shrink-0"><Segmented legend="Thickness unit" name="thickness-unit" hideLegend compact value={draft.thicknessUnit} options={LENGTH_UNITS} onChange={(unit: LengthUnit) => update({ thicknessUnit: unit, thickness: convertEntry(draft.thickness, draft.thicknessUnit, unit) })} /></div>}
              />
            </div>
          </SetupSection>

          <SetupSection title="Target">
            <TargetStepper
              display={toUnit(draft.targetC, tempUnit)}
              onStep={(delta) => update({ targetC: stepTarget(draft.targetC, tempUnit, delta) })}
              error={errors.targetC}
              unitControl={<Segmented legend="Temperature unit" name="temp-unit" hideLegend compact value={tempUnit} options={TEMP_UNITS} onChange={setTempUnit} />}
            />
            <p className="mt-4 max-w-[52ch] text-[14px] text-tide-muted">
              The doneness you want after the rest. The pull alarm sounds a little earlier, once the model has estimated carryover.
            </p>
          </SetupSection>

          <SetupSection title="Cooker">
            <Segmented legend="Cooker type" name="cooker" hideLegend value={draft.cookerType} options={COOKERS} onChange={(cookerType) => update({ cookerType })} columns={2} />
          </SetupSection>

          <SetupSection title="Probe">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="FireBoard device ID" value={draft.deviceId} onChange={(deviceId) => update({ deviceId })} error={errors.deviceId} hint="The core probe reads from channel 1." />
              <TextField label="Nickname (optional)" value={draft.deviceName} onChange={(deviceName) => update({ deviceName })} placeholder="Backyard kamado" />
            </div>
          </SetupSection>
        </div>

        <SetupSummary rows={summary} error={sessionError} busy={isCreatingSession} />
        <StartBar
          line={`${draft.cutType.trim() || "Unnamed cut"} · ${toUnit(draft.targetC, tempUnit)}°${tempUnit}`}
          error={sessionError}
          busy={isCreatingSession}
        />
      </form>
    </div>
  );
}
