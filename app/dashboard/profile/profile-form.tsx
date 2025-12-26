"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { updateProfileBasics } from "./actions";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
};

interface ProfileFormProps {
  profile: Profile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Basics form state
  const [basics, setBasics] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    avatar_url: profile?.avatar_url || "",
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    twitter_url: profile?.twitter_url || "",
    website_url: profile?.website_url || "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!avatarPreviewUrl || !avatarPreviewUrl.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);


  const handleBasicsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateProfileBasics(basics as any);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Profile basics updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    setAvatarError(null);
    setAvatarSuccess(null);
    setAvatarFile(null);
    setAvatarPreviewUrl(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be 5MB or smaller.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setAvatarError("Select an image before uploading.");
      return;
    }

    if (!profile?.id) {
      setAvatarError("Unable to find your profile id.");
      return;
    }

    setAvatarError(null);
    setAvatarSuccess(null);
    setIsUploadingAvatar(true);

    const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${profile.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      setAvatarError(uploadError.message || "Upload failed.");
      setIsUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    const nextBasics = { ...basics, avatar_url: publicUrl };
    const saveResult = await updateProfileBasics(nextBasics as any);

    if (saveResult?.error) {
      setAvatarError(saveResult.error);
      setIsUploadingAvatar(false);
      return;
    }

    setBasics(nextBasics);
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarSuccess("Avatar uploaded and saved.");
    setIsUploadingAvatar(false);
  };


  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      {/* Basics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>Shown in People and on your public profile page</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBasicsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Avatar Image</Label>
              <div className="space-y-3">
                <Input type="file" accept="image/*" onChange={handleAvatarFileChange} />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAvatarUpload}
                    disabled={isUploadingAvatar || !avatarFile}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Avatar"
                    )}
                  </Button>
                  <span className="text-xs text-slate-400">PNG/JPG up to 5MB.</span>
                </div>
              </div>
              {(avatarError || avatarSuccess) && (
                <div
                  className={`rounded border px-3 py-2 text-xs ${
                    avatarError
                      ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {avatarError || avatarSuccess}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Or use an image URL</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={basics.avatar_url}
                  onChange={(e) => {
                    setAvatarFile(null);
                    setAvatarPreviewUrl(null);
                    setAvatarError(null);
                    setAvatarSuccess(null);
                    setBasics({ ...basics, avatar_url: e.target.value });
                  }}
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-400">
                  Shown on your public profile. GitHub sync will overwrite this.
                </p>
              </div>
              {(avatarPreviewUrl || basics.avatar_url) && (
                <div className="pt-2">
                  <img
                    src={avatarPreviewUrl || basics.avatar_url}
                    alt="Avatar preview"
                    className="h-16 w-16 rounded-full border border-white/10 object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Display Name</Label>
              <Input
                id="full_name"
                value={basics.full_name}
                onChange={(e) => setBasics({ ...basics, full_name: e.target.value })}
                placeholder="Your name"
              />
              <p className="text-xs text-slate-400">
                Synced from GitHub. You can customize it here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={basics.bio}
                onChange={(e) => setBasics({ ...basics, bio: e.target.value })}
                placeholder="What do you build and what are you looking for?"
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-slate-400">
                Synced from GitHub. You can customize it here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={basics.location}
                onChange={(e) => setBasics({ ...basics, location: e.target.value })}
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
                  value={basics.linkedin_url}
                  onChange={(e) => setBasics({ ...basics, linkedin_url: e.target.value })}
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
                  value={basics.github_url}
                  onChange={(e) => setBasics({ ...basics, github_url: e.target.value })}
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
                  value={basics.twitter_url}
                  onChange={(e) => setBasics({ ...basics, twitter_url: e.target.value })}
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
                  value={basics.website_url}
                  onChange={(e) => setBasics({ ...basics, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Basics
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
