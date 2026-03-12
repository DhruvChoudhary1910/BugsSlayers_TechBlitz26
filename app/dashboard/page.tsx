"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      if ((session.user as any).role === "DOCTOR") {
        router.replace("/dashboard/doctor");
      } else {
        router.replace("/dashboard/receptionist");
      }
    }
  }, [session, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );
}
