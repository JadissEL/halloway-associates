"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyAdminPassword,
} from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

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

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(`modal-login:${ip}`, 5, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
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
  // "/" alone is a safe relative path; "//evil.com" also starts with "/" but
  // is a protocol-relative URL browsers will follow off-site.
  const safeFrom = typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/";
  redirect(safeFrom);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
