# Outsource Builder

외주 개발 신청 정보를 입력하면 프로젝트를 자동으로 생성하고, Cursor Agent가 앱 개발을 진행하는 웹 툴입니다.

## 기능

1. **외주 신청 폼** — 프로젝트 개요, 코드 작성 방식, 주의사항 등 입력
2. **자동 스캐폴딩** — `generated/` 폴더에 프로젝트 생성
   - `README.md`, `AGENTS.md`, `BUILD_PROMPT.md`
   - `.cursor/rules/project.mdc` (에이전트 규칙)
   - `intake.json` (원본 신청 데이터)
3. **AI 자동 개발** — `CURSOR_API_KEY` 설정 시 Cursor SDK로 에이전트 실행

## 시작하기

```bash
cd ~/Projects/outsource-builder
cp .env.example .env.local
# .env.local 에 CURSOR_API_KEY 입력 (선택)

npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## API 키 없이 사용

`CURSOR_API_KEY` 없이도 **스캐폴딩까지는 동작**합니다. 생성된 프로젝트의 `BUILD_PROMPT.md`를 Cursor에서 열어 수동으로 개발을 이어갈 수 있습니다.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `CURSOR_API_KEY` | Cursor API 키 (자동 개발용) |
| `CURSOR_AGENT_MODEL` | 에이전트 모델 (기본 `composer-2.5`) |
| `GENERATED_PROJECTS_DIR` | 생성 프로젝트 경로 (기본 `./generated`) |

## 프로젝트 구조

```
src/
  app/           # Next.js 페이지 & API
  components/    # 신청 폼, 빌드 상태 UI
  lib/           # 스캐폴딩, 에이전트, 작업 저장
  types/         # 타입 정의
generated/       # 생성된 클라이언트 프로젝트
data/jobs/       # 빌드 작업 상태
```

## API

- `POST /api/intake` — 신청 제출 & 빌드 시작
- `GET /api/jobs` — 작업 목록
- `GET /api/jobs/:id` — 작업 상태 조회
