import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStoreConfig } from "@/lib/config";
import { blendName, machineLabel, parseBlend, parsePack } from "@/lib/product";
import { productFaqs } from "@/lib/product-faq";
import { referralPathUrl } from "@/lib/referral";
import { getMachineOptions, getProductBySlug, parseSpecs } from "@/server/catalog";
import { getReferralCode } from "@/server/referral";
import { ProductDetail } from "@/components/product-detail";
import { TrustBadges } from "@/components/product/trust-badges";
import { BlendSheet } from "@/components/product/blend-sheet";
import { FaqList } from "@/components/ui/faq-list";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Prodotto" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, session] = await Promise.all([getProductBySlug(slug), auth()]);
  if (!product || !product.active || product.variants.length === 0) notFound();

  const userId = session?.user?.id;
  const [machines, config, referralCode] = await Promise.all([
    getMachineOptions(),
    getStoreConfig(),
    userId ? getReferralCode(userId) : null,
  ]);

  const blend = parseBlend(product.origin);
  const first = product.variants[0];
  const faqs = productFaqs({
    machine: machineLabel(product.name),
    pack: parsePack(first.name),
    flatShippingCents: config.flatShippingCents,
    freeShippingThresholdCents: config.freeShippingThreshold,
    priceCents: first.priceCents,
  });

  return (
    <ProductDetail
      slug={product.slug}
      name={product.name}
      description={product.description}
      origin={product.origin}
      blend={blend}
      roast={product.roastLevel}
      image={product.images[0] ?? null}
      categoryName={product.category?.name ?? null}
      variants={product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        priceCents: v.priceCents,
        stock: v.stock,
        image: v.image,
      }))}
      machines={machines.map((m) => ({ ...m, label: machineLabel(m.name) }))}
      freeShippingThresholdCents={config.freeShippingThreshold}
      shareUrl={referralCode ? referralPathUrl(`/prodotto/${product.slug}`, referralCode) : null}
      aside={
        <div className="space-y-4">
          <TrustBadges freeShippingThresholdCents={config.freeShippingThreshold} />
          <BlendSheet
            blendName={blendName(product.name)}
            blend={blend}
            roast={product.roastLevel}
            specs={parseSpecs(product.specs)}
          />
        </div>
      }
    >
      <section aria-labelledby="faq-prodotto" className="mt-20 max-w-3xl">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
            Domande frequenti
          </p>
          <h2 id="faq-prodotto" className="mt-2 font-heading text-3xl font-bold text-coffee-900">
            Prima di ordinare
          </h2>
        </Reveal>
        <div className="mt-8">
          <FaqList
            items={faqs.map((f) => ({
              q: f.q,
              a: (
                <>
                  <p>{f.a}</p>
                  {f.href && (
                    <Link
                      href={f.href.url}
                      className="mt-2 inline-block font-medium text-accent-dark underline underline-offset-2 hover:text-coffee-900"
                    >
                      {f.href.label}
                    </Link>
                  )}
                </>
              ),
            }))}
          />
        </div>
      </section>
    </ProductDetail>
  );
}
