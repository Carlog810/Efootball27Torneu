import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [{ token }, locale] = await Promise.all([params, getLocale()]);
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">{t.auth.resetTitle}</h1>
      <Card className="p-6">
        <ResetPasswordForm token={token} t={t} />
      </Card>
    </div>
  );
}