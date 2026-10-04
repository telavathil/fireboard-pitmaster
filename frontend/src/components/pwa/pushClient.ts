import { BACKEND_URL } from "../../lib/api";
import { InstallState } from "./pwa";

export type PushState =
  | "on"
  | "off"
  | "denied"
  | "insecure"
  | "needs-install"
  | "unsupported"
  | "server-off";

interface PushInputs {
  supported: boolean;
  secure: boolean;
  installState: InstallState;
  serverReady: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}

/** What the pull-alerts control should offer on this device, in priority order. */
export function derivePushState({ supported, secure, installState, serverReady, permission, subscribed }: PushInputs): PushState {
  if (!secure) return "insecure";
  // iPhone and iPad only expose push to apps added to the Home Screen.
  if (!supported) return installState === "ios" ? "needs-install" : "unsupported";
  if (!serverReady) return "server-off";
  if (permission === "denied") return "denied";
  return subscribed && permission === "granted" ? "on" : "off";
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Decodes a base64url VAPID public key into the bytes PushManager expects. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** The server's VAPID public key, or null when the server hasn't configured push. */
export async function fetchPublicKey(): Promise<string | null> {
  const res = await fetch(`${BACKEND_URL}/api/push/public-key`);
  if (res.status === 503) return null;
  if (!res.ok) throw new Error(`Public key request failed (${res.status})`);
  const data: unknown = await res.json();
  const key = (data as { publicKey?: unknown }).publicKey;
  return typeof key === "string" && key.length > 0 ? key : null;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Asks permission (must run from a tap), subscribes this device, and registers it with the server. */
export async function enablePullAlerts(publicKey: string): Promise<"on" | "denied"> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
  const res = await postJson("/api/push/subscribe", subscription.toJSON());
  if (!res.ok) {
    await subscription.unsubscribe();
    throw new Error(`Subscribe failed (${res.status})`);
  }
  return "on";
}

export async function disablePullAlerts(subscription: PushSubscription): Promise<void> {
  await postJson("/api/push/unsubscribe", { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}

export async function sendTestAlert(subscription: PushSubscription): Promise<void> {
  const res = await postJson("/api/push/test", { endpoint: subscription.endpoint });
  if (!res.ok) throw new Error(`Test alert failed (${res.status})`);
}
