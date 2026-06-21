"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";

export default function Header() {
  const { activeSession, handleEndCook } = useCookSession();

  return (
    <header className="dashboard-header">
      <div className="flex items-center gap-gutter">
        <span className="font-headline-lg text-headline-lg uppercase tracking-tighter text-primary">EMBER & CHAR</span>
        <div className="h-6 w-[1px] bg-outline-variant mx-4"></div>
        {activeSession ? (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-label-mono text-xs uppercase text-on-surface tracking-wider">
              LIVE BROADCAST ACTIVE
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
            <span className="font-label-mono text-xs uppercase text-on-surface-variant tracking-wider">
              STANDBY
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-sm">
        {activeSession && (
          <button
            onClick={handleEndCook}
            className="px-4 py-2 bg-error-container text-on-error-container hover:brightness-110 font-label-mono text-xs uppercase cursor-pointer"
          >
            END SESSION
          </button>
        )}
        <div className="h-10 w-[1px] bg-outline-variant mx-2"></div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">account_circle</span>
          <span className="font-label-mono text-xs text-on-surface-variant font-bold">PITMASTER</span>
        </div>
      </div>
    </header>
  );
}
