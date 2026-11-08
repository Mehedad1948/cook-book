"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/dal";
import { startCheckout } from "@/lib/billing/service";

export async function checkoutAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/pricing");

  const res = await startCheckout(viewer.user.id, String(formData.get("plan") ?? ""), viewer.user.phone);
  if ("error" in res) redirect("/pricing");
  redirect(res.redirectUrl);
}
