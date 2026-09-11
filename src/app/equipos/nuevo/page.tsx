import { requireUser } from "@/lib/auth-helpers";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";
import { TeamForm } from "@/components/forms/TeamForm";

export default async function NuevoEquipoPage() {
  await requireUser();
  const t = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t.teamForm.pageTitle}</h1>
      <Card className="p-6">
        <TeamForm t={t} />
      </Card>
    </div>
  );
}
