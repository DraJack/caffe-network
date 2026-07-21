import { ImageResponse } from "next/og";
import { getMiniSiteBySlug } from "@/server/consultant-profile";
import { SLUG_PATTERN } from "@/lib/slug";
import { initials, themeTokens } from "@/lib/mini-site";

export const alt = "Invito a Caffè Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Anteprima del link nelle chat e sui social. È la prima cosa che vede chi
 * riceve il link su WhatsApp, quindi conta quanto la pagina stessa.
 *
 * Vincoli di ImageResponse: solo stili inline (niente Tailwind), e i colori
 * devono essere valori letterali — per questo MINI_SITE_THEMES contiene hex
 * grezzi e non riferimenti alle variabili di globals.css. La gerarchia è
 * affidata a peso e dimensione: caricare Fraunces a ogni richiesta non vale
 * il costo in questa versione.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = SLUG_PATTERN.test(slug) ? await getMiniSiteBySlug(slug) : null;

  const displayName = profile?.displayName ?? "Caffè Network";
  const t = themeTokens(profile?.theme ?? "NOTTE");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: t.bg,
          color: t.fg,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 156,
            height: 156,
            borderRadius: "50%",
            background: t.accent,
            color: t.onAccent,
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          {initials(displayName)}
        </div>

        <div
          style={{
            marginTop: 44,
            fontSize: 30,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: t.accent,
          }}
        >
          Ti sta invitando
        </div>

        <div style={{ marginTop: 14, fontSize: 76, fontWeight: 700, textAlign: "center" }}>
          {displayName}
        </div>

        <div style={{ marginTop: 26, fontSize: 36, color: t.muted }}>
          Anche tu per il caffè · Caffè Network
        </div>
      </div>
    ),
    size,
  );
}
