import { z } from "zod";

export const scriptLineSchema = z.object({
  time: z.string(),
  visual: z.string(),
  audio: z.string(),
});

export const scriptDataSchema = z.object({
  title: z.string(),
  hookingVariants: z.array(z.string()).min(1),
  scriptLines: z.array(scriptLineSchema).min(1),
  hashtags: z.array(z.string()).min(1),
});

export const intakeSchema = z.object({
  clientName: z.string().min(1, "의뢰인/회사명을 입력해 주세요."),
  projectName: z.string().min(1, "프로젝트명을 입력해 주세요."),
  overview: z.string().min(10, "프로젝트 개요를 10자 이상 입력해 주세요."),
  features: z.string().min(5, "주요 기능을 입력해 주세요."),
  targetUsers: z.string().optional().default(""),
  techStack: z.enum([
    "nextjs",
    "react-vite",
    "node-express",
    "python-fastapi",
    "other",
  ]),
  customStack: z.string().optional().default(""),
  codeStyle: z.string().min(5, "코드 작성 방식을 입력해 주세요."),
  architecture: z.string().optional().default(""),
  cautions: z.string().min(3, "주의사항을 입력해 주세요."),
  deadline: z.string().optional().default(""),
  budget: z.string().optional().default(""),
  additionalNotes: z.string().optional().default(""),
});
