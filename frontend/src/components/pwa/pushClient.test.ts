import { describe, it, expect } from "vitest";
import { derivePushState, urlBase64ToUint8Array } from "./pushClient";

describe("urlBase64ToUint8Array", () => {
  it("decodes an unpadded base64url VAPID key", () => {
    // "hello?" in base64url is "aGVsbG8_" — exercises the '_' substitution and padding.
    expect(Array.from(urlBase64ToUint8Array("aGVsbG8_"))).toEqual([104, 101, 108, 108, 111, 63]);
  });
});

describe("derivePushState", () => {
  const ready = { supported: true, secure: true, installState: "browser" as const, serverReady: true, permission: "default" as NotificationPermission, subscribed: false };

  it("is off when everything is available but not yet enabled", () => {
    expect(derivePushState(ready)).toBe("off");
  });

  it("is on when this device is subscribed and permitted", () => {
    expect(derivePushState({ ...ready, permission: "granted", subscribed: true })).toBe("on");
  });

  it("needs HTTPS before anything else", () => {
    expect(derivePushState({ ...ready, secure: false })).toBe("insecure");
  });

  it("asks iPhone users to install first", () => {
    expect(derivePushState({ ...ready, supported: false, installState: "ios" })).toBe("needs-install");
  });

  it("reports browsers without push support", () => {
    expect(derivePushState({ ...ready, supported: false })).toBe("unsupported");
  });

  it("reports when the server isn't configured", () => {
    expect(derivePushState({ ...ready, serverReady: false })).toBe("server-off");
  });

  it("reports blocked notifications", () => {
    expect(derivePushState({ ...ready, permission: "denied" })).toBe("denied");
  });
});
