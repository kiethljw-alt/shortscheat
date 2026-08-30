"use client";

import { useState } from "react";
import type { IntakeFormData, TechStack } from "@/types/intake";

const DEFAULT_FORM: IntakeFormData = {
  clientName: "",
  projectName: "",
  overview: "",
  features: "",
  targetUsers: "",
  techStack: "nextjs",
  customStack: "",
  codeStyle: "",
  architecture: "",
  cautions: "",
  deadline: "",
  budget: "",
  additionalNotes: "",
};

type Props = {
  onSubmitted: (jobId: string) => void;
};

const STACK_OPTIONS: { value: TechStack; label: string }[] = [
  { value: "nextjs", label: "Next.js + TypeScript" },
  { value: "react-vite", label: "React + Vite" },
  { value: "node-express", label: "Node.js + Express" },
  { value: "python-fastapi", label: "Python + FastAPI" },
  { value: "other", label: "직접 입력" },
];

export function IntakeForm({ onSubmitted }: Props) {
  const [form, setForm] = useState<IntakeFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "제출에 실패했습니다.");
      }

      onSubmitted(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <SectionTitle step={1} title="기본 정보" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="의뢰인 / 회사명" required>
            <input
              className="input"
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
              placeholder="예: (주)OO컴퍼니"
            />
          </Field>
          <Field label="프로젝트명" required>
            <input
              className="input"
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
              placeholder="예: 재고관리 앱"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="마감일">
            <input
              className="input"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              placeholder="예: 2026-07-01"
            />
          </Field>
          <Field label="예산">
            <input
              className="input"
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="예: 500만원"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle step={2} title="프로젝트 개요" />
        <Field label="프로젝트 개요" required hint="무엇을 만들지, 왜 필요한지">
          <textarea
            className="input min-h-28"
            value={form.overview}
            onChange={(e) => update("overview", e.target.value)}
            placeholder="프로젝트 목적, 배경, 핵심 가치를 설명해 주세요."
          />
        </Field>
        <Field label="주요 기능" required>
          <textarea
            className="input min-h-28"
            value={form.features}
            onChange={(e) => update("features", e.target.value)}
            placeholder="- 사용자 로그인&#10;- 대시보드&#10;- 알림"
          />
        </Field>
        <Field label="대상 사용자">
          <input
            className="input"
            value={form.targetUsers}
            onChange={(e) => update("targetUsers", e.target.value)}
            placeholder="예: 내부 영업팀, B2C 일반 사용자"
          />
        </Field>
      </section>

      <section className="space-y-4">
        <SectionTitle step={3} title="코드 작성 방식" />
        <Field label="기술 스택" required>
          <select
            className="input"
            value={form.techStack}
            onChange={(e) => update("techStack", e.target.value as TechStack)}
          >
            {STACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        {form.techStack === "other" && (
          <Field label="직접 입력 스택">
            <input
              className="input"
              value={form.customStack}
              onChange={(e) => update("customStack", e.target.value)}
              placeholder="예: Flutter + Firebase"
            />
          </Field>
        )}
        <Field label="코드 작성 방식" required hint="컨벤션, 폴더 구조, 라이브러리 선호">
          <textarea
            className="input min-h-28"
            value={form.codeStyle}
            onChange={(e) => update("codeStyle", e.target.value)}
            placeholder="예: 함수형 컴포넌트, Zod 검증, feature 폴더 구조, 한글 주석 금지"
          />
        </Field>
        <Field label="아키텍처 / 구조">
          <textarea
            className="input min-h-24"
            value={form.architecture}
            onChange={(e) => update("architecture", e.target.value)}
            placeholder="예: API 레이어 분리, Prisma ORM, REST API"
          />
        </Field>
      </section>

      <section className="space-y-4">
        <SectionTitle step={4} title="주의사항" />
        <Field label="주의사항" required hint="보안, 성능, 금지 사항">
          <textarea
            className="input min-h-28"
            value={form.cautions}
            onChange={(e) => update("cautions", e.target.value)}
            placeholder="예: 개인정보 암호화 필수, 외부 API 키 하드코딩 금지"
          />
        </Field>
        <Field label="추가 메모">
          <textarea
            className="input min-h-20"
            value={form.additionalNotes}
            onChange={(e) => update("additionalNotes", e.target.value)}
            placeholder="참고 자료, 디자인 링크, 기타 요청사항"
          />
        </Field>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "빌드 시작 중…" : "프로젝트 자동 생성 시작"}
      </button>
    </form>
  );
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
        {step}
      </span>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      {children}
    </label>
  );
}
