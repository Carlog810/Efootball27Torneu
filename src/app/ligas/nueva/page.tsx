import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";
import { LigaForm } from "@/components/forms/LigaForm";

export default async function NuevaLigaPage() {
  await requireUser();
  const [platforms, locale] = await Promise.all([
    db.platform.findMany({ orderBy: { name: "asc" } }),
    getLocale(),
  ]);
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t.ligaForm.pageTitle}</h1>
      <Card className="p-6">
        <LigaForm platforms={platforms} t={t} />
      </Card>
    </div>
  );
}