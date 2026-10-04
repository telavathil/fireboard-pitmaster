import { describe, it, expect, vi } from "vitest";
import { getInstallState, registerServiceWorker } from "./pwa";

function fakeWindow({ standalone = false, iosStandalone = false, ua = "Mozilla/5.0 (Macintosh)", touchPoints = 0 } = {}) {
  return {
    matchMedia: (q: string) => ({ matches: standalone && q === "(display-mode: standalone)" }),
    navigator: { userAgent: ua, standalone: iosStandalone, maxTouchPoints: touchPoints },
  } as unknown as Window;
}

describe("getInstallState", () => {
  it("is installed when running standalone", () => {
    expect(getInstallState(fakeWindow({ standalone: true }))).toBe("installed");
    expect(getInstallState(fakeWindow({ iosStandalone: true, ua: "iPhone" }))).toBe("installed");
  });

  it("asks iPhone and iPad users to add to the home screen", () => {
    expect(getInstallState(fakeWindow({ ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" }))).toBe("ios");
    // iPadOS reports a desktop Safari user agent but has touch.
    expect(getInstallState(fakeWindow({ ua: "Mozilla/5.0 (Macintosh)", touchPoints: 5 }))).toBe("ios");
  });

  it("falls back to the browser's own install option elsewhere", () => {
    expect(getInstallState(fakeWindow({ ua: "Mozilla/5.0 (Linux; Android 14) Chrome/130" }))).toBe("browser");
  });
});

describe("registerServiceWorker", () => {
  it("registers /sw.js at the root scope, bypassing the HTTP cache", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "/" });
    const reg = await registerServiceWorker({ serviceWorker: { register } } as unknown as Navigator);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
    expect(reg).toEqual({ scope: "/" });
  });

  it("returns null where service workers are unavailable or registration fails", async () => {
    expect(await registerServiceWorker({} as Navigator)).toBeNull();
    const register = vi.fn().mockRejectedValue(new Error("insecure context"));
    expect(await registerServiceWorker({ serviceWorker: { register } } as unknown as Navigator)).toBeNull();
  });
});
