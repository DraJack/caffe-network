# ☕ Caffè Network

E-commerce di caffè con programma punti e fondamenta per il network marketing (MLM unilevel).
Piattaforma custom **Next.js 16 + Prisma + PostgreSQL + Stripe**. Fase 1 (MVP e-commerce).

Documentazione completa per lo sviluppo: **[CLAUDE.md](./CLAUDE.md)**.

## Avvio rapido

```bash
# 1. Dipendenze
npm install

# 2. Ambiente — copia e compila le variabili
cp .env.example .env
#   - DATABASE_URL  → crea un DB gratuito su https://neon.tech
#   - AUTH_SECRET   → npx auth secret
#   - STRIPE_*      → chiavi TEST dal dashboard Stripe (opzionali: senza, il checkout va in modalità demo)

# 3. Database: schema + dati di esempio
npm run db:push
npm run db:seed

# 4. Sviluppo
npm run dev        # http://localhost:3000
```

**Login di prova:**
- Admin → `admin@caffenetwork.it` / `admin1234` (pannello su `/admin`)
- Cliente → `cliente@example.com` / `cliente1234`

## Cosa c'è già (Fase 1)

- 🛍️ Storefront: home, catalogo con filtri, pagina prodotto con varianti, carrello
- 💳 Checkout con Stripe (test) + webhook, con fallback demo senza chiavi
- ⭐ Programma punti: accumulo all'acquisto + riscatto come sconto (ledger completo)
- 👤 Account cliente: ordini, movimenti punti, codice consulente (albero unilevel)
- 🛠️ Admin: dashboard, gestione prodotti/varianti, ordini, utenti, impostazioni store

## Verifica

```bash
npm run typecheck   # tipi OK
npm run build       # build OK
```

Test end-to-end del checkout: aggiungi al carrello → checkout → carta test Stripe
`4242 4242 4242 4242` → l'ordine passa a `PAID`, i punti vengono accreditati.

Vedi **[CLAUDE.md](./CLAUDE.md)** per architettura, regole di dominio, roadmap e note legali.
