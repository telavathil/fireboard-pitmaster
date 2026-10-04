import { describe, it, expect } from "vitest";
import manifest from "./manifest";

describe("web app manifest", () => {
  const m = manifest();

  it("names the product and opens standalone at the app root", () => {
    expect(m.name).toBe("FireBoard Pitmaster");
    expect(m.short_name).toBe("Pitmaster");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });

  it("uses the tide world's ground and band colours", () => {
    expect(m.background_color).toBe("#f5f6f2");
    expect(m.theme_color).toBe("#f2c230");
  });

  it("ships install icons, including a maskable one", () => {
    const icons = m.icons ?? [];
    expect(icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
    icons.forEach((i) => expect(i.src).toMatch(/^\/icons\/.+\.png$/));
  });
});
