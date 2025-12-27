import Link from "next/link";

import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface AppNavProps {
  email?: string | null;
}

export function AppNav({ email }: AppNavProps) {
  const tabs = [
    { label: "~/people", href: "/dashboard/people", title: "People" },
    { label: "./inbox", href: "/dashboard/inbox", title: "Inbox" },
    { label: "@profile", href: "/dashboard/profile", title: "Profile" }
  ];

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight text-orange-400">
            <span className="inline-flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>&gt;_ SHIP-IT_</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="hidden sm:flex items-center gap-3">
              <span>user: {email ?? "anon"}</span>
              <span className="text-orange-300">status: building</span>
            </div>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2 text-xs">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.title}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-slate-300 transition hover:border-orange-500/40 hover:text-orange-300"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
