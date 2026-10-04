"use client";

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

export default function Dashboard() {
  return (
    <CookSessionProvider>
      <DashboardContent />
    </CookSessionProvider>
  );
}
