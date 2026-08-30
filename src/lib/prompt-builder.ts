import type { IntakeFormData } from "@/types/intake";

const STACK_LABELS: Record<IntakeFormData["techStack"], string> = {
  nextjs: "Next.js (App Router) + TypeScript + Tailwind",
  "react-vite": "React + Vite + TypeScript",
  "node-express": "Node.js + Express + TypeScript",
  "python-fastapi": "Python + FastAPI",
  other: "사용자 지정",
};

export function buildAgentPrompt(intake: IntakeFormData): string {
  const stack =
    intake.techStack === "other"
      ? intake.customStack || "미지정"
      : STACK_LABELS[intake.techStack];

  return `당신은 외주 개발 프로젝트를 처음부터 완성하는 시니어 풀스택 개발자입니다.
아래 요구사항을 바탕으로 동작하는 애플리케이션을 이 디렉터리에 구현하세요.

## 프로젝트 정보
- 프로젝트명: ${intake.projectName}
- 의뢰인: ${intake.clientName}
- 기술 스택: ${stack}
${intake.deadline ? `- 마감: ${intake.deadline}` : ""}
${intake.budget ? `- 예산: ${intake.budget}` : ""}

## 프로젝트 개요
${intake.overview}

## 주요 기능
${intake.features}

## 대상 사용자
${intake.targetUsers || "명시되지 않음"}

## 코드 작성 방식
${intake.codeStyle}

## 아키텍처 / 구조
${intake.architecture || "프로젝트에 맞게 합리적으로 설계"}

## 주의사항 (반드시 준수)
${intake.cautions}

## 추가 메모
${intake.additionalNotes || "없음"}

## 작업 지침
1. 먼저 프로젝트 구조를 설계하고 필요한 파일을 생성하세요.
2. 핵심 기능을 우선 구현하고, README에 실행 방법을 작성하세요.
3. 주의사항을 위반하지 마세요.
4. 타입 안전성, 에러 처리, 기본 테스트(가능하면)를 포함하세요.
5. 완료 후 README에 구현된 기능 목록과 미구현 항목을 정리하세요.`;
}

export function buildCursorRules(intake: IntakeFormData): string {
  return `---
description: ${intake.projectName} 외주 프로젝트 규칙
alwaysApply: true
---

# ${intake.projectName}

## 프로젝트 개요
${intake.overview}

## 코드 작성 방식
${intake.codeStyle}

## 아키텍처
${intake.architecture || "프로젝트 컨벤션에 맞게 유지"}

## 주의사항
${intake.cautions}

## 주요 기능
${intake.features}
`;
}
