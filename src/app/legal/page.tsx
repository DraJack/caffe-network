import { PageShell, Prose } from "@/components/page-shell";

export const metadata = { title: "Termini e privacy" };

/**
 * Pagina informativa onesta, NON un documento legale definitivo.
 * Descrive i trattamenti realmente implementati nel codice; i punti che
 * richiedono un professionista sono segnalati esplicitamente.
 */
export default function LegalPage() {
  return (
    <PageShell
      title="Termini e privacy"
      intro="Cosa raccogliamo, perché, e cosa manca ancora prima dell'apertura reale delle vendite."
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        <strong className="block">Documento provvisorio.</strong>
        Caffè Network è al momento un ambiente dimostrativo: i pagamenti girano in modalità di test
        e non vengono evasi ordini reali. Le condizioni generali di vendita e l&apos;informativa
        privacy definitive verranno pubblicate, verificate da un professionista, prima
        dell&apos;apertura delle vendite. Quanto segue descrive come funziona oggi la piattaforma.
      </div>

      <Prose title="Dati che raccogliamo">
        <p>Per farti usare il servizio trattiamo:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Account</strong> — nome, email e password. La password non viene mai salvata in
            chiaro: ne conserviamo solo un hash.
          </li>
          <li>
            <strong>Ordini</strong> — indirizzo di spedizione e dettaglio degli articoli acquistati.
          </li>
          <li>
            <strong>Rete</strong> — chi ti ha invitato e chi hai invitato, per calcolare le
            provvigioni.
          </li>
          <li>
            <strong>Prelievi</strong> — intestatario e IBAN, richiesti solo quando chiedi un
            bonifico e conservati sulla singola richiesta di prelievo, non sul tuo profilo.
          </li>
        </ul>
      </Prose>

      <Prose title="Pagamenti">
        <p>
          I pagamenti sono gestiti da <strong>Stripe</strong>. I dati della tua carta vengono
          trasmessi direttamente a Stripe e non transitano né vengono conservati sui nostri
          sistemi. L&apos;autenticazione forte del cliente (3D Secure) è gestita da Stripe.
        </p>
      </Prose>

      <Prose title="Cookie">
        <p>Usiamo un numero minimo di cookie:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Sessione</strong> — necessario per tenerti collegato al tuo account.
          </li>
          <li>
            <strong>Carrello</strong> — necessario per conservare gli articoli che aggiungi.
          </li>
          <li>
            <strong>
              <code className="rounded bg-coffee-100 px-1.5 py-0.5 font-mono text-sm">cn_ref</code>
            </strong>{" "}
            — cookie di attribuzione commerciale. Quando arrivi da un link di invito registra il
            codice di chi ti ha invitato, per 30 giorni, così la provvigione può essere attribuita
            correttamente alla sua registrazione. Vale l&apos;ultimo link seguito. Il codice ti viene
            mostrato, già compilato, nel modulo di registrazione: puoi modificarlo o cancellarlo
            prima di registrarti.
          </li>
        </ul>
      </Prose>

      <Prose title="I tuoi diritti">
        <p>
          Puoi chiedere accesso, rettifica o cancellazione dei tuoi dati, e opporti al loro
          trattamento. Per esercitare questi diritti contattaci dall&apos;indirizzo email associato
          al tuo account.
        </p>
      </Prose>

      <Prose title="Il piano provvigionale">
        <p>
          Il piano è pubblicato per intero nella pagina dedicata, generato dai valori realmente in
          uso. Non è prevista alcuna quota d&apos;iscrizione e non si percepisce alcun compenso per
          il semplice reclutamento di nuove persone: le provvigioni maturano esclusivamente su
          acquisti reali di prodotto.
        </p>
      </Prose>

      <Prose title="Cosa manca">
        <p>
          Per trasparenza, ecco cosa deve ancora essere completato prima delle vendite reali: dati
          identificativi e P.IVA del venditore, condizioni generali di vendita, informativa privacy
          e cookie banner in forma definitiva, cifratura degli IBAN a riposo, fatturazione
          elettronica, e l&apos;inquadramento fiscale degli incaricati alle vendite.
        </p>
      </Prose>
    </PageShell>
  );
}
