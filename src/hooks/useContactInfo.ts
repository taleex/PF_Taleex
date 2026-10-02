import { useQuery } from "@tanstack/react-query";
import { contactInfo, socialLinks } from "@/data/contact";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CLOUD_ENABLED } from "@/config/cloud";
import type { Database } from "@/integrations/supabase/types";

export const useContactInfo = () => {
  return useQuery({
    queryKey: ["contact-info"],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return { socialLinks, contactInfo };

      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .order("order_index");
      if (error) throw error;

      const rows = (data ||
        []) as Database["public"]["Tables"]["contact_info"]["Row"][];

      const social = rows
        .filter((item) => item.type === "social")
        .map((item) => ({
          icon:
            (LucideIcons as unknown as Record<string, LucideIcon>)[
              item.icon_name || ""
            ] || LucideIcons.Mail,
          href: item.link || item.value,
          label: item.label,
        }));

      const info = rows
        .filter((item) => item.type === "contact")
        .reduce(
          (acc: Record<string, string>, item) => {
            acc[String(item.label).toLowerCase()] = item.value;
            return acc;
          },
          {},
        );

      return {
        socialLinks: social.length > 0 ? social : socialLinks,
        contactInfo:
          Object.keys(info).length > 0
            ? {
                email: info.email || contactInfo.email,
                phone: info.phone || contactInfo.phone,
                location: info.location || contactInfo.location,
              }
            : contactInfo,
      };
    },
    placeholderData: { socialLinks, contactInfo },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};
