import { PrismaClient, RoastLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
// Path relativo (non l'alias "@/"): il seed gira fuori dal bundle Next.
// È il motivo per cui la logica provvigionale vive in un modulo puro.
import { computeCommissionSplit, commissionableUnits, MS_PER_DAY } from "../src/lib/commissions";
import { baseProfileSlug } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed in corso…");

  // Config store
  const config = await prisma.storeConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  // Admin
  const adminPass = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@caffenetwork.it" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@caffenetwork.it",
      name: "Admin",
      role: "ADMIN",
      referralCode: "CAFFEADM",
      passwordHash: adminPass,
      commissionAccount: { create: {} },
    },
  });

  // ── Catena unilevel a 6 nodi ──
  // Serve profonda 6 perché il livello 5 sia davvero esercitato:
  // consulente1 → consulente2 → … → consulente5 → acquirente.
  const demoPass = await bcrypt.hash("demo1234", 10);
  // I temi sono distribuiti apposta su tutte e tre le atmosfere: aprendo
  // /c/anna-bianchi, /c/luca-verdi e /c/sara-neri si vedono tutte senza
  // dover modificare nulla a mano.
  const catena = [
    {
      email: "consulente1@example.com",
      name: "Anna Bianchi",
      code: "CAFFE001",
      theme: "NOTTE",
      tagline: "QUOTIDIANO",
    },
    {
      email: "consulente2@example.com",
      name: "Luca Verdi",
      code: "CAFFE002",
      theme: "CREMA",
      tagline: "RISVEGLIO",
    },
    {
      email: "consulente3@example.com",
      name: "Sara Neri",
      code: "CAFFE003",
      theme: "TOSTATURA",
      tagline: "CONDIVISO",
    },
    {
      email: "consulente4@example.com",
      name: "Marco Gallo",
      code: "CAFFE004",
      theme: "NOTTE",
      tagline: "SCELTA",
    },
    {
      email: "consulente5@example.com",
      name: "Elena Costa",
      code: "CAFFE005",
      theme: "CREMA",
      tagline: "NESSUNA",
    },
    {
      email: "cliente@example.com",
      name: "Mario Rossi",
      code: "CAFFE006",
      theme: "NOTTE",
      tagline: "NESSUNA",
    },
  ] as const;

  const chainIds: string[] = [];
  for (const [i, u] of catena.entries()) {
    const sponsorId = i > 0 ? chainIds[i - 1] : undefined;
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { sponsorId, referralCode: u.code },
      create: {
        email: u.email,
        name: u.name,
        role: "CUSTOMER",
        passwordHash: demoPass,
        referralCode: u.code,
        sponsorId,
        commissionAccount: { create: {} },
      },
    });
    // Vetrina /c/[slug]: in produzione nasce con l'account, qui va creata a
    // mano perché gli utenti demo non passano da registerUser.
    const slug = baseProfileSlug(u.name, u.code);
    await prisma.consultantProfile.upsert({
      where: { userId: created.id },
      update: { slug, displayName: u.name, theme: u.theme, tagline: u.tagline },
      create: {
        userId: created.id,
        slug,
        displayName: u.name,
        theme: u.theme,
        tagline: u.tagline,
      },
    });

    chainIds.push(created.id);
  }
  const acquirenteId = chainIds[chainIds.length - 1];

  // Due referral extra sotto consulente1, così i conteggi per livello non sono banali.
  for (const extra of [
    { email: "referral-a@example.com", name: "Giulia Fabbri", code: "CAFFE010" },
    { email: "referral-b@example.com", name: "Paolo Moretti", code: "CAFFE011" },
  ]) {
    await prisma.user.upsert({
      where: { email: extra.email },
      update: { sponsorId: chainIds[0], referralCode: extra.code },
      create: {
        email: extra.email,
        name: extra.name,
        role: "CUSTOMER",
        passwordHash: demoPass,
        referralCode: extra.code,
        sponsorId: chainIds[0],
        commissionAccount: { create: {} },
      },
    });
  }

  // Ai due referral extra la vetrina non serve: restano gli unici utenti senza
  // profilo, così il percorso di creazione lazy resta testabile dopo il seed.

  // Categorie — la sola cosa che distingue i prodotti è il formato: l'etichetta della
  // scheda dice "Cialde" o "Capsule", non un generico "Cialde e Capsule".
  const categorie = [
    { slug: "cialde", name: "Cialde", position: 1 },
    { slug: "capsule", name: "Capsule", position: 2 },
  ];
  for (const c of categorie) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const cialde = await prisma.category.findUniqueOrThrow({ where: { slug: "cialde" } });
  const capsule = await prisma.category.findUniqueOrThrow({ where: { slug: "capsule" } });

  // Placeholder per i formati ancora senza foto: 3:2 come i banner reali,
  // così le schede del catalogo restano allineate.
  const img = (t: string) =>
    `https://placehold.co/1200x800/14120f/d8b988/png?text=${encodeURIComponent(t)}`;
  const photo = (file: string) => `/images/prodotti/${file}`;

  // È sempre la stessa miscela, la Gran Crema: descrizione e scheda condivise,
  // cambia solo la riga di compatibilità per formato.
  const PRICE_CENTS = 7000;
  // Il nome inizia già con "Gran Crema": qui solo la composizione, senza ripeterlo.
  // Tre righe (resa con whitespace-pre-line in scheda e pagina prodotto).
  const ORIGIN = "Miscela\n70% Robusta\n30% Arabica";
  const SPECS = [
    { label: "Retrogusto", value: "Rotondo" },
    { label: "Colore schiuma", value: "Marrone bruno" },
  ];
  // Pezzi per confezione: le cialde sono da 150, le capsule da 100.
  const PACK = { cialda: 150, capsula: 100 } as const;
  // Tre paragrafi separati da doppio a capo: lo slogan (reso in evidenza) riprende quello
  // stampato sulle foto, poi la miscela, poi compatibilità + confezione + nota sui marchi.
  // Nei nomi e nei testi i marchi altrui compaiono solo dopo "compatibili": citarli per
  // indicare la compatibilità è lecito, presentarli come nostri no.
  const desc = (format: "cialda" | "capsula", formatLine: string) =>
    `Il grande caffè, ${format === "cialda" ? "in una cialda di qualità" : "in una piccola capsula"}.` +
    `\n\nLa nostra miscela Gran Crema ha un carattere spiccato e incisivo, una straordinaria ` +
    `aromaticità e una crema vellutata. Più gusto, più energia, ogni giorno.` +
    `\n\n${formatLine} Confezione da ${PACK[format]} ${format === "cialda" ? "cialde" : "capsule"}. ` +
    `Marchi citati di proprietà dei rispettivi titolari, non affiliati a AS Life.`;
  const cialdaPack = `${PACK.cialda} cialde`;
  const capsulaPack = `${PACK.capsula} capsule`;

  type SeedProduct = {
    slug: string;
    name: string;
    description: string;
    origin?: string;
    roastLevel?: RoastLevel;
    featured?: boolean;
    images?: string[];
    variants: {
      sku: string;
      name: string;
      priceCents: number;
      stock: number;
      commissionUnits?: number;
      image?: string;
    }[];
  };

  // L'ordine dell'array È l'ordine di vetrina: diventa Product.position, usato sia in
  // homepage (i primi 4) sia nel catalogo. Cialde prima, poi Lavazza Firma e Blue.
  const prodottiCialde: SeedProduct[] = [
    {
      slug: "cialde-frog-44",
      name: "Gran Crema — Cialde compatibili Frog® 44 mm",
      description: desc(
        "cialda",
        "Cialde in carta filtro da 44 mm, compatibili con tutte le macchine Frog® didiesse " +
          "e con le macchine a cialda ESE.",
      ),
      featured: true,
      images: [photo("cialde-frog-44mm.webp")],
      variants: [{ sku: "CIA-FROG-44-150", name: cialdaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
    {
      slug: "cialde-frog-38",
      name: "Gran Crema — Cialde compatibili Frog® 38 mm",
      description: desc(
        "cialda",
        "Cialde in carta filtro da 38 mm, compatibili con tutte le macchine Frog® didiesse.",
      ),
      featured: true,
      images: [photo("cialde-frog-38mm.webp")],
      variants: [{ sku: "CIA-FROG-38-150", name: cialdaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
  ];

  const prodottiCapsule: SeedProduct[] = [
    {
      slug: "capsule-lavazza-firma",
      name: "Gran Crema — Capsule compatibili Lavazza Firma®",
      description: desc("capsula", "Compatibili con tutte le macchine Lavazza® Firma®."),
      featured: true,
      images: [photo("capsule-lavazza-firma.webp")],
      variants: [{ sku: "CAP-FIRMA-100", name: capsulaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
    {
      // Le macchine Lavazza In Black usano le capsule del sistema Lavazza Blue.
      slug: "capsule-lavazza-blue",
      name: "Gran Crema — Capsule compatibili Lavazza Blue® / In Black®",
      description: desc(
        "capsula",
        "Compatibili con i sistemi Lavazza® Blue® e con tutte le macchine Lavazza® In Black®, " +
          "ideali anche per l'ufficio.",
      ),
      featured: true,
      images: [photo("capsule-lavazza-blue-in-black.webp")],
      variants: [{ sku: "CAP-BLUE-100", name: capsulaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
    {
      slug: "capsule-a-modo-mio",
      name: "Gran Crema — Capsule compatibili A Modo Mio®",
      description: desc("capsula", "Compatibili con tutte le macchine Lavazza® A Modo Mio®."),
      images: [photo("capsule-lavazza-a-modo-mio.webp")],
      variants: [{ sku: "CAP-AMM-100", name: capsulaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
    {
      slug: "capsule-lavazza-point",
      name: "Gran Crema — Capsule compatibili Espresso Point®",
      description: desc("capsula", "Compatibili con tutte le macchine Lavazza® Espresso Point®."),
      images: [photo("capsule-espresso-point.webp")],
      variants: [{ sku: "CAP-POINT-100", name: capsulaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
    {
      slug: "capsule-nespresso",
      name: "Gran Crema — Capsule compatibili Nespresso®",
      description: desc("capsula", "Compatibili con tutte le macchine Nespresso®."),
      images: [photo("capsule-nespresso.webp")],
      variants: [{ sku: "CAP-NES-100", name: capsulaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
    {
      slug: "capsule-dolce-gusto",
      name: "Gran Crema — Capsule compatibili Dolce Gusto®",
      description: desc("capsula", "Compatibili con tutte le macchine Nescafé® Dolce Gusto®."),
      images: [photo("capsule-dolce-gusto.webp")],
      variants: [{ sku: "CAP-DG-100", name: capsulaPack, priceCents: PRICE_CENTS, stock: 150 }],
    },
    // Lavazza Bidose resta fuori finché non c'è la foto: per aggiungerlo basta una voce qui.
  ];

  const prodotti = [
    ...prodottiCialde.map((p) => ({ ...p, categoryId: cialde.id })),
    ...prodottiCapsule.map((p) => ({ ...p, categoryId: capsule.id })),
  ].map((p, position) => ({ origin: ORIGIN, roastLevel: "DARK" as const, position, ...p }));

  for (const p of prodotti) {
    const { variants, images, ...data } = p;
    const productImages = images?.length ? images : [img(p.name)];
    // featured esplicito anche quando assente: togliere un prodotto dall'evidenza
    // nel seed deve toglierlo anche dal database, non lasciarlo com'era.
    const fields = { ...data, featured: data.featured ?? false, images: productImages, specs: SPECS };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: fields,
      create: fields,
    });
    for (const v of variants) {
      const variant = { ...v, image: v.image ?? null };
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: { ...variant, productId: product.id },
        create: { ...variant, productId: product.id },
      });
    }
  }

  // Prune: il seed è la fonte di verità del catalogo. Rimuove prodotti/categorie non più
  // in lista (es. i placeholder demo). I ProductVariant cascadano; gli OrderItem storici
  // fanno SetNull mantenendo lo snapshot, quindi ordini e provvigioni restano intatti.
  await prisma.product.deleteMany({ where: { slug: { notIn: prodotti.map((p) => p.slug) } } });
  await prisma.category.deleteMany({ where: { slug: { notIn: categorie.map((c) => c.slug) } } });

  // ── Ordini demo con provvigioni ──
  // L'upline qui è nota (è la catena costruita sopra), quindi si risale con un
  // semplice walk in JS: la CTE ricorsiva serve solo a runtime.
  const uplineOf = (buyerId: string) => {
    const idx = chainIds.indexOf(buyerId);
    if (idx < 1) return [] as { userId: string; level: number }[];
    return chainIds
      .slice(Math.max(0, idx - 5), idx)
      .reverse()
      .map((userId, i) => ({ userId, level: i + 1 }));
  };

  // Prodotto di riferimento degli ordini demo.
  const signature = await prisma.productVariant.findUniqueOrThrow({
    where: { sku: "CAP-FIRMA-100" },
    include: { product: { select: { name: true } } },
  });

  const ordiniDemo = [
    // Consegnato 20 giorni fa ⇒ provvigioni già APPROVED (prelevabili).
    { id: "seed-order-1", quantity: 1, deliveredDaysAgo: 20 },
    // Consegnato ieri ⇒ ancora PENDING (finestra resi aperta).
    { id: "seed-order-2", quantity: 1, deliveredDaysAgo: 1 },
    // 3 confezioni ⇒ 30/6/6/6/9€: verifica che il piano scali col volume.
    { id: "seed-order-3", quantity: 3, deliveredDaysAgo: 25 },
  ];

  for (const o of ordiniDemo) {
    const subtotalCents = signature.priceCents * o.quantity;
    const deliveredAt = new Date(Date.now() - o.deliveredDaysAgo * MS_PER_DAY);
    const maturesAt = new Date(deliveredAt.getTime() + config.commissionMaturationDays * MS_PER_DAY);
    const matured = maturesAt.getTime() <= Date.now();

    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        userId: acquirenteId,
        email: "cliente@example.com",
        status: "DELIVERED",
        deliveredAt,
        createdAt: new Date(deliveredAt.getTime() - 3 * MS_PER_DAY),
        subtotalCents,
        shippingCents: 0,
        discountCents: 0,
        totalCents: subtotalCents,
        shippingName: "Mario Rossi",
        shippingLine1: "Via Roma 1",
        shippingCity: "Milano",
        shippingProvince: "MI",
        shippingPostal: "20100",
        items: {
          create: [
            {
              variantId: signature.id,
              name: `${signature.product.name} · ${signature.name}`,
              sku: signature.sku,
              priceCents: signature.priceCents,
              quantity: o.quantity,
              commissionUnits: signature.commissionUnits,
            },
          ],
        },
        payment: { create: { amountCents: subtotalCents, status: "SUCCEEDED" } },
      },
    });

    const upline = uplineOf(acquirenteId);
    const split = computeCommissionSplit({
      units: commissionableUnits([
        { commissionUnits: signature.commissionUnits, quantity: o.quantity },
      ]),
      basisCents: subtotalCents,
      levels: upline.map((u) => u.level),
      rules: config,
    });
    const byLevel = new Map(upline.map((u) => [u.level, u.userId]));

    for (const row of split) {
      const earnerId = byLevel.get(row.level);
      if (!earnerId) continue;
      const account = await prisma.commissionAccount.upsert({
        where: { userId: earnerId },
        update: {},
        create: { userId: earnerId },
      });
      // Upsert sulla chiave di idempotenza: rieseguire il seed non duplica nulla.
      await prisma.commission.upsert({
        where: { orderId_level: { orderId: o.id, level: row.level } },
        update: {},
        create: {
          accountId: account.id,
          orderId: o.id,
          buyerId: acquirenteId,
          level: row.level,
          units: row.units,
          rateCents: row.rateCents,
          amountCents: row.amountCents,
          reason: "ORDER",
          status: matured ? "APPROVED" : "PENDING",
          maturesAt,
          approvedAt: matured ? maturesAt : null,
        },
      });
    }
  }

  // Riallinea i saldi denormalizzati al ledger appena scritto.
  const accounts = await prisma.commissionAccount.findMany({ select: { id: true } });
  for (const a of accounts) {
    const rows = await prisma.commission.groupBy({
      by: ["status"],
      where: { accountId: a.id },
      _sum: { amountCents: true },
    });
    const sum = (s: string) => rows.find((r) => r.status === s)?._sum.amountCents ?? 0;
    await prisma.commissionAccount.update({
      where: { id: a.id },
      data: {
        pendingCents: sum("PENDING"),
        availableCents: sum("APPROVED"),
        requestedCents: 0,
        paidCents: sum("PAID"),
      },
    });
  }

  console.log("✅ Seed completato.");
  console.log("   Admin:       admin@caffenetwork.it / admin1234");
  console.log("   Consulenti:  consulente1..5@example.com / demo1234  (codici CAFFE001..005)");
  console.log("   Acquirente:  cliente@example.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
