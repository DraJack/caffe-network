import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { miniSiteDisplayUrl, miniSiteUrl } from "@/lib/mini-site";
import { getStoreConfig } from "@/lib/config";
import { levelRateCents, COMMISSION_DEPTH } from "@/lib/commissions";
import { downlineCounts, downlineMembers } from "@/server/commissions";
import { ensureConsultantProfile } from "@/server/consultant-profile";
import { MiniSiteShare } from "@/components/account/mini-site-share";
import { ShareCode } from "@/components/account/share-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "La mia rete" };

export default async function NetworkPage() {
  const sessionUser = await requireUser();

  // ensureConsultantProfile crea la vetrina agli utenti registrati prima che
  // esistesse. È qui e non in /account perché questa è la pagina che si apre
  // *per* condividere: a regime è una findUnique su indice unique, in parallelo.
  const [user, profile, counts, members, config] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { referralCode: true, sponsor: { select: { name: true } } },
    }),
    ensureConsultantProfile(sessionUser.id),
    downlineCounts(sessionUser.id),
    downlineMembers(sessionUser.id),
    getStoreConfig(),
  ]);

  const countByLevel = new Map(counts.map((c) => [c.level, c.count]));
  const total = counts.reduce((s, c) => s + c.count, 0);
  const levels = Array.from({ length: COMMISSION_DEPTH }, (_, i) => i + 1);
  // Barra proporzionale: il livello più popoloso definisce il 100%.
  const maxCount = Math.max(1, ...levels.map((l) => countByLevel.get(l) ?? 0));

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
        La mia rete
      </h1>
      <p className="mt-2 max-w-2xl text-coffee-600">
        {total === 0
          ? "Non hai ancora nessuno nella tua rete. Condividi il link qui sotto per iniziare."
          : `${total} ${total === 1 ? "persona" : "persone"} nella tua rete su ${COMMISSION_DEPTH} livelli.`}
        {user.sponsor?.name && ` Sei stato invitato da ${user.sponsor.name}.`}
      </p>

      {/* Il link è l'azione chiave della pagina: va messa in evidenza.
          Il link della vetrina ha già l'attribuzione dentro, quindi è lui il
          primario; il codice resta per quando bisogna dettarlo a voce. */}
      <div className="mt-7 space-y-4">
        <MiniSiteShare
          url={miniSiteUrl(profile.slug)}
          displayUrl={miniSiteDisplayUrl(profile.slug)}
          slug={profile.slug}
        />
        <ShareCode code={user.referralCode} />
      </div>

      <h2 className="mt-12 font-heading text-2xl font-bold text-coffee-900">I tuoi livelli</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {levels.map((level, i) => {
          const count = countByLevel.get(level) ?? 0;
          return (
            <Reveal key={level} delay={i * 60}>
              <div className="h-full rounded-2xl border border-coffee-100 bg-white p-5 shadow-(--shadow-card)">
                <p className="text-sm text-coffee-500">Livello {level}</p>
                <p className="mt-1.5 font-heading text-3xl font-bold tabular-nums text-coffee-900">
                  {count}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-coffee-100">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700 ease-out-quart"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <p className="mt-2.5 text-xs text-coffee-500">
                  {formatEuro(levelRateCents(level, config))} a confezione
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <h2 className="mt-12 font-heading text-2xl font-bold text-coffee-900">Persone</h2>
      {members.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={<Users className="h-7 w-7" />}
          title="La tua rete è ancora vuota"
          description="Condividi il tuo link con chi apprezza il buon caffè: entreranno nella tua rete al primo acquisto."
          action={{ label: "Come funziona il piano", href: "/consulenti" }}
        />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-card)">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-coffee-50 text-left text-coffee-600">
              <tr>
                <th className="px-5 py-3.5 font-medium">Livello</th>
                <th className="px-5 py-3.5 font-medium">Nome</th>
                <th className="px-5 py-3.5 font-medium">Iscritto il</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {members.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-coffee-50/60">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-coffee-100 px-1.5 text-xs font-semibold text-coffee-700">
                      L{m.level}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-coffee-800">{m.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-coffee-600">
                    {m.createdAt.toLocaleDateString("it-IT")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {members.length >= 100 && (
        <p className="mt-3 text-sm text-coffee-500">
          Mostrate le prime 100 persone. I conteggi per livello qui sopra sono completi.
        </p>
      )}
    </div>
  );
}
