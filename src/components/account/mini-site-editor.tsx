"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import type { MiniSiteTheme, MiniSiteTagline } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MINI_SITE_TAGLINES,
  MINI_SITE_TAGLINE_KEYS,
  MINI_SITE_THEMES,
  MINI_SITE_THEME_KEYS,
  initials,
  themeTokens,
} from "@/lib/mini-site";
import { updateMiniSite, type MiniSiteState } from "@/app/actions/mini-site";

type Props = {
  displayName: string;
  theme: MiniSiteTheme;
  tagline: MiniSiteTagline;
};

export function MiniSiteEditor({ displayName, theme, tagline }: Props) {
  const [state, formAction, pending] = useActionState<MiniSiteState, FormData>(
    updateMiniSite,
    undefined,
  );

  // Stato locale solo per l'anteprima: il salvataggio resta della server action.
  const [name, setName] = useState(displayName);
  const [selectedTheme, setSelectedTheme] = useState<MiniSiteTheme>(theme);
  const [selectedTagline, setSelectedTagline] = useState<MiniSiteTagline>(tagline);

  const t = themeTokens(selectedTheme);
  const phrase = MINI_SITE_TAGLINES[selectedTagline].text;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <form action={formAction} className="space-y-7">
        <div>
          <Label htmlFor="displayName">Come ti chiami sulla vetrina</Label>
          <Input
            id="displayName"
            name="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            error={Boolean(state?.error)}
            required
          />
          <p className="mt-1.5 text-xs text-coffee-500">
            È il nome che legge chi apre il tuo link. L&apos;indirizzo della pagina invece non
            cambia più: i link che hai già condiviso devono continuare a funzionare.
          </p>
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-coffee-800">Atmosfera</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {MINI_SITE_THEME_KEYS.map((key) => {
              const tokens = MINI_SITE_THEMES[key];
              const active = selectedTheme === key;
              return (
                <label
                  key={key}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 p-3 transition-all duration-200 ease-out-quart",
                    active
                      ? "border-accent shadow-(--shadow-card)"
                      : "border-coffee-100 hover:border-coffee-200",
                  )}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={key}
                    checked={active}
                    onChange={() => setSelectedTheme(key)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className="flex h-14 items-center justify-center rounded-xl"
                    style={{ background: tokens.bg }}
                  >
                    <span
                      className="h-6 w-6 rounded-full"
                      style={{ background: tokens.accent }}
                    />
                  </span>
                  <span className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-coffee-900">
                    {tokens.label}
                    {active && <Check className="h-3.5 w-3.5 text-accent-dark" />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-coffee-500">
                    {tokens.hint}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-coffee-800">
            La tua frase
          </legend>
          <div className="space-y-2">
            {MINI_SITE_TAGLINE_KEYS.map((key) => {
              const option = MINI_SITE_TAGLINES[key];
              const active = selectedTagline === key;
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors duration-200",
                    active
                      ? "border-accent bg-accent/[0.06]"
                      : "border-coffee-100 hover:border-coffee-200",
                  )}
                >
                  <input
                    type="radio"
                    name="tagline"
                    value={key}
                    checked={active}
                    onChange={() => setSelectedTagline(key)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                      active ? "border-accent bg-accent" : "border-coffee-300",
                    )}
                  />
                  <span className="text-sm text-coffee-800">
                    {option.text ?? <span className="text-coffee-500">{option.label}</span>}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-coffee-500">
            Le frasi sono scritte da noi: una pagina pubblica non può contenere promesse di
            guadagno, nemmeno involontarie.
          </p>
        </fieldset>

        {state?.error && (
          <p className="flex animate-fade-up items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="flex animate-fade-up items-center gap-2 rounded-xl bg-green-50 px-3.5 py-3 text-sm text-green-700">
            <Check className="h-4 w-4 shrink-0" />
            {state.success}
          </p>
        )}

        <Button type="submit" size="lg" variant="accent" loading={pending}>
          {!pending && "Salva la vetrina"}
        </Button>
      </form>

      {/* Anteprima: stessi token della pagina reale, così non possono divergere. */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2.5 text-sm font-medium text-coffee-800">Anteprima</p>
        <div
          className="overflow-hidden rounded-2xl border border-coffee-100 shadow-(--shadow-card)"
          style={{ background: t.bg, color: t.fg }}
        >
          <div className="px-6 py-10 text-center">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full font-heading text-lg font-bold"
              style={{ background: t.accent, color: t.onAccent }}
            >
              {initials(name || "C")}
            </span>
            <p
              className="mt-4 text-xs font-medium uppercase tracking-wider"
              style={{ color: t.accent }}
            >
              Ciao, ti sta invitando {name || "…"}
            </p>
            <p className="mt-2 font-heading text-2xl font-bold">Anche tu per il caffè</p>
            {phrase && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: t.muted }}>
                {phrase}
              </p>
            )}
            <span
              className="mt-6 inline-flex rounded-full px-5 py-2 text-sm font-medium"
              style={{ background: t.accent, color: t.onAccent }}
            >
              Entra nella rete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
