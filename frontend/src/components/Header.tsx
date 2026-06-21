"use client";

import React from "react";
import { CookSession } from "../types";

interface HeaderProps {
  activeSession: CookSession | null;
  handleEndCook: () => void;
}

export default function Header({ activeSession, handleEndCook }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="flex items-center gap-gutter">
        <span className="font-headline-lg text-headline-lg uppercase tracking-tighter text-primary">EMBER & CHAR</span>
        <div className="h-6 w-[1px] bg-outline-variant mx-4"></div>
        <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
          SESSION ID: <span className="text-primary">#{activeSession ? activeSession.id.substring(0, 8).toUpperCase() : "BBQ-2026-0812"}</span>
        </span>
      </div>
      <div className="flex items-center gap-md">
        {activeSession ? (
          <button
            onClick={handleEndCook}
            className="bg-primary-container text-on-primary-container font-headline-md px-6 py-2 tracking-wide active:scale-95 transition-transform uppercase cursor-pointer"
          >
            START NEW COOK
          </button>
        ) : (
          <div className="font-label-mono text-xs text-on-surface-variant uppercase">SYSTEM READY</div>
        )}
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">account_circle</span>
        </div>
      </div>
    </header>
  );
}
