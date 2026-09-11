"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { slugify } from "@/lib/slug";
import { getLigaSchema } from "@/lib/validation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { ActionState } from "@/lib/actions/auth";

export async function createLigaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const t = getDictionary(await getLocale());

  const parsed = getLigaSchema(t).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    coverImage: formData.get("coverImage") || "",
    platformId: formData.get("platformId") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const baseSlug = slugify(data.name) || "liga";
  let slug = baseSlug;
  let attempt = 0;
  while (await db.liga.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const liga = await db.liga.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      coverImage: data.coverImage || null,
      platformId: data.platformId || null,
    },
  });

  revalidatePath("/ligas");
  redirect(`/ligas/${liga.slug}`);
}