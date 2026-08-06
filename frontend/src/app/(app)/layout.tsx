"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Plane,
  Route,
  BatteryMedium,
  UserRound,
  MapPinned,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { api } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, endpoint: null },
  { href: "/drones", label: "Dronët", icon: Plane, endpoint: "/drones" },
  { href: "/missions", label: "Misionet", icon: Route, endpoint: "/missions" },
  { href: "/batteries", label: "Bateritë", icon: BatteryMedium, endpoint: "/batteries" },
  { href: "/pilots", label: "Pilotët", icon: UserRound, endpoint: "/pilots" },
  { href: "/flight-zones", label: "Zonat", icon: MapPinned, endpoint: "/flight-zones" },
];

const emptySubscribe = () => () => {};

function useStoredEmail(): string | null {
  return useSyncExternalStore(
    emptySubscribe,
    () =>
      localStorage.getItem("accessToken")
        ? localStorage.getItem("userEmail") ?? ""
        : null,
    () => null
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const email = useStoredEmail();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (email === null) router.replace("/login");
  }, [email, router]);

  // Te dhenat fillojne te vijne sa lëvizet miu drejt lidhjes
  function prefetch(key: string, endpoint: string | null) {
    if (!endpoint) return;
    queryClient.prefetchQuery({
      queryKey: [key],
      queryFn: async () => (await api.get(endpoint)).data,
    });
  }

  function logout() {
    localStorage.clear();
    router.replace("/login");
  }

  if (email === null) return null;

  return (
<div className="flex h-screen overflow-hidden">     
<aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">        {/* Identiteti */}
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="font-heading text-[15px] font-semibold tracking-tight text-white">
            SmartFleet
            <span className="text-primary"> AI</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/50">
            Fleet operations
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() =>
                  prefetch(item.href.replace("/", ""), item.endpoint)
                }
                className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                }`}
              >
                {/* Shenja e faqes aktive — magenta e hartave ajrore */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 font-mono text-[11px] text-sidebar-foreground/50">
            {email}
          </p>
          <div className="mt-2 flex gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white"
              aria-label="Ndërro temën"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
            <button
              onClick={logout}
              className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-[13px] text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Dil
            </button>
          </div>
        </div>
      </aside>

<main className="flex-1 overflow-y-auto">
  <div className="mx-auto max-w-[1400px] p-8">{children}</div>
</main>    </div>
  );
}