import fs from "fs/promises";
import path from "path";
import type { BuildJob, IntakeFormData, JobStatus } from "@/types/intake";

function getJobsDir(): string {
  return path.join(process.cwd(), "data", "jobs");
}

function jobFilePath(id: string): string {
  return path.join(getJobsDir(), `${id}.json`);
}

export async function createJob(intake: IntakeFormData): Promise<BuildJob> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const job: BuildJob = {
    id,
    intake,
    status: "pending",
    projectPath: "",
    createdAt: now,
    updatedAt: now,
  };

  await fs.mkdir(getJobsDir(), { recursive: true });
  await fs.writeFile(jobFilePath(id), JSON.stringify(job, null, 2), "utf-8");

  return job;
}

export async function getJob(id: string): Promise<BuildJob | null> {
  try {
    const raw = await fs.readFile(jobFilePath(id), "utf-8");
    return JSON.parse(raw) as BuildJob;
  } catch {
    return null;
  }
}

export async function updateJob(
  id: string,
  patch: Partial<Pick<BuildJob, "status" | "projectPath" | "agentId" | "error">>,
): Promise<BuildJob | null> {
  const job = await getJob(id);
  if (!job) return null;

  const updated: BuildJob = {
    ...job,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(jobFilePath(id), JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

export async function listJobs(): Promise<BuildJob[]> {
  try {
    const files = await fs.readdir(getJobsDir());
    const jobs = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(getJobsDir(), f), "utf-8");
          return JSON.parse(raw) as BuildJob;
        }),
    );
    return jobs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export type { JobStatus };
