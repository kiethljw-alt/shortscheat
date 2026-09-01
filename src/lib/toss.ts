import { loadTossPayments, TossPaymentsSDK } from "@tosspayments/tosspayments-sdk";

let tossPaymentsPromise: Promise<TossPaymentsSDK> | null = null;

export async function getTossPayment(customerKey: string) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았습니다.");
  }

  if (!tossPaymentsPromise) {
    tossPaymentsPromise = loadTossPayments(clientKey);
  }

  const tossPayments = await tossPaymentsPromise;
  return tossPayments.payment({ customerKey });
}
