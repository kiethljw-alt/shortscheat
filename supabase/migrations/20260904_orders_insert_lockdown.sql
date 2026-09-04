-- 보안 수정: orders 테이블의 클라이언트 INSERT 정책이 credits/amount 값을
-- 전혀 검증하지 않아, 인증된 사용자가 anon key로 직접
--   insert into orders (user_id, credits, amount, status, ...) values (본인, 999999, 100, 'pending', ...)
-- 같은 위조 주문을 만든 뒤 소액만 실제 결제하고 confirm_order로 임의의 큰
-- 크레딧을 받아갈 수 있었다(결제 금액 자체는 Toss가 검증하지만, credits 값은
-- orders 테이블에 저장된 그대로 지급되기 때문). 주문 생성은 이제 서버 라우트가
-- creditPackages.ts 가격표로 계산해 admin(service_role) 클라이언트로만 만들도록
-- 바꿨으므로, 클라이언트가 직접 orders에 쓸 수 있는 경로 자체를 없앤다.

DROP POLICY IF EXISTS "Users can create own pending orders" ON public.orders;
