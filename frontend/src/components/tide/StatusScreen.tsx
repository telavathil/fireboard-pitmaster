"use client";

import React from "react";
import { PRESS } from "./press";

interface StatusScreenProps {
  message: string;
  action?: { label: string; onClick: () => void };
}

/** A band-only screen for moments with nothing to act on yet (loading, a check that failed). */
export default function StatusScreen({ message, action }: StatusScreenProps) {
  return (
    <div className="tide-world min-h-[100dvh]">
      <header className="tide-band">
        <div className="mx-auto max-w-[1200px] px-5 pb-4 pt-[max(env(safe-area-inset-top),18px)] md:px-10">
          <p className="pt-2 text-[17px] font-semibold">FireBoard Pitmaster</p>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-10">
        <p role={action ? "alert" : "status"} className="max-w-[52ch] text-[17px]">
          {message}
        </p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={`${PRESS} mt-5 min-h-[48px] rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink`}
          >
            {action.label}
          </button>
        )}
      </main>
    </div>
  );
}
