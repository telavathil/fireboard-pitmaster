import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PullAlertsSetting from "./PullAlertsSetting";
import * as pushClient from "../pwa/pushClient";

vi.mock("../pwa/pushClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../pwa/pushClient")>();
  return {
    ...actual,
    isPushSupported: vi.fn(),
    fetchPublicKey: vi.fn(),
    getCurrentSubscription: vi.fn(),
    hasServiceWorker: vi.fn(),
    enablePullAlerts: vi.fn(),
    disablePullAlerts: vi.fn(),
    sendTestAlert: vi.fn(),
  };
});
const m = vi.mocked(pushClient);
const fakeSub = { endpoint: "https://push.example/abc" } as PushSubscription;

function env({ secure = true, supported = true, worker = true, permission = "default" as NotificationPermission, key = "BKey" as string | null, sub = null as PushSubscription | null } = {}) {
  Object.defineProperty(window, "isSecureContext", { value: secure, configurable: true });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("Notification", { permission });
  m.isPushSupported.mockReturnValue(supported);
  m.hasServiceWorker.mockResolvedValue(worker);
  m.fetchPublicKey.mockResolvedValue(key);
  m.getCurrentSubscription.mockResolvedValue(sub);
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("PullAlertsSetting", () => {
  it("offers to turn alerts on, then confirms they're on", async () => {
    env();
    m.enablePullAlerts.mockResolvedValue("on");
    render(<PullAlertsSetting />);
    const button = await screen.findByRole("button", { name: "Turn on pull alerts" });
    m.getCurrentSubscription.mockResolvedValue(fakeSub);
    await userEvent.click(button);
    expect(m.enablePullAlerts).toHaveBeenCalledWith("BKey");
    expect(await screen.findByText("Pull alerts are on for this device.")).toBeInTheDocument();
  });

  it("explains a refused permission", async () => {
    env();
    m.enablePullAlerts.mockResolvedValue("denied");
    render(<PullAlertsSetting />);
    await userEvent.click(await screen.findByRole("button", { name: "Turn on pull alerts" }));
    expect(await screen.findByText(/blocked for this site/i)).toBeInTheDocument();
  });

  it("sends a test alert and turns alerts off when subscribed", async () => {
    env({ permission: "granted", sub: fakeSub });
    m.sendTestAlert.mockResolvedValue();
    m.disablePullAlerts.mockResolvedValue();
    render(<PullAlertsSetting />);
    await userEvent.click(await screen.findByRole("button", { name: "Send a test alert" }));
    expect(m.sendTestAlert).toHaveBeenCalledWith(fakeSub);
    expect(await screen.findByText(/test alert sent/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Turn off" }));
    expect(m.disablePullAlerts).toHaveBeenCalledWith(fakeSub);
    expect(await screen.findByRole("button", { name: "Turn on pull alerts" })).toBeInTheDocument();
  });

  it("says when the app isn't on HTTPS", async () => {
    env({ secure: false });
    render(<PullAlertsSetting />);
    expect(await screen.findByText(/need the app served over HTTPS/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says when the app's service worker didn't load, rather than hanging", async () => {
    env({ worker: false });
    render(<PullAlertsSetting />);
    expect(await screen.findByText(/reload the page/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says when the server hasn't set up alerts", async () => {
    env({ key: null });
    render(<PullAlertsSetting />);
    expect(await screen.findByText(/aren't set up on the server/i)).toBeInTheDocument();
  });

  it("reports a failed enable without claiming success", async () => {
    env();
    m.enablePullAlerts.mockRejectedValue(new Error("network"));
    render(<PullAlertsSetting />);
    await userEvent.click(await screen.findByRole("button", { name: "Turn on pull alerts" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't be turned on/i);
    expect(screen.queryByText("Pull alerts are on for this device.")).not.toBeInTheDocument();
  });
});
