import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";
import { Input, Label, FormError } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, locale] = await Promise.all([searchParams, getLocale()]);
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">{t.auth.loginTitle}</h1>
      <Card className="p-6">
        <form
          className="flex flex-col gap-4"
          action={async (formData) => {
            "use server";
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/",
              });
            } catch (err) {
              if (err instanceof AuthError) {
                redirect(`/login?error=${err.type}`);
              }
              throw err;
            }
          }}
        >
          <FormError
            message={
              error
                ? t.auth.errors[error as keyof typeof t.auth.errors] ?? error
                : undefined
            }
          />
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
          </div>
          <Button type="submit" className="w-full">
            {t.auth.login}
          </Button>
        </form>

        <div className="mt-4 flex justify-between text-sm text-muted">
          <Link href="/olvide" className="hover:text-foreground">
            {t.auth.forgotPassword}
          </Link>
          <Link href="/registro" className="hover:text-foreground">
            {t.auth.createAccount}
          </Link>
        </div>
      </Card>
    </div>
  );
}