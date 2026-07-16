import { useQuery } from "@tanstack/react-query";
import { CLOUD_ENABLED } from "@/config/cloud";
import type { Database } from "@/integrations/supabase/types";

export interface SiteContentItem {
  key: string;
  value: string;
  section: string;
}

export const useSiteContent = (section?: string) => {
  return useQuery<Record<string, string>>({
    queryKey: ["site-content", section],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return {};

      const { supabase } = await import("@/integrations/supabase/client");
      let query = supabase.from("site_content").select("*");
      if (section) {
        query = query.eq("section", section);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ||
        []) as Database["public"]["Tables"]["site_content"]["Row"][];
      return rows.reduce((acc: Record<string, string>, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSiteContentValue = (
  section: string,
  key: string,
  defaultValue: string = "",
) => {
  const { data } = useSiteContent(section);
  return data?.[key] || defaultValue;
};
