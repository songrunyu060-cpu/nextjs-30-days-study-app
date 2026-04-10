import { z } from "zod";
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const input = credentialsSchema.parse(raw);

        // `middleware` runs on Edge runtime; keep Node-only deps out of top-level imports.
        // Cache the dynamic imports so only the first sign-in pays the load cost.
        const load = (() => {
          let cached: null | Promise<{
            db: (typeof import("@/db"))["db"];
            userTable: (typeof import("@/schema/user.schema"))["userTable"];
            eq: (typeof import("drizzle-orm"))["eq"];
            argon2: typeof import("argon2");
          }> = null;

          return () =>
            (cached ??= Promise.all([
              import("@/db"),
              import("@/schema/user.schema"),
              import("drizzle-orm"),
              import("argon2"),
            ]).then(([dbMod, schemaMod, ormMod, argon2Mod]) => ({
              db: dbMod.db,
              userTable: schemaMod.userTable,
              eq: ormMod.eq,
              argon2: argon2Mod,
            })));
        })();

        const { db, userTable, eq, argon2 } = await load();

        const users = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, input.email))
          .limit(1);

        const user = users[0];
        if (!user?.passwordHash) return null;

        const ok = await argon2.verify(user.passwordHash, input.password);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.sub = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
