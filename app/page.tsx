import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight text-orange-400">
            <span className="inline-flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>&gt;_ SHIP-IT_</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline">status: building</span>
            <Link href="/find">
              <Button size="sm" variant="outline">~/login</Button>
            </Link>
          </div>
        </nav>

        <section className="mt-12 grid gap-6 lg:grid-cols-12 items-start">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-black/95 p-8 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.9)] lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3 text-xs text-orange-300">
              <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 uppercase tracking-[0.2em]">co-founder network live</span>
              <span className="text-slate-500">commit.log</span>
            </div>

            <h1 className="mt-10 text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
              Don't build alone.
              <span className="block text-orange-400">Ship together.</span>
              <span className="ml-1 inline-block h-6 w-2 translate-y-1 bg-orange-400 align-middle animate-pulse" />
            </h1>

            <div className="mt-6 space-y-2 border-l border-orange-500/40 pl-4 text-sm text-slate-400">
              <p>// TODO: Solo mode is over.</p>
              <p>// Find someone who matches your pace.</p>
              <p>// Start something real, together.</p>
            </div>

            <p className="mt-4 text-sm text-slate-300">
              The curated network for founders, engineers, and product leaders. Find the partner who complements your skills and is ready to launch.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/find">
                <Button size="lg">Find a co-founder</Button>
              </Link>
            </div>
  
         
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-orange-500/40 bg-slate-950/80 p-6 shadow-[0_24px_60px_-45px_rgba(249,115,22,0.4)]">
              <div className="flex items-center justify-between text-xs uppercase text-orange-300">
                <span># Core Protocols</span>
                <span className="text-slate-500">README.md</span>
              </div>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-orange-300">PROOF_OF_WORK</div>
                  <p className="mt-1 text-slate-400">See real projects, not just promises.</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-orange-300">OPEN_MESSAGES</div>
                  <p className="mt-1 text-slate-400">Anyone can message. You can turn DMs on or off.</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-orange-300">RELIABILITY_SIGNALS</div>
                  <p className="mt-1 text-slate-400">Consistent builders rise. Ghosting fades.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-white/10 bg-black/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Serious Builders</span>
                    <Badge variant="outline">ACTIVE</Badge>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Founders, engineers, and product leads building now.</p>
                  <div className="mt-3 h-1 w-full rounded-full bg-white/5">
                    <div className="h-full w-2/3 rounded-full bg-orange-500/70" />
                  </div>
                  <Link href="/find" className="block mt-4">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      Browse Builders →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-black/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Fast Movement</span>
                    <Badge variant="accent">MERGED</Badge>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">"Met my co-founder on Monday, incorporated by Friday."</p>
                  <div className="mt-3 flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />
                    <span className="h-2 w-2 rounded-full bg-orange-400/60" />
                    <span className="h-2 w-2 rounded-full bg-orange-400/30" />
                  </div>
                  <Link href="/find" className="block mt-4">
                    <Button size="sm" className="w-full text-xs">
                      Get Started →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2025 Ship-It. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
