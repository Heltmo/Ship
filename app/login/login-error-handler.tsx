"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LoginErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if there are error parameters in the URL hash
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1); // Remove the #
      const params = new URLSearchParams(hash);
      const errorCode = params.get("error_code");
      const error = params.get("error");

      if (error || errorCode) {
        // Convert hash params to query params so the server component can read them
        const newUrl = `/login?error=${errorCode || error}`;

        // Replace the URL to remove the hash and add query params
        router.replace(newUrl);
      }
    }
  }, [router]);

  return null;
}
