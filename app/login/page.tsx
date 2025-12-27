import Link from "next/link";

import { sendMagicLink, signInWithGithub } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Send } from "lucide-react";
import { LoginErrorHandler } from "./login-error-handler";

interface LoginPageProps {
  searchParams: { sent?: string; error?: string; next?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const sent = searchParams.sent === "1";
  const error = searchParams.error;
  const next = searchParams.next || "";

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-orange-400">
            <span className="inline-flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>&gt;_ SHIP-IT_</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              ./back
            </Button>
          </Link>
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Sign in / Sign up</CardTitle>
            <CardDescription>
              Welcome back. Sign in to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={sendMagicLink} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@company.com" />
              </div>
              <Button type="submit" className="w-full">
                Send magic link
              </Button>
            </form>
            <div className="my-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              <span>or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <form action={signInWithGithub}>
              <input type="hidden" name="next" value={next} />
              <Button type="submit" variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
            </form>
            <p className="mt-2 text-xs text-slate-400">
              GitHub lets you import repos so people can see what you build.
            </p>
            {sent && (
              <div className="mt-4 space-y-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                <p className="text-sm font-medium text-emerald-200">
                  Magic link sent. Check your inbox.
                </p>
                <p className="text-xs text-emerald-200/70">
                  Link expires in 60 seconds. Click it quickly or request a new one.
                </p>
              </div>
            )}
            {error === "otp-failed" && (
              <p className="mt-4 rounded-md border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-200">
                We could not send the link. Please try again.
              </p>
            )}
            {error === "auth-failed" && (
              <p className="mt-4 rounded-md border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-200">
                Authentication failed. Please try again.
              </p>
            )}
            {error === "otp_expired" && (
              <p className="mt-4 rounded-md border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-200">
                Magic link expired. Please request a new one. Links are valid for 60 seconds.
              </p>
            )}
            <LoginErrorHandler />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
