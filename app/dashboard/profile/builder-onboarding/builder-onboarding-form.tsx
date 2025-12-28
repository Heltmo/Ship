"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { saveBuilderOnboarding } from "./actions";
import { useRouter } from "next/navigation";
import { TIMEZONES, WORK_MODES, ITERATION_STYLES, STACK_OPTIONS, PRIMARY_TOOLS } from "@/lib/constants/builder-options";

type BuilderOnboardingFormProps = {
  initialData?: {
    timezone?: string;
    availability_hours_per_week?: number;
    work_best_mode?: string[];
    iteration_style?: "vibe_coder" | "regular_coder";
    want_to_build_next?: string;
    stack_focus?: string[];
    primary_tools?: string[];
    allow_messages?: boolean;
  };
};

export function BuilderOnboardingForm({ initialData }: BuilderOnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form state
  const [formData, setFormData] = useState({
    timezone: initialData?.timezone || "",
    availability_hours_per_week: initialData?.availability_hours_per_week || 10,
    work_best_mode: initialData?.work_best_mode || [],
    iteration_style: initialData?.iteration_style || "",
    want_to_build_next: initialData?.want_to_build_next || "",
    stack_focus: initialData?.stack_focus || [],
    primary_tools: initialData?.primary_tools || [],
    allow_messages: initialData?.allow_messages ?? true,
  });

  const toggleArrayItem = (field: "work_best_mode" | "stack_focus" | "primary_tools", value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveBuilderOnboarding(formData as any);

      if (result?.error) {
        setError(result.error);
        if ("details" in result && result.details) {
          setFieldErrors(result.details as Record<string, string[]>);
        }
      } else if (result?.success) {
        // Delay to ensure cookies are synchronized before redirect
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push("/dashboard/people");
        router.refresh(); // Force fresh data load
      }
    });
  };

  const missingFields = Object.keys(fieldErrors);
  const fieldLabels: Record<string, string> = {
    timezone: "Timezone",
    availability_hours_per_week: "Hours per week",
    work_best_mode: "Work preferences",
    iteration_style: "Coding style",
    stack_focus: "Stack focus",
    want_to_build_next: "What you want to build",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
      {missingFields.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 px-4 py-3 rounded text-sm">
          Missing: {missingFields.map((field) => fieldLabels[field] || field).join(", ")}
        </div>
      )}

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle>Your Location & Time</CardTitle>
          <CardDescription>
            Helps us match you with builders in compatible timezones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">
              Timezone <span className="text-orange-400">*</span>
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.timezone?.[0] && (
              <p className="text-xs text-orange-400">{fieldErrors.timezone[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability_hours_per_week">
              Hours to build per week <span className="text-orange-400">*</span>
            </Label>
            <Input
              id="availability_hours_per_week"
              type="number"
              min="1"
              max="168"
              value={formData.availability_hours_per_week}
              onChange={(e) =>
                setFormData({ ...formData, availability_hours_per_week: parseInt(e.target.value) || 1 })
              }
              required
            />
            <p className="text-xs text-slate-400">
              Realistic hours you can commit each week
            </p>
            {fieldErrors.availability_hours_per_week?.[0] && (
              <p className="text-xs text-orange-400">{fieldErrors.availability_hours_per_week[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>How You Work Best</CardTitle>
          <CardDescription>
            Select all that apply - helps match your work style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>
              I work best like this <span className="text-orange-400">*</span>
            </Label>
            <div className="space-y-3">
              {WORK_MODES.map((mode) => (
                <div key={mode.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={mode.id}
                    checked={formData.work_best_mode.includes(mode.id)}
                    onCheckedChange={() => toggleArrayItem("work_best_mode", mode.id)}
                  />
                  <div className="space-y-0.5">
                    <label
                      htmlFor={mode.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {mode.label}
                    </label>
                    <p className="text-xs text-slate-400">{mode.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {fieldErrors.work_best_mode?.[0] ? (
              <p className="text-xs text-orange-400">{fieldErrors.work_best_mode[0]}</p>
            ) : (
              formData.work_best_mode.length === 0 && (
                <p className="text-xs text-orange-400">Select at least one</p>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Iteration Style */}
      <Card>
        <CardHeader>
          <CardTitle>Your Coding Style</CardTitle>
          <CardDescription>
            How do you prefer to iterate on projects?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>
              Choose your style <span className="text-orange-400">*</span>
            </Label>
            <div className="space-y-3">
              {ITERATION_STYLES.map((style) => (
                <div
                  key={style.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.iteration_style === style.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-white/10 hover:border-orange-500/50"
                  }`}
                  onClick={() => setFormData({ ...formData, iteration_style: style.id as any })}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="iteration_style"
                      value={style.id}
                      checked={formData.iteration_style === style.id}
                      onChange={() => setFormData({ ...formData, iteration_style: style.id as any })}
                      className="mt-1"
                      required
                    />
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <p className="text-sm text-slate-400">{style.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fieldErrors.iteration_style?.[0] && (
              <p className="text-xs text-orange-400">{fieldErrors.iteration_style[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stack Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Stack & Tools</CardTitle>
          <CardDescription>
            What you're building with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>
              Stack focus <span className="text-orange-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {STACK_OPTIONS.map((stack) => (
                <div key={stack.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`stack-${stack.id}`}
                    checked={formData.stack_focus.includes(stack.id)}
                    onCheckedChange={() => toggleArrayItem("stack_focus", stack.id)}
                  />
                  <div className="space-y-0.5">
                    <label
                      htmlFor={`stack-${stack.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {stack.label}
                    </label>
                    <p className="text-xs text-slate-400">{stack.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {fieldErrors.stack_focus?.[0] ? (
              <p className="text-xs text-orange-400">{fieldErrors.stack_focus[0]}</p>
            ) : (
              formData.stack_focus.length === 0 && (
                <p className="text-xs text-orange-400">Select at least one</p>
              )
            )}
          </div>

          <div className="space-y-3">
            <Label>Primary tools (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tool-${tool.id}`}
                    checked={formData.primary_tools.includes(tool.id)}
                    onCheckedChange={() => toggleArrayItem("primary_tools", tool.id)}
                  />
                  <label
                    htmlFor={`tool-${tool.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {tool.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Building Goals */}
      <Card>
        <CardHeader>
          <CardTitle>What You Want to Build</CardTitle>
          <CardDescription>
            Help us find collaborators with aligned interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="want_to_build_next">
              Tell us what you want to build next <span className="text-orange-400">*</span>
            </Label>
            <Textarea
              id="want_to_build_next"
              value={formData.want_to_build_next}
              onChange={(e) => setFormData({ ...formData, want_to_build_next: e.target.value })}
              placeholder="e.g., AI-powered dev tools, a micro-SaaS for indie makers, experimental prototypes with LLMs..."
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-xs text-slate-400">
              {formData.want_to_build_next.length}/500 characters
              {formData.want_to_build_next.length < 10 && formData.want_to_build_next.length > 0 && (
                <span className="text-orange-400"> (minimum 10 characters)</span>
              )}
            </p>
            {fieldErrors.want_to_build_next?.[0] && (
              <p className="text-xs text-orange-400">{fieldErrors.want_to_build_next[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messaging Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Messaging</CardTitle>
          <CardDescription>
            Control who can start a chat with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="allow_messages"
              checked={formData.allow_messages}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allow_messages: checked === true })
              }
            />
            <div className="space-y-0.5">
              <label
                htmlFor="allow_messages"
                className="text-sm font-medium cursor-pointer"
              >
                Allow direct messages
              </label>
              <p className="text-xs text-slate-400">
                When off, people can still view your profile but cannot start a chat.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Complete Profile & Start Matching
      </Button>
    </form>
  );
}
