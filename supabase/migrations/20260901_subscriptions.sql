-- 월 정기구독(Toss 자동결제/빌링) 상태 테이블.
-- billing_key는 카드 자체가 아니라 Toss가 발급한 재청구용 토큰입니다.
-- 모든 쓰기(구독 등록/갱신/해지)는 service_role로만 수행되며(RLS를 우회),
-- 일반 사용자는 자신의 구독 상태를 조회만 할 수 있습니다.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_key text NOT NULL,
  customer_key text NOT NULL,
  plan_id text NOT NULL,
  credits_per_cycle integer NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active | canceled | past_due
  next_billing_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 구독 갱신/최초 결제 성공 시 크레딧을 지급하는 RPC.
-- service_role(서버의 관리자 클라이언트)에서만 호출되어야 하므로 authenticated에는
-- 실행 권한을 주지 않습니다. (일반 사용자가 직접 호출해 크레딧을 얻을 수 없음)
CREATE OR REPLACE FUNCTION public.grant_subscription_credits(p_user_id uuid, p_credits integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_credits integer;
BEGIN
  UPDATE public.profiles
  SET credits_left = credits_left + p_credits
  WHERE id = p_user_id
  RETURNING credits_left INTO v_new_credits;

  IF v_new_credits IS NULL THEN
    RAISE EXCEPTION 'profile not found for user %', p_user_id;
  END IF;

  RETURN v_new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_subscription_credits(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_subscription_credits(uuid, integer) TO service_role;
