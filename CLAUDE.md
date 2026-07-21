@AGENTS.md

# CLAUDE.md — Caffè Network

Guida di progetto per Claude Code (e per il team). Leggila prima di lavorare sul codice.

---

## 1. Cos'è

Piattaforma **e-commerce + network marketing** per la vendita di caffè, con piano provvigionale
MLM unilevel. **Fase 1 e Fase 2 sono attive.**

| Fase | Contenuto | Stato |
|------|-----------|-------|
| **1 — MVP e-commerce** | Catalogo, carrello, checkout, account | ✅ Attiva |
| **2 — Consulenti/Networker** | Provvigioni unilevel a 5 livelli, dashboard rete, link invito, mini-siti, prelievi | ✅ Attiva |
| 3 — Community | LMS formazione, AI Coach | 🔜 Predisposto |

> **Il sistema punti è stato rimosso** (luglio 2026) e sostituito dalle provvigioni: non servivano
> due valute parallele. Non reintrodurre `PointsAccount` / `PointsTransaction`.

Principio guida: **lo schema dati nasce "future-proof"**. `ResellerProfile` esiste già per il B2B
ma la sua *logica* verrà attivata più avanti, senza rifacimenti.

---

## 2. Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (config CSS-first in `src/app/globals.css`, token brand `coffee-*`, `accent`, `cream`)
- **PostgreSQL** (consigliato [Neon](https://neon.tech)) + **Prisma 6** ORM
- **Auth.js (NextAuth v5)** — credenziali email/password, sessioni JWT, campo `role`
- **Stripe** (test mode) — Checkout Session + webhook; con **fallback demo** se le chiavi non sono configurate
- Deploy target: **Vercel**

> Nota: Prisma è volutamente fissato alla **v6** (la v7 richiede driver adapter e `prisma.config.ts`).
> Non aggiornare a Prisma 7 senza migrare la configurazione datasource.

---

## 3. Comandi

```bash
npm run dev          # sviluppo (http://localhost:3000)
npm run build        # build di produzione
npm run start        # avvia il build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint

npm run db:generate  # genera il Prisma Client
npm run db:migrate   # crea/applica migrazioni (dev)
npm run db:push      # sincronizza lo schema senza migrazioni (rapido)
npm run db:seed      # popola dati placeholder (prodotti, admin, cliente)
npm run db:studio    # Prisma Studio (GUI dati)
```

---

## 4. Setup ambiente (per far girare tutto)

1. **Database**: crea un progetto gratuito su Neon → copia la connection string.
2. Copia `.env.example` in `.env` e in `.env.local`, poi compila:
   - `DATABASE_URL` (Neon)
   - `AUTH_SECRET` → genera con `npx auth secret`
   - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (chiavi **test** dal dashboard Stripe)
   - `STRIPE_WEBHOOK_SECRET` (vedi punto 5)
3. Applica lo schema e popola: `npm run db:push && npm run db:seed`
4. Avvia: `npm run dev`
5. **Webhook Stripe in locale** (per pagamenti reali di test):
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copia il `whsec_...` mostrato in `STRIPE_WEBHOOK_SECRET`.

> **Modalità demo**: se `STRIPE_SECRET_KEY` resta il placeholder, il checkout **simula** il
> pagamento e marca l'ordine come pagato (utile per testare il flusso senza chiavi Stripe).

Serve inoltre `CRON_SECRET` (maturazione provvigioni, vedi §6) e `NEXT_PUBLIC_SITE_URL`
(usato nei link di invito).

**Utenti di seed** (catena a 6 nodi, così il livello 5 è davvero esercitato):
- Admin — `admin@caffenetwork.it` / `admin1234`
- Consulenti — `consulente1..5@example.com` / `demo1234` (codici `CAFFE001`…`CAFFE005`)
- Acquirente — `cliente@example.com` / `demo1234` (in fondo alla catena)

`consulente1 → consulente2 → … → consulente5 → cliente`, più due referral extra sotto
`consulente1`. Il seed crea 3 ordini demo con provvigioni già maturate.

---

## 5. Struttura del codice

```
prisma/schema.prisma        Modello dati (attivo + predisposto). Fonte di verità del dominio.
prisma/seed.ts              Dati placeholder.
src/lib/                    Utilità condivise:
  prisma.ts                 Singleton Prisma Client
  auth.ts                   Config NextAuth (handlers, auth, signIn, signOut)
  guards.ts                 requireUser() / requireAdmin()
  stripe.ts                 Client Stripe + flag STRIPE_ENABLED
  commissions.ts            Calcolo provvigioni — PURO, niente DB (importato anche dal seed)
  referral.ts               Codici invito leggibili + costanti cookie
  slug.ts                   Slug del mini-sito: riservati + baseProfileSlug() (importato dal seed)
  mini-site.ts              Temi, frasi, iniziali, URL vetrina — hex grezzi, li usa anche next/og
  config.ts                 StoreConfig (spedizione + piano provvigionale) con default
  utils.ts                  cn(), formatEuro(), slugify()
src/server/                 Logica server (solo lato server):
  catalog.ts                Query catalogo
  cart.ts                   Lettura carrello (cookie + DB)
  orders.ts                 createOrderFromCart(), markOrderPaid() ← cuore transazionale
  commissions.ts            findUpline() e downline via CTE ricorsiva, maturazione, saldi
  referral.ts               resolveSponsorId(), getSponsorPreview(), allocateReferralCode()
  consultant-profile.ts     ensureConsultantProfile() (creazione lazy), slug liberi, getMiniSiteBySlug()
src/proxy.ts                Cattura del cookie referral (in Next 16 il middleware si chiama così)
src/app/actions/            Server Actions ("use server"): cart, auth, checkout, admin,
                            commissions (prelievi), mini-site (vetrina), logout
src/app/                    Route App Router (vedi sotto)
src/components/             Componenti UI e di dominio (ui/ = primitive)
```

**Route principali:**
- Pubbliche: `/` `/catalogo` `/prodotto/[slug]` `/carrello` `/checkout` `/checkout/success` `/consulenti` `/c/[slug]`
- Auth: `/login` `/registrati`
- Account: `/account` + `/ordini` `/rete` `/vetrina` `/provvigioni`
- Admin (`role=ADMIN`): `/admin` + `/prodotti` `/ordini` `/utenti` `/provvigioni` `/payout` `/impostazioni`
- API: `/api/auth/[...nextauth]`, `/api/stripe/webhook`, `/api/cron/commissions`

---

## 6. Regole di dominio

**Provvigioni (Fase 2) — il cuore del sistema.**

Piano **unilevel a 5 livelli**, importo **fisso per confezione acquistata** (non percentuale):
L1 10€ · L2 2€ · L3 2€ · L4 2€ · L5 3€ ⇒ 19€ su un ordine da 50€ (38%). Scala col volume:
3 confezioni ⇒ 30/6/6/6/9€. Le tariffe stanno in `StoreConfig` e sono modificabili da admin.

- **Chi guadagna:** *tutti* gli utenti registrati con una downline. Nessun gate di ruolo, nessuna
  quota d'iscrizione. `ConsultantProfile` (il mini-sito) nasce automaticamente con l'account.
- **Unità provvigionabili:** `ProductVariant.commissionUnits` (0 = accessorio escluso, 2 = bundle),
  **snapshottato** su `OrderItem` perché modificare una variante non riscriva lo storico.
- **Tetto di sicurezza:** `maxCommissionPercent` (40%) del netto ordine. Oggi non scatta mai
  (nessuno sconto attivo), ma protegge il margine se torneranno i coupon. Lo scaling è
  proporzionale con redistribuzione dei centesimi: `sum(amount) === min(gross, cap)` **sempre**.
- **Ciclo di vita:** `PENDING → APPROVED → PAID`, più `REVERSED`.
  Nasce PENDING all'ordine pagato; diventa APPROVED `commissionMaturationDays` (14) giorni dopo la
  consegna. Se l'admin non segna mai `DELIVERED`, matura comunque dopo `commissionFallbackDays` (45)
  giorni dal pagamento: **la consegna può solo anticipare la maturazione, mai bloccarla.**
- **Ledger + cache:** `Commission` è immutabile; i 4 bucket su `CommissionAccount` sono una **cache
  per la UI**. La fonte di verità è sempre la somma del ledger — ogni operazione che sposta denaro
  chiama `recomputeCommissionBalances`. In `/admin/provvigioni` c'è un pulsante di riallineamento.
- **Idempotenza:** vincolo `@@unique([orderId, level])` — in un unilevel esiste un solo beneficiario
  per livello. Un webhook Stripe duplicato non può generare provvigioni doppie.
- **Risalita upline:** CTE ricorsiva in `findUpline()`, non 5 query sequenziali (la transazione di
  `markOrderPaid` è già carica e gira su Neon serverless). Postgres protegge da cicli con l'array `path`;
  l'acquirente è il seme del path, quindi **non può mai guadagnare dal proprio ordine**.
- **Prelievi:** wallet interno + bonifico manuale. `requestPayout` matura le provvigioni scadute
  *dentro la propria transazione* prima di calcolare il disponibile, così un cron saltato non può
  bloccare né sottopagare un prelievo. Una sola richiesta aperta per volta.

**Ordini:** `PENDING → PAID → SHIPPED → DELIVERED` (o `CANCELLED`).
- `createOrderFromCart` ricalcola **sempre** i totali lato server e svuota il carrello.
- `markOrderPaid` è **idempotente** (agisce solo su `PENDING`): scala stock, matura le provvigioni
  dell'upline, chiude il pagamento. Chiamata dal webhook Stripe o dal fallback demo.
- `updateOrderStatus` (admin) **non è un semplice update**: su `DELIVERED` stampa `deliveredAt` e
  anticipa la maturazione; su `CANCELLED` ripristina lo stock, storna le provvigioni non liquidate e
  **ricalcola le richieste di prelievo aperte** che le contenevano. Le righe già `PAID` non si
  stornano (il denaro è uscito): l'admin riceve un avviso esplicito.

**Mini-sito `/c/[slug]` — la vetrina personale.**

Ogni utente ne riceve una alla registrazione, già attiva: la `create` di `registerUser` è annidata
(utente + conto provvigioni + vetrina insieme). Gli utenti registrati prima esistono ancora senza
profilo, quindi `ensureConsultantProfile()` lo crea alla prima apertura di `/account/rete` o
`/account/vetrina` — **niente script di backfill**.

- **Lo slug è immutabile.** Generato dal nome (`baseProfileSlug`), collisioni con suffisso `-2`.
  Non è modificabile perché un link già mandato in chat deve continuare a funzionare. Il pre-check
  su unicità è un'ottimizzazione: l'arbitro è il vincolo `@unique`, e il retry su `P2002` chiude
  usando il `referralCode` come slug, unico per costruzione.
- **Personalizzabile solo nome + tema + frase.** ⚠️ **Nessun campo di testo libero**, e non va
  reintrodotto: una bio libera su pagina pubblica aprirebbe a promesse di guadagno impossibili da
  moderare (L. 173/2005). Le frasi sono un enum scritto da noi. `slug` **non compare** nello schema
  Zod di `updateMiniSite`: l'immutabilità è imposta al confine dei dati, non nascondendo il campo.
- **Temi via CSS custom properties**, non varianti di classe: un solo percorso JSX per tutte e tre
  le atmosfere, così è strutturalmente impossibile che una diverga per tipografia o spaziature.
  I valori in `src/lib/mini-site.ts` sono **hex grezzi** perché `next/og` renderizza fuori dal
  documento e non vede `globals.css`.
- **La pagina è cachata** (`revalidate = 3600`), eccezione deliberata a §7: non legge né sessione né
  cookie. Con una vetrina per utente è ciò che rende sostenibile una scansione degli slug, insieme
  alla guardia di formato prima della query.
- **`noindex, follow`.** Migliaia di pagine quasi identiche sono il pattern delle doorway page.
  ⚠️ **Non aggiungere `Disallow: /c/` a un robots.txt**: bloccherebbe anche i crawler di WhatsApp e
  Twitter, azzerando l'anteprima del link — cioè il senso stesso della funzionalità.
- **`bio` resta in tabella ma è morta** (`@deprecated`, sempre NULL, nessun read). Va rimossa in un
  secondo momento, quando conviene pagare il prompt distruttivo di `db:push`.

**Attribuzione referral:** `src/proxy.ts` (in Next 16 il middleware si chiama **proxy**) salva il
codice da `?ref=` o `/c/[slug]` nel cookie `cn_ref`, **last-touch**, 30 giorni. Il cookie non può
essere scritto da un Server Component: in Next 16 `cookies().set()` non è ammesso in fase di render.
Il cookie contiene il valore **grezzo** del link (codice o slug): `/registrati` lo risolve con
`getSponsorPreview()` e mostra *«Ti sta invitando Anna Bianchi»*, precompilando il campo con il
`referralCode` **canonico** — mai lo slug, che nel campo "Codice invito" sembrerebbe sbagliato.
Un codice *digitato* inesistente dà errore; un cookie *scaduto* viene ignorato in silenzio e non
mostra alcun saluto (non deve mai bloccare una registrazione).

**Ruoli:** `CUSTOMER | CONSULTANT | RESELLER | ADMIN`. Attivi CUSTOMER e ADMIN — le provvigioni
non dipendono dal ruolo. ⚠️ Le sessioni sono **JWT**: un cambio ruolo non si propaga fino al
re-login, quindi non fidarsi di `session.user.role` per decisioni sul denaro.

**Maturazione automatica:** `GET /api/cron/commissions`, protetta da `CRON_SECRET`, schedulata
alle 03:00 in `vercel.json`.

---

## 7. Convenzioni

- **Prezzi in centesimi** (interi), mai float. Formattazione con `formatEuro()`.
- Mutazioni dati → **Server Actions** in `src/app/actions/*`, con validazione **Zod**.
- Query di sola lettura → helper in `src/server/*` (import `"server-only"`).
- Le pagine che leggono dati/sessione sono **dinamiche** (`export const dynamic = "force-dynamic"` o uso di `auth()`).
- Immagini prodotto: attualmente placeholder (`placehold.co`); si usano `<img>` semplici (nessuna config `next/image` per host remoti).
- UI: componenti e testi in italiano, palette `coffee-*` / `accent` / `cream`.

---

## 8. Compliance (checklist, NON consulenza legale)

Da affrontare prima del go-live reale (serve P.IVA):
- **L. 173/2005** (vendita diretta / MLM): il piano è basato su vendite reali e non prevede alcuna
  quota d'iscrizione né guadagno dal reclutamento — la posizione è solida, ma va mantenuta tale.
- **Piano provvigionale trasparente**: pubblicato in `/consulenti`, generato dai valori reali di
  `StoreConfig`. ⚠️ Se cambi le tariffe da admin, la pagina si aggiorna da sola: **non scrivere
  numeri a mano** in quella pagina.
- **Inquadramento fiscale degli incaricati**: chi supera le soglie di provvigione ha obblighi
  fiscali propri (ritenuta d'acconto, eventuale P.IVA). Da definire con un commercialista.
- **IBAN**: raccolto su `PayoutRequest` (non su `User`) per poterlo purgare su richiesta GDPR.
  Va cifrato a riposo prima del go-live e citato nell'informativa privacy.
- **GDPR** + cookie banner: il cookie `cn_ref` è di attribuzione commerciale, va dichiarato.
- **PSD2 / SCA**: gestita da Stripe (3D Secure).
- **IVA** e **fatturazione elettronica (SdI)**: da integrare al go-live.
- Termini di vendita, diritto di recesso, resi.

**Margine.** 38% di payout è alto: va verificato contro il costo reale del prodotto (caffè +
packaging + spedizione + ~1,5% Stripe). Il tetto al 40% protegge dai casi limite, **non** dal
margine strutturale.

---

## 9. Roadmap prossimi passi

**Completare Fase 1:** creazione/modifica prodotti da admin + upload immagini; email transazionali
(Resend); pagina indirizzi salvati; abbonamenti ricorrenti (Stripe Subscriptions); pagine legali.

**Rifinire Fase 2:**
- **Auto-`DELIVERED`** N giorni dopo `SHIPPED`. Oggi lo stato è manuale: è il principale rischio
  operativo, mitigato ma non eliminato dal fallback a 45 giorni.
- **Chargeback Stripe** (fino a 120 giorni): la maturazione a 14 giorni copre il recesso ordinario,
  non il chargeback. Valutare una riserva o una finestra più lunga.
- **Mini-sito**: foto profilo (oggi solo iniziali — serve prima l'upload immagini), e una UI admin
  per disattivare una vetrina abusiva (`active` esiste, il pulsante no). Attenzione: disattivare un
  profilo fa smettere di risolvere i cookie di attribuzione ancora in volo — comportamento corretto,
  ma va detto a chi preme il pulsante.
- **Email**: notifica al consulente quando una provvigione matura o un prelievo viene pagato.
- **Checkout ospite**: `Order.userId` è nullable, quindi un acquisto da ospite non genera
  provvigioni. Sconsigliato il matching per email (attribuzione ambigua) — meglio spiegarlo in UI.
- **Cancellazione utente**: la self-relation `Downline` è `SetNull`, quindi eliminare un nodo
  intermedio **orfana l'intero sottoalbero**. Valutare un soft-delete prima del go-live.
- Payout automatici via **Stripe Connect** (oggi bonifico manuale).

Aggiorna questa sezione e la tabella in §1 quando lo stato cambia.
