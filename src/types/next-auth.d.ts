import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    playerTag: string;
  }

  interface Session {
    user: {
      id: string;
      playerTag: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    playerTag?: string;
  }
}