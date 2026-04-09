import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!githubClientId || !githubClientSecret) {
  throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_USER?.trim().toLowerCase();
      const login = (profile as { login?: string } | null)?.login?.trim().toLowerCase();

      if (!allowed) return false;
      return login === allowed;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.login = (profile as { login?: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { login?: string }).login = token.login as string | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
