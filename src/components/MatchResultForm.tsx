"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitMatchResultAction } from "@/lib/actions/tournaments";
import { Button } from "@/components/ui/Button";

export function MatchResultForm({
  matchId,
  loadLabel,
  loadingLabel,
  scoreALabel,
  scoreBLabel,
  allowPenalties = false,
  penaltiesToggleLabel,
  penaltyScoreALabel,
  penaltyScoreBLabel,
}: {
  matchId: string;
  loadLabel: string;
  loadingLabel: string;
  scoreALabel: string;
  scoreBLabel: string;
  allowPenalties?: boolean;
  penaltiesToggleLabel?: string;
  penaltyScoreALabel?: string;
  penaltyScoreBLabel?: string;
}) {
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [penaltiesOn, setPenaltiesOn] = useState(false);
  const [penaltyScoreA, setPenaltyScoreA] = useState("0");
  const [penaltyScoreB, setPenaltyScoreB] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await submitMatchResultAction(
              matchId,
              Number(scoreA),
              Number(scoreB),
              penaltiesOn ? Number(penaltyScoreA) : undefined,
              penaltiesOn ? Number(penaltyScoreB) : undefined
            );
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        });
      }}
    >
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${matchId}-scoreA`}>
          {scoreALabel}
        </label>
        <input
          id={`${matchId}-scoreA`}
          type="number"
          min={0}
          value={scoreA}
          onChange={(e) => setScoreA(e.target.value)}
          className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
        />
        <span className="text-muted" aria-hidden="true">
          -
        </span>
        <label className="sr-only" htmlFor={`${matchId}-scoreB`}>
          {scoreBLabel}
        </label>
        <input
          id={`${matchId}-scoreB`}
          type="number"
          min={0}
          value={scoreB}
          onChange={(e) => setScoreB(e.target.value)}
          className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? loadingLabel : loadLabel}
        </Button>
      </div>

      {allowPenalties && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={penaltiesOn}
              onChange={(e) => setPenaltiesOn(e.target.checked)}
            />
            {penaltiesToggleLabel}
          </label>
          {penaltiesOn && (
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`${matchId}-penA`}>
                {penaltyScoreALabel}
              </label>
              <input
                id={`${matchId}-penA`}
                type="number"
                min={0}
                value={penaltyScoreA}
                onChange={(e) => setPenaltyScoreA(e.target.value)}
                className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
              />
              <span className="text-muted" aria-hidden="true">
                -
              </span>
              <label className="sr-only" htmlFor={`${matchId}-penB`}>
                {penaltyScoreBLabel}
              </label>
              <input
                id={`${matchId}-penB`}
                type="number"
                min={0}
                value={penaltyScoreB}
                onChange={(e) => setPenaltyScoreB(e.target.value)}
                className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
              />
            </div>
          )}
        </div>
      )}

      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}
