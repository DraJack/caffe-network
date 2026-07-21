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

  // Categorie — un solo caffè in più formati: basta una categoria.
  const categorie = [{ slug: "capsule", name: "Cialde e Capsule", position: 1 }];
  for (const c of categorie) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const capsule = await prisma.category.findUniqueOrThrow({ where: { slug: "capsule" } });

  // Prodotti placeholder — immagini via placehold.co (sostituibili)
  const img = (t: string) =>
    `https://placehold.co/800x800/4b2e1e/ffffff/png?text=${encodeURIComponent(t)}`;

  // È sempre la stessa miscela: descrizione condivisa + riga di compatibilità per formato.
  const ORIGIN = "Miscela Caffè Network · 80% Arabica / 20% Robusta";
  const desc = (formatLine: string) =>
    `Il nostro caffè: miscela 80% Arabica / 20% Robusta, tostatura media, corpo rotondo e ` +
    `crema densa con note di cacao e frutta secca. ${formatLine} Confezione da 150 pezzi. ` +
    `Marchi citati di proprietà dei rispettivi titolari, non affiliati a Caffè Network.`;

  const prodotti: Array<{
    slug: string;
    name: string;
    description: string;
    origin?: string;
    roastLevel?: RoastLevel;
    categoryId: string;
    featured?: boolean;
    imagePath?: string;
    variants: {
      sku: string;
      name: string;
      priceCents: number;
      stock: number;
      commissionUnits?: number;
    }[];
  }> = [
    {
      // Cialde in carta ESE: l'unico prodotto con due varianti (i due diametri standard).
      slug: "cialde-carta-ese",
      name: "Cialde in carta ESE 38/44 mm",
      description: desc(
        "In cialde di carta filtro nei diametri standard 44 mm e 38 mm, per macchine a cialda ESE.",
      ),
      origin: ORIGIN,
      roastLevel: "MEDIUM",
      categoryId: capsule.id,
      featured: true,
      imagePath: "/images/caffe-cialde.webp",
      variants: [
        { sku: "CIA-ESE-44", name: "44 mm (150 cialde)", priceCents: 5000, stock: 150 },
        { sku: "CIA-ESE-38", name: "38 mm (150 cialde)", priceCents: 5000, stock: 150 },
      ],
    },
    {
      // Prodotto di riferimento del piano provvigionale (50€ ⇒ 10/2/2/2/3 = 19€ distribuiti).
      slug: "capsule-nespresso",
      name: "Capsule compatibili Nespresso",
      description: desc(
        "In capsule autoprotette compatibili con le macchine Nespresso® per uso domestico.",
      ),
      origin: ORIGIN,
      roastLevel: "MEDIUM",
      categoryId: capsule.id,
      featured: true,
      variants: [{ sku: "CAP-NESP-150", name: "150 capsule", priceCents: 5000, stock: 150 }],
    },
    {
      slug: "capsule-dolce-gusto",
      name: "Capsule compatibili Dolce Gusto",
      description: desc("In capsule compatibili con i sistemi Nescafé® Dolce Gusto®."),
      origin: ORIGIN,
      roastLevel: "MEDIUM",
      categoryId: capsule.id,
      featured: true,
      variants: [{ sku: "CAP-DG-150", name: "150 capsule", priceCents: 5000, stock: 150 }],
    },
    {
      slug: "capsule-a-modo-mio",
      name: "Capsule compatibili Lavazza A Modo Mio",
      description: desc("In capsule compatibili con le macchine Lavazza® A Modo Mio®."),
      origin: ORIGIN,
      roastLevel: "MEDIUM",
      categoryId: capsule.id,
      featured: true,
      variants: [{ sku: "CAP-AMM-150", name: "150 capsule", priceCents: 5000, stock: 150 }],
    },
    {
      slug: "capsule-lavazza-point",
      name: "Capsule compatibili Lavazza Point",
      description: desc("In capsule compatibili con i sistemi Lavazza® Espresso Point®."),
      origin: ORIGIN,
      roastLevel: "MEDIUM",
      categoryId: capsule.id,
      variants: [{ sku: "CAP-POINT-150", name: "150 capsule", priceCents: 5000, stock: 150 }],
    },
    {
      slug: "capsule-lavazza-blue",
      name: "Capsule compatibili Lavazza Blue",
      description: desc(
        "In capsule compatibili con i sistemi Lavazza® Blue®, ideali anche per l'ufficio.",
      ),
      origin: ORIGIN,
      roastLevel: "MEDIUM",
      categoryId: capsule.id,
      variants: [{ sku: "CAP-BLUE-150", name: "150 capsule", priceCents: 5000, stock: 150 }],
    },
    {
      slug: "capsule-lavazza-bidose",
      name: "Capsule compatibili Lavazza Bidose",
      description: desc(
        "In capsule bi-dose compatibili con i sistemi Lavazza® Espresso Point® bi-dose.",
      ),
      origin: ORIGIN,
      roastLevel: "MEDIUM",
      categoryId: capsule.id,
      variants: [{ sku: "CAP-BIDOSE-150", name: "150 capsule", priceCents: 5000, stock: 150 }],
    },
  ];

  for (const p of prodotti) {
    const { variants, imagePath, ...data } = p;
    const imageUrl = imagePath || img(p.name);
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...data, images: [imageUrl] },
      create: { ...data, images: [imageUrl] },
    });
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: { ...v, productId: product.id },
        create: { ...v, productId: product.id },
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

  const signature = await prisma.productVariant.findUniqueOrThrow({
    where: { sku: "CAP-NESP-150" },
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
              name: `Capsule compatibili Nespresso — ${signature.name}`,
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
