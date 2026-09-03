import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 계정 삭제. profiles/subscriptions/orders는 auth.users FK에 ON DELETE CASCADE가
// 걸려 있어 auth 계정만 지우면 관련 데이터가 전부 함께 정리된다. 구독 행이
// 사라지면 renew 크론의 status='active' 조회에도 더 이상 걸리지 않아 재청구
// 걱정은 없지만, Toss 쪽에 남는 빌링키 자체는 별도로 삭제해줘야 완전히
// 정리된다 — 탈퇴 전에 활성 구독이 있으면 Toss 빌링키 삭제 API를 먼저 호출한다.
export async function POST() {
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

  const admin = createAdminClient();

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("billing_key")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (subscription?.billing_key) {
    const secretKey = process.env.TOSS_BILLING_SECRET_KEY;
    if (secretKey) {
      try {
        const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
        const res = await fetch(
          `https://api.tosspayments.com/v1/billing/${subscription.billing_key}`,
          { method: "DELETE", headers: { Authorization: authHeader } }
        );
        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          console.error("Toss billing key deletion failed:", errorBody);
          Sentry.captureMessage("Toss billing key deletion failed on account delete", {
            level: "warning",
            extra: { userId: user.id, errorBody },
          });
        }
      } catch (err) {
        // 빌링키 삭제 실패는 탈퇴 자체를 막을 이유가 아니다 — 로그만 남기고 계속 진행.
        console.error("Toss billing key deletion request failed:", err);
        Sentry.captureException(err, { extra: { userId: user.id } });
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Account deletion failed:", error);
    Sentry.captureException(error, { extra: { userId: user.id } });
    return NextResponse.json(
      { error: "회원 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
