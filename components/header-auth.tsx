import Link from "next/link";
import { getViewer } from "@/lib/dal";

/** Streams in behind <Suspense> so the header itself stays static. */
export async function HeaderAuth() {
  const v = await getViewer();
  return v.user ? (
    <Link href="/account" className="btn btn-ghost !min-h-10 !px-4 text-sm">
      حساب من{v.access === "subscriber" ? " ✦" : ""}
    </Link>
  ) : (
    <LoginLink />
  );
}

export function LoginLink() {
  return (
    <Link href="/login" className="btn btn-ghost !min-h-10 !px-4 text-sm">
      ورود
    </Link>
  );
}
