"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 inline-flex animate-scale-in rounded-2xl bg-red-50 p-4 text-red-600">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-coffee-900">
        Non riusciamo a caricare i tuoi dati
      </h1>
      <p className="mt-3 max-w-md text-coffee-600">
        I tuoi ordini e le tue provvigioni sono al sicuro: si tratta di un problema temporaneo di
        caricamento.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => unstable_retry()} variant="accent">
          <RotateCw className="h-4 w-4" />
          Riprova
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>
    </div>
  );
}
