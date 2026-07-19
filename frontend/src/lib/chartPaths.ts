import { TelemetryPayload } from "../types";

const CHART_WIDTH = 800;
const CHART_HEIGHT = 300;

export function getSvgPathF(data: TelemetryPayload[], minValF: number, maxValF: number) {
  if (data.length === 0) return "";
  const coords = data.map((d, index) => {
    const x = (index / (data.length - 1 || 1)) * CHART_WIDTH;
    const valC = d.core_temp_filtered || 0;
    const valF = (valC * 9) / 5 + 32;
    const y = CHART_HEIGHT - ((valF - minValF) / (maxValF - minValF || 1)) * CHART_HEIGHT;
    return `${x},${y}`;
  });
  return `M ${coords.join(" L ")}`;
}

export function getSvgPathAmbientF(data: TelemetryPayload[], minValF: number, maxValF: number) {
  if (data.length === 0) return "";
  const coords = data.map((d, index) => {
    const x = (index / (data.length - 1 || 1)) * CHART_WIDTH;
    const valC = d.ambient_temp || 110.0;
    const valF = (valC * 9) / 5 + 32;
    const y = CHART_HEIGHT - ((valF - minValF) / (maxValF - minValF || 1)) * CHART_HEIGHT;
    return `${x},${y}`;
  });
  return `M ${coords.join(" L ")}`;
}
