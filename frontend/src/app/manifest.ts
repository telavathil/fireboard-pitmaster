import type { MetadataRoute } from "next";

/** Installable app manifest. Colours come from the tide world: table-stock ground, almanac-yellow band. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FireBoard Pitmaster",
    short_name: "Pitmaster",
    description: "Predictive cook times and pull alerts from your FireBoard probes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f6f2",
    theme_color: "#f2c230",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
