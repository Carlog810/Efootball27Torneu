import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { TeamCard } from "@/components/TeamCard";
import { LinkButton } from "@/components/ui/Button";

export default async function EquiposPage() {
  const [teams, locale] = await Promise.all([
    db.team.findMany({ orderBy: { name: "asc" } }),
    getLocale(),
  ]);
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.teamsPage.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.teamsPage.subtitle}</p>
        </div>
        <LinkButton href="/equipos/nuevo">{t.teamsPage.create}</LinkButton>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          {t.teamsPage.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
