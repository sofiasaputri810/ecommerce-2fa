import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        token: { label: "2FA Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Authenticate with Supabase
        const { data: authData, error: authError } = 
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError || !authData.user) {
          throw new Error("Invalid credentials");
        }

        // Check if 2FA is enabled
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("two_factor_enabled, two_factor_secret, role")
          .eq("id", authData.user.id)
          .single();

        if (profile?.two_factor_enabled) {
          if (!credentials.token) {
            throw new Error("2FA_REQUIRED");
          }

          // Verify 2FA token
          const speakeasy = require("speakeasy");
          const verified = speakeasy.totp.verify({
            secret: profile.two_factor_secret,
            encoding: "base32",
            token: credentials.token,
            window: 2
          });

          if (!verified) {
            throw new Error("Invalid 2FA token");
          }
        }

        // Log successful login
        await supabase.from("audit_logs").insert({
          user_id: authData.user.id,
          action: "login",
          details: { method: "credentials", has_2fa: profile?.two_factor_enabled }
        });

        return {
          id: authData.user.id,
          email: authData.user.email,
          role: profile?.role || "customer"
        };
      }
    })
  ],
callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; 
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id; 
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
});

export { handler as GET, handler as POST };