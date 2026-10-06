import { useQuery } from "@tanstack/react-query";
import { skillCategories } from "@/data/skills";
import * as Icons from "react-icons/si";
import { CLOUD_ENABLED } from "@/config/cloud";
import type { Database } from "@/integrations/supabase/types";
import type { IconType } from "react-icons";

interface SkillCategoryRow {
  id: string;
  name: string;
}

interface SkillRow {
  id: string;
  name: string;
  category_id: string;
  icon: string;
  svg_url?: string | null;
  svg_url_dark?: string | null;
}

export const useSkills = () => {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return skillCategories;

      const { supabase } = await import("@/integrations/supabase/client");
      const { data: categories, error: catError } = await supabase
        .from("skill_categories")
        .select("*")
        .order("order_index");
      if (catError) throw catError;

      const { data: skills, error: skillError } = await supabase
        .from("skills")
        .select("*")
        .order("order_index");
      if (skillError) throw skillError;

      const categoryRows = (categories ||
        []) as Database["public"]["Tables"]["skill_categories"]["Row"][];
      const skillRows = (skills ||
        []) as Database["public"]["Tables"]["skills"]["Row"][];

      return categoryRows.map((category) => ({
        title: category.name,
        skills: skillRows
          .filter((skill) => skill.category_id === category.id)
          .map((skill) => ({
            name: skill.name,
            icon:
              (Icons as Record<string, IconType>)[skill.icon] || Icons.SiReact,
            svg_url: skill.svg_url || undefined,
            svg_url_dark: skill.svg_url_dark || undefined,
          })),
      }));
    },
    placeholderData: skillCategories,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};
