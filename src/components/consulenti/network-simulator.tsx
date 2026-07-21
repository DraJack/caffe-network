"use client";

import * as React from "react";
import { Users, Layers, Info } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import {
  buildNetwork,
  formatCount,
  MAX_PER_PERSON,
  MIN_PER_PERSON,
} from "./network-math";
import { NetworkPyramid } from "./network-pyramid";

/* Il totale mensile è sempre un numero intero di euro (le tariffe sono in
   euro pieni), quindi i centesimi in un dato proiettato sono solo rumore. */
const euroWhole = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type Preset = { label: string; perPerson: number; depth: number };

const PRESETS: Preset[] = [
  { label: "Cauto", perPerson: 2, depth: 3 },
  { label: "Realistico", perPerson: 2, depth: 5 },
  { label: "Ambizioso", perPerson: 3, depth: 5 },
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Sul server non conosciamo la preferenza: assumiamo movimento consentito. */
function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/**
 * Anima un numero verso il target.
 * Rispetta "Riduci movimento": lì il valore si legge diretto dal target durante
 * il render, perché il CSS non può spegnere un'animazione fatta in JavaScript.
 */
function useCountUp(target: number, duration = 450): number {
  const [value, setValue] = React.useState(target);
  const valueRef = React.useRef(target);
  const reduce = usePrefersReducedMotion();

  React.useEffect(() => {
    if (reduce) return;

    const from = valueRef.current;
    if (from === target) return;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart, come --ease-out-quart
      const next = Math.round(from + (target - from) * eased);
      valueRef.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    // Se il target cambia a metà corsa, si riparte da dove eravamo (valueRef),
    // non dal vecchio punto di partenza: niente scatti all'indietro.
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);

  return reduce ? target : value;
}

type Props = {
  /** Tariffe per livello in centesimi, indicizzate da 0 (= livello 1). Da StoreConfig. */
  ratesCents: number[];
  minPayoutCents: number;
};

export function NetworkSimulator({ ratesCents, minPayoutCents }: Props) {
  const [perPerson, setPerPerson] = React.useState(2);
  const [depth, setDepth] = React.useState(ratesCents.length);

  const { rows, totalCents, totalPeople } = React.useMemo(
    () => buildNetwork(perPerson, depth, ratesCents),
    [perPerson, depth, ratesCents],
  );

  const shownCents = useCountUp(totalCents);
  const shownPeople = useCountUp(totalPeople);

  const monthsToPayout = totalCents > 0 ? Math.ceil(minPayoutCents / totalCents) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      {/* Su mobile i controlli vanno sopra: la leva deve essere la prima cosa
          che si incontra, altrimenti la piramide sembra un'immagine statica. */}
      <div className="order-2 lg:order-1">
        <div className="rounded-3xl border border-coffee-100 bg-white p-4 shadow-(--shadow-card) sm:p-6">
          <NetworkPyramid
            rows={rows}
            perPerson={perPerson}
            animationKey={`${perPerson}-${depth}`}
          />
        </div>

        {/* Il dettaglio per livello: è qui che il calcolo si può verificare riga per riga */}
        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li
              key={row.level}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-2.5 text-sm transition-colors duration-300 ${
                row.active
                  ? "border-coffee-100 bg-white text-coffee-700"
                  : "border-dashed border-coffee-100 bg-transparent text-coffee-400"
              }`}
            >
              <span className="w-20 shrink-0 font-medium text-coffee-900">
                Livello {row.level}
              </span>
              <span className="tabular-nums">{formatCount(row.people)} persone</span>
              <span className="text-coffee-400">·</span>
              <span className="tabular-nums">{formatEuro(row.rateCents)} a confezione</span>
              <span
                className={`ml-auto font-heading font-semibold tabular-nums ${
                  row.active ? "text-coffee-900" : "text-coffee-400"
                }`}
              >
                {row.active ? euroWhole.format(row.amountCents / 100) : "escluso"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pannello controlli + risultato */}
      <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
        <div className="rounded-3xl bg-coffee-900 p-6 text-cream shadow-(--shadow-hero)">
          <div className="space-y-5">
            <Slider
              id="per-person"
              icon={<Users className="h-4 w-4" />}
              label="Persone invitate a testa"
              value={perPerson}
              min={MIN_PER_PERSON}
              max={MAX_PER_PERSON}
              onChange={setPerPerson}
              valueText={`${perPerson} persone a testa`}
              display={String(perPerson)}
            />
            <Slider
              id="depth"
              icon={<Layers className="h-4 w-4" />}
              label="Livelli considerati"
              value={depth}
              min={1}
              max={ratesCents.length}
              onChange={setDepth}
              valueText={`${depth} livelli`}
              display={String(depth)}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const active = preset.perPerson === perPerson && preset.depth === depth;
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setPerPerson(preset.perPerson);
                    setDepth(preset.depth);
                  }}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.97] ${
                    active
                      ? "bg-accent text-coffee-950"
                      : "border border-coffee-700 text-coffee-200 hover:border-coffee-600 hover:text-cream"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Il guadagno e la rete che lo produce hanno peso tipografico
              comparabile di proposito: "993 €" senza "363 persone" accanto
              sarebbe una promessa, non una proiezione. */}
          <div
            className="mt-6 border-t border-coffee-800 pt-6"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="font-heading text-4xl font-bold tabular-nums text-accent">
              {euroWhole.format(shownCents / 100)}
              <span className="ml-1 text-lg font-normal text-coffee-300">/ mese</span>
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-cream">
              con {formatCount(shownPeople)} persone
            </p>
            <p className="text-sm text-coffee-300">attive nella tua rete</p>

            <p className="mt-4 text-xs leading-relaxed text-coffee-400">
              Ipotesi: 1 confezione al mese a persona e rete completa e attiva.
            </p>
          </div>

          {totalCents > 0 && (
            <p className="mt-4 rounded-xl bg-coffee-950/60 px-4 py-3 text-xs leading-relaxed text-coffee-200">
              {totalCents >= minPayoutCents ? (
                <>
                  Superi la soglia di prelievo di {formatEuro(minPayoutCents)} già dal primo
                  mese.
                </>
              ) : (
                <>
                  A questo ritmo raggiungi la soglia di prelievo di{" "}
                  {formatEuro(minPayoutCents)} in {monthsToPayout} mesi.
                </>
              )}
            </p>
          )}
        </div>

        <p className="flex gap-2.5 rounded-2xl border border-coffee-200 bg-coffee-50 px-4 py-3 text-xs leading-relaxed text-coffee-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-coffee-400" aria-hidden />
          <span>
            Proiezione teorica, non una previsione di guadagno. Nella realtà solo una parte
            della rete acquista ogni mese e la crescita non è mai uniforme.
          </span>
        </p>
      </div>
    </div>
  );
}

function Slider({
  id,
  icon,
  label,
  value,
  min,
  max,
  onChange,
  valueText,
  display,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  valueText: string;
  display: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm text-coffee-200">
          <span className="text-accent" aria-hidden>
            {icon}
          </span>
          {label}
        </label>
        <span className="font-heading text-lg font-semibold tabular-nums text-cream">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="range-accent"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
