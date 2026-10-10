CREATE TABLE IF NOT EXISTS public.portfolio_content_drafts (
  id uuid PRIMARY KEY,
  payload jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  published_at timestamptz,
  publish_result jsonb
);

ALTER TABLE public.portfolio_content_drafts
  ADD COLUMN IF NOT EXISTS publish_result jsonb;

ALTER TABLE public.portfolio_content_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'portfolio_content_drafts'
      AND policyname = 'Admins can manage portfolio content drafts'
  ) THEN
    CREATE POLICY "Admins can manage portfolio content drafts"
    ON public.portfolio_content_drafts
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

REVOKE ALL ON TABLE public.portfolio_content_drafts FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.portfolio_content_drafts TO authenticated;

CREATE OR REPLACE FUNCTION public.save_portfolio_draft(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  draft_id constant uuid := 'c6938771-507d-44b5-b69d-9e0b39e42974';
  table_name text;
  affected_counts jsonb := '{}'::jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;

  IF jsonb_typeof(payload) <> 'object'
    OR payload->>'formatVersion' <> '2'
    OR jsonb_typeof(payload->'data') <> 'object'
    OR jsonb_object_length(payload->'data') <> 12
    OR NOT (payload->'data' ?& ARRAY[
      'profiles', 'projects', 'experiences', 'skill_categories', 'skills',
      'contact_info', 'page_sections', 'site_content', 'site_images',
      'education', 'courses', 'languages'
    ]) THEN
    RAISE EXCEPTION 'Invalid portfolio snapshot';
  END IF;

  FOR table_name IN SELECT jsonb_object_keys(payload->'data') LOOP
    IF jsonb_typeof(payload->'data'->table_name) <> 'array' THEN
      RAISE EXCEPTION 'Snapshot entry % must be an array', table_name;
    END IF;
    affected_counts := affected_counts || jsonb_build_object(
      table_name,
      jsonb_array_length(payload->'data'->table_name)
    );
  END LOOP;

  INSERT INTO public.portfolio_content_drafts (id, payload, created_by, published_at, publish_result)
  VALUES (draft_id, payload, auth.uid(), NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET
    payload = EXCLUDED.payload,
    created_by = EXCLUDED.created_by,
    updated_at = timezone('utc'::text, now()),
    published_at = NULL,
    publish_result = NULL;

  RETURN jsonb_build_object(
    'status', 'draft_saved',
    'formatVersion', 2,
    'affectedRows', affected_counts
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_portfolio_draft()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  draft_id constant uuid := 'c6938771-507d-44b5-b69d-9e0b39e42974';
  payload jsonb;
  affected_rows bigint;
  affected_counts jsonb := '{}'::jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;

  SELECT draft.payload INTO payload
  FROM public.portfolio_content_drafts AS draft
  WHERE draft.id = draft_id
    AND draft.published_at IS NULL
  FOR UPDATE;

  IF payload IS NULL THEN
    RAISE EXCEPTION 'No unpublished portfolio draft is available';
  END IF;

  IF jsonb_typeof(payload) <> 'object'
    OR payload->>'formatVersion' <> '2'
    OR jsonb_typeof(payload->'data') <> 'object'
    OR jsonb_object_length(payload->'data') <> 12
    OR NOT (payload->'data' ?& ARRAY[
      'profiles', 'projects', 'experiences', 'skill_categories', 'skills',
      'contact_info', 'page_sections', 'site_content', 'site_images',
      'education', 'courses', 'languages'
    ]) THEN
    RAISE EXCEPTION 'Stored portfolio draft is invalid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_each(payload->'data') AS entries(table_name, table_rows)
    WHERE jsonb_typeof(entries.table_rows) <> 'array'
  ) THEN
    RAISE EXCEPTION 'Stored portfolio table entries must be arrays';
  END IF;

  INSERT INTO public.profiles (id, display_name, title, avatar_url, bio, location, email, interests, experience_years, experience_label, tags, cv_url, open_to_remote, timezone, availability)
  SELECT id, display_name, title, avatar_url, bio, location, email, interests, experience_years, experience_label, tags, cv_url, open_to_remote, timezone, availability
  FROM jsonb_populate_recordset(NULL::public.profiles, payload->'data'->'profiles')
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, title = EXCLUDED.title, avatar_url = EXCLUDED.avatar_url, bio = EXCLUDED.bio, location = EXCLUDED.location, email = EXCLUDED.email, interests = EXCLUDED.interests, experience_years = EXCLUDED.experience_years, experience_label = EXCLUDED.experience_label, tags = EXCLUDED.tags, cv_url = EXCLUDED.cv_url, open_to_remote = EXCLUDED.open_to_remote, timezone = EXCLUDED.timezone, availability = EXCLUDED.availability, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('profiles', affected_rows);

  INSERT INTO public.projects (id, title, category, description, image_url, tags, github_url, demo_url, featured, order_index, problem, highlights, what_i_would_improve)
  SELECT id, title, category, description, image_url, tags, github_url, demo_url, featured, order_index, problem, highlights, what_i_would_improve
  FROM jsonb_populate_recordset(NULL::public.projects, payload->'data'->'projects')
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, description = EXCLUDED.description, image_url = EXCLUDED.image_url, tags = EXCLUDED.tags, github_url = EXCLUDED.github_url, demo_url = EXCLUDED.demo_url, featured = EXCLUDED.featured, order_index = EXCLUDED.order_index, problem = EXCLUDED.problem, highlights = EXCLUDED.highlights, what_i_would_improve = EXCLUDED.what_i_would_improve, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('projects', affected_rows);

  INSERT INTO public.experiences (id, company, period, position, description, highlights, employment_type, location, order_index)
  SELECT id, company, period, position, description, highlights, employment_type, location, order_index
  FROM jsonb_populate_recordset(NULL::public.experiences, payload->'data'->'experiences')
  ON CONFLICT (id) DO UPDATE SET company = EXCLUDED.company, period = EXCLUDED.period, position = EXCLUDED.position, description = EXCLUDED.description, highlights = EXCLUDED.highlights, employment_type = EXCLUDED.employment_type, location = EXCLUDED.location, order_index = EXCLUDED.order_index, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('experiences', affected_rows);

  INSERT INTO public.skill_categories (id, name, icon, order_index)
  SELECT id, name, icon, order_index
  FROM jsonb_populate_recordset(NULL::public.skill_categories, payload->'data'->'skill_categories')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, order_index = EXCLUDED.order_index;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('skill_categories', affected_rows);

  INSERT INTO public.skills (id, name, icon, category_id, level, order_index, svg_url, svg_url_dark)
  SELECT id, name, icon, category_id, level, order_index, svg_url, svg_url_dark
  FROM jsonb_populate_recordset(NULL::public.skills, payload->'data'->'skills')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, category_id = EXCLUDED.category_id, level = EXCLUDED.level, order_index = EXCLUDED.order_index, svg_url = EXCLUDED.svg_url, svg_url_dark = EXCLUDED.svg_url_dark;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('skills', affected_rows);

  INSERT INTO public.contact_info (id, info_key, label, value, type, link, icon, icon_name, order_index, show_publicly)
  SELECT id, info_key, label, value, type, link, icon, icon_name, order_index, show_publicly
  FROM jsonb_populate_recordset(NULL::public.contact_info, payload->'data'->'contact_info')
  ON CONFLICT (id) DO UPDATE SET info_key = EXCLUDED.info_key, label = EXCLUDED.label, value = EXCLUDED.value, type = EXCLUDED.type, link = EXCLUDED.link, icon = EXCLUDED.icon, icon_name = EXCLUDED.icon_name, order_index = EXCLUDED.order_index, show_publicly = EXCLUDED.show_publicly;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('contact_info', affected_rows);

  INSERT INTO public.page_sections (id, section_key, title, subtitle, content)
  SELECT id, section_key, title, subtitle, content
  FROM jsonb_populate_recordset(NULL::public.page_sections, payload->'data'->'page_sections')
  ON CONFLICT (id) DO UPDATE SET section_key = EXCLUDED.section_key, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, content = EXCLUDED.content, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('page_sections', affected_rows);

  INSERT INTO public.site_content (id, key, section, value)
  SELECT id, key, section, value
  FROM jsonb_populate_recordset(NULL::public.site_content, payload->'data'->'site_content')
  ON CONFLICT (id) DO UPDATE SET key = EXCLUDED.key, section = EXCLUDED.section, value = EXCLUDED.value, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('site_content', affected_rows);

  INSERT INTO public.site_images (id, image_key, image_url, alt_text, description)
  SELECT id, image_key, image_url, alt_text, description
  FROM jsonb_populate_recordset(NULL::public.site_images, payload->'data'->'site_images')
  ON CONFLICT (id) DO UPDATE SET image_key = EXCLUDED.image_key, image_url = EXCLUDED.image_url, alt_text = EXCLUDED.alt_text, description = EXCLUDED.description, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('site_images', affected_rows);

  INSERT INTO public.education (id, institution, title, period, description, highlights, related_project_id, order_index)
  SELECT id, institution, title, period, description, highlights, related_project_id, order_index
  FROM jsonb_populate_recordset(NULL::public.education, payload->'data'->'education')
  ON CONFLICT (id) DO UPDATE SET institution = EXCLUDED.institution, title = EXCLUDED.title, period = EXCLUDED.period, description = EXCLUDED.description, highlights = EXCLUDED.highlights, related_project_id = EXCLUDED.related_project_id, order_index = EXCLUDED.order_index, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('education', affected_rows);

  INSERT INTO public.courses (id, title, provider, description, period, certificate_url, order_index)
  SELECT id, title, provider, description, period, certificate_url, order_index
  FROM jsonb_populate_recordset(NULL::public.courses, payload->'data'->'courses')
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, provider = EXCLUDED.provider, description = EXCLUDED.description, period = EXCLUDED.period, certificate_url = EXCLUDED.certificate_url, order_index = EXCLUDED.order_index, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('courses', affected_rows);

  INSERT INTO public.languages (id, name, level, order_index)
  SELECT id, name, level, order_index
  FROM jsonb_populate_recordset(NULL::public.languages, payload->'data'->'languages')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level, order_index = EXCLUDED.order_index, updated_at = timezone('utc'::text, now());
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  affected_counts := affected_counts || jsonb_build_object('languages', affected_rows);

  UPDATE public.portfolio_content_drafts
  SET published_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now()),
      publish_result = jsonb_build_object(
        'status', 'published',
        'formatVersion', 2,
        'affectedRows', affected_counts
      )
  WHERE id = draft_id;

  RETURN jsonb_build_object(
    'status', 'published',
    'formatVersion', 2,
    'affectedRows', affected_counts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_portfolio_draft(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_portfolio_draft() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_portfolio_draft(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_portfolio_draft() TO authenticated;
