import { Card } from "@/components/ui/Card";
import { TeamBadge } from "@/components/TeamBadge";

export function TeamCard({
  team,
}: {
  team: { name: string; crestUrl: string | null };
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <TeamBadge name={team.name} crestUrl={team.crestUrl} size="md" />
      <span className="font-medium">{team.name}</span>
    </Card>
  );
}
