import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "./Sidebar";
import { useCookSession } from "../context/CookSessionContext";

vi.mock("../context/CookSessionContext", () => ({
  useCookSession: vi.fn(),
}));

const mockedUseCookSession = useCookSession as unknown as ReturnType<typeof vi.fn>;

function baseSession(overrides: Record<string, unknown> = {}) {
  return {
    currentPhase: 1,
    activeTab: "history",
    setActiveTab: vi.fn(),
    activeSession: null,
    handleEndCook: vi.fn(),
    ...overrides,
  };
}

describe("Sidebar", () => {
  it("shows STANDBY MODE and hides the end-cook button when there is no active session", () => {
    mockedUseCookSession.mockReturnValue(baseSession());
    render(<Sidebar />);
    expect(screen.getByText("STANDBY MODE")).toBeInTheDocument();
    expect(screen.queryByText("END ACTIVE COOK")).not.toBeInTheDocument();
  });

  it("shows the phase/status badge and end-cook button when a session is active", () => {
    mockedUseCookSession.mockReturnValue(
      baseSession({ currentPhase: 3, activeSession: { id: "s1", status: "bare" } })
    );
    render(<Sidebar />);
    expect(screen.getByText(/PHASE 3: BARE/)).toBeInTheDocument();
    expect(screen.getByText("END ACTIVE COOK")).toBeInTheDocument();
  });

  it("shows a pull-warning badge on phase 4 regardless of raw session status", () => {
    mockedUseCookSession.mockReturnValue(
      baseSession({ currentPhase: 4, activeSession: { id: "s1", status: "bare" } })
    );
    render(<Sidebar />);
    expect(screen.getByText("PULL WARNING ACTIVE")).toBeInTheDocument();
  });

  it("switches tabs when a nav item is clicked", async () => {
    const setActiveTab = vi.fn();
    mockedUseCookSession.mockReturnValue(baseSession({ setActiveTab }));
    render(<Sidebar />);

    // Desktop nav items exist alongside a duplicate mobile bottom-nav item
    // with the same label - scope to the desktop `.nav-item` element.
    const cookItems = screen.getAllByText("Cook");
    await userEvent.click(cookItems[0]);
    expect(setActiveTab).toHaveBeenCalledWith("dashboard");
  });

  it("has no separate Probes tab; setup lives under Cook", () => {
    mockedUseCookSession.mockReturnValue(baseSession({}));
    render(<Sidebar />);
    expect(screen.queryByText("Probes")).not.toBeInTheDocument();
  });

  it("calls handleEndCook when END ACTIVE COOK is clicked", async () => {
    const handleEndCook = vi.fn();
    mockedUseCookSession.mockReturnValue(
      baseSession({ activeSession: { id: "s1", status: "bare" }, handleEndCook })
    );
    render(<Sidebar />);

    await userEvent.click(screen.getByText("END ACTIVE COOK"));
    expect(handleEndCook).toHaveBeenCalledTimes(1);
  });
});
