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
