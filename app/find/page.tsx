import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BuilderOnboardingForm } from "@/app/dashboard/profile/builder-onboarding/builder-onboarding-form";
import {
  checkBuilderProfileComplete,
  getBuilderOnboardingStatus,
} from "@/app/dashboard/profile/builder-onboarding/actions";

export default async function FindPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/find");
  }

  const isComplete = await checkBuilderProfileComplete();
  if (isComplete) {
    redirect("/matches");
  }

  const initialData = await getBuilderOnboardingStatus();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Complete Your Builder Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tell us how you build so we can match you with the right people.
        </p>
      </div>

      <BuilderOnboardingForm initialData={initialData || undefined} />
    </div>
  );
}
