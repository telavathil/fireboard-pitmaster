import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookSessionProvider, useCookSession } from "./CookSessionContext";

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
  const { activeSession, handleEndCook } = useCookSession();
  return (
    <div>
      <p>{activeSession ? `session:${activeSession.id}:${activeSession.status}` : "no session"}</p>
      <button onClick={() => handleEndCook()}>end</button>
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
