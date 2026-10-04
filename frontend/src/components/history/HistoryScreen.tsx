"use client";

import React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { useCookSession } from "../../context/CookSessionContext";
import TideScreen from "../tide/TideScreen";
import { summarizeCook } from "./historyModel";
import { useCookHistory } from "./useCookHistory";

/** The world's figure face: condensed, heavy, tabular. */
const FIGURE = "text-[22px] font-bold leading-tight [font-stretch:80%]";

const secondaryButton =
  "min-h-[48px] rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink";

function Message({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="max-w-[52ch] py-10">
      <h2 className="text-[22px] font-bold [font-stretch:85%]">{title}</h2>
      <p className="mt-2 text-[15px] text-tide-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default function HistoryScreen() {
  const { tempUnit, setActiveTab } = useCookSession();
  const { state, retry } = useCookHistory();

  return (
    <TideScreen title="History">
      <main className="mx-auto max-w-[1200px] px-5 pb-28 md:px-10 md:pb-12">
        {state.status === "loading" && (
          <p role="status" className="py-10 text-[15px] text-tide-muted">
            Loading past cooks…
          </p>
        )}

        {state.status === "error" && (
          <div role="alert" className="py-10">
            <p className="flex items-start gap-2 text-[15px] font-semibold">
              <WarningCircle size={20} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
              {state.message}
            </p>
            <button type="button" onClick={retry} className={`${secondaryButton} mt-4`}>
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && state.entries.length === 0 && (
          <Message
            title="No finished cooks yet"
            body="A cook appears here once you end it, with how long it took and how close it came to target."
            action={
              <button type="button" onClick={() => setActiveTab("dashboard")} className={secondaryButton}>
                Start a cook
              </button>
            }
          />
        )}

        {state.status === "ready" && state.entries.length > 0 && (
          <table className="mt-6 w-full border-collapse text-left">
            <caption className="sr-only">Finished cooks, newest first</caption>
            <thead className="hidden md:table-header-group">
              <tr className="border-b-[1.5px] border-tide-ink text-[14px] font-semibold">
                <th scope="col" className="py-2 pr-4 font-semibold">Date</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Cook</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Duration</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Target</th>
                <th scope="col" className="py-2 text-right font-semibold">Peak</th>
              </tr>
            </thead>
            <tbody className="border-t-[1.5px] border-tide-ink md:border-t-0">
              {state.entries.map((entry) => {
                const s = summarizeCook(entry, tempUnit);
                return (
                  <tr key={entry.id} className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-tide-rule py-3 md:table-row">
                    <td className="col-span-2 text-[13px] text-tide-muted md:w-[150px] md:py-3 md:pr-4 md:text-[15px] md:text-tide-ink">{s.date}</td>
                    <td className="md:py-3 md:pr-4">
                      <span className="block text-[17px] font-semibold">{s.cut}</span>
                      <span className="block text-[13px] text-tide-muted">{s.details}</span>
                    </td>
                    <td
                      className={`self-center text-right md:py-3 md:pr-4 ${
                        s.hasReadings ? `${FIGURE} md:text-[22px]` : "text-[15px] text-tide-muted"
                      }`}
                    >
                      {s.duration}
                    </td>
                    <td className={`hidden text-right md:table-cell md:py-3 md:pr-4 ${FIGURE}`}>{s.target}</td>
                    <td className="col-span-2 pt-1 text-[14px] md:py-3 md:pt-3 md:text-right">
                      {s.hasReadings ? (
                        <>
                          <span className="text-tide-muted md:hidden">Peak </span>
                          <span className={FIGURE}>{s.peak}</span>
                          <span className="text-tide-muted md:hidden"> of {s.target}</span>
                          {s.peakNote && <span className="ml-2 text-[13px] text-tide-muted md:ml-0 md:block">{s.peakNote}</span>}
                        </>
                      ) : (
                        <>
                          <span className="text-tide-muted md:hidden">Target {s.target}</span>
                          <span className="hidden text-[15px] text-tide-muted md:inline">{s.peak}</span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </TideScreen>
  );
}
