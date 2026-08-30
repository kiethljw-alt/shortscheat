import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import type { IntakeFormData } from "@/types/intake";
import { buildAgentPrompt } from "./prompt-builder";

const exec = promisify(execFile);

export type AgentRunResult = {
  success: boolean;
  agentId?: string;
  status?: string;
  result?: string;
  error?: string;
};

export function hasCursorApiKey(): boolean {
  return Boolean(process.env.CURSOR_API_KEY?.trim());
}

export async function runBuildAgent(
  intake: IntakeFormData,
  projectPath: string,
): Promise<AgentRunResult> {
  if (!hasCursorApiKey()) {
    return {
      success: false,
      error:
        "CURSOR_API_KEY가 설정되지 않았습니다. 스캐폴딩만 완료되었습니다.",
    };
  }

  const prompt = buildAgentPrompt(intake);
  const promptFile = path.join(projectPath, ".build-prompt.tmp.md");
  await fs.writeFile(promptFile, prompt, "utf-8");

  const scriptPath = path.join(process.cwd(), "scripts", "run-agent.mjs");

  try {
    const { stdout } = await exec(
      process.execPath,
      [scriptPath, projectPath, promptFile],
      {
        cwd: process.cwd(),
        env: process.env,
        timeout: 30 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    const parsed = JSON.parse(stdout.trim()) as AgentRunResult;
    return parsed;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "에이전트 실행 중 오류가 발생했습니다.";
    return { success: false, error: message };
  } finally {
    await fs.unlink(promptFile).catch(() => {});
  }
}
