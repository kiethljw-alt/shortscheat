-- Atomic credit helpers. Run in Supabase SQL Editor if CLI is not set up.
-- decrement_credit / refund_credit use auth.uid() so clients cannot touch another user.

CREATE OR REPLACE FUNCTION public.decrement_credit()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.profiles
  SET credits_left = credits_left - 1
  WHERE id = auth.uid()
    AND credits_left > 0
  RETURNING credits_left INTO new_credits;

  RETURN new_credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credit()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.profiles
  SET credits_left = credits_left + 1
  WHERE id = auth.uid()
  RETURNING credits_left INTO new_credits;

  RETURN new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_credit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credit() TO authenticated;
