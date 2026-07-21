import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-[var(--ease-out-quart)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-coffee-800 text-cream shadow-(--shadow-soft) hover:bg-coffee-900 hover:shadow-(--shadow-lift)",
        accent:
          "bg-accent text-coffee-900 shadow-(--shadow-soft) hover:bg-accent-dark hover:shadow-(--shadow-accent)",
        outline:
          "border border-coffee-300 text-coffee-800 hover:border-coffee-400 hover:bg-coffee-100",
        ghost: "text-coffee-800 hover:bg-coffee-100",
        danger: "bg-red-600 text-white shadow-(--shadow-soft) hover:bg-red-700",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Rende il figlio (es. un <Link>) invece di un <button>, conservando gli stili.
   *  Evita di annidare un <button> dentro un <a>, che non è HTML valido. */
  asChild?: boolean;
  /** Mostra lo spinner e disabilita il bottone. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    // asChild: clona l'unico figlio (tipicamente <Link>) fondendo le classi.
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
