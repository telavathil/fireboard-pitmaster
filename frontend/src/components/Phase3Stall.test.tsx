import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Phase3Stall from "./Phase3Stall";
import { useCookSession } from "../context/CookSessionContext";

vi.mock("../context/CookSessionContext", () => ({
  useCookSession: vi.fn(),
}));

const mockedUseCookSession = useCookSession as unknown as ReturnType<typeof vi.fn>;

function baseSession(overrides: Record<string, unknown> = {}) {
  return {
    coreTempF: 165,
    moistureBudget: 85,
    spritzCount: 0,
    handleSpritz: vi.fn(),
    activeSession: { id: "abcd1234", cut_type: "Brisket Flat" },
    history: [],
    getSvgPathF: () => "",
    getSvgPathAmbientF: () => "",
    minTempF: 40,
    maxTempF: 250,
    ...overrides,
  };
}

describe("Phase3Stall", () => {
  it("renders the current spritz count", () => {
    mockedUseCookSession.mockReturnValue(baseSession({ spritzCount: 2 }));
    render(<Phase3Stall />);
    expect(screen.getByText("2 TIMES")).toBeInTheDocument();
  });

  it("calls handleSpritz when FORCE BREAKOUT (SPRITZ) is clicked", async () => {
    const handleSpritz = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSession({ handleSpritz }));
    render(<Phase3Stall />);

    await userEvent.click(screen.getByText("FORCE BREAKOUT (SPRITZ)"));
    expect(handleSpritz).toHaveBeenCalledTimes(1);
  });
});
