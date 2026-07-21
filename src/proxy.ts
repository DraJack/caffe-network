// In Next 16 il Middleware si chiama Proxy (src/proxy.ts, export `proxy`).
//
// Unico compito: catturare l'attribuzione referral in un cookie. Niente accesso
// al database — la documentazione Next lo sconsiglia esplicitamente qui, e la
// risoluzione del codice avviene comunque in fase di registrazione.
//
// Attribuzione LAST-TOUCH: l'ultimo link cliccato vince. Il codice viene poi
// prefillato in modo visibile nel form di registrazione, così l'utente vede da
// chi è stato invitato e può correggerlo.

import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, REF_COOKIE_MAX_AGE } from "@/lib/referral";

export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  const url = request.nextUrl;

  const fromQuery = url.searchParams.get("ref");
  const fromMiniSite = url.pathname.match(/^\/c\/([^/]+)\/?$/)?.[1];
  const value = fromQuery ?? fromMiniSite;

  if (value) {
    // Il valore si salva GREZZO (solo ripulito): può essere un codice invito
    // (CAFFE001) o uno slug di mini-sito (anna-bianchi), e i trattini dello slug
    // sono significativi. La normalizzazione avviene in resolveSponsorId.
    const code = value.trim();
    if (/^[A-Za-z0-9 _-]{1,64}$/.test(code)) {
      res.cookies.set(REF_COOKIE, code, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: REF_COOKIE_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
