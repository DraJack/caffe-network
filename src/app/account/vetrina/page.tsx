import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { ensureConsultantProfile, DEFAULT_DISPLAY_NAME } from "@/server/consultant-profile";
import { miniSiteDisplayUrl, miniSiteUrl } from "@/lib/mini-site";
import { MiniSiteEditor } from "@/components/account/mini-site-editor";
import { MiniSiteShare } from "@/components/account/mini-site-share";

export const dynamic = "force-dynamic";
export const metadata = { title: "La mia vetrina" };

export default async function MiniSitePage() {
  const sessionUser = await requireUser();
  const profile = await ensureConsultantProfile(sessionUser.id);

  return (
    <div className="container-page py-10">
      <Link
        href="/account"
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-coffee-600 transition-colors hover:text-coffee-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Torna all&apos;account
      </Link>

      <h1 className="font-heading text-4xl font-bold tracking-tight text-coffee-900">
        La mia vetrina
      </h1>
      <p className="mt-2 max-w-2xl text-coffee-600">
        La pagina che vede chi apre il tuo link. Scegli come presentarti: il resto lo mettiamo noi.
      </p>

      <div className="mt-7">
        <MiniSiteShare
          url={miniSiteUrl(profile.slug)}
          displayUrl={miniSiteDisplayUrl(profile.slug)}
          slug={profile.slug}
        />
      </div>

      {profile.displayName === DEFAULT_DISPLAY_NAME && (
        <p className="mt-5 rounded-xl border border-accent/30 bg-accent/[0.06] px-4 py-3 text-sm text-coffee-700">
          La tua vetrina mostra ancora un nome generico. Scrivi il tuo qui sotto: chi riceve il
          link deve riconoscerti.
        </p>
      )}

      <div className="mt-10">
        <MiniSiteEditor
          displayName={profile.displayName}
          theme={profile.theme}
          tagline={profile.tagline}
        />
      </div>
    </div>
  );
}
