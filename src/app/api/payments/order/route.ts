import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreditPackage } from "@/lib/creditPackages";

export async function POST(req: Request) {
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

  let body: { packageId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const packageId = typeof body.packageId === "string" ? body.packageId : "";
  const creditPackage = getCreditPackage(packageId);

  if (!creditPackage) {
    return NextResponse.json(
      { error: "존재하지 않는 크레딧 패키지입니다." },
      { status: 400 }
    );
  }

  const orderId = `order_${crypto.randomUUID()}`;

  const { error: insertError } = await supabase.from("orders").insert({
    order_id: orderId,
    user_id: user.id,
    package_id: creditPackage.id,
    credits: creditPackage.credits,
    amount: creditPackage.amount,
    status: "pending",
  });

  if (insertError) {
    console.error("Order insert failed:", insertError);
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    orderId,
    amount: creditPackage.amount,
    orderName: `ShortsCheat 크레딧 ${creditPackage.credits}회 (${creditPackage.label})`,
    customerEmail: user.email ?? undefined,
  });
}
