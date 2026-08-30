#!/usr/bin/env node
/**
 * Notion API로 페이지 생성
 *
 * 사용:
 *   NOTION_TOKEN=secret_xxx NOTION_PARENT_PAGE_ID=page_id node scripts/post-to-notion.mjs
 *
 * NOTION_PARENT_PAGE_ID: 페이지 URL의 마지막 32자리 ID (하이픈 제거)
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTION_VERSION = "2022-06-28";

const token = process.env.NOTION_TOKEN;
const parentId = process.env.NOTION_PARENT_PAGE_ID?.replace(/-/g, "");

if (!token || !parentId) {
  console.error(
    "NOTION_TOKEN 과 NOTION_PARENT_PAGE_ID 환경 변수가 필요합니다.",
  );
  process.exit(1);
}

const mdPath = path.join(__dirname, "..", "docs", "notion-outsource-builder.md");
const markdown = await fs.readFile(mdPath, "utf-8");

const blocks = markdownToNotionBlocks(markdown);

const res = await fetch("https://api.notion.com/v1/pages", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    parent: { page_id: formatId(parentId) },
    properties: {
      title: {
        title: [{ text: { content: "Outsource Builder — 외주 개발 자동 생성 툴" } }],
      },
    },
    children: blocks.slice(0, 100),
  }),
});

const data = await res.json();

if (!res.ok) {
  console.error("Notion API 오류:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("Notion 페이지 생성 완료:", data.url);

function formatId(id) {
  const clean = id.replace(/-/g, "");
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

function markdownToNotionBlocks(md) {
  const lines = md.split("\n");
  const blocks = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.startsWith("# ")) {
      blocks.push(heading(1, line.slice(2)));
    } else if (line.startsWith("## ")) {
      blocks.push(heading(2, line.slice(3)));
    } else if (line.startsWith("### ")) {
      blocks.push(heading(3, line.slice(4)));
    } else if (line.startsWith("> ")) {
      blocks.push({
        object: "block",
        type: "quote",
        quote: { rich_text: richText(line.slice(2)) },
      });
    } else if (line.startsWith("- [ ] ")) {
      blocks.push({
        object: "block",
        type: "to_do",
        to_do: { rich_text: richText(line.slice(6)), checked: false },
      });
    } else if (line.startsWith("- ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: richText(line.slice(2)) },
      });
    } else if (line.startsWith("```")) {
      continue;
    } else if (line.startsWith("|")) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: richText(line) },
      });
    } else if (line === "---") {
      blocks.push({ object: "block", type: "divider", divider: {} });
    } else {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: richText(line) },
      });
    }
  }

  return blocks;
}

function heading(level, text) {
  const type = `heading_${level}`;
  return {
    object: "block",
    type,
    [type]: { rich_text: richText(text) },
  };
}

function richText(text) {
  return [{ type: "text", text: { content: text.slice(0, 2000) } }];
}
