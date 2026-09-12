import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Dictionary } from "@/lib/i18n/dictionary";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const gmailTransport =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
    : null;

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  t: Dictionary
) {
  const subject = t.auth.resetEmailSubject;
  const html = `<p>${t.auth.resetEmailBody}</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

  // Gmail SMTP primero: a diferencia del dominio de pruebas de Resend
  // (onboarding@resend.dev), entrega a cualquier destinatario real.
  if (gmailTransport) {
    await gmailTransport.sendMail({
      from: `EF Torneos <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return;
  }

  if (resend) {
    await resend.emails.send({
      from: "EF Torneos <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    return;
  }

  // Sin ningún proveedor configurado (ej. desarrollo local): el link
  // se imprime en la consola del servidor en vez de enviarse.
  console.log(`\n[Reset de contraseña] ${to} -> ${resetUrl}\n`);
}
