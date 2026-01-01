import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { needsSetup } from "@/lib/bootstrap";
import { AUTH_COOKIE } from "@/lib/session";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  // If setup is NOT needed anymore, don't show setup again
  if (!needsSetup()) {
    const jar = await cookies();
    const auth = jar.get(AUTH_COOKIE)?.value;

    // If logged in -> dashboard, otherwise -> login
    if (auth) redirect("/");
    redirect("/login");
  }

  return <SetupForm />;
}
