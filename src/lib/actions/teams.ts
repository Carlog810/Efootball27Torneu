"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { getTeamSchema } from "@/lib/validation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { ActionState } from "@/lib/actions/auth";

export async function createTeamAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const t = getDictionary(await getLocale());

  const parsed = getTeamSchema(t).safeParse({
    name: formData.get("name"),
    crestUrl: formData.get("crestUrl") || "",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const existing = await db.team.findUnique({ where: { name: data.name } });
  if (existing) {
    return { fieldErrors: { name: [t.teamForm.nameTaken] } };
  }

  await db.team.create({
    data: {
      name: data.name,
      crestUrl: data.crestUrl || null,
    },
  });

  revalidatePath("/equipos");
  redirect("/equipos");
}
