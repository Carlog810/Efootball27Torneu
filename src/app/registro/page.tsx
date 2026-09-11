import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default async function RegistroPage() {
  const [platforms, locale] = await Promise.all([
    db.platform.findMany({ orderBy: { name: "asc" } }),
    getLocale(),
  ]);
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">{t.auth.registerTitle}</h1>
      <Card className="p-6">
        <RegisterForm platforms={platforms} t={t} />
      </Card>
    </div>
  );
}