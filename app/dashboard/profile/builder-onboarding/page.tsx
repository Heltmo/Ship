import { redirect } from "next/navigation";
import { BuilderOnboardingForm } from "./builder-onboarding-form";
import { getBuilderOnboardingStatus, checkBuilderProfileComplete } from "./actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function BuilderOnboardingPage() {
  const supabase = createServerSupabaseClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current onboarding status
  const initialData = await getBuilderOnboardingStatus();

  // Check if already complete (allow re-editing)
  const isComplete = await checkBuilderProfileComplete();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isComplete ? "Edit Builder Profile" : "Complete Your Builder Profile"}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {isComplete
            ? "Update your preferences and matching criteria"
            : "Tell us about yourself to unlock matching and discovery"}
        </p>
      </div>

      {/* Progress indicator */}
      {!isComplete && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-300 font-medium">
                3
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-orange-200">Almost there!</h3>
              <p className="text-sm text-orange-200/80 mt-1">
                Complete this final step to start discovering builders and matching with cofounders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <BuilderOnboardingForm initialData={initialData || undefined} />
    </div>
  );
}
