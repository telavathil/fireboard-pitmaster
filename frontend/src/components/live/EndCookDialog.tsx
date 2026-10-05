"use client";

import React, { useEffect, useRef } from "react";
import { PRESS } from "../tide/press";

interface EndCookDialogProps {
  open: boolean;
  cookLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  error?: string | null;
}

/** A protected confirmation: ending a cook stops recording and cannot be undone. */
export default function EndCookDialog({ open, cookLabel, onConfirm, onCancel, error }: EndCookDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="end-cook-title"
      className="tide-dialog m-auto w-[min(92vw,420px)] rounded-[14px] bg-tide-ground p-6 text-tide-ink shadow-[0_18px_50px_rgb(19_35_58/0.28)] backdrop:bg-[rgb(13_21_36/0.55)]"
    >
      <h2 id="end-cook-title" className="text-[24px] font-bold [font-stretch:85%]">End this cook?</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-tide-muted">
        {cookLabel} stops recording and moves to History. This can&apos;t be undone.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-[15px] font-semibold">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className={`${PRESS} min-h-[48px] rounded-[10px] px-5 text-[17px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink`}
        >
          Keep cooking
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`${PRESS} min-h-[48px] rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90`}
        >
          End cook
        </button>
      </div>
    </dialog>
  );
}
