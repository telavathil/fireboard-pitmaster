import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsView from "./SettingsView";
import { useCookSession } from "../context/CookSessionContext";

vi.mock("../context/CookSessionContext", () => ({
  useCookSession: vi.fn(),
}));

const mockedUseCookSession = useCookSession as unknown as ReturnType<typeof vi.fn>;

function baseSettings(overrides: Record<string, unknown> = {}) {
  return {
    tempUnit: "F",
    setTempUnit: vi.fn(),
    updateRate: 1,
    setUpdateRate: vi.fn(),
    estimationModel: "thermal_mass",
    setEstimationModel: vi.fn(),
    probeOffset: "0.0",
    setProbeOffset: vi.fn(),
    alarmsEnabled: true,
    setAlarmsEnabled: vi.fn(),
    ...overrides,
  };
}

describe("SettingsView", () => {
  it("calls setTempUnit with the clicked unit", async () => {
    const setTempUnit = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSettings({ setTempUnit }));
    render(<SettingsView />);

    await userEvent.click(screen.getByText("CELSIUS (°C)"));
    expect(setTempUnit).toHaveBeenCalledWith("C");
  });

  it("calls setUpdateRate with the clicked interval", async () => {
    const setUpdateRate = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSettings({ setUpdateRate }));
    render(<SettingsView />);

    await userEvent.click(screen.getByText("5 SECONDS"));
    expect(setUpdateRate).toHaveBeenCalledWith(5);
  });

  it("calls setEstimationModel when the prediction model dropdown changes", async () => {
    const setEstimationModel = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSettings({ setEstimationModel }));
    render(<SettingsView />);

    await userEvent.selectOptions(screen.getByRole("combobox"), "exponential");
    expect(setEstimationModel).toHaveBeenCalledWith("exponential");
  });

  it("toggles the audio alarm label based on alarmsEnabled", () => {
    mockedUseCookSession.mockReturnValue(baseSettings({ alarmsEnabled: false }));
    render(<SettingsView />);
    expect(screen.getByText("AUDIO ALARMS: MUTED")).toBeInTheDocument();
  });

  it("calls setAlarmsEnabled with the flipped value when the alarm button is clicked", async () => {
    const setAlarmsEnabled = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSettings({ alarmsEnabled: true, setAlarmsEnabled }));
    render(<SettingsView />);

    await userEvent.click(screen.getByText("AUDIO ALARMS: ON"));
    expect(setAlarmsEnabled).toHaveBeenCalledWith(false);
  });
});
