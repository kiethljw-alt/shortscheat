import { NextResponse } from "next/server";
import { startBuild } from "@/lib/build-orchestrator";
import { intakeSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = intakeSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const job = await startBuild(parsed.data);

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: "빌드가 시작되었습니다.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
