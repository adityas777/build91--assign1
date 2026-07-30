import { api } from "./client";

export interface Project {
  _id: string;
  name: string;
  client: string;
  status: "Submitted" | "Approved" | "In Progress" | "Review" | "Done";
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const getProjects = async (params?: { status?: string; search?: string }) => {
  const response = await api.get<Project[]>("/projects", { params });
  return response.data;
};

export const getProject = async (id: string) => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data: Omit<Project, "_id" | "createdAt" | "updatedAt">) => {
  const response = await api.post<Project>("/projects", data);
  return response.data;
};

export const updateProject = async (id: string, data: Partial<Project>) => {
  const response = await api.put<Project>(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: string) => {
  await api.delete(`/projects/${id}`);
};
