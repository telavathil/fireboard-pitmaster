import React from "react";

interface ForgeRadialGaugeProps {
  value: number; // percentage (0-100) or elapsed ratio
  label: string;
  centerText: React.ReactNode;
  statusBadge?: string;
  animation?: "pulse" | "heat" | "none";
}

export default function ForgeRadialGauge({
  value,
  label,
  centerText,
  statusBadge,
  animation = "none",
}: ForgeRadialGaugeProps) {
  // Normalize value between 0 and 100
  const pct = Math.min(Math.max(value, 0), 100);
  const strokeOffset = 2 * Math.PI * 64 * (1 - pct / 100);

  return (
    <div className="relative w-36 h-36 flex items-center justify-center mt-4">
      {animation === "pulse" && (
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full pulsing-ring" />
      )}
      {animation === "heat" && (
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-heat" />
      )}
      
      <svg className="w-full h-full -rotate-90">
        <circle
          className="text-white/5"
          cx="72"
          cy="72"
          fill="transparent"
          r="64"
          stroke="currentColor"
          strokeWidth="6"
        />
        <circle
          className="text-primary"
          cx="72"
          cy="72"
          fill="transparent"
          r="64"
          stroke="currentColor"
          strokeDasharray={2 * Math.PI * 64}
          strokeDashoffset={strokeOffset}
          strokeWidth="6"
        />
      </svg>
      
      <div className="absolute flex flex-col items-center text-center px-2">
        <span className="font-label-mono text-[9px] text-on-surface-variant uppercase">{label}</span>
        <span className={`font-display-lg ${
          typeof centerText === "string" && centerText.length > 5 ? "text-xl" : "text-3xl"
        } font-bold tracking-wider`}>
          {centerText}
        </span>
        {statusBadge && (
          <span className="font-label-mono text-[8px] text-secondary-fixed mt-1 px-1.5 py-0.5 border border-secondary-fixed/30 bg-secondary-fixed/5 uppercase font-bold">
            {statusBadge}
          </span>
        )}
      </div>
    </div>
  );
}
