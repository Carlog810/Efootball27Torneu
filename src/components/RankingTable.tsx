import Link from "next/link";
import type { RankingRow } from "@/lib/rankings";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function RankingTable({ rows, t }: { rows: RankingRow[]; t: Dictionary }) {
  const h = t.rankingsPage.headers;

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
        {t.rankingsPage.empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface max-md:[-webkit-mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] max-md:[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="px-4 py-3">{h.pos}</th>
            <th className="px-4 py-3">{h.player}</th>
            <th className="px-4 py-3 text-center">{h.tournaments}</th>
            <th className="px-4 py-3 text-center">{h.played}</th>
            <th className="px-4 py-3 text-center">{h.won}</th>
            <th className="px-4 py-3 text-center">{h.drawn}</th>
            <th className="px-4 py-3 text-center">{h.lost}</th>
            <th className="px-4 py-3 text-center">{h.points}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.userId} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 text-muted">{i + 1}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/jugadores/${row.playerTag}`}
                  className="font-medium hover:text-primary"
                >
                  {row.name}
                </Link>
                <span className="ml-1 text-xs text-muted">
                  @{row.playerTag}
                </span>
              </td>
              <td className="px-4 py-3 text-center">{row.tournamentsPlayed}</td>
              <td className="px-4 py-3 text-center">{row.matchesPlayed}</td>
              <td className="px-4 py-3 text-center">{row.wins}</td>
              <td className="px-4 py-3 text-center">{row.draws}</td>
              <td className="px-4 py-3 text-center">{row.losses}</td>
              <td className="px-4 py-3 text-center font-semibold text-primary">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}