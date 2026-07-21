import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Segnala visivamente e per gli screen reader un campo non valido. */
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(
        "h-11 w-full rounded-xl border bg-white px-4 text-sm text-coffee-900 transition-all duration-200 placeholder:text-coffee-400 focus:outline-none focus:ring-2",
        error
          ? "border-red-400 focus:border-red-500 focus:ring-red-500/25"
          : "border-coffee-200 hover:border-coffee-300 focus:border-accent focus:ring-accent/30",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("mb-1.5 block text-sm font-medium text-coffee-800", className)}
    {...props}
  />
));
Label.displayName = "Label";
