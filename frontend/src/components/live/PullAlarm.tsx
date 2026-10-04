"use client";

import React, { useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { usePullAlarm } from "./hooks";

interface PullAlarmProps {
  explanation: string;
  audible: boolean;
  onPulled: () => void;
}

/** The pull takeover: lives inside the band, which has already turned red. */
export default function PullAlarm({ explanation, audible, onPulled }: PullAlarmProps) {
  const [silenced, setSilenced] = useState(false);
  usePullAlarm(true, audible && !silenced);

  return (
    <div role="alert" className="tide-alarm mx-auto max-w-[1200px] px-5 pb-6 md:px-10 md:pb-8">
      <p className="text-[clamp(3.75rem,17vw,6rem)] font-extrabold leading-[0.88] tracking-[-0.02em] [font-stretch:66%]">
        Pull now
      </p>
      <p className="mt-3 max-w-[42ch] text-[17px] leading-snug">{explanation}</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onPulled}
          className="min-h-[56px] flex-1 rounded-[10px] bg-tide-on-band px-5 text-[17px] font-bold text-tide-band transition-transform active:scale-[0.98] sm:flex-none"
        >
          I pulled it, start rest
        </button>
        <button
          type="button"
          onClick={() => setSilenced((v) => !v)}
          aria-pressed={silenced}
          aria-label={silenced ? "Turn alarm sound back on" : "Silence alarm"}
          className="flex min-h-[56px] w-14 items-center justify-center rounded-[10px] ring-[1.5px] ring-current/70"
        >
          {silenced ? <SpeakerSlash size={24} aria-hidden="true" /> : <SpeakerHigh size={24} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
