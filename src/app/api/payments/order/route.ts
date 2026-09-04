import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // credits/amount는 서버가 이 시점에 creditPackages.ts 가격표로만 계산하므로,
  // 클라이언트가 임의의 크레딧/금액 조합으로 직접 주문을 만들 수 없도록 admin
  // 클라이언트로 insert한다(RLS의 클라이언트 INSERT 정책은 제거됨).
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("orders").insert({
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
