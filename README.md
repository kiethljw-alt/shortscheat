# ShortsCheat

AI로 유튜브 쇼츠·인스타그램 릴스·틱톡용 숏폼 대본(후킹 문구, 타임라인 연출, 해시태그)을
몇 초 만에 생성해주는 웹 서비스입니다.

## 기능

1. **AI 대본 생성** — 주제/타깃/플랫폼/톤앤매너를 입력하면 GPT-4o-mini가 후킹 문구·타임라인별
   연출·해시태그를 JSON 형식으로 생성
2. **소셜 로그인 & 무료 크레딧** — 구글/카카오 로그인, 가입 시 무료 크레딧 5회 지급 (Supabase Auth)
3. **크레딧 충전 & 정기구독** — Toss Payments로 크레딧 충전(1회성) 또는 월 정기구독 가능
4. **로컬 이력 관리** — 최근 생성한 대본 10개를 브라우저 localStorage에 저장

## 시작하기

```bash
cd ~/Projects/outsource-builder
cp .env.example .env.local
# .env.local에 아래 "환경 변수" 항목을 채워 넣기

npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | 대본 생성용 OpenAI API 키 |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 프로젝트 URL/anon 키 (로그인·크레딧) |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` | Toss Payments 클라이언트/시크릿 키 (충전·구독 결제) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키. 구독 갱신 등 서버 전용 작업에만 사용, 절대 클라이언트에 노출 금지 |
| `CRON_SECRET` | `/api/subscriptions/renew`를 호출하는 외부 크론 인증용 임의 비밀값 |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | Sentry 에러 모니터링 (선택, 비워두면 비활성화) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | 프로덕션 빌드 시 Sentry 소스맵 업로드용 (선택) |

## Supabase 설정

1. `supabase/migrations/`의 SQL 파일들을 순서대로 Supabase SQL Editor(또는 CLI)에서 실행
   - `profiles`, `orders`, `subscriptions` 테이블과 크레딧 관련 RPC 생성
2. Authentication에서 Google/Kakao OAuth 프로바이더 활성화, 리다이렉트 URL에 `/auth/callback` 등록
3. `/api/subscriptions/renew`를 매일 호출하는 크론(Supabase pg_cron, Vercel Cron 등) 등록
   — `Authorization: Bearer $CRON_SECRET` 헤더 필요

## 프로젝트 구조

```
src/
  app/
    api/generate/          # 대본 생성 API (인증·크레딧 확인 포함)
    api/payments/          # 1회성 크레딧 충전 (주문 생성 → Toss 결제 확정)
    api/subscriptions/     # 정기구독 등록/갱신/해지
    auth/callback/         # OAuth 콜백
    payments/, subscriptions/  # 결제 성공/실패 리다이렉트 페이지
    terms/, privacy/       # 이용약관, 개인정보처리방침
  components/              # Header(로그인/크레딧), RechargeModal(충전/구독) 등 UI
  lib/
    supabase/              # 브라우저/서버/관리자(service role) 클라이언트
    creditPackages.ts, subscriptionPlan.ts  # 가격표
    toss.ts                # Toss Payments SDK 로더
supabase/migrations/       # DB 스키마 & RPC
```

## API

- `POST /api/generate` — 대본 생성 (로그인 필요, 크레딧 1개 차감)
- `POST /api/payments/order` / `POST /api/payments/confirm` — 크레딧 충전 주문/결제 확정
- `POST /api/subscriptions/confirm` — 정기구독 등록 및 첫 결제
- `POST /api/subscriptions/renew` — 정기구독 갱신 (크론 전용, `CRON_SECRET` 필요)
- `POST /api/subscriptions/cancel` — 정기구독 해지
