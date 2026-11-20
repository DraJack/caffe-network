import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// auth() viene chiamato più volte per richiesta (header, footer, pagina):
// cache() fa una sola query per richiesta.
const findSessionUser = cache((id: string) =>
  prisma.user.findUnique({ where: { id }, select: { role: true } }),
);

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        return token;
      }

      // Il JWT vive 30 giorni ma l'utente può sparire prima (reset del DB,
      // cancellazione account). Senza questo controllo il cookie continua a
      // dire "loggato" con un id inesistente: /account va in errore e
      // aggiungere al carrello viola Cart_userId_fkey. Restituire null fa
      // invalidare la sessione ad Auth.js, che cancella il cookie.
      if (typeof token.id !== "string") return null;
      try {
        const current = await findSessionUser(token.id);
        if (!current) return null;
        // Il ruolo si rilegge dal DB: un cambio ruolo vale subito, senza re-login.
        token.role = current.role;
      } catch {
        // DB irraggiungibile: non buttare fuori tutti per un problema
        // temporaneo. Si tiene il token com'è; la pagina gestirà l'errore.
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
