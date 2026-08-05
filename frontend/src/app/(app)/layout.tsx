"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/drones", label: "Dronët" },
  { href: "/missions", label: "Misionet" },
  { href: "/batteries", label: "Bateritë" },
  { href: "/pilots", label: "Pilotët" },
  { href: "/flight-zones", label: "Zonat e fluturimit" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Lexohet vetem nje here, kur komponenti krijohet — jo ne cdo render
  const [auth] = useState(() => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return { email: localStorage.getItem("userEmail") ?? "" };
  });

  // Effect-i tani vetem ridrejton — nuk prek state
  useEffect(() => {
    if (!auth) router.replace("/login");
  }, [auth, router]);

  function logout() {
    localStorage.clear();
    router.replace("/login");
  }

  if (!auth) return null;

  return (

    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r bg-muted/30 p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="font-medium">SmartDlone AI</h1>
          <p className="text-xs text-muted-foreground">Menaxhim i flotës</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t pt-4 space-y-2">
          <p className="text-xs text-muted-foreground truncate">{auth.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            Dil
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}