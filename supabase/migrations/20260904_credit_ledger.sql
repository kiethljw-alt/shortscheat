-- 크레딧 변동 이력(credit_ledger) 테이블.
-- 지금까지는 profiles.credits_left 잔액만 있고 "왜 바뀌었는지" 기록이 없었다.
-- 마이페이지에 결제내역/크레딧 이력을 보여주기 위해, 크레딧을 바꾸는 모든
-- SECURITY DEFINER 함수(가입 보너스/생성 차감/생성 실패 환불/충전/구독 지급)가
-- 잔액을 바꿀 때마다 이 테이블에도 한 행씩 남기도록 재정의한다.

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL, -- signup_bonus | generation | generation_refund | topup | subscription
  reference_id text,    -- orders.order_id (충전/구독 결제 건일 때만)
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit ledger"
  ON public.credit_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- 직접 INSERT는 막는다(정책 없음) — 아래 SECURITY DEFINER 함수들만 기록을 남긴다.

-- 1) 가입 보너스: handle_new_user 트리거 재정의.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, credits_left)
  VALUES (NEW.id, 5)
  ON CONFLICT (id) DO NOTHING;

  IF FOUND THEN
    INSERT INTO public.credit_ledger (user_id, delta, balance_after, reason)
    VALUES (NEW.id, 5, 5, 'signup_bonus');
  END IF;

  RETURN NEW;
END;
$$;

-- 2) 생성 시 차감.
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

  IF new_credits IS NOT NULL THEN
    INSERT INTO public.credit_ledger (user_id, delta, balance_after, reason)
    VALUES (auth.uid(), -1, new_credits, 'generation');
  END IF;

  RETURN new_credits;
END;
$$;

-- 3) 생성 실패 시 환불.
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

  IF new_credits IS NOT NULL THEN
    INSERT INTO public.credit_ledger (user_id, delta, balance_after, reason)
    VALUES (auth.uid(), 1, new_credits, 'generation_refund');
  END IF;

  RETURN new_credits;
END;
$$;

-- 4) 1회성 크레딧 충전 확정.
CREATE OR REPLACE FUNCTION public.confirm_order(p_order_id text, p_payment_key text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_credits integer;
  v_new_credits integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.orders
  SET status = 'paid', payment_key = p_payment_key, paid_at = now()
  WHERE order_id = p_order_id
    AND user_id = auth.uid()
    AND status = 'pending'
  RETURNING user_id, credits INTO v_user_id, v_credits;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order not found or already processed';
  END IF;

  UPDATE public.profiles
  SET credits_left = credits_left + v_credits
  WHERE id = v_user_id
  RETURNING credits_left INTO v_new_credits;

  INSERT INTO public.credit_ledger (user_id, delta, balance_after, reason, reference_id)
  VALUES (v_user_id, v_credits, v_new_credits, 'topup', p_order_id);

  RETURN v_new_credits;
END;
$$;

-- 5) 정기구독 크레딧 지급 — order_id를 받아 ledger에 남기도록 파라미터 추가.
-- 파라미터 개수가 바뀌므로(2개 -> 3개) 기존 함수를 먼저 지우고 다시 만든다.
DROP FUNCTION IF EXISTS public.grant_subscription_credits(uuid, integer);

CREATE FUNCTION public.grant_subscription_credits(
  p_user_id uuid,
  p_credits integer,
  p_order_id text DEFAULT NULL
)
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

  INSERT INTO public.credit_ledger (user_id, delta, balance_after, reason, reference_id)
  VALUES (p_user_id, p_credits, v_new_credits, 'subscription', p_order_id);

  RETURN v_new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_subscription_credits(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_subscription_credits(uuid, integer, text) TO service_role;
