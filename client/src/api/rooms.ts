import { api } from "./client";

export interface Room {
  _id: string;
  projectId: string;
  name: string;
  assignedArtist: string;
  targetDeliveryDate?: string;
  stage: "Modeling" | "Internal Review" | "Rendering" | "QA Review" | "Final Renders" | "Completed";
  progress: number;
  reviewerComments?: string;
  createdAt: string;
  updatedAt: string;
}

export const getRooms = async (projectId: string) => {
  const response = await api.get<Room[]>("/rooms", { params: { projectId } });
  return response.data;
};

export const createRoom = async (data: Omit<Room, "_id" | "createdAt" | "updatedAt">) => {
  const response = await api.post<Room>("/rooms", data);
  return response.data;
};

export const updateRoom = async (id: string, data: Partial<Room>) => {
  const response = await api.put<Room>(`/rooms/${id}`, data);
  return response.data;
};

export const deleteRoom = async (id: string) => {
  await api.delete(`/rooms/${id}`);
};
