import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { needsSetup } from "@/lib/bootstrap";
import { AUTH_COOKIE } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (needsSetup()) redirect("/setup");

  const jar = await cookies();
  const auth = jar.get(AUTH_COOKIE)?.value;
  if (!auth) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
