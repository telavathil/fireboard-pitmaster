"use client";

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "../../lib/api";
import { HistoryEntry, parseHistory } from "./historyModel";

type HistoryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; entries: HistoryEntry[] };

/** Loads finished cooks from the backend, with a retry for when it was unreachable. */
export function useCookHistory() {
  const [state, setState] = useState<HistoryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BACKEND_URL}/api/sessions/history`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setState({ status: "ready", entries: parseHistory(await res.json()) });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: err instanceof TypeError ? "Couldn't reach the server. Check that the backend is running." : "Past cooks couldn't be loaded.",
        });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
