"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";
import { Input, Label, FieldErrors, FormError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: ActionState = {};

export function ResetPasswordForm({
  token,
  t,
}: {
  token: string;
  t: Dictionary;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push("/login?reset=1");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormError message={state.error} />
      <div>
        <Label htmlFor="password">{t.auth.newPassword}</Label>
        <Input id="password" name="password" type="password" required />
        <FieldErrors errors={state.fieldErrors?.password} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
        />
        <FieldErrors errors={state.fieldErrors?.confirmPassword} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.auth.saving : t.auth.resetSubmit}
      </Button>
    </form>
  );
}