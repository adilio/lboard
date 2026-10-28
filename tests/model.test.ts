import { describe, it, expect } from "vitest";
import {
  areas,
  toyIds,
  validatePreferences,
  mixColors,
  traceTrack,
} from "../src/model";
describe("initial release inventory", () => {
  it("offers two distinct activities in each of ten areas", () => {
    expect(areas).toHaveLength(10);
    expect(toyIds).toHaveLength(20);
    expect(new Set(toyIds).size).toBe(20);
    for (const area of areas) expect(area.toys).toHaveLength(2);
  });
});
describe("preferences", () => {
  it("recovers from missing and malformed data", () => {
    for (const p of [
      null,
      undefined,
      "oops",
      [],
      { soundEnabled: "yes", enabledActivityIds: ["unknown"] },
    ]) {
      const v = validatePreferences(p);
      expect(v.soundEnabled).toBe(true);
      expect(v.enabledActivityIds.length).toBeGreaterThan(0);
    }
  });
  it("clamps levels and rejects nonfinite numbers", () => {
    expect(
      validatePreferences({ effectsVolume: 7, musicVolume: -3 }),
    ).toMatchObject({ effectsVolume: 1, musicVolume: 0 });
    expect(validatePreferences({ effectsVolume: NaN })).toHaveProperty(
      "effectsVolume",
      0.6,
    );
  });
  it("retains only recognized activity choices", () => {
    expect(
      validatePreferences({
        enabledActivityIds: ["Switchboard", "unknown", "Switchboard"],
        calmMode: true,
      }),
    ).toMatchObject({ enabledActivityIds: ["Switchboard"], calmMode: true });
  });
});
describe("paint mixing", () => {
  it.each([
    ["red", "yellow", "orange"],
    ["yellow", "blue", "green"],
    ["blue", "red", "purple"],
    ["red", "red", "red"],
  ])("mixes %s and %s as %s", (a, b, result) => {
    expect(mixColors(a, b)).toBe(result);
    expect(mixColors(b, a)).toBe(result);
  });
});
describe("track connectivity", () => {
  it("follows only connected endpoints", () => {
    expect(
      traceTrack([
        { kind: "straight", rotation: 1 },
        { kind: "straight", rotation: 1 },
        { kind: "curve", rotation: 2 },
        null,
        null,
        { kind: "straight", rotation: 0 },
      ]),
    ).toEqual([0, 1, 2, 5]);
  });
  it("rests before an unconnected piece", () => {
    expect(
      traceTrack([
        { kind: "straight", rotation: 1 },
        { kind: "straight", rotation: 0 },
        null,
        null,
        null,
        null,
      ]),
    ).toEqual([0]);
    expect(traceTrack(Array(6).fill(null))).toEqual([]);
  });
});
