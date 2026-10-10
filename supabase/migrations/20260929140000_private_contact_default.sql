ALTER TABLE public.contact_info
  ALTER COLUMN show_publicly SET DEFAULT false;

WITH phone_rows AS (
  SELECT id
  FROM public.contact_info
  WHERE lower(COALESCE(label, '')) LIKE '%phone%'
     OR lower(COALESCE(info_key, '')) LIKE '%phone%'
)
UPDATE public.contact_info AS contact
SET show_publicly = false
WHERE contact.id IN (SELECT id FROM phone_rows)
  AND contact.show_publicly IS DISTINCT FROM false;
