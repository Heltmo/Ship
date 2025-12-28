"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CompletingAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    // Small delay to ensure cookies are synchronized
    const timer = setTimeout(() => {
      router.push(next);
      router.refresh();
    }, 200);

    return () => clearTimeout(timer);
  }, [next, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-400" />
        <p className="mt-4 text-sm text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
}
