import { useQuery } from "@tanstack/react-query";
import { experiences } from "@/data/experience";
import { CLOUD_ENABLED } from "@/config/cloud";
import type { Database } from "@/integrations/supabase/types";

export const useExperiences = () => {
  return useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return experiences;

      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("order_index");
      if (error) throw error;

      const rows = (data ||
        []) as Database["public"]["Tables"]["experiences"]["Row"][];
      return rows.map((exp) => ({
        title: exp.position,
        company: exp.company,
        location: exp.location || "",
        period: exp.period,
        type: exp.employment_type || "Full-time",
        description: exp.description,
        achievements: exp.highlights ?? [],
        technologies: [] as string[], // Not in DB, could add relation if needed
      }));
    },
    initialData: CLOUD_ENABLED ? undefined : experiences,
    retry: 1,
    staleTime: 1 * 60 * 1000,
    refetchOnMount: true,
  });
};
