import fs from "fs/promises";
import path from "path";
import type { IntakeFormData } from "@/types/intake";
import { buildAgentPrompt, buildCursorRules } from "./prompt-builder";
import { uniqueSlug } from "./slug";

const STACK_LABELS: Record<IntakeFormData["techStack"], string> = {
  nextjs: "Next.js + TypeScript",
  "react-vite": "React + Vite",
  "node-express": "Node.js + Express",
  "python-fastapi": "Python + FastAPI",
  other: "Custom",
};

export function getGeneratedRoot(): string {
  return process.env.GENERATED_PROJECTS_DIR
    ? path.resolve(process.env.GENERATED_PROJECTS_DIR)
    : path.join(process.cwd(), "generated");
}

export async function scaffoldProject(
  intake: IntakeFormData,
  jobId: string,
): Promise<string> {
  const root = getGeneratedRoot();
  const dirName = uniqueSlug(intake.projectName, jobId.slice(0, 8));
  const projectPath = path.join(root, dirName);

  await fs.mkdir(projectPath, { recursive: true });
  await fs.mkdir(path.join(projectPath, ".cursor", "rules"), {
    recursive: true,
  });

  const stack =
    intake.techStack === "other"
      ? intake.customStack
      : STACK_LABELS[intake.techStack];

  const readme = `# ${intake.projectName}

> 의뢰인: ${intake.clientName}  
> 생성일: ${new Date().toISOString().split("T")[0]}  
> 기술 스택: ${stack}

## 개요
${intake.overview}

## 주요 기능
${intake.features}

## 코드 작성 방식
${intake.codeStyle}

## 주의사항
${intake.cautions}

## 실행 방법
에이전트 빌드가 완료되면 이 섹션이 업데이트됩니다.

\`\`\`bash
# 스택에 맞는 설치/실행 명령을 README에 추가하세요
\`\`\`
`;

  const agentsMd = `# Agent Instructions

${buildAgentPrompt(intake)}
`;

  const intakeJson = JSON.stringify(intake, null, 2);

  await Promise.all([
    fs.writeFile(path.join(projectPath, "README.md"), readme, "utf-8"),
    fs.writeFile(path.join(projectPath, "AGENTS.md"), agentsMd, "utf-8"),
    fs.writeFile(
      path.join(projectPath, ".cursor", "rules", "project.mdc"),
      buildCursorRules(intake),
      "utf-8",
    ),
    fs.writeFile(path.join(projectPath, "intake.json"), intakeJson, "utf-8"),
    fs.writeFile(
      path.join(projectPath, "BUILD_PROMPT.md"),
      buildAgentPrompt(intake),
      "utf-8",
    ),
  ]);

  await initGitRepo(projectPath);

  return projectPath;
}

async function initGitRepo(projectPath: string): Promise<void> {
  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const exec = promisify(execFile);

  try {
    await exec("git", ["init"], { cwd: projectPath });
    await exec("git", ["add", "."], { cwd: projectPath });
    await exec(
      "git",
      ["commit", "-m", "chore: initial scaffold from outsource-builder"],
      { cwd: projectPath },
    );
  } catch {
    // git 미설치 등은 무시 — 스캐폴딩은 계속 진행
  }
}
