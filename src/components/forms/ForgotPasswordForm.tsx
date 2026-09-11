"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type ActionState,
} from "@/lib/actions/auth";
import { Input, Label, FieldErrors, FormSuccess } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: ActionState = {};

export function ForgotPasswordForm({ t }: { t: Dictionary }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState
  );

  if (state.success) {
    return <FormSuccess message={state.message} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" required />
        <FieldErrors errors={state.fieldErrors?.email} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.auth.sending : t.auth.forgotSubmit}
      </Button>
    </form>
  );
}