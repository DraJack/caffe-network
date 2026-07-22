import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell, Prose } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Come funziona" };

export default function ChiSiamoPage() {
  return (
    <PageShell
      title="Il caffè, e le persone che lo portano in giro"
      intro="Caffè Network nasce da un'idea semplice: un buon caffè si racconta meglio di persona che con la pubblicità."
    >
      <Prose title="Cosa facciamo">
        <p>
          Selezioniamo miscele e single origin e li tostiamo in piccoli lotti, così il caffè arriva
          fresco invece che fermo in magazzino. Vendiamo online, direttamente, senza intermediari
          fra la torrefazione e la tua tazza.
        </p>
      </Prose>

      <Prose title="Perché una rete">
        <p>
          Il passaparola è sempre stato il modo migliore per far conoscere un caffè. Abbiamo deciso
          di riconoscerlo: chi ci presenta a qualcuno riceve una provvigione su quello che quella
          persona acquista davvero.
        </p>
        <p>
          Non c&apos;è nessuna quota d&apos;ingresso e non si guadagna iscrivendo persone: si guadagna
          soltanto su vendite reali di prodotto. Il piano completo è pubblicato, per intero, con i
          numeri veri.
        </p>
      </Prose>

      <Prose title="A che punto siamo">
        <p>
          Questa piattaforma è attualmente un <strong>ambiente dimostrativo</strong>: i pagamenti
          girano in modalità di test e il catalogo contiene prodotti di esempio. Stiamo completando
          gli adempimenti necessari prima dell&apos;apertura reale delle vendite.
        </p>
      </Prose>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild variant="accent">
          <Link href="/consulenti">
            Vedi il piano provvigionale
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalogo">Sfoglia il catalogo</Link>
        </Button>
      </div>
    </PageShell>
  );
}
