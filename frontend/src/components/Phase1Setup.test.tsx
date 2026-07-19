import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Phase1Setup from "./Phase1Setup";
import { useCookSession } from "../context/CookSessionContext";

vi.mock("../context/CookSessionContext", () => ({
  useCookSession: vi.fn(),
}));

const mockedUseCookSession = useCookSession as unknown as ReturnType<typeof vi.fn>;

function baseSetup(overrides: Record<string, unknown> = {}) {
  return {
    targetTempF: 203,
    setTargetTempF: vi.fn(),
    meatType: "beef",
    setMeatType: vi.fn(),
    cutType: "Brisket Flat",
    setCutType: vi.fn(),
    cookerType: "kamado",
    setCookerType: vi.fn(),
    weightKg: "5.4",
    setWeightKg: vi.fn(),
    thicknessMm: "75.0",
    setThicknessMm: vi.fn(),
    deviceId: "device_sim_123",
    setDeviceId: vi.fn(),
    deviceName: "Hearth Grill",
    setDeviceName: vi.fn(),
    isCreatingSession: false,
    handleCreateSession: vi.fn((e: React.FormEvent) => e.preventDefault()),
    applyPresetF: vi.fn(),
    ...overrides,
  };
}

describe("Phase1Setup", () => {
  it("calls applyPresetF with the right meat/cut/target when a preset is clicked", async () => {
    const applyPresetF = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSetup({ applyPresetF }));
    render(<Phase1Setup />);

    await userEvent.click(screen.getByText("PORK BUTT (205°F)"));
    expect(applyPresetF).toHaveBeenCalledWith("pork", "Shoulder Butt", 205);
  });

  it("calls setMeatType when a meat-type quick-select button is clicked", async () => {
    const setMeatType = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSetup({ setMeatType }));
    render(<Phase1Setup />);

    await userEvent.click(screen.getByRole("button", { name: "poultry" }));
    expect(setMeatType).toHaveBeenCalledWith("poultry");
  });

  it("calls setCookerType when a cooker profile card is clicked", async () => {
    const setCookerType = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSetup({ setCookerType }));
    render(<Phase1Setup />);

    await userEvent.click(screen.getByText("Offset Smoker"));
    expect(setCookerType).toHaveBeenCalledWith("offset");
  });

  it("marks the currently selected cooker profile as SELECTED", () => {
    mockedUseCookSession.mockReturnValue(baseSetup({ cookerType: "pellet" }));
    render(<Phase1Setup />);
    const pelletCard = screen.getByText("Pellet Grill").closest("button");
    expect(pelletCard).toHaveTextContent("SELECTED");
    const kamadoCard = screen.getByText("Kamado").closest("button");
    expect(kamadoCard).not.toHaveTextContent("SELECTED");
  });

  it("submits the form and calls handleCreateSession", async () => {
    const handleCreateSession = vi.fn((e: React.FormEvent) => e.preventDefault());
    mockedUseCookSession.mockReturnValue(baseSetup({ handleCreateSession }));
    render(<Phase1Setup />);

    await userEvent.click(screen.getByText("INITIALIZE THERMAL MODEL"));
    expect(handleCreateSession).toHaveBeenCalledTimes(1);
  });

  it("disables the submit button while a session is being created", () => {
    mockedUseCookSession.mockReturnValue(baseSetup({ isCreatingSession: true }));
    render(<Phase1Setup />);
    expect(screen.getByText("Calibrating...")).toBeDisabled();
  });
});
