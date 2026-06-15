"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyAdminPassword,
} from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { error: "Password is required." };
  }

  if (!process.env.MODAL_ADMIN_PASSWORD?.trim()) {
    return { error: "Server misconfigured: MODAL_ADMIN_PASSWORD not set." };
  }

  if (!verifyAdminPassword(password)) {
    return { error: "Invalid password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);

  const from = formData.get("from");
  redirect(typeof from === "string" && from.startsWith("/") ? from : "/");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
