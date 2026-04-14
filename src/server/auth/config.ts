import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { env } from "@/lib/env";
import { db } from "@/server/db";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const isGoogleProviderEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
if (!isGoogleProviderEnabled && process.env.NODE_ENV === "development") {
  console.warn(
    "[auth][warn] Google provider disabled. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to enable it.",
  );
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "Email Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        console.info("[auth][credentials] authorize invoked");
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[auth][credentials] Invalid credentials payload.");
          }
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);
        if (!user) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[auth][credentials] User not found:", parsed.data.email);
          }
          return null;
        }

        if (!user.passwordHash) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[auth][credentials] User has no password set:", parsed.data.email);
          }
          return null;
        }
        const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!validPassword) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[auth][credentials] Invalid password:", parsed.data.email);
          }
          return null;
        }

        console.info("[auth][credentials] authorize success", { email: user.email });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    ...(isGoogleProviderEnabled
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[auth][error]", code, metadata ?? "");
    },
    warn(code) {
      console.warn("[auth][warn]", code);
    },
  },
};
