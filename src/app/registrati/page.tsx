import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { REF_COOKIE } from "@/lib/referral";
import { getSponsorPreview } from "@/server/referral";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registrati" };

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/account");

  // L'attribuzione viene mostrata invece di essere applicata in silenzio:
  // l'utente vede da chi è stato invitato e può correggerla.
  //
  // Il cookie contiene il valore grezzo del link — può essere un codice invito
  // o lo slug di un mini-sito. Si risolve qui, così il form riceve il nome di
  // chi invita e il codice canonico, non "anna-bianchi".
  const refCode = (await cookies()).get(REF_COOKIE)?.value;
  const sponsor = refCode ? await getSponsorPreview(refCode) : null;

  return <AuthForm mode="register" sponsor={sponsor} />;
}
