"use client";

import React, { useEffect, useState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { getInstallState } from "../pwa/pwa";
import { PRESS } from "../tide/press";
import {
  PushState,
  derivePushState,
  disablePullAlerts,
  enablePullAlerts,
  fetchPublicKey,
  getCurrentSubscription,
  hasServiceWorker,
  isPushSupported,
  sendTestAlert,
} from "../pwa/pushClient";

const COPY: Record<PushState | "checking", string> = {
  checking: "Checking this device…",
  on: "Pull alerts are on for this device.",
  off: "Get a notification when it's time to pull, even with the app closed or the phone locked.",
  denied: "Notifications are blocked for this site. Allow them in your browser or system settings, then reopen this screen.",
  insecure: "Pull alerts need the app served over HTTPS. They work here on localhost, and on your phone once the app is served with HTTPS.",
  "needs-install": "On iPhone and iPad, install the app first (see App), then turn pull alerts on from the installed app.",
  unsupported: "This browser can't receive push notifications. The screen still takes over at the pull while the app is open.",
  "server-off": "Pull alerts aren't set up on the server yet.",
  "worker-missing": "Pull alerts can't start because the app's background worker didn't load. Reload the page and try again.",
};

const primary =
  `${PRESS} min-h-[56px] rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`;
const secondary =
  "min-h-[48px] rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink disabled:cursor-not-allowed disabled:opacity-50";

/** Opt-in for pull alerts on this device: permission, subscription, and a test alert. */
export default function PullAlertsSetting() {
  const [state, setState] = useState<PushState | "checking">("checking");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const secure = window.isSecureContext === true;
      const supported = isPushSupported();
      let key: string | null = null;
      let sub: PushSubscription | null = null;
      let workerReady = false;
      if (secure && supported) {
        workerReady = await hasServiceWorker().catch(() => false);
        key = await fetchPublicKey().catch(() => null);
        sub = workerReady ? await getCurrentSubscription().catch(() => null) : null;
      }
      if (cancelled) return;
      setPublicKey(key);
      setSubscription(sub);
      setState(
        derivePushState({
          supported,
          secure,
          installState: getInstallState(window),
          workerReady,
          serverReady: key !== null,
          permission: supported ? Notification.permission : "default",
          subscribed: sub !== null,
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch {
      setNotice({ text: failure, error: true });
    } finally {
      setBusy(false);
    }
  };

  const turnOn = () =>
    run(async () => {
      if (!publicKey) return;
      if ((await enablePullAlerts(publicKey)) === "denied") {
        setState("denied");
        return;
      }
      setSubscription(await getCurrentSubscription());
      setState("on");
    }, "Pull alerts couldn't be turned on. Check the connection and try again.");

  const turnOff = () =>
    run(async () => {
      if (subscription) await disablePullAlerts(subscription);
      setSubscription(null);
      setState("off");
    }, "Pull alerts couldn't be turned off. Try again.");

  const test = () =>
    run(async () => {
      if (!subscription) return;
      await sendTestAlert(subscription);
      setNotice({ text: "Test alert sent. It should appear in a few seconds.", error: false });
    }, "The test alert couldn't be sent. Check the connection and try again.");

  return (
    <div>
      <p className="text-[15px]">{COPY[state]}</p>

      {state === "off" && (
        <button type="button" onClick={turnOn} disabled={busy} className={`${primary} mt-4 w-full sm:w-auto`}>
          {busy ? "Turning on…" : "Turn on pull alerts"}
        </button>
      )}

      {state === "on" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={test} disabled={busy} className={secondary}>
            Send a test alert
          </button>
          <button type="button" onClick={turnOff} disabled={busy} className={secondary}>
            Turn off
          </button>
        </div>
      )}

      {notice && (
        <p role={notice.error ? "alert" : "status"} className="mt-3 flex items-start gap-2 text-[14px] font-semibold">
          {notice.error && <WarningCircle size={18} weight="bold" className="mt-px shrink-0" aria-hidden="true" />}
          {notice.text}
        </p>
      )}
    </div>
  );
}
