import { describe, it, expect } from "vitest";
import {
  areas,
  calmIds,
  toyArt,
  toyIds,
  validatePreferences,
  mixPaint,
  nameColour,
  cleanName,
} from "../src/model";
import { activities } from "../src/activities";
describe("Release 1 catalogue", () => {
  it("has 21 distinct activities across ten areas, each with art and a component", () => {
    expect(areas).toHaveLength(10);
    expect(toyIds).toHaveLength(21);
    expect(new Set(toyIds).size).toBe(21);
    for (const id of toyIds) {
      expect(toyArt[id]).toBeTruthy();
      expect(activities[id]).toBeTruthy();
    }
    for (const area of areas) expect(area.toys.length).toBeGreaterThan(0);
  });
  it("keeps calm mode within the catalogue", () => {
    for (const id of calmIds) expect(toyIds).toContain(id);
  });
});
describe("preferences", () => {
  it("recovers from missing and malformed data", () => {
    for (const p of [
      null,
      undefined,
      "oops",
      [],
      { soundEnabled: "yes", enabledActivityIds: ["unknown"], voice: "loud" },
    ]) {
      const v = validatePreferences(p);
      expect(v.soundEnabled).toBe(true);
      expect(v.enabledActivityIds.length).toBeGreaterThan(0);
      expect(v.voice).toBe("on");
      expect(v.childName).toBe("Layla");
    }
  });
  it("clamps volumes and keeps valid choices", () => {
    const v = validatePreferences({
      effectsVolume: 4,
      musicVolume: -1,
      reducedMotion: true,
      enabledActivityIds: ["Stamp Pad", "nope"],
      voice: "names",
      childName: "Mia!!",
      familyNames: ["Dad", 4, "Grandma Jo", ""],
    });
    expect(v.effectsVolume).toBe(1);
    expect(v.musicVolume).toBe(0);
    expect(v.reducedMotion).toBe(true);
    expect(v.enabledActivityIds).toEqual(["Stamp Pad"]);
    expect(v.voice).toBe("names");
    expect(v.childName).toBe("Mia");
    expect(v.familyNames).toEqual(["Dad", "GrandmaJo"]);
  });
  it("cleans names to letters only", () => {
    expect(cleanName("Lay la1")).toBe("Layla");
    expect(cleanName(7)).toBe("");
  });
});
describe("paint mixing (RYB, spec §9.6)", () => {
  const name = (...p: Parameters<typeof mixPaint>[0]) =>
    nameColour(mixPaint(p)!).name;
  it("mixes like preschool paint", () => {
    expect(name("r", "y")).toBe("orange");
    expect(name("y", "b")).toBe("green");
    expect(name("r", "b")).toBe("purple");
    expect(name("r")).toBe("red");
    expect(name("y")).toBe("yellow");
    expect(name("b")).toBe("blue");
  });
  it("tints and shades with white and black", () => {
    expect(name("r", "w", "w")).toBe("pink");
    expect(name("w")).toBe("white");
    expect(name("k")).toBe("black");
  });
  it("returns nothing for an empty bowl", () => {
    expect(mixPaint([])).toBeNull();
  });
});
