import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { needsSetup } from "@/lib/bootstrap";
import { AUTH_COOKIE } from "@/lib/session";
import { loadConfig } from "@/lib/config";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (needsSetup()) {
    redirect("/setup");
  }

  const jar = await cookies();
  const auth = jar.get(AUTH_COOKIE)?.value;

  let isAuthenticated = false;

  if (auth) {
    const { server } = loadConfig();
    const base = server.base_url.replace(/\/+$/, "");

    try {
      const res = await fetch(`${base}/v1/api/info`, {
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
        cache: "no-store",
      });

      if (res.ok) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  if (isAuthenticated) {
    redirect("/");
  }

  return <LoginForm />;
}
