import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupScreen from "./SetupScreen";
import { useCookSession } from "../../context/CookSessionContext";

vi.mock("../../context/CookSessionContext", () => ({ useCookSession: vi.fn() }));
const mocked = useCookSession as unknown as ReturnType<typeof vi.fn>;

function setup(overrides: Record<string, unknown> = {}) {
  const ctx = {
    activeSession: null,
    tempUnit: "F",
    setTempUnit: vi.fn(),
    startCook: vi.fn().mockResolvedValue(true),
    isCreatingSession: false,
    sessionError: null,
    activeTab: "dashboard",
    setActiveTab: vi.fn(),
    ...overrides,
  };
  mocked.mockReturnValue(ctx);
  render(<SetupScreen />);
  return ctx;
}

// Desktop and the narrow-screen start bar each render a submit button; CSS shows one at a time.
const startButton = () => screen.getAllByRole("button", { name: "Start cook" })[0];

beforeEach(() => {
  mocked.mockReset();
  localStorage.clear();
});

describe("SetupScreen", () => {
  it("starts a cook with a metric payload, whatever units were entered", async () => {
    const ctx = setup();
    await userEvent.click(screen.getByRole("radio", { name: "lb" }));
    const weight = screen.getByLabelText("Weight");
    expect(weight).toHaveValue("11.9");
    await userEvent.clear(weight);
    await userEvent.type(weight, "12");
    await userEvent.click(startButton());
    expect(ctx.startCook).toHaveBeenCalledWith(expect.objectContaining({ weight_kg: 5.44, target_temp_c: 95, status: "bare" }));
  });

  it("applies a preset to protein, cut and target", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /Pork butt/ }));
    expect(screen.getByLabelText("Cut")).toHaveValue("Pork butt");
    expect(screen.getByRole("radio", { name: "Pork" })).toBeChecked();
    expect(screen.getByLabelText("Target temperature")).toHaveTextContent("205°");
  });

  it("steps the target one degree at a time", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Raise target by one degree" }));
    expect(screen.getByLabelText("Target temperature")).toHaveTextContent("204°");
  });

  it("explains invalid fields instead of submitting", async () => {
    const ctx = setup();
    await userEvent.clear(screen.getByLabelText("Cut"));
    await userEvent.click(startButton());
    expect(screen.getByText(/name the cut/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Cut")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Cut")).toHaveFocus();
    expect(ctx.startCook).not.toHaveBeenCalled();
  });

  it("remembers the last cook's setup after a successful start", async () => {
    setup();
    await userEvent.clear(screen.getByLabelText("Cut"));
    await userEvent.type(screen.getByLabelText("Cut"), "Beef ribs");
    await userEvent.click(startButton());
    expect(JSON.parse(localStorage.getItem("pitmaster_last_setup")!).cutType).toBe("Beef ribs");
  });

  it("shows the server's reason when a cook can't start", () => {
    setup({ sessionError: "Device not found." });
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Device not found.");
  });
});
