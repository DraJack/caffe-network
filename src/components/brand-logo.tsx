import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * I PNG del logo hanno lo sfondo trasparente ma contengono l'alone dorato:
 * sono pensati per fondi neri. Su fondo chiaro vanno dentro una superficie
 * scura (vedi auth-form), altrimenti l'alone diventa uno sporco grigio.
 */

/** Monogramma "AS" dorato, senza scritte. */
export function BrandMonogram({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/as-monogram.png"
      alt=""
      width={608}
      height={366}
      sizes="96px"
      className={cn("h-10 w-auto", className)}
    />
  );
}

/** Marchio orizzontale per header e footer: monogramma + "LIFE". */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMonogram />
      <span className="text-gold text-sm font-semibold tracking-[0.34em]">LIFE</span>
    </span>
  );
}

/** Logo completo, con payoff: solo dove c'è spazio per leggerlo. */
export function BrandLogo({ className, preload }: { className?: string; preload?: boolean }) {
  return (
    <Image
      src="/brand/as-life-logo.png"
      alt="AS Life — La vita, alle tue condizioni."
      width={710}
      height={638}
      sizes="(min-width: 768px) 420px, 260px"
      preload={preload}
      className={cn("h-auto w-full", className)}
    />
  );
}

/** Il filetto con chicco del logo, riusato come separatore di sezione. */
export function BeanDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-3 text-accent", className)}>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-accent/70" />
      <svg viewBox="0 0 24 24" className="h-4 w-4 rotate-[25deg]" fill="currentColor">
        <path d="M11 3C6.6 3.5 3.5 7.4 3.5 12c0 4.7 3.2 8.6 7 9 .9-2.700-.2-4.800-1.300-6.900-1.200-2.300-2.400-4.700-1.300-7.800C8.600 4.900 9.700 3.700 11 3Zm2 18c4.400-.5 7.500-4.400 7.500-9 0-4.700-3.200-8.600-7-9-.9 2.700.2 4.800 1.300 6.900 1.200 2.300 2.400 4.700 1.300 7.800-.7 1.400-1.800 2.600-3.100 3.300Z" />
      </svg>
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-accent/70" />
    </div>
  );
}
