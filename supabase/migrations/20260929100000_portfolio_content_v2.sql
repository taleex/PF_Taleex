ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_label text,
  ADD COLUMN IF NOT EXISTS open_to_remote boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS availability text;

ALTER TABLE public.contact_info
  ADD COLUMN IF NOT EXISTS show_publicly boolean NOT NULL DEFAULT true;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS problem text,
  ADD COLUMN IF NOT EXISTS highlights text[],
  ADD COLUMN IF NOT EXISTS what_i_would_improve text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.projects'::regclass
      AND conname = 'projects_category_check'
  ) THEN
    ALTER TABLE public.projects DROP CONSTRAINT projects_category_check;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.projects'::regclass
      AND conname = 'projects_category_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_category_check
      CHECK (category IN ('Personal', 'Professional', 'Open Source', 'Course'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution text NOT NULL,
  title text NOT NULL,
  period text NOT NULL,
  description text,
  highlights text[] NOT NULL DEFAULT '{}',
  related_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  provider text NOT NULL,
  description text,
  period text,
  certificate_url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT languages_level_check CHECK (level IN ('Native', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'TODO(me)'))
);

CREATE INDEX IF NOT EXISTS education_order_index_idx ON public.education(order_index);
CREATE INDEX IF NOT EXISTS courses_order_index_idx ON public.courses(order_index);
CREATE INDEX IF NOT EXISTS languages_order_index_idx ON public.languages(order_index);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['education', 'courses', 'languages'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name AND policyname = 'Public can read ' || table_name
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', 'Public can read ' || table_name, table_name);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name AND policyname = 'Admins can manage ' || table_name
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', 'Admins can manage ' || table_name, table_name);
    END IF;
  END LOOP;
END;
$$;

GRANT SELECT ON public.education, public.courses, public.languages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.education, public.courses, public.languages TO authenticated;

INSERT INTO public.page_sections (id, section_key, title, subtitle, content)
VALUES
  ('d3f455b5-320b-4f2e-87a9-3fbe02cbf181', 'education', 'Education', 'Formal education and project work', NULL),
  ('8c752775-8f8e-42b0-83f1-36fbf2d1c11c', 'courses', 'Courses', 'Professional training and certifications', NULL),
  ('59d99796-bb49-4d21-8f79-c22f017988be', 'languages', 'Languages', 'Languages I use', NULL)
ON CONFLICT (id) DO UPDATE SET
  section_key = EXCLUDED.section_key,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  content = EXCLUDED.content,
  updated_at = timezone('utc'::text, now());
