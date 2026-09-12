"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import {
  getRegisterSchema,
  getForgotPasswordSchema,
  getResetPasswordSchema,
} from "@/lib/validation";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  message?: string;
};

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const t = getDictionary(await getLocale());

  const parsed = getRegisterSchema(t).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    playerTag: formData.get("playerTag"),
    password: formData.get("password"),
    platformId: formData.get("platformId") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, playerTag, password, platformId } = parsed.data;

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { playerTag }] },
  });
  if (existing) {
    return {
      error:
        existing.email === email
          ? t.auth.errors.emailTaken
          : t.auth.errors.playerTagTaken,
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      playerTag,
      passwordHash,
      platformPrefId: platformId || null,
    },
  });

  return { success: true };
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const t = getDictionary(await getLocale());

  const parsed = getForgotPasswordSchema(t).safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Same response whether or not the user exists, to avoid leaking which
  // emails are registered.
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const hdrs = await headers();
    const host = hdrs.get("host") ?? "localhost:3000";
    const protocol = hdrs.get("x-forwarded-proto") ?? "http";
    const resetUrl = `${protocol}://${host}/reset/${token}`;

    await sendPasswordResetEmail(user.email, resetUrl, t);
  }

  return {
    success: true,
    message: t.auth.forgotSuccess,
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const t = getDictionary(await getLocale());

  const parsed = getResetPasswordSchema(t).safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    return { error: t.auth.errors.invalidOrExpiredToken };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}