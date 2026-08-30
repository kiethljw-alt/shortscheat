# Outsource Builder — 외주 개발 자동 생성 툴

> 생성일: 2026-06-02  
> 경로: `~/Projects/outsource-builder`

---

## 개요

외주 개발 신청 정보를 입력하면 프로젝트를 자동으로 생성하고, Cursor Agent가 앱 개발을 진행하는 웹 툴입니다.

**흐름:** 신청 폼 입력 → 프로젝트 스캐폴딩 → AI 에이전트 자동 개발

---

## 주요 기능

### 1. 외주 신청 폼 (한글 UI)

| 섹션 | 입력 항목 |
|------|-----------|
| 기본 정보 | 의뢰인/회사명, 프로젝트명, 마감일, 예산 |
| 프로젝트 개요 | 개요, 주요 기능, 대상 사용자 |
| 코드 작성 방식 | 기술 스택, 컨벤션, 아키텍처 |
| 주의사항 | 보안·금지 사항, 추가 메모 |

### 2. 자동 스캐폴딩

`generated/` 폴더에 클라이언트 프로젝트 생성:

- `README.md` — 프로젝트 설명
- `AGENTS.md` — 에이전트 지침
- `BUILD_PROMPT.md` — 개발 프롬프트
- `.cursor/rules/project.mdc` — Cursor 에이전트 규칙
- `intake.json` — 원본 신청 데이터

### 3. AI 자동 개발

`CURSOR_API_KEY` 설정 시 Cursor SDK 에이전트가 코드까지 생성합니다.

API 키가 없으면 **스캐폴딩만 완료**되며, `BUILD_PROMPT.md`를 Cursor에서 열어 수동 개발을 이어갈 수 있습니다.

---

## 기술 스택

- **프레임워크:** Next.js 16 + TypeScript + Tailwind CSS
- **검증:** Zod
- **AI:** Cursor SDK (`@cursor/sdk`) — 별도 스크립트로 실행
- **저장:** 파일 기반 (`data/jobs/`, `generated/`)

---

## 실행 방법

```bash
cd ~/Projects/outsource-builder
cp .env.example .env.local
# .env.local에 CURSOR_API_KEY 입력 (선택)

npm run dev
```

브라우저: http://localhost:3000

---

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `CURSOR_API_KEY` | Cursor API 키 (자동 개발용) | — |
| `CURSOR_AGENT_MODEL` | 에이전트 모델 | `composer-2.5` |
| `GENERATED_PROJECTS_DIR` | 생성 프로젝트 경로 | `./generated` |

API 키 발급: https://cursor.com/dashboard

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/intake` | 신청 제출 & 빌드 시작 |
| GET | `/api/jobs` | 작업 목록 |
| GET | `/api/jobs/:id` | 작업 상태 조회 (2초 폴링) |

---

## 빌드 상태

| 상태 | 설명 |
|------|------|
| `pending` | 대기 중 |
| `scaffolding` | 프로젝트 스캐폴딩 중 |
| `agent_running` | AI 에이전트 개발 중 |
| `completed` | 완료 |
| `failed` | 실패 |

---

## 프로젝트 구조

```
outsource-builder/
├── src/
│   ├── app/              # Next.js 페이지 & API
│   ├── components/       # IntakeForm, BuildPanel
│   ├── lib/              # 스캐폴딩, 에이전트, 작업 저장
│   └── types/            # 타입 정의
├── scripts/
│   └── run-agent.mjs     # Cursor SDK 실행 (Next 번들 외부)
├── generated/            # 생성된 클라이언트 프로젝트
├── data/jobs/            # 빌드 작업 상태
└── docs/                 # 문서
```

---

## 향후 확장 아이디어

- [ ] 신청서 PDF/이메일 자동 파싱
- [ ] Slack/이메일 접수 연동
- [ ] 생성 프로젝트 목록 대시보드
- [ ] Cursor Automation 연동 (신청 접수 시 자동 개발)

---

## 참고

- Cursor 사용량은 **매일 리셋이 아니라 월간(결제일 기준)** 으로 갱신됩니다.
- Cursor 메뉴 한글화: Korean Language Pack 설치 + `locale.json` → `ko`
