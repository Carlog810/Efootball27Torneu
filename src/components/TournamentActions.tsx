"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  joinTournamentAction,
  leaveTournamentAction,
  drawTournamentAction,
} from "@/lib/actions/tournaments";
import { Button } from "@/components/ui/Button";

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
}: {
  tournamentId: string;
  label: string;
  pendingLabel: string;
}) {
  const { run, error, pending } = useTournamentAction(joinTournamentAction);
  return (
    <div>
      <Button onClick={() => run(tournamentId)} disabled={pending}>
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