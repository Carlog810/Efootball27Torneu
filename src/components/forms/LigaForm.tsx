"use client";

import { useActionState } from "react";
import { createLigaAction } from "@/lib/actions/ligas";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label, Select, Textarea, FieldErrors, FormError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: ActionState = {};

export function LigaForm({
  platforms,
  t,
}: {
  platforms: { id: string; name: string }[];
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(
    createLigaAction,
    initialState
  );
  const f = t.ligaForm;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      <div>
        <Label htmlFor="name">{f.name}</Label>
        <Input id="name" name="name" required />
        <FieldErrors errors={state.fieldErrors?.name} />
      </div>
      <div>
        <Label htmlFor="platformId">{f.platform}</Label>
        <Select id="platformId" name="platformId" defaultValue="">
          <option value="">{f.platformAll}</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="description">{f.description}</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? f.submitting : f.submit}
      </Button>
    </form>
  );
}