import Link from "next/link";
import { PageShell, Prose } from "@/components/page-shell";
import { getStoreConfig } from "@/lib/config";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spedizioni e resi" };

export default async function SpedizioniPage() {
  // Costi e soglia vengono da StoreConfig: se l'admin li cambia,
  // questa pagina si aggiorna da sola.
  const config = await getStoreConfig();

  return (
    <PageShell
      title="Spedizioni e resi"
      intro="Costi, tempi e diritto di recesso, senza sorprese al checkout."
    >
      <Prose title="Costi di spedizione">
        <p>
          La spedizione costa {formatEuro(config.flatShippingCents)} ed è{" "}
          <strong>gratuita per ordini pari o superiori a {formatEuro(config.freeShippingThreshold)}</strong>.
          Nel carrello trovi sempre quanto manca alla soglia.
        </p>
        <p>Consegniamo in tutta Italia.</p>
      </Prose>

      <Prose title="Tempi di consegna">
        <p>
          Gli ordini vengono preparati nei giorni lavorativi. Poiché tostiamo in piccoli lotti, la
          preparazione può richiedere qualche giorno in più rispetto a un magazzino tradizionale:
          preferiamo spedirti caffè fresco.
        </p>
        <p>Puoi seguire lo stato del tuo ordine dalla sezione «I miei ordini» del tuo account.</p>
      </Prose>

      <Prose title="Diritto di recesso">
        <p>
          Per gli acquisti online hai diritto di recedere entro 14 giorni dalla consegna, secondo il
          Codice del Consumo. Il prodotto va restituito integro e nella confezione originale, non
          aperto: trattandosi di un alimento, le confezioni già aperte non possono essere accettate
          per ragioni igieniche.
        </p>
      </Prose>

      <Prose title="Prodotti danneggiati">
        <p>
          Se il pacco arriva danneggiato o il contenuto non corrisponde all&apos;ordine,
          scrivici entro pochi giorni dalla consegna allegando una foto: risolviamo con una
          sostituzione o un rimborso.
        </p>
      </Prose>

      <Prose title="Nota">
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Questa piattaforma è al momento un ambiente dimostrativo: i pagamenti sono in modalità di
          test e nessun ordine viene realmente spedito. Le condizioni definitive saranno pubblicate
          all&apos;apertura delle vendite. Vedi anche{" "}
          <Link href="/legal" className="font-medium underline">
            termini e privacy
          </Link>
          .
        </p>
      </Prose>
    </PageShell>
  );
}
