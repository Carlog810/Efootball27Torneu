"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitMatchResultAction } from "@/lib/actions/tournaments";
import { Button } from "@/components/ui/Button";

export function MatchResultForm({
  matchId,
  loadLabel,
  loadingLabel,
}: {
  matchId: string;
  loadLabel: string;
  loadingLabel: string;
}) {
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="mt-2 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await submitMatchResultAction(
              matchId,
              Number(scoreA),
              Number(scoreB)
            );
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        });
      }}
    >
      <input
        type="number"
        min={0}
        value={scoreA}
        onChange={(e) => setScoreA(e.target.value)}
        className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
      />
      <span className="text-muted">-</span>
      <input
        type="number"
        min={0}
        value={scoreB}
        onChange={(e) => setScoreB(e.target.value)}
        className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? loadingLabel : loadLabel}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}