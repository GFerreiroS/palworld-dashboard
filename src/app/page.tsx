import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { needsSetup } from "@/lib/bootstrap";
import { AUTH_COOKIE } from "@/lib/session";

export default async function Home() {
  if (needsSetup()) redirect("/setup");

  const jar = await cookies();
  const auth = jar.get(AUTH_COOKIE)?.value;

  if (!auth) redirect("/login");
  redirect("/endpoints");
}
