"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Users, Map, Sun, Moon, LogOut } from "lucide-react";

type Props = { children: React.ReactNode };

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`btn btn-ghost gap-2 justify-start ${
        active ? "bg-primary/10 text-primary" : ""
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export default function AppShell({ children }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function logout() {
    await fetch("/internal/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 border-b border-base-300">
        <div className="navbar-start">
          <div className="text-xl font-bold px-2">Palworld Dashboard</div>
        </div>

        <div className="navbar-end">
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="btn btn-ghost btn-circle"
            aria-label="theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button onClick={logout} className="btn btn-ghost gap-2">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        <aside className="w-64 bg-base-100 min-h-[calc(100vh-4rem)] border-r border-base-300 p-3 hidden md:block">
          <div className="flex flex-col gap-1">
            <NavLink
              href="/endpoints"
              label="Endpoints"
              icon={<BarChart3 size={18} />}
            />
            <NavLink
              href="/players"
              label="Players"
              icon={<Users size={18} />}
            />
            <NavLink href="/map" label="Map" icon={<Map size={18} />} />
          </div>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
