CREATE OR REPLACE FUNCTION public.restore_portfolio_content(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;

  RAISE EXCEPTION 'Version 1 snapshot restore is disabled. Use the version 2 draft and publish workflow.';
END;
$$;

REVOKE ALL ON FUNCTION public.restore_portfolio_content(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_portfolio_content(jsonb) TO authenticated;
