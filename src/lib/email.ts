import { Resend } from "resend";
import type { Dictionary } from "@/lib/i18n/dictionary";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  t: Dictionary
) {
  if (!resend) {
    // Sin RESEND_API_KEY configurada (ej. desarrollo local): el link
    // se imprime en la consola del servidor en vez de enviarse.
    console.log(`\n[Reset de contraseña] ${to} -> ${resetUrl}\n`);
    return;
  }

  await resend.emails.send({
    from: "EF Torneos <onboarding@resend.dev>",
    to,
    subject: t.auth.resetEmailSubject,
    html: `<p>${t.auth.resetEmailBody}</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}
