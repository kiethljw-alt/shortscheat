"use client";

import { useEffect, useState } from "react";
import type { BuildJob } from "@/types/intake";

const STATUS_LABELS: Record<BuildJob["status"], string> = {
  pending: "대기 중",
  scaffolding: "프로젝트 스캐폴딩 중",
  agent_running: "AI 에이전트 개발 중",
  completed: "완료",
  failed: "실패",
};

type Props = {
  jobId: string;
  onReset: () => void;
};

export function BuildPanel({ jobId, onReset }: Props) {
  const [job, setJob] = useState<BuildJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (active) setJob(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "상태 조회 실패");
        }
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [jobId]);

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <p className="text-red-700">{error}</p>
        <button onClick={onReset} className="btn-secondary mt-4">
          새 신청
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="card">
        <p className="text-zinc-600">빌드 상태를 불러오는 중…</p>
      </div>
    );
  }

  const isRunning = ["pending", "scaffolding", "agent_running"].includes(
    job.status,
  );

  return (
    <div className="card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">작업 ID</p>
          <p className="font-mono text-sm text-zinc-800">{job.id}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div>
        <p className="text-sm text-zinc-500">프로젝트</p>
        <p className="text-xl font-semibold text-zinc-900">
          {job.intake.projectName}
        </p>
        <p className="text-sm text-zinc-600">{job.intake.clientName}</p>
      </div>

      {isRunning && (
        <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-3 text-indigo-800">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700" />
          <span>{STATUS_LABELS[job.status]}…</span>
        </div>
      )}

      {job.projectPath && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            생성 경로
          </p>
          <p className="mt-1 break-all font-mono text-sm text-zinc-800">
            {job.projectPath}
          </p>
        </div>
      )}

      {job.status === "completed" && (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="font-medium text-emerald-800">프로젝트가 생성되었습니다.</p>
          {job.error && (
            <p className="text-sm text-amber-700">
              참고: {job.error} Cursor에서 `BUILD_PROMPT.md`를 열어 수동으로 이어서
              개발할 수 있습니다.
            </p>
          )}
          <ul className="list-inside list-disc space-y-1 text-sm text-emerald-900">
            <li>`generated/` 폴더에서 프로젝트 확인</li>
            <li>`.cursor/rules/project.mdc` — 에이전트 규칙</li>
            <li>`BUILD_PROMPT.md` — 개발 프롬프트</li>
          </ul>
        </div>
      )}

      {job.status === "failed" && job.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {job.error}
        </div>
      )}

      {!isRunning && (
        <button onClick={onReset} className="btn-secondary">
          새 외주 신청
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BuildJob["status"] }) {
  const colors: Record<BuildJob["status"], string> = {
    pending: "bg-zinc-100 text-zinc-700",
    scaffolding: "bg-amber-100 text-amber-800",
    agent_running: "bg-indigo-100 text-indigo-800",
    completed: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${colors[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
