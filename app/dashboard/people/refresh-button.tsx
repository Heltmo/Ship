"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const REFRESH_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

function getMsUntilNextWindow() {
  const now = Date.now();
  const nextWindow = Math.ceil(now / REFRESH_WINDOW_MS) * REFRESH_WINDOW_MS;
  return Math.max(0, nextWindow - now);
}

function formatMs(msLeft: number) {
  const totalSeconds = Math.ceil(msLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RefreshPeopleButton() {
  const router = useRouter();
  const [msLeft, setMsLeft] = useState(getMsUntilNextWindow());

  useEffect(() => {
    const id = setInterval(() => {
      setMsLeft(getMsUntilNextWindow());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const canRefresh = msLeft === 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        onClick={() => router.refresh()}
        disabled={!canRefresh}
      >
        {canRefresh ? "Refresh people" : "Refresh locked"}
      </Button>
      <span className="text-xs text-slate-400">
        {canRefresh ? "New batch ready" : `Next refresh in ${formatMs(msLeft)}`}
      </span>
    </div>
  );
}
