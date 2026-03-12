import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Node.js-only imports like Prisma/better-sqlite3)
export const authConfig: NextAuthConfig = {
  providers: [], // We'll add the actual provider in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.doctorId = (user as any).doctorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).doctorId = token.doctorId;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user ? (auth.user as any).role : null;
      const pathname = nextUrl.pathname;

      // Protect dashboard routes
      if (pathname.startsWith("/dashboard")) {
        if (!isLoggedIn) return false; // Redirect to login

        // Role-based route protection
        if (pathname.startsWith("/dashboard/receptionist") && role !== "RECEPTIONIST") {
          return Response.redirect(new URL("/dashboard/doctor", nextUrl));
        }
        if (pathname.startsWith("/dashboard/doctor") && role !== "DOCTOR") {
          return Response.redirect(new URL("/dashboard/receptionist", nextUrl));
        }

        // Redirect /dashboard to role-specific page
        if (pathname === "/dashboard") {
          if (role === "DOCTOR") {
            return Response.redirect(new URL("/dashboard/doctor", nextUrl));
          }
          return Response.redirect(new URL("/dashboard/receptionist", nextUrl));
        }

        return true;
      }

      // Redirect logged-in users from login page
      if (pathname === "/login" && isLoggedIn) {
        if (role === "DOCTOR") {
          return Response.redirect(new URL("/dashboard/doctor", nextUrl));
        }
        return Response.redirect(new URL("/dashboard/receptionist", nextUrl));
      }

      // Redirect root to login or dashboard
      if (pathname === "/") {
        if (isLoggedIn) {
          if (role === "DOCTOR") {
            return Response.redirect(new URL("/dashboard/doctor", nextUrl));
          }
          return Response.redirect(new URL("/dashboard/receptionist", nextUrl));
        }
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
