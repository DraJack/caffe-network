import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getMiniSiteBySlug } from "@/server/consultant-profile";
import { getFeaturedProducts } from "@/server/catalog";
import { getStoreConfig } from "@/lib/config";
import { SLUG_PATTERN } from "@/lib/slug";
import { taglineText } from "@/lib/mini-site";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "@/components/product-card";
import { MiniSiteHero } from "@/components/mini-site/mini-site-hero";
import { MiniSitePlan } from "@/components/mini-site/mini-site-plan";

/**
 * Mini-sito consulente. Il cookie di attribuzione è già stato scritto da
 * src/proxy.ts: in Next 16 un Server Component non può impostare cookie.
 *
 * Eccezione deliberata alla convenzione di CLAUDE.md §7 (le pagine che leggono
 * dati sono dinamiche): qui non si legge né sessione né cookie, e con una
 * vetrina per utente queste pagine sono tante. La cache è ciò che rende
 * sostenibile anche una scansione degli slug.
 */
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

/** Guardia di formato: scarta gli slug impossibili prima di toccare il DB. */
async function loadProfile(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null;
  return getMiniSiteBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) return { title: "Vetrina non trovata" };

  const title = `${profile.displayName} ti invita in Caffè Network`;
  const description =
    taglineText(profile.tagline) ??
    "Caffè selezionato, tostato con cura. Registrati gratis, senza quote d'ingresso.";

  return {
    title,
    description,
    alternates: { canonical: `/c/${profile.slug}` },
    // noindex: migliaia di pagine quasi identiche sono il pattern delle doorway
    // page e penalizzerebbero l'intero dominio. Attenzione: NON aggiungere un
    // Disallow in robots.txt — bloccherebbe anche i crawler di WhatsApp e
    // Twitter, azzerando l'anteprima del link, cioè il senso di questa pagina.
    robots: { index: false, follow: true },
    openGraph: { title, description, type: "profile", url: `/c/${profile.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ConsultantSitePage({ params }: Props) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) notFound();

  const [products, config] = await Promise.all([getFeaturedProducts(3), getStoreConfig()]);

  return (
    <>
      <MiniSiteHero
        displayName={profile.displayName}
        theme={profile.theme}
        tagline={profile.tagline}
      />

      <MiniSitePlan config={config} />

      {products.length > 0 && (
        <section className="container-page py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
              Da cui iniziare
            </p>
            <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-coffee-900">
              Il caffè che trovi qui
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <Reveal key={product.slug} delay={i * 90}>
                <ProductCard {...product} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-coffee-100 bg-white/60">
        <div className="container-page py-16 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-coffee-900">
            Pronto a iniziare?
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/registrati">
                Crea il tuo account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/catalogo">Vai al catalogo</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-coffee-500">
            Registrandoti da questa pagina entri nella rete di {profile.displayName} (codice{" "}
            <span className="font-mono font-medium text-coffee-700">
              {profile.user.referralCode}
            </span>
            ).
          </p>
        </div>
      </section>
    </>
  );
}
