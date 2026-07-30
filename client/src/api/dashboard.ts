import { api } from "./client";
import type { Project } from "./projects";

export interface DashboardSummary {
  projects: {
    total: number;
    byStatus: {
      Submitted: number;
      Approved: number;
      "In Progress": number;
      Review: number;
      Done: number;
    };
  };
  rooms: {
    total: number;
    byStage: {
      Modeling: number;
      "Internal Review": number;
      Rendering: number;
      "QA Review": number;
      "Final Renders": number;
      Completed: number;
    };
    averageProgress: number;
  };
  totalAssets: number;
  activeProjects: Project[];
}

export const getDashboardSummary = async () => {
  const response = await api.get<DashboardSummary>("/dashboard/summary");
  return response.data;
};
