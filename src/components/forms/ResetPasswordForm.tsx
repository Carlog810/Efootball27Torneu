"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";
import { Label, FieldErrors, FormError } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
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
        <PasswordInput
          id="password"
          name="password"
          required
          showLabel={t.auth.showPassword}
          hideLabel={t.auth.hidePassword}
        />
        <FieldErrors errors={state.fieldErrors?.password} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          showLabel={t.auth.showPassword}
          hideLabel={t.auth.hidePassword}
        />
        <FieldErrors errors={state.fieldErrors?.confirmPassword} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.auth.saving : t.auth.resetSubmit}
      </Button>
    </form>
  );
}