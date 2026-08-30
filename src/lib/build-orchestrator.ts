import { runBuildAgent } from "./agent-runner";
import { createJob, updateJob } from "./job-store";
import { scaffoldProject } from "./project-generator";
import type { IntakeFormData } from "@/types/intake";

export async function startBuild(intake: IntakeFormData) {
  const job = await createJob(intake);

  runBuildPipeline(job.id, intake).catch(async (err) => {
    await updateJob(job.id, {
      status: "failed",
      error: err instanceof Error ? err.message : "알 수 없는 오류",
    });
  });

  return job;
}

async function runBuildPipeline(jobId: string, intake: IntakeFormData) {
  await updateJob(jobId, { status: "scaffolding" });

  const projectPath = await scaffoldProject(intake, jobId);
  await updateJob(jobId, { projectPath, status: "agent_running" });

  const agentResult = await runBuildAgent(intake, projectPath);

  if (agentResult.success) {
    await updateJob(jobId, {
      status: "completed",
      agentId: agentResult.agentId,
    });
    return;
  }

  // API 키 없으면 스캐폴딩만 완료로 처리
  if (
    agentResult.error?.includes("CURSOR_API_KEY") ||
    !process.env.CURSOR_API_KEY
  ) {
    await updateJob(jobId, {
      status: "completed",
      error: agentResult.error,
    });
    return;
  }

  await updateJob(jobId, {
    status: "failed",
    error: agentResult.error,
    agentId: agentResult.agentId,
  });
}
