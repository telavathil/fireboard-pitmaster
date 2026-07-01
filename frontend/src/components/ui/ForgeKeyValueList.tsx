import React from "react";

interface KeyValueItem {
  label: string;
  value: React.ReactNode;
  valueColor?: "primary" | "secondary" | "green" | "default";
}

interface ForgeKeyValueListProps {
  items: KeyValueItem[];
  compact?: boolean;
}

export default function ForgeKeyValueList({
  items,
  compact = false,
}: ForgeKeyValueListProps) {
  const valueColorClasses = {
    primary: "text-primary font-bold",
    secondary: "text-secondary-fixed font-bold",
    green: "text-green-500 font-bold",
    default: "text-on-surface font-bold",
  };

  return (
    <div className={`space-y-sm text-xs font-label-mono uppercase ${compact ? "mt-1" : "mt-4"}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <span className="text-outline">{item.label}</span>
          <span className={item.valueColor ? valueColorClasses[item.valueColor] : valueColorClasses.default}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
