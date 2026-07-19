"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";

export default function Header() {
  const { activeSession, handleEndCook, username } = useCookSession();

  const sessionContext = activeSession
    ? `${activeSession.cooker_type.toUpperCase()} · ${activeSession.cut_type.toUpperCase()} (${activeSession.weight_kg}KG)`
    : null;

  return (
    <header className="dashboard-header">
      <div className="flex items-center gap-gutter">
        <span className="font-headline-lg text-2xl md:text-headline-lg uppercase tracking-tighter text-primary">EMBER & CHAR</span>
        {sessionContext && (
          <>
            <div className="h-6 w-[1px] bg-outline-variant mx-4"></div>
            <span className="font-label-mono text-xs uppercase text-on-surface-variant tracking-wider hidden md:inline">
              {sessionContext}
            </span>
          </>
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
        <span className="material-symbols-outlined text-on-surface-variant text-xl cursor-pointer hover:text-primary transition-colors">
          notifications
        </span>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">account_circle</span>
          <span className="font-label-mono text-xs text-on-surface-variant font-bold uppercase">
            {username || "Pitmaster"}
          </span>
        </div>
      </div>
    </header>
  );
}
