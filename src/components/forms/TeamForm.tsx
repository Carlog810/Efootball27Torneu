"use client";

import { useActionState } from "react";
import { createTeamAction } from "@/lib/actions/teams";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label, FieldErrors, FormError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: ActionState = {};

export function TeamForm({ t }: { t: Dictionary }) {
  const [state, formAction, pending] = useActionState(
    createTeamAction,
    initialState
  );
  const f = t.teamForm;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      <div>
        <Label htmlFor="name">{f.name}</Label>
        <Input id="name" name="name" required />
        <FieldErrors errors={state.fieldErrors?.name} />
      </div>
      <div>
        <Label htmlFor="crestUrl">{f.crestUrl}</Label>
        <Input id="crestUrl" name="crestUrl" type="url" />
        <FieldErrors errors={state.fieldErrors?.crestUrl} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? f.submitting : f.submit}
      </Button>
    </form>
  );
}
