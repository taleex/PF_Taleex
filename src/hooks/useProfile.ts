import { useQuery } from "@tanstack/react-query";
import { userProfile } from "@/data/profile";
import { CLOUD_ENABLED } from "@/config/cloud";
import type { Database } from "@/integrations/supabase/types";

interface ProfileQueryResult {
  name: string;
  title: string;
  avatar: string;
  location: string;
  email: string;
  interests: string;
  description: string[];
  experience: string;
  experienceLabel: string;
  tags: string[];
  cvUrl: string | null;
  openToRemote: boolean;
  timezone: string;
  availability: string;
}

export const useProfile = () => {
  return useQuery<ProfileQueryResult>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return userProfile;

      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      const row = data as
        | Database["public"]["Tables"]["profiles"]["Row"]
        | null;

      return {
        name: row?.display_name || userProfile.name,
        title: row?.title || userProfile.title,
        avatar: row?.avatar_url || userProfile.avatar,
        location: row?.location || userProfile.location,
        email: row?.email || userProfile.email,
        interests: row?.interests || userProfile.interests,
        description:
          row?.bio && !row.bio.startsWith("TODO(me)")
            ? String(row.bio).split("\n\n")
            : userProfile.description,
        experience:
          row?.experience_label ||
          (row?.experience_years
            ? `${row.experience_years}+ Years`
            : userProfile.experience),
        experienceLabel: row?.experience_label || userProfile.experienceLabel,
        tags: row?.tags && row.tags.length > 0 ? row.tags : userProfile.tags,
        cvUrl: row?.cv_url || null,
        openToRemote: row?.open_to_remote ?? userProfile.openToRemote,
        timezone: row?.timezone || userProfile.timezone,
        availability: row?.availability || userProfile.availability,
      };
    },
    // Fallback to static data if query fails
    placeholderData: userProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
