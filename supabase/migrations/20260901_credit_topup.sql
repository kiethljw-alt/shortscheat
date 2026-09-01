-- 크레딧 충전(Toss Payments) 주문 테이블 및 결제 확정 RPC.
-- 주문은 서버(Next.js API route)가 사용자 세션으로 pending 상태로 먼저 생성하고,
-- Toss 결제 확정(API) 이후에만 confirm_order RPC로 크레딧을 지급합니다.
-- status='pending' 가드로 같은 주문이 두 번 크레딧을 지급하는 것을 막습니다.

CREATE TABLE IF NOT EXISTS public.orders (
  order_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id text NOT NULL,
  credits integer NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- 서버가 사용자 세션으로 pending 주문을 생성할 수 있도록 허용.
-- amount/credits는 API route가 서버 측 가격표(creditPackages.ts)로만 계산하므로
-- 클라이언트가 임의 금액을 주문하도록 조작할 수 없습니다.
CREATE POLICY "Users can create own pending orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

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

  RETURN v_new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_order(text, text) TO authenticated;
