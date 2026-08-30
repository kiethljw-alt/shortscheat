#!/usr/bin/env node
/**
 * Cursor SDK를 Next.js 번들 밖에서 실행하는 스크립트.
 * 사용: node scripts/run-agent.mjs <projectPath> <promptFile>
 */
import fs from "fs/promises";
import { Agent, CursorAgentError } from "@cursor/sdk";

const [projectPath, promptFile] = process.argv.slice(2);

if (!projectPath || !promptFile) {
  console.error("Usage: node scripts/run-agent.mjs <projectPath> <promptFile>");
  process.exit(1);
}

const apiKey = process.env.CURSOR_API_KEY;
if (!apiKey) {
  console.error(JSON.stringify({ success: false, error: "CURSOR_API_KEY missing" }));
  process.exit(0);
}

const prompt = await fs.readFile(promptFile, "utf-8");
const model = process.env.CURSOR_AGENT_MODEL ?? "composer-2.5";

try {
  await using agent = await Agent.create({
    apiKey,
    model: { id: model },
    local: { cwd: projectPath },
  });

  const run = await agent.send(prompt);
  const terminal = await run.wait();

  console.log(
    JSON.stringify({
      success: terminal.status !== "error",
      agentId: agent.id,
      status: terminal.status,
      result: terminal.result ?? null,
      error:
        terminal.status === "error"
          ? `Agent run failed: ${terminal.id}`
          : null,
    }),
  );
} catch (err) {
  const message =
    err instanceof CursorAgentError
      ? err.message
      : err instanceof Error
        ? err.message
        : "Unknown error";
  console.log(JSON.stringify({ success: false, error: message }));
  process.exit(1);
}
