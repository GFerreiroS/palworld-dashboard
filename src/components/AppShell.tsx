"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Map,
  Settings,
  Sun,
  Moon,
  LogOut,
  UsersRound,
  ScrollText,
} from "lucide-react";
import { ConfigProvider, useAppConfig } from "@/components/ConfigProvider";

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

function AppShellInner({ children }: Props) {
  const { dashboardName } = useAppConfig();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function logout() {
    window.location.href = "/internal/logout";
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 border-b border-base-300">
        <div className="navbar-start">
          <div className="flex items-center gap-3 px-2">
            <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center">
              <Image
                src="/palworld-dashboard-logo.png"
                alt="Palworld Dashboard"
                width={256}
                height={256}
                className="scale-[1.4] object-contain"
                priority
              />
            </div>

            <div className="text-xl font-bold">{dashboardName}</div>
          </div>
        </div>

        <div className="navbar-end gap-2">
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
              href="/"
              label="Dashboard"
              icon={<BarChart3 size={18} />}
            />
            <NavLink
              href="/player-admin"
              label="Player admin"
              icon={<UsersRound size={18} />}
            />
            <NavLink href="/map" label="Map" icon={<Map size={18} />} />
            <NavLink
              href="/logs"
              label="Logs"
              icon={<ScrollText size={18} />}
            />
            <NavLink
              href="/settings"
              label="Settings"
              icon={<Settings size={18} />}
            />
          </div>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: Props) {
  return (
    <ConfigProvider>
      <AppShellInner>{children}</AppShellInner>
    </ConfigProvider>
  );
}
