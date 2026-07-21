"use client";

import { useTransition } from "react";
import type { Role } from "@prisma/client";
import { updateUserRole } from "@/app/actions/admin";

const ROLES: { value: Role; label: string }[] = [
  { value: "CUSTOMER", label: "Cliente" },
  { value: "CONSULTANT", label: "Consulente" },
  { value: "RESELLER", label: "Rivenditore" },
  { value: "ADMIN", label: "Admin" },
];

export function UserRoleSelect({ userId, value }: { userId: string; value: Role }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={value}
      disabled={pending}
      onChange={(e) => startTransition(() => updateUserRole(userId, e.target.value as Role))}
      className="rounded-lg border border-coffee-200 bg-white px-2 py-1 text-sm text-coffee-800 disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
