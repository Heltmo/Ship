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
import { Separator } from "@/components/ui/separator";
import { updateProfileBasics } from "./actions";
import { Loader2 } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  identity_tagline: string | null;
  timezone: string | null;
  availability_hours_per_week: number | null;
  work_style: string | null;
  iteration_style: string | null;
  availability_mode: string[] | null;
  primary_tools: string[] | null;
  stack_focus: string[] | null;
  strengths: string[] | null;
  want_to_build: string | null;
  not_interested_in: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
};

interface BuilderProfileFormProps {
  profile: Profile | null;
}

// Constants
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const PRIMARY_TOOLS = [
  { id: "cursor", label: "Cursor" },
  { id: "vscode", label: "VS Code" },
  { id: "replit", label: "Replit" },
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "windsurf", label: "Windsurf" },
  { id: "vim", label: "Vim/Neovim" },
  { id: "other", label: "Other" },
];

const STACK_FOCUS = [
  { id: "web", label: "Web" },
  { id: "mobile", label: "Mobile" },
  { id: "ai", label: "AI/ML" },
  { id: "game", label: "Game Dev" },
  { id: "backend", label: "Backend/Infrastructure" },
  { id: "tooling", label: "Dev Tools/Tooling" },
];

const STRENGTHS = [
  { id: "idea_to_prototype", label: "Idea → Prototype" },
  { id: "shipping_mvp", label: "Shipping MVP" },
  { id: "ui_polish", label: "UI/Design Polish" },
  { id: "backend_depth", label: "Deep Backend Work" },
];

const AVAILABILITY_MODES = [
  { id: "weekdays_evenings", label: "Weekday Evenings" },
  { id: "weekends", label: "Weekends" },
  { id: "flexible", label: "Flexible" },
];

export function BuilderProfileForm({ profile }: BuilderProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    identity_tagline: profile?.identity_tagline || "",
    timezone: profile?.timezone || "",
    availability_hours_per_week: profile?.availability_hours_per_week || 10,
    work_style: profile?.work_style || "",
    iteration_style: profile?.iteration_style || "",
    availability_mode: profile?.availability_mode || [],
    primary_tools: profile?.primary_tools || [],
    stack_focus: profile?.stack_focus || [],
    strengths: profile?.strengths || [],
    want_to_build: profile?.want_to_build || "",
    not_interested_in: profile?.not_interested_in || "",
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    twitter_url: profile?.twitter_url || "",
    website_url: profile?.website_url || "",
  });

  const toggleArrayItem = (field: string, value: string) => {
    setFormData((prev) => {
      const currentArray = (prev as any)[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateProfileBasics(formData as any);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Builder profile updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Builder Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Builder Identity</CardTitle>
            <CardDescription>
              How you work and what kind of builder you are
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identity_tagline">
                Identity Tagline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identity_tagline"
                value={formData.identity_tagline}
                onChange={(e) => setFormData({ ...formData, identity_tagline: e.target.value })}
                placeholder="e.g., AI indie hacker, full-stack prototyper"
                maxLength={100}
                required
              />
              <p className="text-xs text-slate-500">
                2-5 words that describe what kind of builder you are
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_style">
                Work Style <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.work_style}
                onValueChange={(value) => setFormData({ ...formData, work_style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="async">Async - flexible hours, async communication</SelectItem>
                  <SelectItem value="sync">Sync - real-time pairing, scheduled meetings</SelectItem>
                  <SelectItem value="hybrid">Hybrid - mix of both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iteration_style">Iteration Style</Label>
              <Select
                value={formData.iteration_style}
                onValueChange={(value) => setFormData({ ...formData, iteration_style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select iteration style (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast_messy">Fast & Messy - move quick, refine later</SelectItem>
                  <SelectItem value="slow_polished">Slow & Polished - get it right first time</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Availability & Compatibility */}
        <Card>
          <CardHeader>
            <CardTitle>Availability & Compatibility</CardTitle>
            <CardDescription>
              When and how much you can collaborate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">
                Timezone <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability_hours_per_week">
                Availability (hours/week) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="availability_hours_per_week"
                type="number"
                min="1"
                max="168"
                value={formData.availability_hours_per_week}
                onChange={(e) =>
                  setFormData({ ...formData, availability_hours_per_week: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Availability Mode</Label>
              <div className="space-y-2">
                {AVAILABILITY_MODES.map((mode) => (
                  <div key={mode.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={mode.id}
                      checked={formData.availability_mode.includes(mode.id)}
                      onCheckedChange={() => toggleArrayItem("availability_mode", mode.id)}
                    />
                    <label htmlFor={mode.id} className="text-sm cursor-pointer">
                      {mode.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tools & Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Tools & Stack</CardTitle>
            <CardDescription>
              What you build with
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Primary Tools</Label>
              <div className="grid grid-cols-2 gap-2">
                {PRIMARY_TOOLS.map((tool) => (
                  <div key={tool.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tool-${tool.id}`}
                      checked={formData.primary_tools.includes(tool.id)}
                      onCheckedChange={() => toggleArrayItem("primary_tools", tool.id)}
                    />
                    <label htmlFor={`tool-${tool.id}`} className="text-sm cursor-pointer">
                      {tool.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Stack Focus</Label>
              <div className="grid grid-cols-2 gap-2">
                {STACK_FOCUS.map((stack) => (
                  <div key={stack.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stack-${stack.id}`}
                      checked={formData.stack_focus.includes(stack.id)}
                      onCheckedChange={() => toggleArrayItem("stack_focus", stack.id)}
                    />
                    <label htmlFor={`stack-${stack.id}`} className="text-sm cursor-pointer">
                      {stack.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Strengths</Label>
              <div className="grid grid-cols-2 gap-2">
                {STRENGTHS.map((strength) => (
                  <div key={strength.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`strength-${strength.id}`}
                      checked={formData.strengths.includes(strength.id)}
                      onCheckedChange={() => toggleArrayItem("strengths", strength.id)}
                    />
                    <label htmlFor={`strength-${strength.id}`} className="text-sm cursor-pointer">
                      {strength.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Building Intent */}
        <Card>
          <CardHeader>
            <CardTitle>What You Want to Build</CardTitle>
            <CardDescription>
              Help us match you with the right collaborators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="want_to_build">Things I want to build next</Label>
              <Textarea
                id="want_to_build"
                value={formData.want_to_build}
                onChange={(e) => setFormData({ ...formData, want_to_build: e.target.value })}
                placeholder="e.g., AI-powered dev tools, micro-SaaS products, experimental prototypes..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="not_interested_in">Hard no — not interested in</Label>
              <Textarea
                id="not_interested_in"
                value={formData.not_interested_in}
                onChange={(e) => setFormData({ ...formData, not_interested_in: e.target.value })}
                placeholder="e.g., crypto projects, agency work, enterprise SaaS..."
                rows={3}
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Info & Links */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Optional but helpful for matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Display Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your name"
              />
              <p className="text-xs text-slate-500">
                Synced from GitHub. You can customize it here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself, your background, and what you're passionate about..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-slate-500">
                Synced from GitHub. You can customize it here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Social Links</Label>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url" className="text-sm font-normal">
                  LinkedIn
                </Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_url" className="text-sm font-normal">
                  GitHub
                </Label>
                <Input
                  id="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_url" className="text-sm font-normal">
                  Twitter
                </Label>
                <Input
                  id="twitter_url"
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url" className="text-sm font-normal">
                  Website
                </Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending} size="lg" className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Builder Profile
        </Button>
      </form>
    </div>
  );
}
