import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyDashboard from "./EmptyDashboard";
import { useCookSession } from "../context/CookSessionContext";

vi.mock("../context/CookSessionContext", () => ({
  useCookSession: vi.fn(),
}));

const mockedUseCookSession = useCookSession as unknown as ReturnType<typeof vi.fn>;

describe("EmptyDashboard", () => {
  it("renders the idle state copy and a properly sized card", () => {
    const setActiveTab = vi.fn();
    mockedUseCookSession.mockReturnValue({ setActiveTab });
    render(<EmptyDashboard />);

    expect(screen.getByText("PITMASTER DASHBOARD IDLE")).toBeInTheDocument();
    expect(screen.getByText("NO ACTIVE COOK SESSION DETECTED")).toBeInTheDocument();

    // Regression guard for the max-w-md/spacing-scale collision bug: this
    // card must use an explicit width, not a bare `max-w-*` keyword class
    // that silently resolves against the custom --spacing-* theme scale.
    const card = screen.getByText("PITMASTER DASHBOARD IDLE").closest("div.glass-card");
    expect(card?.className).toMatch(/max-w-\[/);
    expect(card?.className).not.toMatch(/\bmax-w-(xs|sm|md|lg|xl|2xl)\b/);
  });

  it("navigates to the probes tab when 'GO TO PROBES SETUP' is clicked", async () => {
    const setActiveTab = vi.fn();
    mockedUseCookSession.mockReturnValue({ setActiveTab });
    render(<EmptyDashboard />);

    await userEvent.click(screen.getByText("GO TO PROBES SETUP"));
    expect(setActiveTab).toHaveBeenCalledWith("probes");
  });
});
