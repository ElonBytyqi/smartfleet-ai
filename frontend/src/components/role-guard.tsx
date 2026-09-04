"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { useRoles, hasAnyRole } from "@/lib/use-roles";

export function RoleGuard({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const userRoles = useRoles();

  if (!hasAnyRole(userRoles, roles)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-16 text-center">
        <ShieldX className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
        <p className="text-[14px] font-medium">Nuk keni qasje në këtë faqe</p>
        <p className="text-[13px] text-muted-foreground">
          Kjo pjesë kërkon të drejta që roli juaj nuk i ka.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 text-[13px] text-primary transition-colors hover:underline"
        >
          Kthehu te dashboard-i
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}