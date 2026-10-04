import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "./page";
import { useCookSession } from "../context/CookSessionContext";

// Stub every heavy child so this test isolates page.tsx's own routing
// switch (activeTab / activeSession / currentPhase / debugPhaseOverride ->
// which view renders), not the children's own rendering logic.
vi.mock("../components/Sidebar", () => ({ default: () => <div>MockSidebar</div> }));
vi.mock("../components/Header", () => ({ default: () => <div>MockHeader</div> }));
vi.mock("../components/EmptyDashboard", () => ({ default: () => <div>MockEmptyDashboard</div> }));
vi.mock("../components/HistoryView", () => ({ default: () => <div>MockHistoryView</div> }));
vi.mock("../components/SettingsView", () => ({ default: () => <div>MockSettingsView</div> }));
vi.mock("../components/Phase1Setup", () => ({ default: () => <div>MockPhase1Setup</div> }));
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
    activeTab: "probes",
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
    expect(screen.queryByText("MockSidebar")).not.toBeInTheDocument();
  });

  it("shows Phase1Setup when activeTab is 'probes'", () => {
    setSession({ token: "t", activeTab: "probes", activeSession: null, currentPhase: 1 });
    render(<Dashboard />);
    expect(screen.getByText("MockPhase1Setup")).toBeInTheDocument();
  });

  it("shows EmptyDashboard on the dashboard tab with no active session (regression: was previously hijacked by the Phase1Setup branch)", () => {
    setSession({ token: "t", activeTab: "dashboard", activeSession: null, currentPhase: 1, debugPhaseOverride: null });
    render(<Dashboard />);
    expect(screen.getByText("MockEmptyDashboard")).toBeInTheDocument();
    expect(screen.queryByText("MockPhase1Setup")).not.toBeInTheDocument();
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
    expect(screen.queryByText("MockSidebar")).not.toBeInTheDocument();
  });

  it("shows HistoryView on the history tab regardless of session/phase state", () => {
    setSession({ token: "t", activeTab: "history", activeSession: null, currentPhase: 1 });
    render(<Dashboard />);
    expect(screen.getByText("MockHistoryView")).toBeInTheDocument();
  });

  it("shows SettingsView on the settings tab regardless of session/phase state", () => {
    setSession({ token: "t", activeTab: "settings", activeSession: null, currentPhase: 1 });
    render(<Dashboard />);
    expect(screen.getByText("MockSettingsView")).toBeInTheDocument();
  });
});
