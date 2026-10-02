import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import { Loader2, Save } from "lucide-react";
import { ProfileBasicInfo } from "./profile/ProfileBasicInfo";
import { ProfileBioEditor } from "./profile/ProfileBioEditor";
import { ProfileCVUpload } from "./profile/ProfileCVUpload";
import { ProfileTagsManager } from "./profile/ProfileTagsManager";

interface Profile {
  id: string;
  display_name: string;
  title: string;
  bio: string;
  avatar_url: string;
  location: string;
  email: string;
  interests: string;
  experience_years: number | null;
  experience_label: string;
  open_to_remote: boolean;
  timezone: string;
  availability: string;
  tags: string[];
  cv_url: string;
}

const ProfileEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: "",
    display_name: "",
    title: "",
    bio: "",
    avatar_url: "",
    location: "",
    email: "",
    interests: "",
    experience_years: null,
    experience_label: "TODO(me): Add an accurate experience label.",
    open_to_remote: true,
    timezone: "Lisbon, WET/WEST",
    availability: "TODO(me): Add start date or notice period.",
    tags: [],
    cv_url: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const profileData = data as Profile;
        setProfile({
          ...profileData,
          tags:
            profileData.tags && profileData.tags.length > 0
              ? profileData.tags
              : ["Frontend Developer", "React", "Next.js", "TypeScript"],
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFieldChange = (
    field: string,
    value: string | number | boolean | null,
  ) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          title: profile.title,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          location: profile.location,
          email: profile.email,
          interests: profile.interests,
          experience_years: null,
          experience_label: profile.experience_label,
          open_to_remote: profile.open_to_remote,
          timezone: profile.timezone,
          availability: profile.availability,
          tags: profile.tags,
          cv_url: profile.cv_url,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight text-[#0A0908]">
          Profile Information
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          Update your personal information displayed on the site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProfileBasicInfo profile={profile} onChange={handleFieldChange} />

        <ProfileBioEditor
          avatar_url={profile.avatar_url}
          bio={profile.bio}
          onChange={handleFieldChange}
        />

        <ProfileCVUpload
          profileId={profile.id}
          cvUrl={profile.cv_url}
          onUploadSuccess={(url) => setProfile({ ...profile, cv_url: url })}
        />

        <ProfileTagsManager
          tags={profile.tags}
          onTagsChange={(tags) => setProfile({ ...profile, tags })}
        />

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} size="default">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;
