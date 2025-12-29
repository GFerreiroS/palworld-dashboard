import { redirect } from "next/navigation";
import { needsSetup } from "@/lib/bootstrap";

export default function Home() {
  if (needsSetup()) {
    redirect("/setup");
  }

  return <h1>Dashboard (login required)</h1>;
}
