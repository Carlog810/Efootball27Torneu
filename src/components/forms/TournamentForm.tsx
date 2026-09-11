"use client";

import { useActionState } from "react";
import { createTournamentAction } from "@/lib/actions/tournaments";
import type { ActionState } from "@/lib/actions/auth";
import {
  Input,
  Label,
  Select,
  Textarea,
  FieldErrors,
  FormError,
} from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: ActionState = {};

export function TournamentForm({
  platforms,
  ligas,
  t,
}: {
  platforms: { id: string; name: string }[];
  ligas: { id: string; name: string }[];
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(
    createTournamentAction,
    initialState
  );
  const f = t.tournamentForm;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />

      <div>
        <Label htmlFor="name">{f.name}</Label>
        <Input id="name" name="name" required />
        <FieldErrors errors={state.fieldErrors?.name} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="format">{f.format}</Label>
          <Select id="format" name="format" defaultValue="SINGLE_ELIM">
            <option value="SINGLE_ELIM">{f.formatSingleElim}</option>
            <option value="LEAGUE">{f.formatLeague}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="platformId">{f.platform}</Label>
          <Select id="platformId" name="platformId" required defaultValue="">
            <option value="" disabled>
              {f.selectPlaceholder}
            </option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <FieldErrors errors={state.fieldErrors?.platformId} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="feeType">{f.fee}</Label>
          <Select id="feeType" name="feeType" defaultValue="FREE">
            <option value="FREE">{t.badges.fee.FREE}</option>
            <option value="PAID">{t.badges.fee.PAID}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="legs">{f.legs}</Label>
          <Select id="legs" name="legs" defaultValue="1">
            <option value="1">{f.legsSingle}</option>
            <option value="2">{f.legsDouble}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="maxParticipants">{f.maxParticipants}</Label>
          <Input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            min={2}
            max={128}
            defaultValue={8}
            required
          />
          <FieldErrors errors={state.fieldErrors?.maxParticipants} />
        </div>
      </div>

      <div>
        <Label htmlFor="ligaId">{f.liga}</Label>
        <Select id="ligaId" name="ligaId" defaultValue="">
          <option value="">{f.ligaNone}</option>
          {ligas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="requireApproval"
          type="checkbox"
          value="true"
          className="h-4 w-4 rounded border-border accent-primary"
        />
        {f.requireApproval}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="registrationClosesAt">
            {f.registrationClosesAt}
          </Label>
          <Input
            id="registrationClosesAt"
            name="registrationClosesAt"
            type="datetime-local"
            required
          />
          <FieldErrors errors={state.fieldErrors?.registrationClosesAt} />
        </div>
        <div>
          <Label htmlFor="startsAt">{f.startsAt}</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
          <FieldErrors errors={state.fieldErrors?.startsAt} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">{f.description}</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? f.submitting : f.submit}
      </Button>
    </form>
  );
}