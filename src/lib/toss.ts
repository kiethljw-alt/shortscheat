import {
  loadTossPayments,
  TossPaymentsSDK,
  TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";

// 결제위젯(주문서형) 연동 키와 API 개별 연동 키는 토스 쪽에서 서로 다른 발급
// 체계라 SDK 인스턴스를 공유하면 안 된다 — 각자 자기 클라이언트 키로 로드한다.
let widgetsPaymentsPromise: Promise<TossPaymentsSDK> | null = null;
let billingPaymentsPromise: Promise<TossPaymentsSDK> | null = null;

// 1회성 크레딧 충전 — 결제위젯(주문서형) 방식. 회원가입 전에도 문서 테스트 키로 연동 가능.
export async function getTossWidgets(
  customerKey: string
): Promise<TossPaymentsWidgets> {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았습니다.");
  }
  if (!widgetsPaymentsPromise) {
    widgetsPaymentsPromise = loadTossPayments(clientKey);
  }
  const tossPayments = await widgetsPaymentsPromise;
  return tossPayments.widgets({ customerKey });
}

// 정기구독(자동결제/빌링) — API 개별 연동 키 전용. Toss 개발자센터 가입 후 발급되는
// 키가 필요하며, 문서에 공개된 위젯용 테스트 키로는 동작하지 않음.
export async function getTossPayment(customerKey: string) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_BILLING_CLIENT_KEY;
  if (!clientKey) {
    throw new Error("NEXT_PUBLIC_TOSS_BILLING_CLIENT_KEY가 설정되지 않았습니다.");
  }
  if (!billingPaymentsPromise) {
    billingPaymentsPromise = loadTossPayments(clientKey);
  }
  const tossPayments = await billingPaymentsPromise;
  return tossPayments.payment({ customerKey });
}
