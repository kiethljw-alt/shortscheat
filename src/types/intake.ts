export type TechStack =
  | "nextjs"
  | "react-vite"
  | "node-express"
  | "python-fastapi"
  | "other";

export type IntakeFormData = {
  clientName: string;
  projectName: string;
  overview: string;
  features: string;
  targetUsers: string;
  techStack: TechStack;
  customStack: string;
  codeStyle: string;
  architecture: string;
  cautions: string;
  deadline: string;
  budget: string;
  additionalNotes: string;
};

export type JobStatus =
  | "pending"
  | "scaffolding"
  | "agent_running"
  | "completed"
  | "failed";

export type BuildJob = {
  id: string;
  intake: IntakeFormData;
  status: JobStatus;
  projectPath: string;
  agentId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};
