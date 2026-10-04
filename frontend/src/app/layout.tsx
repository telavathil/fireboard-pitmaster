import type { Metadata, Viewport } from "next";
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
  applicationName: "FireBoard Pitmaster",
  appleWebApp: { capable: true, title: "Pitmaster", statusBarStyle: "default" },
};

// The band colour by day and by night; viewport-fit=cover lets the band run under the notch
// (screens already pad with env(safe-area-inset-*)).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2c230" },
    { media: "(prefers-color-scheme: dark)", color: "#1d2a44" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
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
