import { useQuery } from "@tanstack/react-query";
import { projects } from "@/data/projects";
import { Project } from "@/types/project";
import { CLOUD_ENABLED } from "@/config/cloud";
import type { Database } from "@/integrations/supabase/types";

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!CLOUD_ENABLED) return projects;

      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("order_index");

      if (error) throw error;

      const rows = (data ||
        []) as Database["public"]["Tables"]["projects"]["Row"][];
      return rows.map((project) => ({
        title: project.title,
        category: (project.category as Project["category"]) || "Professional",
        description: project.description,
        image: project.image_url || "/placeholder.svg",
        technologies: project.tags ?? [],
        github: project.github_url || undefined,
        live: project.demo_url || undefined,
        featured: project.featured ?? false,
      }));
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};
