import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LiveCook from "./LiveCook";
import { useCookSession } from "../../context/CookSessionContext";
import { TelemetryPayload } from "../../types";

vi.mock("../../context/CookSessionContext", () => ({ useCookSession: vi.fn() }));
const mocked = useCookSession as unknown as ReturnType<typeof vi.fn>;

const session = {
  id: "s1",
  device_id: "d1",
  meat_type: "beef",
  cut_type: "Brisket Flat",
  cooker_type: "kamado",
  status: "bare",
  weight_kg: 5.4,
  thickness_mm: 75,
  target_temp_c: 95,
  created_at: "2026-10-04T06:00:00",
};

function reading(overrides: Partial<TelemetryPayload> = {}): TelemetryPayload {
  return {
    channel: 1,
    core_temp_raw: 75.6,
    core_temp_filtered: 75.6,
    ambient_temp: 107.8,
    heating_rate: 0.25,
    stall_detected: false,
    eta_seconds: 3 * 3600,
    carryover_rise: 4.4,
    confidence: "high",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function setup(overrides: Record<string, unknown> = {}) {
  const ctx = {
    activeSession: session,
    telemetry: reading(),
    history: [reading()],
    isConnected: true,
    stage: "cooking",
    carryoverC: 4.4,
    restStartedAt: null,
    peakRestTempC: null,
    tempUnit: "F",
    alarmsEnabled: false,
    handleUpdateStatus: vi.fn().mockResolvedValue(true),
    handleEndCook: vi.fn().mockResolvedValue(true),
    activeTab: "dashboard",
    setActiveTab: vi.fn(),
    ...overrides,
  };
  mocked.mockReturnValue(ctx);
  render(<LiveCook />);
  return ctx;
}

beforeEach(() => mocked.mockReset());

describe("LiveCook", () => {
  it("leads with core temperature against the pull temperature", () => {
    setup();
    const readout = within(screen.getByRole("region", { name: "Core temperature" }));
    expect(readout.getByText("168°")).toBeInTheDocument();
    expect(readout.getByText("→ 195° pull")).toBeInTheDocument();
    expect(screen.getByText("Brisket Flat · 5.4 kg · Kamado")).toBeInTheDocument();
  });

  it("takes over with the pull alarm and logs the pull", async () => {
    const ctx = setup({ stage: "pull", telemetry: reading({ core_temp_filtered: 90.8 }) });
    expect(screen.getByRole("alert")).toHaveTextContent("Pull now");
    await userEvent.click(screen.getByRole("button", { name: "I pulled it, start rest" }));
    expect(ctx.handleUpdateStatus).toHaveBeenCalledWith("resting");
  });

  it("says so when the pull couldn't be saved", async () => {
    setup({ stage: "pull", telemetry: reading({ core_temp_filtered: 90.8 }), handleUpdateStatus: vi.fn().mockResolvedValue(false) });
    await userEvent.click(screen.getByRole("button", { name: "I pulled it, start rest" }));
    expect(await screen.findByText(/couldn't save the pull/i)).toBeInTheDocument();
  });

  it("only ends the cook after confirmation", async () => {
    const ctx = setup();
    await userEvent.click(screen.getByRole("button", { name: "Cook options" }));
    await userEvent.click(screen.getByRole("menuitem", { name: /End cook/ }));
    expect(ctx.handleEndCook).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "End cook", hidden: true }));
    expect(ctx.handleEndCook).toHaveBeenCalledTimes(1);
  });

  it("keeps the dialog open and says so when ending fails", async () => {
    setup({ handleEndCook: vi.fn().mockResolvedValue(false) });
    await userEvent.click(screen.getByRole("button", { name: "Cook options" }));
    await userEvent.click(screen.getByRole("menuitem", { name: /End cook/ }));
    await userEvent.click(screen.getByRole("button", { name: "End cook", hidden: true }));
    expect(await screen.findByText(/couldn't be ended/i)).toBeInTheDocument();
  });

  it("never shows an invented temperature without readings", () => {
    setup({ telemetry: null, history: [], stage: "stabilizing" });
    expect(screen.getByText("--°")).toBeInTheDocument();
    expect(screen.getByText("No readings yet")).toBeInTheDocument();
  });

  it("says so when the connection drops", () => {
    setup({ isConnected: false });
    expect(screen.getByRole("status")).toHaveTextContent(/connection lost/i);
  });
});
