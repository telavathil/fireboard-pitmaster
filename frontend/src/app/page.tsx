"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CookSessionProvider, useCookSession } from "../context/CookSessionContext";
import HistoryScreen from "../components/history/HistoryScreen";
import SettingsScreen from "../components/settings/SettingsScreen";
import SetupScreen from "../components/setup/SetupScreen";
import LiveCook from "../components/live/LiveCook";
import LoginScreen from "../components/login/LoginScreen";
import StatusScreen from "../components/tide/StatusScreen";
import { registerServiceWorker } from "../components/pwa/pwa";

function DashboardContent() {
  const { token, activeSession, activeTab, isLoadingSession, sessionLoadError, retryActiveSession } = useCookSession();

  if (!token) return <LoginScreen />;
  // Never show the setup form until we know no cook is running: it could start a duplicate.
  if (isLoadingSession) return <StatusScreen message="Checking for a running cook…" />;
  if (sessionLoadError && !activeSession) {
    return <StatusScreen message={sessionLoadError} action={{ label: "Try again", onClick: retryActiveSession }} />;
  }

  // Every signed-in screen owns its whole viewport (its own band and navigation).
  if (activeTab === "history") return <HistoryScreen />;
  if (activeTab === "settings") return <SettingsScreen />;
  // ?phase=N only restyles a running cook for review; without one, the Cook tab is setup.
  return activeSession ? <LiveCook /> : <SetupScreen />;
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
  // The service worker makes the app installable and will deliver pull alerts.
  useEffect(() => {
    void registerServiceWorker();
  }, []);
  if (!isClient) return null;
  return (
    <CookSessionProvider>
      <DashboardContent />
    </CookSessionProvider>
  );
}
