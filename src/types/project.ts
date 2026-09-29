export interface Project {
  title: string;
  category: "Personal" | "Professional" | "Open Source" | "Course";
  description: string;
  image: string;
  technologies: string[];
  github: string | null;
  live?: string;
  featured: boolean;
}

export type ProjectCategory = "All" | Project["category"];
