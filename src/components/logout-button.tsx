"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/logout";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button className="flex items-center gap-2 text-sm text-coffee-600 hover:text-red-600">
        <LogOut className="h-4 w-4" /> Esci
      </button>
    </form>
  );
}
