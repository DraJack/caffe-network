"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Coffee, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { registerUser, loginUser, type ActionState } from "@/app/actions/auth";
import type { SponsorPreview } from "@/lib/mini-site";

export function AuthForm({
  mode,
  sponsor,
}: {
  mode: "login" | "register";
  /** null quando non c'è attribuzione: cookie assente, scaduto o non risolvibile. */
  sponsor?: SponsorPreview | null;
}) {
  const action = mode === "login" ? loginUser : registerUser;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex rounded-2xl bg-coffee-800 p-3.5 text-accent">
            <Coffee className="h-6 w-6" />
          </span>
        </div>

        {/* Continuità con il mini-sito: chi arriva da /c/anna-bianchi ha appena
            letto "ti sta invitando Anna", e qui ritrova la stessa persona. */}
        {mode === "register" && sponsor && (
          <div
            className="mb-4 flex animate-fade-up items-center gap-3 rounded-2xl border border-accent/25 bg-accent/8 p-4"
            style={{ animationDelay: "60ms" }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-sm font-bold text-coffee-900">
              {sponsor.initials}
            </span>
            <p className="text-sm text-coffee-700">
              Ti sta invitando{" "}
              <span className="font-semibold text-coffee-900">{sponsor.displayName}</span>. Entrerai
              nella sua rete.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-coffee-100 bg-white p-8 shadow-(--shadow-card)">
          <h1 className="text-center font-heading text-3xl font-bold tracking-tight text-coffee-900">
            {mode === "login" ? "Bentornato" : "Crea il tuo account"}
          </h1>
          <p className="mt-2 text-center text-sm text-coffee-600">
            {mode === "login"
              ? "Accedi per vedere ordini, rete e provvigioni."
              : "Gratuito, senza quote d'ingresso. Bastano trenta secondi."}
          </p>

          <form action={formAction} className="mt-7 space-y-4">
            {mode === "register" && (
              <div>
                <Label htmlFor="name">Nome e cognome</Label>
                <Input id="name" name="name" autoComplete="name" required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                error={Boolean(state?.error)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                error={Boolean(state?.error)}
                required
              />
              {mode === "register" && (
                <p className="mt-1.5 text-xs text-coffee-500">Almeno 8 caratteri.</p>
              )}
            </div>

            {mode === "register" && (
              <div>
                <Label htmlFor="sponsorCode">Codice invito (facoltativo)</Label>
                {/* Si precompila sempre il codice canonico, mai il valore grezzo
                    del link: uno slug nel campo sembrerebbe un codice sbagliato. */}
                <Input
                  id="sponsorCode"
                  name="sponsorCode"
                  placeholder="Se ti ha invitato qualcuno"
                  defaultValue={sponsor?.referralCode}
                />
                {sponsor && (
                  <p className="mt-1.5 text-xs text-coffee-500">
                    È il codice di {sponsor.displayName}. Puoi modificarlo o cancellarlo.
                  </p>
                )}
              </div>
            )}

            {state?.error && (
              <p className="flex animate-fade-up items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {state.error}
              </p>
            )}

            <Button type="submit" size="lg" variant="accent" className="w-full" loading={pending}>
              {!pending && (mode === "login" ? "Accedi" : "Registrati")}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-coffee-600">
          {mode === "login" ? (
            <>
              Non hai un account?{" "}
              <Link
                href="/registrati"
                className="font-medium text-accent-dark transition-colors hover:text-accent"
              >
                Registrati
              </Link>
            </>
          ) : (
            <>
              Hai già un account?{" "}
              <Link
                href="/login"
                className="font-medium text-accent-dark transition-colors hover:text-accent"
              >
                Accedi
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
