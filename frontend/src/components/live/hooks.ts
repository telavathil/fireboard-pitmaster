"use client";

import { useEffect, useRef, useState } from "react";

/** Current time, refreshed on an interval so ages and rest clocks stay current. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Tracks an element's rendered width so the chart draws at real pixels. */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

const ALARM_REPEAT_MS = 8000;
const PULL_TITLE = "Pull now · FireBoard Pitmaster";

function playAlarmTone(ctx: AudioContext) {
  const start = ctx.currentTime;
  [0, 0.28, 0.56].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.22);
  });
}

/**
 * While active: repeats a tone, vibrates where supported, and retitles the tab
 * so the pull is visible even from another tab. Browsers may block audio until
 * the page has had a user interaction; the visual alarm never depends on it.
 */
export function usePullAlarm(active: boolean, audible: boolean) {
  useEffect(() => {
    if (!active) return;
    const previousTitle = document.title;
    document.title = PULL_TITLE;

    let ctx: AudioContext | null = null;
    const ring = () => {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([300, 150, 300]);
      if (!audible) return;
      try {
        ctx = ctx ?? new AudioContext();
        playAlarmTone(ctx);
      } catch {
        // Audio unavailable (autoplay policy or no device); the visual alarm still shows.
      }
    };
    ring();
    const id = setInterval(ring, ALARM_REPEAT_MS);
    return () => {
      clearInterval(id);
      document.title = previousTitle;
      ctx?.close().catch(() => undefined);
    };
  }, [active, audible]);
}
