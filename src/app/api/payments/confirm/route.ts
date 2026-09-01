import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "결제 설정이 완료되지 않았습니다. (TOSS_SECRET_KEY 누락)" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  let body: { paymentKey?: unknown; orderId?: unknown; amount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { paymentKey, orderId, amount } = body;
  if (
    typeof paymentKey !== "string" ||
    typeof orderId !== "string" ||
    typeof amount !== "number"
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 주문이 실제로 이 사용자의 pending 주문이고, 금액이 일치하는지 먼저 확인.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("amount, status, user_id")
    .eq("order_id", orderId)
    .single();

  if (orderError || !order || order.user_id !== user.id) {
    return NextResponse.json(
      { error: "주문을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (order.status !== "pending") {
    return NextResponse.json(
      { error: "이미 처리된 주문입니다." },
      { status: 409 }
    );
  }

  if (order.amount !== amount) {
    return NextResponse.json(
      { error: "결제 금액이 주문 금액과 일치하지 않습니다." },
      { status: 400 }
    );
  }

  // Toss 서버에 결제 승인 요청 (금액 위변조는 Toss 쪽에서도 검증됨).
  const confirmRes = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }
  );

  if (!confirmRes.ok) {
    const errorBody = await confirmRes.json().catch(() => null);
    console.error("Toss payment confirm failed:", errorBody);
    return NextResponse.json(
      { error: errorBody?.message ?? "결제 승인에 실패했습니다." },
      { status: 502 }
    );
  }

  const { data: newCredits, error: rpcError } = await supabase.rpc(
    "confirm_order",
    { p_order_id: orderId, p_payment_key: paymentKey }
  );

  if (rpcError) {
    console.error("confirm_order RPC failed:", rpcError);
    return NextResponse.json(
      {
        error:
          "결제는 승인되었지만 크레딧 지급에 실패했습니다. 고객센터에 문의해 주세요.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, creditsLeft: newCredits });
}
