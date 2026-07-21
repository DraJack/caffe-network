"use client";

import * as React from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; message: string; variant: ToastVariant };

const ToastContext = React.createContext<((message: string, variant?: ToastVariant) => void) | null>(
  null,
);

/** Hook per notificare l'esito di un'azione. Va usato dentro <ToastProvider>. */
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast va usato dentro <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <Check className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-white text-coffee-900 [&_[data-icon]]:bg-emerald-100 [&_[data-icon]]:text-emerald-700",
  error: "border-red-200 bg-white text-coffee-900 [&_[data-icon]]:bg-red-100 [&_[data-icon]]:text-red-700",
  info: "border-coffee-200 bg-white text-coffee-900 [&_[data-icon]]:bg-coffee-100 [&_[data-icon]]:text-coffee-700",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* aria-live: gli screen reader annunciano l'esito senza spostare il focus */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-xl border p-3 pr-2 shadow-(--shadow-lift) animate-slide-in-right",
              STYLES[t.variant],
            )}
          >
            <span data-icon className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
              {ICONS[t.variant]}
            </span>
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-1.5 text-coffee-400 transition-colors hover:bg-coffee-100 hover:text-coffee-700"
              aria-label="Chiudi notifica"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
