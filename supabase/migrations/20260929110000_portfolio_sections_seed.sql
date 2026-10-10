INSERT INTO public.education (id, institution, title, period, description, highlights, related_project_id, order_index)
VALUES (
  'a98b932f-cdec-4ae5-9420-c891ab6ce09f',
  'Escola Secundária Leal da Câmara',
  'Professional Technical Course in Management and Programming of IT Systems',
  '2017 – 2020',
  'TODO(me): Confirm whether the school name should be spelled “Leal da Câmera”.',
  ARRAY['C++, C#, Java, PHP, JavaScript, SQL, HTML, CSS', 'Unity, Bootstrap, AJAX', 'Windows/Linux, Cisco Packet Tracer'],
  (SELECT id FROM public.projects WHERE lower(title) = 'games library' ORDER BY id LIMIT 1),
  1
)
ON CONFLICT (id) DO UPDATE SET
  institution = EXCLUDED.institution,
  title = EXCLUDED.title,
  period = EXCLUDED.period,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  related_project_id = EXCLUDED.related_project_id,
  order_index = EXCLUDED.order_index,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.courses (id, title, provider, description, period, certificate_url, order_index)
VALUES (
  '6b0ad38c-1fc6-482d-80da-9194d89e5927',
  'Professional React & Next.js Program',
  'ByteGrad',
  'Seven production-style apps covering authentication, payments with Stripe, SSR/SSG, state management, and PostgreSQL.',
  'TODO(me): Add course dates.',
  'TODO(me): Add certificate URL.',
  1
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  description = EXCLUDED.description,
  period = EXCLUDED.period,
  certificate_url = EXCLUDED.certificate_url,
  order_index = EXCLUDED.order_index,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.languages (id, name, level, order_index)
VALUES
  ('2d0db2bf-1cd8-4d3c-b8fc-e1b16b25bdcb', 'Portuguese', 'Native', 1),
  ('3cb3d4e5-53f5-4e3e-a2f5-42e807140e7b', 'English', 'TODO(me)', 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  order_index = EXCLUDED.order_index,
  updated_at = timezone('utc'::text, now());
