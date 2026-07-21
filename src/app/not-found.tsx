import Link from "next/link";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6 animate-scale-in">
        <Coffee className="h-20 w-20 text-coffee-200" strokeWidth={1.25} />
      </div>
      <p className="font-heading text-6xl font-bold text-coffee-900">404</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold text-coffee-900">
        Questa pagina non esiste
      </h1>
      <p className="mt-3 max-w-sm text-coffee-600">
        Il link potrebbe essere vecchio o il prodotto non è più disponibile. Intanto, il caffè
        buono è di là.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="accent">
          <Link href="/catalogo">Vai al catalogo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>
    </div>
  );
}
