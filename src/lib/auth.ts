import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Sem PrismaAdapter: Credentials + JWT não usa DB para sessões.
  // Evita conflitos que causam Internal Server Error em /api/auth/error
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
          if (!credentials?.email || !credentials?.password) {
            console.error("[auth] missing credentials");
            return null;
          }

          const { prisma } = await import("./prisma");
          const email = (credentials.email as string).trim().toLowerCase();
          console.log("[auth] looking up:", email);

          const user = await prisma.user.findUnique({ where: { email } });
          console.log("[auth] user found:", !!user, "has password:", !!user?.password);

          if (!user) return null;
          if (!user.password) return null;

          const { default: bcrypt } = await import("bcryptjs");
          const ok = await bcrypt.compare(credentials.password as string, user.password);
          console.log("[auth] password match:", ok);
          if (!ok) return null;

          return { id: user.id, email: user.email, name: user.name, image: user.image };
        } catch (e) {
          console.error("[auth authorize error]", e);
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
