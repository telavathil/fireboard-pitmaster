"use client";

import { useSyncExternalStore } from "react";
import { CookSessionProvider, useCookSession } from "../context/CookSessionContext";
import HistoryScreen from "../components/history/HistoryScreen";
import SettingsScreen from "../components/settings/SettingsScreen";
import SetupScreen from "../components/setup/SetupScreen";
import LiveCook from "../components/live/LiveCook";
import LoginScreen from "../components/login/LoginScreen";

function DashboardContent() {
  const { token, activeSession, activeTab, debugPhaseOverride } = useCookSession();

  if (!token) return <LoginScreen />;

  // Every signed-in screen owns its whole viewport (its own band and navigation).
  if (activeTab === "history") return <HistoryScreen />;
  if (activeTab === "settings") return <SettingsScreen />;
  return activeSession || debugPhaseOverride !== null ? <LiveCook /> : <SetupScreen />;
}

const noopSubscribe = () => () => {};

/** True once running in the browser; false during server rendering and hydration. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function Dashboard() {
  // The app reads its saved sign-in and preferences from localStorage, so it
  // mounts client-side only; the server renders the ground colour alone.
  const isClient = useIsClient();
  if (!isClient) return null;
  return (
    <CookSessionProvider>
      <DashboardContent />
    </CookSessionProvider>
  );
}
