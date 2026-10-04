import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookSessionProvider, useCookSession } from "./CookSessionContext";
import { unsubscribeThisDevice } from "../components/pwa/pushClient";

vi.mock("../components/pwa/pushClient", () => ({ unsubscribeThisDevice: vi.fn().mockResolvedValue(undefined) }));

const session = {
  id: "s1",
  device_id: "d1",
  meat_type: "beef",
  cut_type: "Brisket flat",
  cooker_type: "kamado",
  status: "bare",
  weight_kg: 5.4,
  thickness_mm: 75,
  target_temp_c: 95,
  created_at: "2026-10-04T06:00:00Z",
};

class FakeEventSource {
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close() {}
}

function Probe() {
  const { activeSession, handleEndCook, handleLogout, isLoadingSession, sessionLoadError, retryActiveSession, token } = useCookSession();
  return (
    <div>
      <p>{activeSession ? `session:${activeSession.id}:${activeSession.status}` : "no session"}</p>
      <p>{isLoadingSession ? "loading" : "loaded"}</p>
      <p>{sessionLoadError ?? "no load error"}</p>
      <p>{token ? "signed in" : "signed out"}</p>
      <button onClick={() => handleEndCook()}>end</button>
      <button onClick={() => handleLogout()}>logout</button>
      <button onClick={() => retryActiveSession()}>retry</button>
    </div>
  );
}

function mockBackend(patchOk: boolean) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/api/sessions/active")) return new Response(JSON.stringify(session), { status: 200 });
    if (init?.method === "PATCH") {
      return patchOk ? new Response(JSON.stringify({ status: "success" }), { status: 200 }) : new Response("{}", { status: 500 });
    }
    return new Response("{}", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubGlobal("EventSource", FakeEventSource);
  localStorage.setItem("pitmaster_token", "t");
  localStorage.setItem("pitmaster_username", "demo");
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("ending a cook", () => {
  it("clears the session and does not bring it back once the save completes", async () => {
    const fetchMock = mockBackend(true);
    render(<CookSessionProvider><Probe /></CookSessionProvider>);
    await screen.findByText("session:s1:bare");

    await userEvent.click(screen.getByRole("button", { name: "end" }));

    await waitFor(() => expect(screen.getByText("no session")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/sessions/s1"), expect.objectContaining({ method: "PATCH" }));
    // Give any late state updates a chance to resurrect it.
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByText("no session")).toBeInTheDocument();
  });

  it("keeps the cook running if the backend didn't save the end", async () => {
    mockBackend(false);
    render(<CookSessionProvider><Probe /></CookSessionProvider>);
    await screen.findByText("session:s1:bare");

    await userEvent.click(screen.getByRole("button", { name: "end" }));
    await new Promise((r) => setTimeout(r, 20));

    expect(screen.getByText("session:s1:bare")).toBeInTheDocument();
  });
});

describe("loading the active cook", () => {
  it("reports an unreachable backend instead of implying no cook is running, and retries", async () => {
    let up = false;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (!up) throw new TypeError("Failed to fetch");
      if (url.endsWith("/api/sessions/active")) return new Response(JSON.stringify(session), { status: 200 });
      return new Response("{}", { status: 404 });
    }));
    render(<CookSessionProvider><Probe /></CookSessionProvider>);
    expect(await screen.findByText(/couldn't reach the server/i)).toBeInTheDocument();
    expect(screen.getByText("loaded")).toBeInTheDocument();

    up = true;
    await userEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(await screen.findByText("session:s1:bare")).toBeInTheDocument();
    expect(screen.getByText("no load error")).toBeInTheDocument();
  });
});

describe("signing out", () => {
  it("unsubscribes this device from pull alerts", async () => {
    mockBackend(true);
    render(<CookSessionProvider><Probe /></CookSessionProvider>);
    await screen.findByText("session:s1:bare");
    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(unsubscribeThisDevice).toHaveBeenCalled();
  });
});
