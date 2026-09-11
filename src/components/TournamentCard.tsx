import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TournamentStatusBadge, FeeBadge, Badge } from "@/components/ui/Badge";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";

export interface TournamentCardData {
  slug: string;
  name: string;
  format: "SINGLE_ELIM" | "LEAGUE";
  status: "REGISTRATION" | "IN_PROGRESS" | "FINISHED";
  feeType: "FREE" | "PAID";
  maxParticipants: number;
  startsAt: Date;
  platform: { name: string };
  _count: { participants: number };
}

export function TournamentCard({
  tournament,
  t,
  locale,
}: {
  tournament: TournamentCardData;
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <Link href={`/torneos/${tournament.slug}`}>
      <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-primary/50">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{tournament.name}</h3>
          <FeeBadge feeType={tournament.feeType} t={t} />
        </div>
        <div className="flex flex-wrap gap-2">
          <TournamentStatusBadge status={tournament.status} t={t} />
          <Badge tone="neutral">{tournament.platform.name}</Badge>
          <Badge tone="neutral">{t.badges.format[tournament.format]}</Badge>
        </div>
        <div className="mt-auto flex items-center justify-between text-xs text-muted">
          <span>
            {tournament._count.participants}/{tournament.maxParticipants}{" "}
            {t.tournamentCard.participants}
          </span>
          <span>
            {new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "es", {
              day: "2-digit",
              month: "short",
            }).format(tournament.startsAt)}
          </span>
        </div>
      </Card>
    </Link>
  );
}