import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "./page";
import { useCookSession } from "../context/CookSessionContext";

// Stub every heavy child so this test isolates page.tsx's own routing
// switch (activeTab / activeSession / currentPhase / debugPhaseOverride ->
// which view renders), not the children's own rendering logic.
vi.mock("../components/history/HistoryScreen", () => ({ default: () => <div>MockHistoryScreen</div> }));
vi.mock("../components/settings/SettingsScreen", () => ({ default: () => <div>MockSettingsScreen</div> }));
vi.mock("../components/setup/SetupScreen", () => ({ default: () => <div>MockSetupScreen</div> }));
vi.mock("../components/live/LiveCook", () => ({ default: () => <div>MockLiveCook</div> }));

vi.mock("../context/CookSessionContext", () => ({
  CookSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useCookSession: vi.fn(),
}));

const mockedUseCookSession = useCookSession as unknown as ReturnType<typeof vi.fn>;

function setSession(overrides: Record<string, unknown>) {
  mockedUseCookSession.mockReturnValue({
    token: "mock-token",
    activeSession: null,
    activeTab: "dashboard",
    currentPhase: 1,
    debugPhaseOverride: null,
    ...overrides,
  });
}

beforeEach(() => {
  mockedUseCookSession.mockReset();
});

describe("Dashboard routing (page.tsx)", () => {
  it("shows the login panel when there is no token", () => {
    setSession({ token: null });
    render(<Dashboard />);
    expect(screen.getByText(/HEARTH COMMAND/i)).toBeInTheDocument();
  });

  it("shows the setup screen on the Cook tab when nothing is cooking", () => {
    setSession({ token: "t", activeTab: "dashboard", activeSession: null, currentPhase: 1, debugPhaseOverride: null });
    render(<Dashboard />);
    expect(screen.getByText("MockSetupScreen")).toBeInTheDocument();
  });

  it("shows the live cook screen on the dashboard tab for a debug phase override", () => {
    setSession({ token: "t", activeTab: "dashboard", activeSession: null, currentPhase: 3, debugPhaseOverride: 3 });
    render(<Dashboard />);
    expect(screen.getByText("MockLiveCook")).toBeInTheDocument();
  });

  it("shows the live cook screen, without the old shell, for an active session", () => {
    const activeSession = { id: "s1", status: "bare" };
    setSession({ token: "t", activeTab: "dashboard", activeSession, currentPhase: 4, debugPhaseOverride: null });
    render(<Dashboard />);
    expect(screen.getByText("MockLiveCook")).toBeInTheDocument();
  });

  it("shows HistoryView on the history tab regardless of session/phase state", () => {
    setSession({ token: "t", activeTab: "history", activeSession: null, currentPhase: 1 });
    render(<Dashboard />);
    expect(screen.getByText("MockHistoryScreen")).toBeInTheDocument();
  });

  it("shows SettingsView on the settings tab regardless of session/phase state", () => {
    setSession({ token: "t", activeTab: "settings", activeSession: null, currentPhase: 1 });
    render(<Dashboard />);
    expect(screen.getByText("MockSettingsScreen")).toBeInTheDocument();
  });
});
