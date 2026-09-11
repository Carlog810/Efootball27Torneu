import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export default async function OlvidePage() {
  const t = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">{t.auth.forgotTitle}</h1>
      <Card className="p-6">
        <ForgotPasswordForm t={t} />
      </Card>
    </div>
  );
}