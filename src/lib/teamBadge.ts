// Fixed palette spanning the app's existing accent-color brightness family
// (--primary, --info, --accent, --danger from globals.css, plus 4 more in
// the same family) so a generated badge always reads clearly against the
// dark theme, regardless of which team name picks it.
const PALETTE = [
  "#22c55e",
  "#38bdf8",
  "#f59e0b",
  "#ef4444",
  "#a78bfa",
  "#f472b6",
  "#2dd4bf",
  "#fb923c",
];

/** Deterministic per-name color for a generated team badge. */
export function pickTeamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % PALETTE.length;
  }
  return PALETTE[hash];
}

export function initialsFor(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}
