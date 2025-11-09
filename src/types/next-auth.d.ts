import NextAuth, { DefaultSession, User } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Mendefinisikan tipe untuk objek session
   */
  interface Session {
    user: {
      id: string; // <-- ⭐️ KITA TAMBAHKAN INI
      role?: string;
    } & DefaultSession["user"] 
  }

  /**
   * Mendefinisikan tipe untuk objek User (dari authorize)
   */
  interface User {
    id: string; // <-- ⭐️ KITA TAMBAHKAN INI
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Mendefinisikan tipe untuk token JWT
   */
  interface JWT {
    id: string; // <-- ⭐️ KITA TAMBAHKAN INI
    role?: string;
  }
}