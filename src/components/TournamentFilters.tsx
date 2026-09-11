import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function TournamentFilters({
  platforms,
  defaults,
  t,
}: {
  platforms: { id: string; name: string }[];
  defaults: {
    q?: string;
    platformId?: string;
    status?: string;
    feeType?: string;
  };
  t: Dictionary;
}) {
  return (
    <form
      method="get"
      className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-5"
    >
      <div className="col-span-2 md:col-span-2">
        <Input
          type="search"
          name="q"
          placeholder={t.filters.searchPlaceholder}
          defaultValue={defaults.q}
        />
      </div>
      <Select name="platformId" defaultValue={defaults.platformId ?? ""}>
        <option value="">{t.filters.platform}</option>
        {platforms.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <Select name="status" defaultValue={defaults.status ?? ""}>
        <option value="">{t.filters.status}</option>
        <option value="REGISTRATION">{t.badges.status.REGISTRATION}</option>
        <option value="IN_PROGRESS">{t.badges.status.IN_PROGRESS}</option>
        <option value="FINISHED">{t.badges.status.FINISHED}</option>
      </Select>
      <Select name="feeType" defaultValue={defaults.feeType ?? ""}>
        <option value="">{t.filters.feeAll}</option>
        <option value="FREE">{t.filters.free}</option>
        <option value="PAID">{t.filters.paid}</option>
      </Select>
      <Button type="submit" variant="secondary" className="col-span-2 md:col-span-5">
        {t.filters.submit}
      </Button>
    </form>
  );
}