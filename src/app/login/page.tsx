import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Accedi" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/account");
  return <AuthForm mode="login" />;
}
