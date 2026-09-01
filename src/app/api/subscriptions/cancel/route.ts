import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { error } = await admin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    console.error("Subscription cancel failed:", error);
    return NextResponse.json(
      { error: "구독 해지에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
