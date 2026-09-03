import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_PLAN } from "@/lib/subscriptionPlan";

// 외부 크론(Vercel Cron)이 주기적으로 호출하는 엔드포인트.
// CRON_SECRET 헤더 검증 없이는 아무도 이 라우트를 호출해 실제 카드 결제를
// 트리거할 수 없도록 막습니다.
// Vercel Cron은 GET으로만 호출하므로 GET을 기본으로 두고, 수동 테스트를 위해
// POST도 동일한 로직을 공유하도록 남겨둡니다.
async function renewDueSubscriptions(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const authHeaderValue = req.headers.get("authorization");
  if (authHeaderValue !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.TOSS_BILLING_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "TOSS_BILLING_SECRET_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: dueSubscriptions, error: fetchError } = await admin
    .from("subscriptions")
    .select("user_id, billing_key, customer_key, next_billing_at")
    .eq("status", "active")
    .lte("next_billing_at", now.toISOString());

  if (fetchError) {
    console.error("Failed to fetch due subscriptions:", fetchError);
    Sentry.captureException(fetchError);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  const results: { userId: string; ok: boolean; reason?: string }[] = [];
  const tossAuthHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  for (const sub of dueSubscriptions ?? []) {
    // 동시 실행 중복 청구 방지: 이 구독이 여전히 만기 상태일 때만 다음 결제일을
    // 먼저 미뤄놓고(낙관적 락) 그 갱신에 성공한 요청만 실제 결제를 진행합니다.
    const nextBillingAt = new Date(
      now.getTime() + SUBSCRIPTION_PLAN.intervalDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: locked, error: lockError } = await admin
      .from("subscriptions")
      .update({ next_billing_at: nextBillingAt })
      .eq("user_id", sub.user_id)
      .eq("status", "active")
      .lte("next_billing_at", sub.next_billing_at)
      .select("user_id")
      .maybeSingle();

    if (lockError || !locked) {
      continue;
    }

    const orderId = `sub_renew_${crypto.randomUUID()}`;
    const chargeRes = await fetch(
      `https://api.tosspayments.com/v1/billing/${sub.billing_key}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: tossAuthHeader,
        },
        body: JSON.stringify({
          customerKey: sub.customer_key,
          amount: SUBSCRIPTION_PLAN.amount,
          orderId,
          orderName: `ShortsCheat ${SUBSCRIPTION_PLAN.label} 갱신`,
        }),
      }
    );

    if (!chargeRes.ok) {
      const errorBody = await chargeRes.json().catch(() => null);
      console.error(`Renewal charge failed for user ${sub.user_id}:`, errorBody);
      Sentry.captureMessage("Subscription renewal charge failed", {
        level: "warning",
        extra: { userId: sub.user_id, orderId, errorBody },
      });
      await admin
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", sub.user_id);
      results.push({
        userId: sub.user_id,
        ok: false,
        reason: errorBody?.message ?? "charge failed",
      });
      continue;
    }

    const { error: grantError } = await admin.rpc(
      "grant_subscription_credits",
      { p_user_id: sub.user_id, p_credits: SUBSCRIPTION_PLAN.credits }
    );

    if (grantError) {
      console.error(`Credit grant failed for user ${sub.user_id}:`, grantError);
      Sentry.captureException(grantError, {
        extra: { userId: sub.user_id, orderId },
      });
      results.push({ userId: sub.user_id, ok: false, reason: "grant failed" });
      continue;
    }

    results.push({ userId: sub.user_id, ok: true });
  }

  return NextResponse.json({ processed: results.length, results });
}

export async function GET(req: Request) {
  return renewDueSubscriptions(req);
}

export async function POST(req: Request) {
  return renewDueSubscriptions(req);
}
