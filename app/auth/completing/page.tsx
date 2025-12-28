"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CompletingContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    // Use full page reload to ensure cookies are properly synced
    window.location.href = next;
  }, [next]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-400" />
        <p className="mt-4 text-sm text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function CompletingAuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-400" />
          <p className="mt-4 text-sm text-slate-400">Completing sign in...</p>
        </div>
      </div>
    }>
      <CompletingContent />
    </Suspense>
  );
}
