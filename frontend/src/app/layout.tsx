import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// The one face of the Cook's Tide Table world: a grotesk with a width axis and tabular figures.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "FireBoard Pitmaster",
  description: "Predictive cook times and pull alerts from your FireBoard probes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="tide-world min-h-full">{children}</body>
    </html>
  );
}
