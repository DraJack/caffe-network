"use client";

import * as React from "react";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Dimensione dell'icona nel fallback. */
  iconClassName?: string;
};

/**
 * Immagine prodotto con fallback grafico.
 * Prima si passava `src={image ?? ""}`, che mostrava l'icona di immagine rotta
 * del browser sia quando l'immagine mancava sia quando non caricava.
 */
export function ProductImage({ src, alt, className, iconClassName }: Props) {
  const [failed, setFailed] = React.useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-coffee-100 text-coffee-300",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <Coffee className={cn("h-1/3 w-1/3", iconClassName)} strokeWidth={1.25} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
