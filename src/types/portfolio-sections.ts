import type { Database } from "@/integrations/supabase/types";

export type EducationRow = Database["public"]["Tables"]["education"]["Row"];
export type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
export type LanguageRow = Database["public"]["Tables"]["languages"]["Row"];
