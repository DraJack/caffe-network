"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

type Props = Omit<ButtonProps, "onClick" | "asChild"> & {
  onConfirm: () => void;
  /** Testo del secondo step. Default: "Confermi?" */
  confirmLabel?: string;
  children: React.ReactNode;
};

/**
 * Conferma inline a due step per le azioni irreversibili.
 * Niente modale: il primo click arma, il secondo esegue, e dopo 4s si disarma da solo.
 */
export function ConfirmButton({
  onConfirm,
  confirmLabel = "Confermi?",
  children,
  className,
  variant = "ghost",
  ...props
}: Props) {
  const [armed, setArmed] = React.useState(false);

  React.useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      {...props}
      variant={armed ? "danger" : variant}
      className={cn(armed && "animate-pop", className)}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
