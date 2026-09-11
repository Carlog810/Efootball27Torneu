"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  joinTournamentAction,
  leaveTournamentAction,
  drawTournamentAction,
  inviteParticipantAction,
  respondToInviteAction,
  approveParticipantAction,
  removeParticipantAction,
} from "@/lib/actions/tournaments";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

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

export function ApproveButton({
  participantId,
  label,
  pendingLabel,
}: {
  participantId: string;
  label: string;
  pendingLabel: string;
}) {
  const { run, error, pending } = useTournamentAction(
    approveParticipantAction
  );
  return (
    <div className="flex flex-col items-end">
      <Button
        variant="primary"
        size="sm"
        onClick={() => run(participantId)}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function RemoveParticipantButton({
  participantId,
  label,
  pendingLabel,
}: {
  participantId: string;
  label: string;
  pendingLabel: string;
}) {
  const { run, error, pending } = useTournamentAction(
    removeParticipantAction
  );
  return (
    <div className="flex flex-col items-end">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => run(participantId)}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function RespondInviteButtons({
  participantId,
  acceptLabel,
  acceptingLabel,
  declineLabel,
  decliningLabel,
}: {
  participantId: string;
  acceptLabel: string;
  acceptingLabel: string;
  declineLabel: string;
  decliningLabel: string;
}) {
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const respond = (accept: boolean) => {
    setError(null);
    setAction(accept ? "accept" : "decline");
    startTransition(async () => {
      try {
        await respondToInviteAction(participantId, accept);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setAction(null);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => respond(true)}
          disabled={action !== null}
        >
          {action === "accept" ? acceptingLabel : acceptLabel}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => respond(false)}
          disabled={action !== null}
        >
          {action === "decline" ? decliningLabel : declineLabel}
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function InviteForm({
  tournamentId,
  teams,
  playerTagLabel,
  teamLabel,
  submitLabel,
  submittingLabel,
}: {
  tournamentId: string;
  teams: { id: string; name: string }[];
  playerTagLabel: string;
  teamLabel: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [playerTag, setPlayerTag] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (teams.length === 0) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await inviteParticipantAction(
              tournamentId,
              playerTag.trim(),
              teamId
            );
            setPlayerTag("");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        });
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <label className="sr-only" htmlFor="invite-playerTag">
          {playerTagLabel}
        </label>
        <Input
          id="invite-playerTag"
          value={playerTag}
          onChange={(e) => setPlayerTag(e.target.value)}
          placeholder={playerTagLabel}
          required
        />
      </div>
      <div>
        <label className="sr-only" htmlFor="invite-team">
          {teamLabel}
        </label>
        <Select
          id="invite-team"
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
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? submittingLabel : submitLabel}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}