import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="text-center">
        <div className="mb-6 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-800">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">Page Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard" className="inline-block mt-6">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
