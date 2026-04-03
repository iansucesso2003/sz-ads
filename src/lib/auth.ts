import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Erros de auth redirecionam para login (não /api/auth/error)
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const { prisma } = await import("./prisma");
          const email = (credentials.email as string).trim().toLowerCase();
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user?.password) return null;

          const { default: bcrypt } = await import("bcryptjs");
          const ok = await bcrypt.compare(credentials.password as string, user.password);
          if (!ok) return null;

          return { id: user.id, email: user.email, name: user.name };
        } catch (e) {
          console.error("[auth]", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
