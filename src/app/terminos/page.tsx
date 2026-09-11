import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function TerminosPage() {
  const t = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t.terminos.title}
      </h1>
      <p className="mb-4">{t.terminos.intro}</p>
      <ul className="mb-4 list-disc space-y-2 pl-5">
        {t.terminos.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{t.terminos.closing}</p>
    </div>
  );
}