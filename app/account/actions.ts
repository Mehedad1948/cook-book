"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashToken } from "@/lib/auth/crypto";
import { deleteSessionByHash } from "@/lib/db/sessions";
import { SESSION_COOKIE } from "@/lib/dal";

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSessionByHash(hashToken(token));
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
