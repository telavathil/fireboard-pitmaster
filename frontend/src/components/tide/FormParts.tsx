"use client";

import React, { useId } from "react";
import { Minus, Plus, WarningCircle } from "@phosphor-icons/react";

export function SetupSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-tide-rule pb-7 pt-6 first:border-t-0">
      <h2 className="mb-4 text-[22px] font-bold leading-tight [font-stretch:85%]">{title}</h2>
      {children}
    </section>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[14px] font-semibold">
      <WarningCircle size={18} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

interface SegmentedProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (value: T) => void;
  columns?: 2 | 4;
  compact?: boolean;
  hideLegend?: boolean;
}

/** Native radio group styled as a segmented control: one choice, keyboard-operable. */
export function Segmented<T extends string>({ legend, name, value, options, onChange, columns, compact, hideLegend }: SegmentedProps<T>) {
  const grid = columns === 4 ? "grid-cols-2 sm:grid-cols-4" : columns === 2 ? "grid-cols-2" : "auto-cols-fr grid-flow-col";
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "mb-2 text-[14px] font-semibold"}>{legend}</legend>
      <div className={`grid gap-1.5 ${grid}`}>
        {options.map((option) => (
          <label key={option.id} className="relative">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="peer sr-only"
            />
            <span
              className={`flex cursor-pointer items-center justify-center rounded-[10px] px-3 text-center font-semibold ring-[1.5px] ring-tide-rule transition-colors hover:ring-tide-ink peer-checked:bg-tide-ink peer-checked:text-tide-ground peer-checked:ring-tide-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tide-blue ${
                compact ? "min-h-[44px] text-[14px]" : "min-h-[48px] text-[15px]"
              }`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  inputMode?: "decimal" | "text";
  autoComplete?: string;
  trailing?: React.ReactNode;
}

export function TextField({ label, value, onChange, error, hint, placeholder, inputMode = "text", autoComplete = "off", trailing }: TextFieldProps) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[14px] font-semibold">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`min-h-[52px] w-full min-w-0 rounded-[10px] bg-tide-field px-4 text-[17px] font-semibold text-tide-ink outline-none placeholder:font-normal placeholder:text-tide-muted focus-visible:ring-2 focus-visible:ring-tide-blue ${
            error ? "ring-[2.5px] ring-tide-ink" : "ring-[1.5px] ring-tide-rule"
          }`}
        />
        {trailing}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-[13px] text-tide-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

interface TargetStepperProps {
  display: number;
  unitControl: React.ReactNode;
  onStep: (delta: number) => void;
  error?: string;
}

/** The target temperature, set at figure scale with large step buttons for imprecise taps. */
export function TargetStepper({ display, unitControl, onStep, error }: TargetStepperProps) {
  const stepButton = (delta: number, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onStep(delta)}
      aria-label={label}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] ring-[1.5px] ring-tide-rule hover:ring-tide-ink active:scale-[0.97]"
    >
      {icon}
    </button>
  );
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-3">
          {stepButton(-1, "Lower target by one degree", <Minus size={22} weight="bold" aria-hidden="true" />)}
          <output aria-live="polite" aria-label="Target temperature" className="min-w-[3.2ch] text-center text-[clamp(4rem,18vw,5.5rem)] font-extrabold leading-[0.85] tracking-[-0.02em] [font-stretch:66%]">
            {display}°
          </output>
          {stepButton(1, "Raise target by one degree", <Plus size={22} weight="bold" aria-hidden="true" />)}
        </div>
        <div className="w-[120px]">{unitControl}</div>
      </div>
      <FieldError id="target-error" message={error} />
    </div>
  );
}
