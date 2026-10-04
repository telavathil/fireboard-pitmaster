import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsScreen from "./SettingsScreen";
import { useCookSession } from "../../context/CookSessionContext";

vi.mock("../../context/CookSessionContext", () => ({ useCookSession: vi.fn() }));
const mocked = useCookSession as unknown as ReturnType<typeof vi.fn>;

function setup(overrides: Record<string, unknown> = {}) {
  const ctx = {
    tempUnit: "F",
    setTempUnit: vi.fn(),
    alarmsEnabled: true,
    setAlarmsEnabled: vi.fn(),
    username: "tobin",
    activeSession: null,
    handleLogout: vi.fn(),
    activeTab: "settings",
    setActiveTab: vi.fn(),
    ...overrides,
  };
  mocked.mockReturnValue(ctx);
  render(<SettingsScreen />);
  return ctx;
}

function stubDisplayMode(standalone: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: standalone && q === "(display-mode: standalone)" }));
}

beforeEach(() => mocked.mockReset());
afterEach(() => vi.unstubAllGlobals());

describe("SettingsScreen", () => {
  it("changes the temperature unit and alarm sound", async () => {
    stubDisplayMode(false);
    const ctx = setup();
    await userEvent.click(screen.getByRole("radio", { name: "Celsius (°C)" }));
    expect(ctx.setTempUnit).toHaveBeenCalledWith("C");
    await userEvent.click(screen.getByRole("radio", { name: "Off" }));
    expect(ctx.setAlarmsEnabled).toHaveBeenCalledWith(false);
  });

  it("signs out", async () => {
    stubDisplayMode(false);
    const ctx = setup();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(ctx.handleLogout).toHaveBeenCalled();
  });

  it("says when the app is installed", () => {
    stubDisplayMode(true);
    setup();
    expect(screen.getByText("Installed on this device.")).toBeInTheDocument();
  });

  it("explains how to install when it isn't", () => {
    stubDisplayMode(false);
    setup();
    expect(screen.getByText(/install/i, { selector: "p" })).toBeInTheDocument();
  });

  it("doesn't break where display-mode can't be queried", () => {
    vi.stubGlobal("matchMedia", undefined);
    setup();
    expect(screen.getByRole("heading", { name: "App" })).toBeInTheDocument();
  });
});
