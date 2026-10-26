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
  Wrench,
  Users,
  Radio,
  Brain,
  History,
  Bell,
  BarChart3,
  SlidersHorizontal,
  
} from "lucide-react";
import { api, tokens } from "@/lib/api";
import { Role, ROLE_LABELS } from "@/lib/constants";
import { useRoles, hasAnyRole } from "@/lib/use-roles";
import { useActiveAlerts } from "@/lib/queries";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    endpoint: null,
    roles: [] as string[],
  },
  {
    href: "/live",
    label: "Ndjekja live",
    icon: Radio,
    endpoint: null,
    roles: [] as string[],
  },
  {
    href: "/drones",
    label: "Dronët",
    icon: Plane,
    endpoint: "/drones",
    roles: [] as string[],
  },
  {
    href: "/missions",
    label: "Misionet",
    icon: Route,
    endpoint: "/missions",
    roles: [] as string[],
  },
  {
    href: "/batteries",
    label: "Bateritë",
    icon: BatteryMedium,
    endpoint: "/batteries",
    roles: [] as string[],
  },
  {
    href: "/pilots",
    label: "Pilotët",
    icon: UserRound,
    endpoint: "/pilots",
    roles: [Role.Admin, Role.FleetManager, Role.Operator] as string[],
  },
  {
    href: "/flight-zones",
    label: "Zonat",
    icon: MapPinned,
    endpoint: "/flight-zones",
    roles: [] as string[],
  },
  {
    href: "/maintenance",
    label: "Mirëmbajtja",
    icon: Wrench,
    endpoint: "/maintenance",
    roles: [] as string[],
  },
  {
    href: "/predictive",
    label: "Parashikimi",
    icon: Brain,
    endpoint: null,
    roles: [Role.Admin, Role.FleetManager, Role.MaintenanceTechnician] as string[],
  },
  {
    href: "/users",
    label: "Përdoruesit",
    icon: Users,
    endpoint: "/users",
    roles: [Role.Admin] as string[],
  },
  {
    href: "/audit",
    label: "Regjistri",
    icon: History,
    endpoint: null,
    roles: [Role.Admin] as string[],
  }, { href: "/alerts", label: "Alerts", icon: Bell, roles: ["Admin", "FleetManager", "Operator"] },
  {
  href: "/reports",
  label: "Raportet",
  icon: BarChart3,
  endpoint: null,
  roles: [Role.Admin, Role.FleetManager, Role.Operator],
},
{
  href: "/settings",
  label: "Cilësimet",
  icon: SlidersHorizontal,
  endpoint: null,
  roles: [Role.Admin, Role.FleetManager],
},

];

// localStorage nuk ekziston ne server — useSyncExternalStore lejon
// vlere te ndryshme per server dhe klient pa hydration mismatch
const emptySubscribe = () => () => { };

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

// Kthen false ne server dhe ne renderin e pare, true pas hidratimit.
// Pa kete, ridrejtimi te /login ndodh para se localStorage te lexohet.
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const email = useStoredEmail();
  const roles = useRoles();
  const hydrated = useHydrated();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Fsheh lidhjet qe useri s'ka te drejte t'i hape
  const visibleItems = navItems.filter((item) => hasAnyRole(roles, item.roles));

  useEffect(() => {
    if (hydrated && email === null) router.replace("/login");
  }, [hydrated, email, router]);

  // Te dhenat fillojne te vijne sa lëvizet miu drejt lidhjes
  // function prefetch(key: string, endpoint: string | null) {
  //   if (!endpoint) return;
  //   queryClient.prefetchQuery({
  //     queryKey: [key],
  //     queryFn: async () => (await api.get(endpoint)).data,
  //   });
  // }
  function prefetch(key: string, endpoint?: string | null) {
    if (!endpoint) return;
    queryClient.prefetchQuery({
      queryKey: [key],
      queryFn: async () => (await api.get(endpoint)).data,
    });
  }
  const { data: activeAlerts } = useActiveAlerts();
  const alertCount = activeAlerts?.length ?? 0;
  const hasCritical = activeAlerts?.some((a) => a.severity === "Critical") ?? false;

  function logout() {
    tokens.clear();
    router.replace("/login");
  }

  if (!hydrated || email === null) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Identiteti */}
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="font-heading text-[15px] font-semibold tracking-tight text-white">
            SmartFleet
            <span className="text-primary"> AI</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/50">
            Fleet operations
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showBadge = item.href === "/alerts" && alertCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => prefetch(item.href.replace("/", ""), item.endpoint)}
                className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>

                {showBadge && (
                  <span
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-medium tabular-nums text-white ${hasCritical
                        ? "animate-pulse bg-[var(--status-warning)]"
                        : "bg-[var(--status-caution)]"
                      }`}
                  >
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="px-2">
            <p className="truncate font-mono text-[11px] text-sidebar-foreground/50">
              {email}
            </p>
            {roles.length > 0 && (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-primary/80">
                {roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}
              </p>
            )}
          </div>

          <div className="mt-2 flex gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white"
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
              className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md text-[13px] text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Dil
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-350 p-8">{children}</div>
      </main>
    </div>
  );
}