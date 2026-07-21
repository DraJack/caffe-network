import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** CTA opzionale: uno stato vuoto senza via d'uscita è un vicolo cieco. */
  action?: { label: string; href: string };
  className?: string;
};

/** Stato vuoto uniforme: icona, titolo, spiegazione e — quando ha senso — un'azione. */
export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-coffee-200 bg-white/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 inline-flex rounded-2xl bg-coffee-100 p-4 text-coffee-500">{icon}</div>
      )}
      <p className="font-heading text-lg font-semibold text-coffee-900">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-coffee-600">{description}</p>
      )}
      {action && (
        <Button asChild variant="accent" className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
