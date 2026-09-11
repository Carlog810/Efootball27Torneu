"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { Input, Label, FieldErrors, FormError } from "@/components/ui/Field";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: ActionState = {};

export function RegisterForm({
  platforms,
  t,
}: {
  platforms: { id: string; name: string }[];
  t: Dictionary;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=1");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      <div>
        <Label htmlFor="name">{t.auth.name}</Label>
        <Input id="name" name="name" required />
        <FieldErrors errors={state.fieldErrors?.name} />
      </div>
      <div>
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" required />
        <FieldErrors errors={state.fieldErrors?.email} />
      </div>
      <div>
        <Label htmlFor="playerTag">{t.auth.playerTag}</Label>
        <Input
          id="playerTag"
          name="playerTag"
          placeholder={t.auth.playerTagPlaceholder}
          required
        />
        <FieldErrors errors={state.fieldErrors?.playerTag} />
      </div>
      <div>
        <Label htmlFor="platformId">{t.auth.platformPref}</Label>
        <Select id="platformId" name="platformId" defaultValue="">
          <option value="">{t.auth.selectPlatform}</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" name="password" type="password" required />
        <FieldErrors errors={state.fieldErrors?.password} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.auth.registering : t.auth.registerSubmit}
      </Button>
    </form>
  );
}