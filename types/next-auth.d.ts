import NextAuth from "next-auth";
// Types for the NextAuth session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "RECEPTIONIST" | "DOCTOR";
      doctorId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "RECEPTIONIST" | "DOCTOR";
    id: string;
    doctorId?: string | null;
  }
}
