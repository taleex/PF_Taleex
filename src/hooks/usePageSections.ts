import { useQuery } from "@tanstack/react-query";
import { CLOUD_ENABLED } from "@/config/cloud";
import type { Database } from "@/integrations/supabase/types";

export interface PageSection {
  section_key: string;
  title?: string;
  subtitle?: string;
  content?: string;
}

export const usePageSections = () => {
  return useQuery<PageSection[]>({
    queryKey: ["page-sections"],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return [];

      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.from("page_sections").select("*");
      if (error) throw error;

      return (data ||
        []) as Database["public"]["Tables"]["page_sections"]["Row"][];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePageSection = (sectionKey: string) => {
  return useQuery<PageSection | null>({
    queryKey: ["page-section", sectionKey],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return null;

      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) throw error;

      return data as
        | Database["public"]["Tables"]["page_sections"]["Row"]
        | null;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};
