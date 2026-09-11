import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function getRegisterSchema(t: Dictionary) {
  return z.object({
    name: z.string().min(2, t.auth.validation.nameMin),
    email: z.string().email(t.auth.validation.emailInvalid),
    playerTag: z
      .string()
      .min(3, t.auth.validation.playerTagMin)
      .max(20, t.auth.validation.playerTagMax)
      .regex(/^[a-zA-Z0-9_-]+$/, t.auth.validation.playerTagFormat),
    password: z.string().min(8, t.auth.validation.passwordMin),
    platformId: z.string().optional(),
  });
}

export function getForgotPasswordSchema(t: Dictionary) {
  return z.object({
    email: z.string().email(t.auth.validation.emailInvalid),
  });
}

export function getResetPasswordSchema(t: Dictionary) {
  return z
    .object({
      token: z.string().min(1),
      password: z.string().min(8, t.auth.validation.passwordMin),
      confirmPassword: z.string().min(8, t.auth.validation.passwordMin),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.auth.validation.passwordsDontMatch,
      path: ["confirmPassword"],
    });
}

export function getTournamentSchema(t: Dictionary) {
  return z.object({
    name: z.string().min(3, t.tournamentValidation.nameMin),
    format: z.enum(["SINGLE_ELIM", "LEAGUE"]),
    platformId: z.string().min(1, t.tournamentValidation.platformRequired),
    ligaId: z.string().optional(),
    feeType: z.enum(["FREE", "PAID"]),
    legs: z.coerce.number().int().min(1).max(2).default(1),
    requireApproval: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    maxParticipants: z
      .number()
      .int()
      .min(2, t.tournamentValidation.minParticipants)
      .max(128, t.tournamentValidation.maxParticipants),
    registrationClosesAt: z.coerce.date(),
    startsAt: z.coerce.date(),
    description: z.string().max(2000).optional(),
    coverImage: z.string().url().optional().or(z.literal("")),
  });
}

export function getMatchResultSchema() {
  return z.object({
    matchId: z.string().min(1),
    scoreA: z.number().int().min(0),
    scoreB: z.number().int().min(0),
  });
}

export function getTeamSchema(t: Dictionary) {
  return z.object({
    name: z.string().min(3, t.tournamentValidation.nameMin),
    crestUrl: z.string().url().optional().or(z.literal("")),
  });
}

export function getLigaSchema(t: Dictionary) {
  return z.object({
    name: z.string().min(3, t.tournamentValidation.nameMin),
    description: z.string().max(2000).optional(),
    coverImage: z.string().url().optional().or(z.literal("")),
    platformId: z.string().optional(),
  });
}