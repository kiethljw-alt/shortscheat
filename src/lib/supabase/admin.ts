import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role 키는 RLS를 우회합니다. 절대 클라이언트로 내려보내거나 로그에 남기지 마세요.
// 구독 갱신(cron)처럼 사용자 세션이 없는 서버 전용 작업에만 사용합니다.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
