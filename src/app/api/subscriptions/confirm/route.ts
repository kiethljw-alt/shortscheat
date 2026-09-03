import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_PLAN } from "@/lib/subscriptionPlan";

export async function POST(req: Request) {
  const secretKey = process.env.TOSS_BILLING_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "결제 설정이 완료되지 않았습니다. (TOSS_BILLING_SECRET_KEY 누락)" },
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

  let body: { authKey?: unknown; customerKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { authKey, customerKey } = body;
  if (
    typeof authKey !== "string" ||
    typeof customerKey !== "string" ||
    customerKey !== user.id
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  // 1) authKey -> billingKey 발급
  const issueRes = await fetch(
    "https://api.tosspayments.com/v1/billing/authorizations/issue",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ authKey, customerKey }),
    }
  );

  if (!issueRes.ok) {
    const errorBody = await issueRes.json().catch(() => null);
    console.error("Billing key issue failed:", errorBody);
    Sentry.captureMessage("Billing key issue failed", {
      level: "warning",
      extra: { userId: user.id, errorBody },
    });
    return NextResponse.json(
      { error: errorBody?.message ?? "카드 등록에 실패했습니다." },
      { status: 502 }
    );
  }

  const { billingKey } = await issueRes.json();

  // 2) 첫 결제 즉시 청구
  const orderId = `sub_${crypto.randomUUID()}`;
  const chargeRes = await fetch(
    `https://api.tosspayments.com/v1/billing/${billingKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        customerKey,
        amount: SUBSCRIPTION_PLAN.amount,
        orderId,
        orderName: `ShortsCheat ${SUBSCRIPTION_PLAN.label}`,
        customerEmail: user.email ?? undefined,
      }),
    }
  );

  if (!chargeRes.ok) {
    const errorBody = await chargeRes.json().catch(() => null);
    console.error("First billing charge failed:", errorBody);
    Sentry.captureMessage("First billing charge failed", {
      level: "warning",
      extra: { userId: user.id, orderId, errorBody },
    });
    return NextResponse.json(
      { error: errorBody?.message ?? "결제에 실패했습니다." },
      { status: 502 }
    );
  }

  const admin = createAdminClient();
  const nextBillingAt = new Date(
    Date.now() + SUBSCRIPTION_PLAN.intervalDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: upsertError } = await admin.from("subscriptions").upsert({
    user_id: user.id,
    billing_key: billingKey,
    customer_key: customerKey,
    plan_id: SUBSCRIPTION_PLAN.id,
    credits_per_cycle: SUBSCRIPTION_PLAN.credits,
    amount: SUBSCRIPTION_PLAN.amount,
    status: "active",
    next_billing_at: nextBillingAt,
    canceled_at: null,
  });

  if (upsertError) {
    console.error("Subscription upsert failed:", upsertError);
    Sentry.captureException(upsertError, {
      extra: { userId: user.id, billingKey },
    });
    return NextResponse.json(
      {
        error:
          "결제는 완료됐지만 구독 등록에 실패했습니다. 고객센터에 문의해 주세요.",
      },
      { status: 500 }
    );
  }

  const { data: newCredits, error: grantError } = await admin.rpc(
    "grant_subscription_credits",
    { p_user_id: user.id, p_credits: SUBSCRIPTION_PLAN.credits }
  );

  if (grantError) {
    console.error("grant_subscription_credits failed:", grantError);
    Sentry.captureException(grantError, { extra: { userId: user.id } });
    return NextResponse.json(
      {
        error:
          "결제는 완료됐지만 크레딧 지급에 실패했습니다. 고객센터에 문의해 주세요.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, creditsLeft: newCredits });
}
