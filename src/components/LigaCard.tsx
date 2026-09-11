import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function LigaCard({
  liga,
  tournamentsLabel,
}: {
  liga: {
    slug: string;
    name: string;
    description: string | null;
    platform: { name: string } | null;
    _count: { tournaments: number };
  };
  tournamentsLabel: string;
}) {
  return (
    <Link href={`/ligas/${liga.slug}`}>
      <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:border-primary/50">
        <h3 className="font-semibold">{liga.name}</h3>
        {liga.description && (
          <p className="line-clamp-2 text-sm text-muted">{liga.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          {liga.platform ? (
            <Badge tone="neutral">{liga.platform.name}</Badge>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">
            {liga._count.tournaments} {tournamentsLabel}
          </span>
        </div>
      </Card>
    </Link>
  );
}