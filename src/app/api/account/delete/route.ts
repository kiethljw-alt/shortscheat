import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 계정 삭제. profiles/subscriptions/orders는 auth.users FK에 ON DELETE CASCADE가
// 걸려 있어 auth 계정만 지우면 관련 데이터가 전부 함께 정리된다.
// 활성 구독이 있어도 별도 처리가 필요 없다 — 구독 행이 사라지면 renew 크론의
// status='active' 조회에도 더 이상 걸리지 않는다.
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
