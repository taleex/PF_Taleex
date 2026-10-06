export interface Project {
  title: string;
  category: 'Personal' | 'Professional' | 'Open Source';
  description: string;
  image: string;
  technologies: string[];
  github: string;
  live?: string;
  featured: boolean;
}

export type ProjectCategory = 'All' | Project['category'];
