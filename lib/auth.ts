import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_USER?.trim().toLowerCase();
      const login = (profile as { login?: string })?.login?.trim().toLowerCase();

      console.log("GitHub signIn:", { allowed, login });

      if (!allowed) return true;
      return login === allowed;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { login?: string }).login = token.login as string;
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.login = (profile as { login?: string }).login;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt"
  }
};
