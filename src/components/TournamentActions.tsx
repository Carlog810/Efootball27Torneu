"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  joinTournamentAction,
  leaveTournamentAction,
  drawTournamentAction,
} from "@/lib/actions/tournaments";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";

function useTournamentAction(
  action: (tournamentId: string) => Promise<void>
) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (tournamentId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await action(tournamentId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  };

  return { run, error, pending };
}

export function JoinButton({
  tournamentId,
  label,
  pendingLabel,
  teams,
  selectLabel,
  noTeamsLabel,
  createTeamLabel,
}: {
  tournamentId: string;
  label: string;
  pendingLabel: string;
  teams: { id: string; name: string }[];
  selectLabel: string;
  noTeamsLabel: string;
  createTeamLabel: string;
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (teams.length === 0) {
    return (
      <p className="text-xs text-muted">
        {noTeamsLabel}{" "}
        <Link href="/equipos/nuevo" className="text-primary underline">
          {createTeamLabel}
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="sr-only" htmlFor="join-team">
        {selectLabel}
      </label>
      <Select
        id="join-team"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
        className="w-40"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </Select>
      <Button
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await joinTournamentAction(tournamentId, teamId);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error");
            }
          });
        }}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function LeaveButton({
  tournamentId,
  label,
  pendingLabel,
}: {
  tournamentId: string;
  label: string;
  pendingLabel: string;
}) {
  const { run, error, pending } = useTournamentAction(leaveTournamentAction);
  return (
    <div>
      <Button
        variant="secondary"
        onClick={() => run(tournamentId)}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function DrawButton({
  tournamentId,
  label,
  pendingLabel,
}: {
  tournamentId: string;
  label: string;
  pendingLabel: string;
}) {
  const { run, error, pending } = useTournamentAction(drawTournamentAction);
  return (
    <div>
      <Button
        variant="primary"
        onClick={() => run(tournamentId)}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}