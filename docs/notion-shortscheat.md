# ShortsCheat — AI 숏폼 대본 생성 서비스

> 최초 생성일: 2026-06-02 (당시 "Outsource Builder")
> 갱신일: 2026-09-02 — ShortsCheat으로 피벗, 이 문서도 재작성
> 경로: `~/Projects/outsource-builder`
> 저장소: https://github.com/kiethljw-alt/shortscheat

---

## 개요

유튜브 쇼츠·인스타그램 릴스·틱톡용 숏폼 대본(후킹 문구, 타임라인 연출, 해시태그)을
AI로 몇 초 만에 생성해주는 웹 서비스.

**흐름:** 주제 입력 → GPT-4o-mini 대본 생성 → 복사/저장 → (크레딧 소진 시) 충전/구독

---

## 완료된 것

### 1. 핵심 대본 생성
- `/api/generate` — GPT-4o-mini 기반, 후킹 문구 3종·타임라인별 연출·해시태그를 JSON으로 생성
- 로컬 이력(localStorage, 최근 10개)

### 2. 로그인 & 무료 크레딧
- Supabase Auth로 구글/카카오 소셜 로그인
- 가입 시 무료 크레딧 5회 자동 지급 (`profiles` 테이블 + 트리거)

### 3. 결제 (Toss Payments)
- 1회성 크레딧 충전: 10회 3,900원 / 30회 8,900원 / 100회 19,900원 (볼륨 할인)
- 월 정기구독: 월 9,900원에 30회 자동 충전, 언제든 해지 가능
- 결제 승인은 서버에서만 처리, 크레딧 지급은 pending 상태를 소모하는 RPC로만 가능
  (중복 지급 방지)

### 4. 법적 페이지
- 이용약관 / 개인정보처리방침 (`[회사명/상호]`, `[고객센터 이메일]` 등 placeholder
  아직 실제 정보로 채워야 함 — 법률 검토 필요)

### 5. 코드 정리
- 옛 "외주 개발 자동화" 기능(IntakeForm, agent-runner, `/api/intake`, `/api/jobs`,
  `@cursor/sdk` 등) 전부 삭제, `package.json` name → `shortscheat`

### 6. 안정성 / 모니터링
- OpenAI 호출 timeout(30s)/재시도(2회)
- 사용자당 분당 10회 rate limit (Postgres RPC)
- Sentry 최소 연동 (`@sentry/nextjs`, DSN 없으면 비활성)

---

## 기술 스택

- **프레임워크:** Next.js 16 (Turbopack) + TypeScript + Tailwind CSS v4
- **인증/DB:** Supabase (Auth, Postgres, RLS)
- **결제:** Toss Payments (결제창 + 빌링/자동결제)
- **AI:** OpenAI gpt-4o-mini
- **모니터링:** Sentry (선택)

---

## 개발 진행 순서 (다음 단계)

우선순위는 "실제로 동작하는지 검증"이 "새 기능 추가"보다 먼저다 — 이미 구현된
결제/구독 코드가 실제 Toss/Supabase 환경에서 한 번도 실행된 적이 없어서, 그 위에
새 기능을 쌓기 전에 먼저 굳혀야 함.

1. **[진행 중] 실제 환경 검증** — Toss 테스트 키 발급, Supabase에 마이그레이션
   (`profiles`, `credit_rpc`, `credit_topup`, `subscriptions`, `rate_limit`) 적용,
   실제 로그인 → 크레딧 차감 → 충전 → 구독 → 해지까지 end-to-end 확인
2. **[예정] 실시간 인기 쇼츠 토픽 순위표** — 유튜브 Data API(`videos.list?chart=mostPopular`)로
   트렌딩 영상을 몇 시간 주기로 수집 → GPT-4o-mini로 숏폼 소재용 토픽 추출 →
   Supabase에 캐싱 → 랭킹 UI에서 클릭하면 대본 생성 폼에 자동 입력.
   API/AI 비용은 하루 수십 원 이내로 무시할 수준, 개발 공수가 실제 비용
   (결제 기능과 비슷한 규모)

---

## 향후 확장 아이디어 (미정)

- [ ] 트렌딩 토픽 카테고리/플랫폼별 필터
- [ ] 생성된 대본 자체 평가(예상 조회수/후킹 점수) 피드백
- [ ] 크레딧 소진 시 이메일 알림
- [ ] 팀/에이전시용 다중 시트 관리

---

## 참고

- Toss Payments 개발자센터: https://developers.tosspayments.com/my/api-keys
- Supabase 마이그레이션 파일: `supabase/migrations/`
- `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`은 절대 클라이언트/공개 저장소에 노출 금지
