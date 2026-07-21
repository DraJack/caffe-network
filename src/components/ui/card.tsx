import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-2xl border bg-white transition-all duration-300", {
  variants: {
    variant: {
      flat: "border-coffee-100 shadow-(--shadow-soft)",
      elevated: "border-coffee-100 shadow-(--shadow-card)",
      /** Per le card cliccabili: si solleva al passaggio del mouse. */
      interactive:
        "border-coffee-100 shadow-(--shadow-card) hover:-translate-y-1 hover:border-coffee-200 hover:shadow-(--shadow-lift)",
      /** Bordo tratteggiato, per empty state e placeholder. */
      dashed: "border-dashed border-coffee-200 shadow-none",
    },
  },
  defaultVariants: { variant: "flat" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3 border-b border-coffee-100 p-5", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-heading text-lg font-semibold tracking-tight text-coffee-900", className)}
      {...props}
    />
  );
}

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-coffee-100 text-coffee-700",
        accent: "bg-accent/15 text-accent-dark",
        success: "bg-emerald-50 text-emerald-700",
        warning: "bg-amber-50 text-amber-700",
        danger: "bg-red-50 text-red-700",
        dark: "bg-coffee-800 text-cream",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { cardVariants, badgeVariants };
