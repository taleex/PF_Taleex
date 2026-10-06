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
  tags: string[];
  cvUrl: string | null;
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
        description: row?.bio
          ? String(row.bio).split("\n\n")
          : userProfile.description,
        experience: row?.experience_years
          ? `${row.experience_years}+ Years`
          : userProfile.experience,
        tags: row?.tags && row.tags.length > 0 ? row.tags : userProfile.tags,
        cvUrl: row?.cv_url || null,
      };
    },
    // Fallback to static data if query fails
    placeholderData: userProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
