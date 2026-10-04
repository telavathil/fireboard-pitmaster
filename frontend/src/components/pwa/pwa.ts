export type InstallState = "installed" | "ios" | "browser";

/** Whether the app runs installed, and if not, which install route the device offers. */
export function getInstallState(win: Window): InstallState {
  const nav = win.navigator as Navigator & { standalone?: boolean };
  const standalone = typeof win.matchMedia === "function" && win.matchMedia("(display-mode: standalone)").matches;
  if (standalone || nav.standalone === true) return "installed";
  // iPadOS reports a desktop Safari user agent, so touch support identifies it.
  const isIos = /iPhone|iPad|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1);
  return isIos ? "ios" : "browser";
}

/**
 * Registers the service worker (required for installation and push).
 * Resolves null where service workers are unavailable, e.g. an insecure origin.
 */
export async function registerServiceWorker(nav: Navigator = navigator): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in nav)) return null;
  try {
    return await nav.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch {
    return null;
  }
}
