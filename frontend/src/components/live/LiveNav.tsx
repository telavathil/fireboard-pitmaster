"use client";

import React from "react";
import { ClockCounterClockwise, GearSix, Plug, ThermometerSimple, type Icon } from "@phosphor-icons/react";
import { useCookSession } from "../../context/CookSessionContext";

type Tab = "dashboard" | "probes" | "history" | "settings";

const ITEMS: ReadonlyArray<{ tab: Tab; label: string; icon: Icon }> = [
  { tab: "dashboard", label: "Cook", icon: ThermometerSimple },
  { tab: "probes", label: "Probes", icon: Plug },
  { tab: "history", label: "History", icon: ClockCounterClockwise },
  { tab: "settings", label: "Settings", icon: GearSix },
];

function NavButton({ tab, label, icon: IconCmp, active, onSelect }: {
  tab: Tab;
  label: string;
  icon: Icon;
  active: boolean;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 text-[12px] font-semibold transition-colors md:w-full md:flex-none md:py-3 ${
        active ? "text-tide-ink" : "text-tide-muted hover:text-tide-ink"
      }`}
    >
      {active && (
        <span aria-hidden="true" className="absolute top-0 h-[3px] w-8 rounded-b-sm bg-tide-band md:left-0 md:top-1/2 md:h-8 md:w-[3px] md:-translate-y-1/2 md:rounded-r-sm md:rounded-bl-none" />
      )}
      <IconCmp size={24} weight={active ? "fill" : "regular"} aria-hidden="true" />
      {label}
    </button>
  );
}

export default function LiveNav() {
  const { activeTab, setActiveTab } = useCookSession();
  const buttons = ITEMS.map((item) => (
    <NavButton key={item.tab} {...item} active={activeTab === item.tab} onSelect={setActiveTab} />
  ));

  return (
    <>
      <nav aria-label="Primary navigation" className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col items-stretch gap-1 border-r border-tide-rule bg-tide-ground pt-24 md:flex">
        {buttons}
      </nav>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-tide-rule bg-tide-ground pb-[env(safe-area-inset-bottom)] md:hidden">
        {buttons}
      </nav>
    </>
  );
}
