import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LigaCard } from "@/components/LigaCard";
import { LinkButton } from "@/components/ui/Button";

export default async function LigasPage() {
  const [ligas, locale] = await Promise.all([
    db.liga.findMany({
      include: { platform: true, _count: { select: { tournaments: true } } },
      orderBy: { name: "asc" },
    }),
    getLocale(),
  ]);
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.ligasPage.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.ligasPage.subtitle}</p>
        </div>
        <LinkButton href="/ligas/nueva">{t.ligasPage.create}</LinkButton>
      </div>

      {ligas.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          {t.ligasPage.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ligas.map((l) => (
            <LigaCard
              key={l.slug}
              liga={l}
              tournamentsLabel={t.nav.torneos.toLowerCase()}
            />
          ))}
        </div>
      )}
    </div>
  );
}