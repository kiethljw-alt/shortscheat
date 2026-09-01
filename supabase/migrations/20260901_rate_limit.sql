-- 대본 생성 API에 대한 사용자별 고정 윈도우(fixed window) rate limit.
-- 서버(로그인 세션)에서만 호출되며, 파라미터 없이 한도(10회/60초)를 함수 안에 고정해
-- 클라이언트가 한도 자체를 조작할 수 없게 합니다.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rl_window_start timestamptz,
  ADD COLUMN IF NOT EXISTS rl_window_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.check_generate_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
  v_limit constant integer := 10;
  v_window_seconds constant integer := 60;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- 동시 요청 경합 방지를 위해 이 사용자의 profiles 행을 잠급니다.
  SELECT rl_window_start, rl_window_count INTO v_window_start, v_count
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF v_window_start IS NULL
     OR now() - v_window_start > make_interval(secs => v_window_seconds) THEN
    UPDATE public.profiles
    SET rl_window_start = now(), rl_window_count = 1
    WHERE id = auth.uid();
    RETURN true;
  END IF;

  IF v_count >= v_limit THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET rl_window_count = rl_window_count + 1
  WHERE id = auth.uid();
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_generate_rate_limit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_generate_rate_limit() TO authenticated;
