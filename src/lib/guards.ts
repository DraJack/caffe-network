import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Richiede un utente autenticato; altrimenti reindirizza al login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Richiede il ruolo ADMIN; altrimenti reindirizza. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user;
}
