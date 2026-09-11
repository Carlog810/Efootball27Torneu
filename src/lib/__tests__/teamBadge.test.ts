import { describe, expect, it } from "vitest";
import { pickTeamColor, initialsFor } from "../teamBadge";

describe("pickTeamColor", () => {
  it("is deterministic for the same name", () => {
    expect(pickTeamColor("Dragones Rojos")).toBe(pickTeamColor("Dragones Rojos"));
  });

  it("returns a valid hex color", () => {
    expect(pickTeamColor("Águilas del Norte")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("can pick different colors for different names", () => {
    const names = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
    const colors = new Set(names.map(pickTeamColor));
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("initialsFor", () => {
  it("uppercases the first two characters", () => {
    expect(initialsFor("dragones rojos")).toBe("DR");
  });

  it("handles short names", () => {
    expect(initialsFor("x")).toBe("X");
  });
});
