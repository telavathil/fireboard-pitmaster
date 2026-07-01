import React from "react";

interface ForgeCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerExtra?: React.ReactNode;
  hasHighlight?: boolean;
  highlightColor?: string; // e.g. "bg-primary" or "bg-error"
  grow?: boolean;
  centered?: boolean;
  compactPadding?: boolean;
  layout?: "column-between" | "column-stretch" | "default";
  minHeight?: "short" | "medium" | "tall"; // short: 220px, medium: 260px, tall: 300px
  children?: React.ReactNode;
}

export default function ForgeCard({
  title,
  subtitle,
  headerExtra,
  hasHighlight = false,
  highlightColor = "bg-primary",
  grow = false,
  centered = false,
  compactPadding = false,
  layout = "default",
  minHeight,
  children,
}: ForgeCardProps) {
  const showHeader = title || subtitle || headerExtra;

  // Derive styling classes purely from layout properties
  const cardClasses = [
    "forge-surface relative overflow-hidden group",
    compactPadding ? "p-4" : "p-md",
    grow ? "flex-grow" : "",
    centered ? "flex flex-col items-center justify-center text-center" : "",
    !centered && layout === "column-between" ? "flex flex-col justify-between" : "",
    !centered && layout === "column-stretch" ? "flex flex-col" : "",
    minHeight === "short" ? "min-h-[220px]" : "",
    minHeight === "medium" ? "min-h-[260px]" : "",
    minHeight === "tall" ? "min-h-[300px]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cardClasses}>
      {hasHighlight && (
        <div
          className={`absolute top-0 left-0 w-1 h-full ${highlightColor} shadow-[2px_0_10px_rgba(255,87,26,0.5)]`}
        />
      )}
      
      {showHeader && (
        <div className="flex justify-between items-start mb-sm">
          <div>
            {title && (typeof title === "string" ? (
              <h3 className="font-headline-md text-on-surface uppercase">{title}</h3>
            ) : (
              title
            ))}
            {subtitle && (typeof subtitle === "string" ? (
              <p className="font-label-mono text-xs text-on-surface-variant uppercase mt-1">{subtitle}</p>
            ) : (
              subtitle
            ))}
          </div>
          {headerExtra && <div className="flex-shrink-0">{headerExtra}</div>}
        </div>
      )}
      
      {children}
    </section>
  );
}
