"use server";

import { revalidatePath } from "next/cache";
import { applyModerationAction } from "@/lib/root-api";

export async function moderateAction(formData: FormData) {
  const id = String(formData.get("id"));
  const action = String(formData.get("action")) as Parameters<typeof applyModerationAction>[1];
  await applyModerationAction(id, action);
  revalidatePath("/moderation");
}
