import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <div className="space-y-2 text-sm text-muted">{children}</div>
    </Card>
  );
}

export default async function AyudaPage() {
  const t = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">{t.ayuda.title}</h1>
      <p className="mb-8 text-sm text-muted">{t.ayuda.intro}</p>

      <h2 className="sr-only">{t.ayuda.title}</h2>
      <div className="flex flex-col gap-4">
        {t.ayuda.sections.map((section) => (
          <Section key={section.title} title={section.title}>
            <p>{section.body}</p>
          </Section>
        ))}
      </div>
    </div>
  );
}