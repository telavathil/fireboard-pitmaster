import React from "react";

interface ForgeStatProps {
  icon: string; // name of Material Symbol
  iconColor?: "primary" | "secondary" | "outline" | "error";
  label: string;
  value: React.ReactNode;
  statusText?: string;
  statusColor?: "stable" | "decreasing" | "high" | "optimal" | "error" | "default";
  interactive?: boolean;
  onClick?: () => void;
}

export default function ForgeStat({
  icon,
  iconColor = "outline",
  label,
  value,
  statusText,
  statusColor = "default",
  interactive = false,
  onClick,
}: ForgeStatProps) {
  const iconColorClass = {
    primary: "text-primary",
    secondary: "text-secondary-fixed",
    outline: "text-outline",
    error: "text-error",
  }[iconColor];

  const statusColorClass = {
    stable: "text-secondary-fixed font-bold",
    decreasing: "text-outline",
    high: "text-secondary-fixed font-bold",
    optimal: "text-outline font-bold",
    error: "text-error font-bold",
    default: "text-on-surface-variant",
  }[statusColor];

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`forge-surface p-4 flex gap-4 items-center ${
        interactive
          ? "cursor-pointer hover:border-primary group transition-colors"
          : ""
      }`}
    >
      <span className={`material-symbols-outlined text-3xl ${iconColorClass} ${interactive ? "group-hover:text-primary" : ""}`}>
        {icon}
      </span>
      <div>
        <p className={`font-label-mono text-[9px] uppercase ${interactive ? "group-hover:text-primary text-on-surface-variant" : "text-on-surface-variant"}`}>
          {label}
        </p>
        <p className={`font-headline-md text-xl ${interactive ? "group-hover:text-primary" : ""}`}>
          {value}
          {statusText && (
            <span className={`text-xs font-label-mono ml-2 uppercase ${statusColorClass}`}>
              {statusText}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
