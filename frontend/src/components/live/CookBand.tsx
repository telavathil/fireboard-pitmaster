"use client";

import React, { useEffect, useRef, useState } from "react";
import { DotsThreeVertical } from "@phosphor-icons/react";

interface CookBandProps {
  cookLabel: string;
  onRequestEndCook: () => void;
  children?: React.ReactNode;
}

function CookMenu({ onRequestEndCook }: { onRequestEndCook: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Cook options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-[rgb(19_35_58/0.08)]"
      >
        <DotsThreeVertical size={24} weight="bold" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 min-w-[180px] rounded-[12px] bg-tide-ground py-1 text-tide-ink shadow-[0_10px_30px_rgb(19_35_58/0.22)]">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRequestEndCook();
            }}
            className="block min-h-[44px] w-full px-4 text-left text-[15px] font-semibold hover:bg-[rgb(19_35_58/0.06)]"
          >
            End cook…
          </button>
        </div>
      )}
    </div>
  );
}

/** The almanac-yellow shell band. It turns red for the pull (see `.is-pull`). */
export default function CookBand({ cookLabel, onRequestEndCook, children }: CookBandProps) {
  return (
    <header className="tide-band">
      <div className="mx-auto flex max-w-[1200px] items-start justify-between px-5 pb-4 pt-[max(env(safe-area-inset-top),18px)] md:px-10">
        <h1 className="min-w-0 truncate pt-2 text-[17px] font-semibold">{cookLabel}</h1>
        <CookMenu onRequestEndCook={onRequestEndCook} />
      </div>
      {children}
    </header>
  );
}
