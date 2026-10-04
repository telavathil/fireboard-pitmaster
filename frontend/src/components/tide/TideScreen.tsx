"use client";

import React from "react";
import LiveNav from "../live/LiveNav";

interface TideScreenProps {
  title: string;
  /** Extra band content, such as a status line. */
  bandExtra?: React.ReactNode;
  children: React.ReactNode;
}

/** Shell for full-viewport screens in the tide world: navigation, the yellow band, then content. */
export default function TideScreen({ title, bandExtra, children }: TideScreenProps) {
  return (
    <div className="tide-world min-h-[100dvh] md:pl-[88px]">
      <LiveNav />
      <header className="tide-band">
        <div className="mx-auto max-w-[1200px] px-5 pb-4 pt-[max(env(safe-area-inset-top),18px)] md:px-10">
          <h1 className="pt-2 text-[17px] font-semibold">{title}</h1>
        </div>
        {bandExtra}
      </header>
      {children}
    </div>
  );
}
