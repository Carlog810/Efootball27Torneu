import { getGlobalRankings } from "@/lib/rankings";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { RankingTable } from "@/components/RankingTable";

export default async function RankingsPage() {
  const [rows, locale] = await Promise.all([getGlobalRankings(), getLocale()]);
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">{t.rankingsPage.title}</h1>
      <p className="mb-6 text-sm text-muted">{t.rankingsPage.subtitle}</p>
      <RankingTable rows={rows} t={t} />
    </div>
  );
}