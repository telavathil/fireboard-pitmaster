export function formatEta(seconds: number) {
  if (seconds === null || seconds === undefined || seconds < 0) return "CALCULATING";
  if (seconds === 0) return "DONE";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatStopwatch(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getMeatLabel(meat: string) {
  if (!meat) return "";
  return meat.charAt(0).toUpperCase() + meat.slice(1).toLowerCase();
}
